import type { CacheEnvelope, PokemonDto } from '@/types/pokemon'
import { fetchPokemon, mapPool, toPokemonDto, type PokeApiPokemon } from './client'
import { CACHE_KEY, CACHE_VERSION, GEN1_COUNT } from './keys'

const DEFAULT_CONCURRENCY = 8

/** Session memory — source of truth after hydrate / ensureCache. */
let memory = new Map<number, PokemonDto>()

function isQuotaError(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)
  )
}

function parseEnvelope(raw: string | null): CacheEnvelope | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as CacheEnvelope
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof parsed.version !== 'number' ||
      !Array.isArray(parsed.pokemon)
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function isValidEnvelope(envelope: CacheEnvelope | null): envelope is CacheEnvelope {
  return (
    envelope !== null &&
    envelope.version === CACHE_VERSION &&
    envelope.pokemon.length === GEN1_COUNT
  )
}

/** Validate and load DTOs into memory. Returns false if any entry is invalid/incomplete. */
function loadMemoryFromPokemon(pokemon: unknown[]): boolean {
  const next = new Map<number, PokemonDto>()
  for (const raw of pokemon) {
    try {
      const dto = toPokemonDto(raw as PokeApiPokemon)
      if (next.has(dto.id)) return false
      next.set(dto.id, dto)
    } catch {
      return false
    }
  }
  if (next.size !== GEN1_COUNT) return false
  for (let id = 1; id <= GEN1_COUNT; id++) {
    if (!next.has(id)) return false
  }
  memory = next
  return true
}

/** Sync hydrate from localStorage into memory (D-03). Invalid/missing → empty memory. */
export function hydrateFromStorage(): void {
  const envelope = parseEnvelope(localStorage.getItem(CACHE_KEY))
  if (!isValidEnvelope(envelope)) {
    memory = new Map()
    return
  }
  if (!loadMemoryFromPokemon(envelope.pokemon)) {
    memory = new Map()
    localStorage.removeItem(CACHE_KEY)
  }
}

/** True when map holds every Gen 1 id 1..GEN1_COUNT (no gaps/duplicates). */
function isCompleteGen1(map: Map<number, PokemonDto>): boolean {
  if (map.size !== GEN1_COUNT) return false
  for (let id = 1; id <= GEN1_COUNT; id++) {
    if (!map.has(id)) return false
  }
  return true
}

/** True when storage (or already-hydrated memory) holds a full v1 Gen 1 set. */
export function hasValidCache(): boolean {
  if (isCompleteGen1(memory)) {
    return true
  }
  return isValidEnvelope(parseEnvelope(localStorage.getItem(CACHE_KEY)))
}

/** True when in-memory Map is fully populated for Gen 1. */
export function isCacheReady(): boolean {
  return isCompleteGen1(memory)
}

/** Synchronous lookup — throws if missing (DATA-02). */
export function getPokemon(id: number): PokemonDto {
  const pokemon = memory.get(id)
  if (!pokemon) {
    throw new Error(`Pokémon ${id} not in cache`)
  }
  return pokemon
}

/** Quota-safe write — never throws on QuotaExceededError (D-06). Touches CACHE_KEY only. */
export function persistCache(envelope: CacheEnvelope): 'ok' | 'quota' {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(envelope))
    if (import.meta.env?.DEV) {
      console.debug('[pokeapi] cache bytes', new Blob([JSON.stringify(envelope)]).size)
    }
    return 'ok'
  } catch (e) {
    if (isQuotaError(e)) {
      return 'quota'
    }
    throw e
  }
}

export type EnsureCacheOptions = {
  concurrency?: number
  onProgress?: (done: number, total: number) => void
  /** When true, only fetch ids missing from memory (D-05 resume). */
  resume?: boolean
}

/**
 * Prefetch Gen 1 into memory + versioned localStorage.
 * Returns persist result ('ok' | 'quota'). Memory stays playable on quota.
 */
export async function ensureCache(
  options: EnsureCacheOptions = {},
): Promise<'ok' | 'quota'> {
  const { concurrency = DEFAULT_CONCURRENCY, onProgress, resume = false } = options

  // Drop stale storage version before refetch (D-10) — CACHE_KEY only.
  const stored = parseEnvelope(localStorage.getItem(CACHE_KEY))
  if (stored && stored.version !== CACHE_VERSION) {
    localStorage.removeItem(CACHE_KEY)
    if (!resume) {
      memory = new Map()
    }
  }

  if (!resume) {
    // Full warm path: if already valid in memory/storage, hydrate and skip network.
    if (memory.size === GEN1_COUNT) {
      const envelope: CacheEnvelope = {
        version: 1,
        fetchedAt: new Date().toISOString(),
        pokemon: Array.from({ length: GEN1_COUNT }, (_, i) => getPokemon(i + 1)),
      }
      return persistCache(envelope)
    }
    const existing = parseEnvelope(localStorage.getItem(CACHE_KEY))
    if (isValidEnvelope(existing)) {
      if (loadMemoryFromPokemon(existing.pokemon)) {
        return 'ok'
      }
      localStorage.removeItem(CACHE_KEY)
    }
  }

  const ids = resume
    ? Array.from({ length: GEN1_COUNT }, (_, i) => i + 1).filter((id) => !memory.has(id))
    : Array.from({ length: GEN1_COUNT }, (_, i) => i + 1)

  if (ids.length > 0) {
    // Commit each DTO into memory as soon as its fetch succeeds (D-05).
    // mapPool rejects on first failure, but prior successes remain in memory for resume.
    await mapPool(
      ids,
      concurrency,
      async (id) => {
        const dto = await fetchPokemon(id)
        memory.set(dto.id, dto)
        return dto
      },
      () => {
        onProgress?.(memory.size, GEN1_COUNT)
      },
    )
  } else {
    onProgress?.(GEN1_COUNT, GEN1_COUNT)
  }

  const envelope: CacheEnvelope = {
    version: 1,
    fetchedAt: new Date().toISOString(),
    pokemon: Array.from({ length: GEN1_COUNT }, (_, i) => {
      const p = memory.get(i + 1)
      if (!p) {
        throw new Error(`Missing Pokémon ${i + 1} after ensureCache`)
      }
      return p
    }),
  }

  return persistCache(envelope)
}

/** Test-only: clear in-memory Map without touching localStorage. */
export function resetCacheMemoryForTests(): void {
  memory = new Map()
}
