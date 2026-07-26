import type { PokemonDto } from '@/types/pokemon'
import { GEN1_COUNT } from './keys'

const POKEAPI_BASE = 'https://pokeapi.co/api/v2/pokemon'
const POKEAPI_SPECIES_BASE = 'https://pokeapi.co/api/v2/pokemon-species'
const DEFAULT_CONCURRENCY = 8

/** Emerald → Ruby → Sapphire → FireRed (D-15 / D-16). */
export const FLAVOR_VERSION_PRIORITY = ['emerald', 'ruby', 'sapphire', 'firered'] as const

export type PokeApiPokemon = {
  id: number
  name: string
  types: { slot: number; type: { name: string } }[]
  height: number
  weight: number
  sprites: {
    front_default: string | null
    front_shiny: string | null
    other?: {
      'official-artwork'?: { front_default?: unknown } | null
    } | null
  }
}

/** Loose species flavor entry — malformed fields are skipped (D-15/D-16). */
export type FlavorTextEntry = {
  flavor_text?: unknown
  language?: { name?: string } | null
  version?: { name?: string } | null
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

function assertNonNegativeInt(value: unknown, field: string): asserts value is number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(`Invalid Pokémon ${field}`)
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
  assertNonNegativeInt(raw.height, 'height')
  assertNonNegativeInt(raw.weight, 'weight')

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
  const officialArtwork = sprites.other?.['official-artwork']?.front_default

  return {
    id: raw.id,
    name: raw.name,
    types,
    sprites: {
      front_default: sanitizeSpriteUrl(sprites.front_default),
      front_shiny: sanitizeSpriteUrl(sprites.front_shiny),
      official_artwork: sanitizeSpriteUrl(officialArtwork),
    },
    flavorText: null,
    genus: null,
    height: raw.height,
    weight: raw.weight,
    habitat: null,
  }
}

export function selectGenus(
  genera: { genus?: unknown; language?: { name?: string } | null }[],
): string | null {
  const hit = genera.find(
    (g) => g.language?.name === 'en' && typeof g.genus === 'string' && g.genus.length > 0,
  )
  return hit?.genus ?? null
}

export function selectHabitat(
  habitat: { name?: string } | null | undefined,
): string | null {
  if (habitat == null) return null
  const name = habitat.name
  return typeof name === 'string' && name.length > 0 ? name : null
}

/** D-17: collapse control chars/whitespace, preserve official wording + capitalization. */
export function sanitizeFlavorText(raw: string): string {
  return raw
    .replace(/\u00ad\n/g, '') // soft-hyphen line breaks (newer games) → rejoin word
    .replace(/[\s\u00a0]+/g, ' ') // \s matches \n, \f, \t; also NBSP
    .trim()
}

/** D-15/D-16: Emerald → Ruby/Sapphire/FireRed → any English → null. Pure, unit-testable. */
export function selectFlavorText(entries: FlavorTextEntry[]): string | null {
  const english = entries.filter(
    (e) => e.language?.name === 'en' && typeof e.flavor_text === 'string',
  )
  for (const version of FLAVOR_VERSION_PRIORITY) {
    const hit = english.find((e) => e.version?.name === version)
    if (hit && typeof hit.flavor_text === 'string') {
      return sanitizeFlavorText(hit.flavor_text)
    }
  }
  const any = english[0]
  return any && typeof any.flavor_text === 'string'
    ? sanitizeFlavorText(any.flavor_text)
    : null
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

export type SpeciesMeta = {
  flavorText: string | null
  genus: string | null
  habitat: string | null
}

/** Prefetch-time species fields — stores only final strings (never raw arrays). */
export async function fetchSpeciesMeta(id: number): Promise<SpeciesMeta> {
  assertGen1Id(id)
  const res = await fetch(`${POKEAPI_SPECIES_BASE}/${id}`)
  if (!res.ok) {
    throw new Error(`PokéAPI species failed for id ${id}: ${res.status}`)
  }
  const json = (await res.json()) as {
    flavor_text_entries?: unknown
    genera?: unknown
    habitat?: { name?: string } | null
  }
  return {
    flavorText: selectFlavorText(
      Array.isArray(json.flavor_text_entries)
        ? (json.flavor_text_entries as FlavorTextEntry[])
        : [],
    ),
    genus: selectGenus(
      Array.isArray(json.genera)
        ? (json.genera as { genus?: unknown; language?: { name?: string } | null }[])
        : [],
    ),
    habitat: selectHabitat(json.habitat),
  }
}

/** Prefetch-time species lore — stores only the final string (never the raw array). */
export async function fetchSpeciesFlavor(id: number): Promise<string | null> {
  return (await fetchSpeciesMeta(id)).flavorText
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
