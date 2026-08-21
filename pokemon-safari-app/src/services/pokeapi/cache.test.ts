import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MEGA_CATALOG } from '@/data/megaCatalog'
import {
  ensureCache,
  getPokemon,
  hasValidCache,
  hydrateFromStorage,
  isCacheReady,
  resetCacheMemoryForTests,
} from '@/services/pokeapi/cache'
import {
  CACHE_KEY,
  NATIONAL_DEX_COUNT,
  SAVE_KEY,
  TOTAL_ROSTER_COUNT,
} from '@/services/pokeapi/keys'
import {
  TEST_CACHE_KEY,
  clearPokeCacheKey,
  makePokemonDto,
  seedPokeCache,
  stubPokeApiFetch,
} from '@/test/pokeapi-test-helpers'

const pokeapiDir = dirname(fileURLToPath(import.meta.url))
const servicesRoot = join(pokeapiDir, '..')

function makeFullRosterDtos() {
  return [
    ...Array.from({ length: NATIONAL_DEX_COUNT }, (_, i) => makePokemonDto(i + 1)),
    ...MEGA_CATALOG.map((entry) =>
      makePokemonDto(entry.id, {
        name: entry.displayName,
        kind: entry.kind,
        baseSpeciesId: entry.baseSpeciesId,
      }),
    ),
  ]
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  clearPokeCacheKey()
  localStorage.removeItem(SAVE_KEY)
  try {
    resetCacheMemoryForTests()
  } catch {
    // Wave 0 — symbol may be missing until 02-02
  }
})

beforeEach(() => {
  clearPokeCacheKey()
  localStorage.removeItem(SAVE_KEY)
  try {
    resetCacheMemoryForTests()
  } catch {
    // ignore
  }
})

describe('ensureCache / getPokemon (DATA-01, DATA-02, D-03)', () => {
  it('writes CacheEnvelope version 4 with full roster DTOs to CACHE_KEY only', async () => {
    stubPokeApiFetch()
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, marker: 'keep-me' }))

    await ensureCache({ concurrency: 8, onProgress: () => {} })

    const raw = localStorage.getItem(CACHE_KEY)
    expect(raw).toBeTruthy()
    const envelope = JSON.parse(raw!) as {
      version: number
      pokemon: unknown[]
    }
    expect(envelope.version).toBe(4)
    expect(envelope.pokemon).toHaveLength(TOTAL_ROSTER_COUNT)
    expect(envelope.pokemon.at(-1)).toMatchObject({
      id: TOTAL_ROSTER_COUNT,
      kind: 'mega',
      baseSpeciesId: 531,
    })
    expect(localStorage.getItem(SAVE_KEY)).toContain('keep-me')
  })

  it('ensureCache / write path never clears SAVE_KEY (Gen 1 progress survives)', async () => {
    const save = {
      version: 2,
      savedAt: '2026-01-01T00:00:00.000Z',
      data: {
        dex: {
          '25': {
            seen: true,
            firstEncounteredAt: '2026-01-01T00:00:00.000Z',
            firstCapturedAt: '2026-01-01T00:00:00.000Z',
            catchCount: 2,
            shinyOwned: true,
          },
        },
        explore: { x: 0, y: 0, facing: 'down' },
      },
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
    stubPokeApiFetch()

    await ensureCache({ concurrency: 8, onProgress: () => {} })

    const raw = localStorage.getItem(SAVE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.data.dex['25'].catchCount).toBe(2)
    expect(parsed.data.dex['25'].shinyOwned).toBe(true)
  })

  it('after hydrate, getPokemon works and fetch count does not increase', async () => {
    const fetchMock = stubPokeApiFetch()
    await ensureCache({ concurrency: 8, onProgress: () => {} })
    const callsAfterEnsure = fetchMock.mock.calls.length
    expect(callsAfterEnsure).toBe(TOTAL_ROSTER_COUNT * 2)

    resetCacheMemoryForTests()
    hydrateFromStorage()

    expect(getPokemon(25).name).toBe('p25')
    expect(getPokemon(TOTAL_ROSTER_COUNT)).toMatchObject({
      id: TOTAL_ROSTER_COUNT,
      kind: 'mega',
      baseSpeciesId: 531,
    })
    expect(hasValidCache()).toBe(true)
    expect(fetchMock.mock.calls.length).toBe(callsAfterEnsure)
  })

  it('hasValidCache requires national and mega ids', () => {
    seedPokeCache(Array.from({ length: NATIONAL_DEX_COUNT }, (_, i) => makePokemonDto(i + 1)))
    expect(hasValidCache()).toBe(false)

    seedPokeCache(makeFullRosterDtos())
    expect(hasValidCache()).toBe(true)
  })

  it('hydrate rejects stored DTOs without explicit kind and baseSpeciesId', () => {
    const roster = makeFullRosterDtos()
    const invalid = { ...roster[0] } as Record<string, unknown>
    delete invalid.kind
    delete invalid.baseSpeciesId
    roster[0] = invalid as (typeof roster)[number]
    seedPokeCache(roster)

    hydrateFromStorage()

    expect(isCacheReady()).toBe(false)
    expect(hasValidCache()).toBe(false)
  })
})

