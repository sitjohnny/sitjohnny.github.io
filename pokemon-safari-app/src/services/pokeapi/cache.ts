import type { CacheEnvelope, PokemonDto } from '@/types/pokemon'
import { MEGA_CATALOG, MEGA_CATALOG_BY_ID, type MegaCatalogEntry } from '@/data/megaCatalog'
import {
  fetchMegaPokemon,
  fetchPokemon,
  fetchSpeciesMeta,
  mapPool,
  sanitizeSpriteUrl,
} from './client'
import { CACHE_KEY, CACHE_VERSION, NATIONAL_DEX_COUNT, TOTAL_ROSTER_COUNT } from './keys'

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
    Array.isArray(envelope.pokemon) &&
    pokemonMapFromStored(envelope.pokemon) !== null
  )
}

function expectedRosterIds(): number[] {
  return [
    ...Array.from({ length: NATIONAL_DEX_COUNT }, (_, i) => i + 1),
    ...MEGA_CATALOG.map((entry) => entry.id),
  ]
}

function isCompleteRoster(map: Map<number, PokemonDto>): boolean {
  if (map.size !== TOTAL_ROSTER_COUNT) return false
  for (const id of expectedRosterIds()) {
    if (!map.has(id)) return false
  }
  return true
}

/**
 * Validate a stored slim DTO (not raw PokéAPI JSON) and re-sanitize sprite URLs (T-02-02, T-02-04).
 */
function fromStoredDto(raw: unknown): PokemonDto {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid stored Pokémon')
  }
  const obj = raw as Record<string, unknown>
  const id = obj.id
  if (
    typeof id !== 'number' ||
    !Number.isInteger(id) ||
    id < 1 ||
    id > TOTAL_ROSTER_COUNT
  ) {
    throw new Error(`Invalid Pokémon id: ${String(id)}`)
  }
  if (typeof obj.name !== 'string' || !obj.name) {
    throw new Error('Invalid Pokémon name')
  }
  if (
    !Array.isArray(obj.types) ||
    obj.types.length === 0 ||
    !obj.types.every((t) => typeof t === 'string' && t.length > 0)
  ) {
    throw new Error('Invalid Pokémon types')
  }
  const spritesRaw = obj.sprites
  if (typeof spritesRaw !== 'object' || spritesRaw === null) {
    throw new Error('Invalid Pokémon sprites')
  }
  const sprites = spritesRaw as Record<string, unknown>
  const flavorText = obj.flavorText
  if (!(flavorText === null || typeof flavorText === 'string')) {
    throw new Error('Invalid Pokémon flavorText')
  }
  const officialArtworkRaw = sprites.official_artwork
  if (!(officialArtworkRaw === undefined || officialArtworkRaw === null || typeof officialArtworkRaw === 'string')) {
    throw new Error('Invalid Pokémon sprites.official_artwork')
  }
  const genus = obj.genus
  if (!(genus === null || typeof genus === 'string')) {
    throw new Error('Invalid Pokémon genus')
  }
  const height = obj.height
  if (typeof height !== 'number' || !Number.isFinite(height)) {
    throw new Error('Invalid Pokémon height')
  }
  const weight = obj.weight
  if (typeof weight !== 'number' || !Number.isFinite(weight)) {
    throw new Error('Invalid Pokémon weight')
  }
  const habitat = obj.habitat
  if (!(habitat === null || typeof habitat === 'string')) {
    throw new Error('Invalid Pokémon habitat')
  }
  const kindRaw = obj.kind
  if (!(kindRaw === 'species' || kindRaw === 'mega' || kindRaw === 'primal')) {
    throw new Error('Invalid Pokémon kind')
  }
  const kind = kindRaw
  const baseSpeciesIdRaw = obj.baseSpeciesId
  let baseSpeciesId: number | null
  if (kind === 'species') {
    if (baseSpeciesIdRaw !== null || id > NATIONAL_DEX_COUNT) {
      throw new Error('Invalid Pokémon baseSpeciesId')
    }
    baseSpeciesId = null
  } else {
    if (
      typeof baseSpeciesIdRaw !== 'number' ||
      !Number.isInteger(baseSpeciesIdRaw) ||
      baseSpeciesIdRaw < 1 ||
      baseSpeciesIdRaw > NATIONAL_DEX_COUNT
    ) {
      throw new Error('Invalid Pokémon baseSpeciesId')
    }
    const catalogEntry = MEGA_CATALOG_BY_ID.get(id)
    if (
      !catalogEntry ||
      catalogEntry.kind !== kind ||
      catalogEntry.baseSpeciesId !== baseSpeciesIdRaw
    ) {
      throw new Error('Invalid Mega catalog DTO')
    }
    baseSpeciesId = baseSpeciesIdRaw
  }
  return {
    id,
    name: obj.name,
    types: obj.types as string[],
    sprites: {
      front_default: sanitizeSpriteUrl(sprites.front_default),
      front_shiny: sanitizeSpriteUrl(sprites.front_shiny),
      official_artwork: sanitizeSpriteUrl(
        officialArtworkRaw === undefined ? null : officialArtworkRaw,
      ),
    },
    flavorText,
    genus,
    height,
    weight,
    habitat,
    kind,
    baseSpeciesId,
  }
}

