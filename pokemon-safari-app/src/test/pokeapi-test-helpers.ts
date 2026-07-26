import { vi, type Mock } from 'vitest'

import { CACHE_KEY, CACHE_VERSION } from '@/services/pokeapi/keys'

/** Must match `CACHE_KEY` from `@/services/pokeapi/keys` (DATA-04 / D-11). */
export const TEST_CACHE_KEY = CACHE_KEY

export type TestPokemonDto = {
  id: number
  name: string
  types: string[]
  sprites: {
    front_default: string | null
    front_shiny: string | null
    official_artwork: string | null
  }
  flavorText: string | null
  genus: string | null
  height: number
  weight: number
  habitat: string | null
}

export type TestCacheEnvelope = {
  version: number
  fetchedAt: string
  pokemon: TestPokemonDto[]
}

/** Build a slim Gen 1–shaped DTO for tests. */
export function makePokemonDto(
  id: number,
  overrides: Partial<TestPokemonDto> = {},
): TestPokemonDto {
  return {
    id,
    name: `p${id}`,
    types: ['normal'],
    sprites: {
      front_default: `https://example.test/${id}.png`,
      front_shiny: `https://example.test/s${id}.png`,
      official_artwork: null,
    },
    flavorText: null,
    genus: null,
    height: 7,
    weight: 69,
    habitat: null,
    ...overrides,
  }
}

/** Write a valid CacheEnvelope (v3) to CACHE_KEY only — never touches SAVE_KEY. */
export function seedPokeCache(
  pokemon: TestPokemonDto[] = Array.from({ length: 151 }, (_, i) => makePokemonDto(i + 1)),
  overrides: Partial<TestCacheEnvelope> = {},
): TestCacheEnvelope {
  const envelope: TestCacheEnvelope = {
    version: CACHE_VERSION,
    fetchedAt: new Date().toISOString(),
    pokemon,
    ...overrides,
  }
  localStorage.setItem(TEST_CACHE_KEY, JSON.stringify(envelope))
  return envelope
}

/** Remove only the poke-cache key — never call Storage clear (D-11). */
export function clearPokeCacheKey(): void {
  localStorage.removeItem(TEST_CACHE_KEY)
}

type StubFetchOptions = {
  /** Fail for these ids (network / !ok). */
  failIds?: Set<number>
  /** Delay each response (ms) — useful for concurrency asserts. */
  delayMs?: number
  /** Optional custom body builder. */
  bodyFor?: (id: number) => Record<string, unknown>
}

/**
 * Stub global fetch for PokéAPI pokemon/{id} and pokemon-species/{id} URLs.
 * Returns ok JSON shaped like PokéAPI responses by default.
 */
export function stubPokeApiFetch(options: StubFetchOptions = {}): Mock {
  const { failIds = new Set(), delayMs = 0, bodyFor } = options
  let inFlight = 0
  let maxInFlight = 0

  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const id = Number(url.split('/').filter(Boolean).pop())
    inFlight += 1
    maxInFlight = Math.max(maxInFlight, inFlight)
    try {
      if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs))
      }
      if (failIds.has(id)) {
        return { ok: false, status: 500, json: async () => ({}) }
      }
      if (url.includes('/pokemon-species/')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id,
            name: `p${id}`,
            flavor_text_entries: [
              {
                flavor_text: `Flavor for ${id}.`,
                language: { name: 'en' },
                version: { name: 'emerald' },
              },
            ],
            genera: [{ genus: `Genus ${id}`, language: { name: 'en' } }],
            habitat: { name: 'grassland' },
          }),
        }
      }
      const body = bodyFor
        ? bodyFor(id)
        : {
            id,
            name: `p${id}`,
            types: [{ slot: 1, type: { name: 'normal' } }],
            height: 7,
            weight: 69,
            sprites: {
              front_default: `https://example.test/${id}.png`,
              front_shiny: `https://example.test/s${id}.png`,
              other: {
                'official-artwork': {
                  front_default: `https://example.test/art/${id}.png`,
                },
              },
            },
          }
      return {
        ok: true,
        status: 200,
        json: async () => body,
      }
    } finally {
      inFlight -= 1
    }
  })

  Object.defineProperty(fetchMock, 'maxInFlight', {
    get: () => maxInFlight,
  })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export function getFetchMaxInFlight(fetchMock: Mock): number {
  return (fetchMock as Mock & { maxInFlight: number }).maxInFlight
}