describe('quota soft-fail (D-06)', () => {
  it('QuotaExceededError on setItem returns quota path without throw and leaves memory playable', async () => {
    stubPokeApiFetch()
    const originalSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === CACHE_KEY || key === TEST_CACHE_KEY) {
        const err = new DOMException('Quota exceeded', 'QuotaExceededError')
        throw err
      }
      return originalSetItem.call(this, key, value)
    })

    let result: unknown
    await expect(
      (async () => {
        result = await ensureCache({ concurrency: 8, onProgress: () => {} })
      })(),
    ).resolves.toBeUndefined()

    expect(result === 'quota' || (result as { status?: string })?.status === 'quota').toBe(true)
    expect(localStorage.getItem(CACHE_KEY)).toBeNull()
    expect(getPokemon(1).id).toBe(1)
  })
})

describe('version mismatch (D-10)', () => {
  it('wrong version envelope fails hasValidCache and ensureCache re-fetches', async () => {
    seedPokeCache(
      Array.from({ length: 151 }, (_, i) => makePokemonDto(i + 1)),
      // Force stale version in stored JSON
      { version: 0 as 3 },
    )
    // Overwrite with explicit wrong version string in storage
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        version: 0,
        fetchedAt: new Date().toISOString(),
        pokemon: Array.from({ length: NATIONAL_DEX_COUNT }, (_, i) => makePokemonDto(i + 1)),
      }),
    )

    expect(hasValidCache()).toBe(false)

    const fetchMock = stubPokeApiFetch()
    await ensureCache({ concurrency: 8, onProgress: () => {} })

    expect(fetchMock.mock.calls.length).toBe(TOTAL_ROSTER_COUNT * 2)
    expect(hasValidCache()).toBe(true)
    const stored = JSON.parse(localStorage.getItem(CACHE_KEY)!) as { version: number }
    expect(stored.version).toBe(4)
  })
})

describe('cache v4 DTO shape (species meta)', () => {
  it('v2 envelope in localStorage fails hasValidCache after hydrate; ensureCache stores v4 fields', async () => {
    localStorage.setItem(
      'pokemon-safari:poke-cache:v2',
      JSON.stringify({
        version: 2,
        fetchedAt: new Date().toISOString(),
        pokemon: Array.from({ length: NATIONAL_DEX_COUNT }, (_, i) => makePokemonDto(i + 1)),
      }),
    )
    hydrateFromStorage()
    expect(hasValidCache()).toBe(false)

    stubPokeApiFetch()
    await ensureCache({ concurrency: 8, onProgress: () => {} })

    const envelope = JSON.parse(localStorage.getItem(CACHE_KEY)!) as {
      version: number
      pokemon: Array<Record<string, unknown>>
    }
    expect(envelope.version).toBe(4)
    const sample = envelope.pokemon[24]!
    expect(sample.genus).toBe('Genus 25')
    expect(sample.height).toBe(7)
    expect(sample.weight).toBe(69)
    expect(sample.habitat).toBe('grassland')
    expect(sample.sprites).toMatchObject({
      official_artwork: 'https://example.test/art/25.png',
    })
    expect(localStorage.getItem('pokemon-safari:poke-cache:v2')).toBeNull()
  })
})

describe('storage discipline (DATA-04, D-11)', () => {
  it('helpers clear only CACHE_KEY and production services never call localStorage.clear', () => {
    localStorage.setItem(SAVE_KEY, 'save-marker')
    seedPokeCache([makePokemonDto(1)])
    expect(localStorage.getItem(CACHE_KEY)).toBeTruthy()

    clearPokeCacheKey()
    expect(localStorage.getItem(CACHE_KEY)).toBeNull()
    expect(localStorage.getItem(SAVE_KEY)).toBe('save-marker')

    const helperSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../../test/pokeapi-test-helpers.ts'),
      'utf8',
    )
    expect(helperSource).not.toMatch(/localStorage\.clear\s*\(/)

    const walk = (dir: string): string[] => {
      const out: string[] = []
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name)
        if (entry.isDirectory()) out.push(...walk(p))
        else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) out.push(p)
      }
      return out
    }

    for (const file of walk(servicesRoot)) {
      const source = readFileSync(file, 'utf8')
      expect(source, file).not.toMatch(/localStorage\.clear\s*\(/)
    }
  })

  it('cache module never references SAVE_KEY or save storage literals', () => {
    const cacheSource = readFileSync(join(pokeapiDir, 'cache.ts'), 'utf8')
    expect(cacheSource).not.toMatch(/\bSAVE_KEY\b/)
    expect(cacheSource).not.toMatch(/pokemon-safari:save/)
  })
})