function pokemonMapFromStored(pokemon: unknown[]): Map<number, PokemonDto> | null {
  const next = new Map<number, PokemonDto>()
  for (const raw of pokemon) {
    try {
      const dto = fromStoredDto(raw)
      if (next.has(dto.id)) return null
      next.set(dto.id, dto)
    } catch {
      return null
    }
  }
  if (!isCompleteRoster(next)) return null
  return next
}

/** Validate and load DTOs into memory. Returns false if any entry is invalid/incomplete. */
function loadMemoryFromPokemon(pokemon: unknown[]): boolean {
  const next = pokemonMapFromStored(pokemon)
  if (!next) return false
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

/** True when storage (or already-hydrated memory) holds a full roster at CACHE_VERSION. */
export function hasValidCache(): boolean {
  if (isCompleteRoster(memory)) {
    return true
  }
  return isValidEnvelope(parseEnvelope(localStorage.getItem(CACHE_KEY)))
}

/** True when in-memory Map is fully populated for the full roster. */
export function isCacheReady(): boolean {
  return isCompleteRoster(memory)
}

/** Synchronous lookup — throws if missing (DATA-02). */
export function getPokemon(id: number): PokemonDto {
  const pokemon = memory.get(id)
  if (!pokemon) {
    throw new Error(`Pokémon ${id} not in cache`)
  }
  return pokemon
}

function removeOrphanPokeCacheKeys(): void {
  localStorage.removeItem('pokemon-safari:poke-cache:v1')
  localStorage.removeItem('pokemon-safari:poke-cache:v2')
}

/** Quota-safe write — never throws on QuotaExceededError (D-06). Touches CACHE_KEY only. */
export function persistCache(envelope: CacheEnvelope): 'ok' | 'quota' {
  try {
    const serialized = JSON.stringify(envelope)
    localStorage.setItem(CACHE_KEY, serialized)
    removeOrphanPokeCacheKeys()
    if (import.meta.env?.DEV) {
      console.debug('[pokeapi] cache bytes', new Blob([serialized]).size)
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

type CacheWorkItem =
  | { kind: 'species'; id: number }
  | { kind: 'mega'; entry: MegaCatalogEntry }

/**
 * Prefetch full roster into memory + versioned localStorage.
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

  // Targeted orphan cleanup for legacy poke-cache keys (RESEARCH OQ3 / T-06-15).
  // Literal keys only — never a loop, never localStorage.clear.
  removeOrphanPokeCacheKeys()

  if (!resume) {
    // Full warm path: if already valid in memory/storage, hydrate and skip network.
    if (isCompleteRoster(memory)) {
      const envelope: CacheEnvelope = {
        version: CACHE_VERSION,
        fetchedAt: new Date().toISOString(),
        pokemon: expectedRosterIds().map((id) => getPokemon(id)),
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

  const missingNationalIds = Array.from({ length: NATIONAL_DEX_COUNT }, (_, i) => i + 1).filter(
    (id) => !memory.has(id),
  )
  const missingMegaEntries = MEGA_CATALOG.filter((entry) => !memory.has(entry.id))
  const work: CacheWorkItem[] = [
    ...missingNationalIds.map((id): CacheWorkItem => ({ kind: 'species', id })),
    ...missingMegaEntries.map((entry): CacheWorkItem => ({ kind: 'mega', entry })),
  ]

  if (work.length > 0) {
    // One worker per roster id: fetch, merge, then commit (Pitfall 3).
    // mapPool rejects on first failure, but prior successes remain in memory for resume.
    await mapPool(
      work,
      concurrency,
      async (item) => {
        const full =
          item.kind === 'species'
            ? { ...(await fetchPokemon(item.id)), ...(await fetchSpeciesMeta(item.id)) }
            : await fetchMegaPokemon(item.entry)
        memory.set(full.id, full)
        return full
      },
      () => {
        onProgress?.(Math.min(memory.size, TOTAL_ROSTER_COUNT), TOTAL_ROSTER_COUNT)
      },
    )
  } else {
    onProgress?.(TOTAL_ROSTER_COUNT, TOTAL_ROSTER_COUNT)
  }

  if (!isCompleteRoster(memory)) {
    const missing = expectedRosterIds().find((id) => !memory.has(id))
    throw new Error(`Missing Pokémon ${String(missing)} after ensureCache`)
  }

  const envelope: CacheEnvelope = {
    version: CACHE_VERSION,
    fetchedAt: new Date().toISOString(),
    pokemon: expectedRosterIds().map((id) => getPokemon(id)),
  }

  return persistCache(envelope)
}

/** Test-only: clear in-memory Map without touching localStorage. */
export function resetCacheMemoryForTests(): void {
  memory = new Map()
}
