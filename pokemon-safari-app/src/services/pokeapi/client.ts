import type { PokemonDto } from '@/types/pokemon'
import { GEN1_COUNT } from './keys'

const POKEAPI_BASE = 'https://pokeapi.co/api/v2/pokemon'
const DEFAULT_CONCURRENCY = 8

export type PokeApiPokemon = {
  id: number
  name: string
  types: { slot: number; type: { name: string } }[]
  sprites: {
    front_default: string | null
    front_shiny: string | null
  }
}

/** Accept only https: sprite URLs; reject javascript: and non-https (T-02-04). */
export function sanitizeSpriteUrl(url: unknown): string | null {
  if (url === null || url === undefined) return null
  if (typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:') return null
    return trimmed
  } catch {
    return null
  }
}

function assertGen1Id(id: unknown): asserts id is number {
  if (typeof id !== 'number' || !Number.isInteger(id) || id < 1 || id > GEN1_COUNT) {
    throw new Error(`Invalid Pokémon id: ${String(id)}`)
  }
}

/**
 * Shape PokéAPI JSON into a slim DTO with ASVS guards (T-02-02, T-02-04).
 * Sorts types by slot; sprite fields are https-only or null.
 */
export function toPokemonDto(raw: PokeApiPokemon): PokemonDto {
  assertGen1Id(raw.id)
  if (typeof raw.name !== 'string' || !raw.name) {
    throw new Error('Invalid Pokémon name')
  }
  if (!Array.isArray(raw.types)) {
    throw new Error('Invalid Pokémon types')
  }

  const types = [...raw.types]
    .sort((a, b) => a.slot - b.slot)
    .map((t) => {
      const name = t?.type?.name
      if (typeof name !== 'string' || !name) {
        throw new Error('Invalid type name')
      }
      return name
    })

  const sprites = raw.sprites ?? { front_default: null, front_shiny: null }

  return {
    id: raw.id,
    name: raw.name,
    types,
    sprites: {
      front_default: sanitizeSpriteUrl(sprites.front_default),
      front_shiny: sanitizeSpriteUrl(sprites.front_shiny),
    },
  }
}

/** Bounded concurrency pool; calls onProgress after each settle. */
export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const total = items.length
  const results = new Array<R>(total)
  let nextIndex = 0
  let done = 0

  const limit = Math.max(1, Math.min(concurrency, total || 1))

  async function runWorker(): Promise<void> {
    while (nextIndex < total) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await worker(items[index]!)
      done += 1
      onProgress?.(done, total)
    }
  }

  const workers = Array.from({ length: Math.min(limit, total) }, () => runWorker())
  await Promise.all(workers)
  return results
}

export async function fetchPokemon(id: number): Promise<PokemonDto> {
  assertGen1Id(id)
  const res = await fetch(`${POKEAPI_BASE}/${id}`)
  if (!res.ok) {
    throw new Error(`PokéAPI failed for id ${id}: ${res.status}`)
  }
  const json = (await res.json()) as PokeApiPokemon
  return toPokemonDto(json)
}

export type FetchGen1Options = {
  concurrency?: number
  onProgress?: (done: number, total: number) => void
  /** When set, only these ids are fetched (resume / partial). */
  ids?: number[]
}

export async function fetchGen1All(options: FetchGen1Options = {}): Promise<PokemonDto[]> {
  const {
    concurrency = DEFAULT_CONCURRENCY,
    onProgress,
    ids = Array.from({ length: GEN1_COUNT }, (_, i) => i + 1),
  } = options

  return mapPool(ids, concurrency, (id) => fetchPokemon(id), onProgress)
}
