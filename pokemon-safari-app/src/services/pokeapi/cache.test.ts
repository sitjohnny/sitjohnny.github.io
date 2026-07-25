import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ensureCache,
  getPokemon,
  hasValidCache,
  hydrateFromStorage,
  resetCacheMemoryForTests,
} from '@/services/pokeapi/cache'
import { CACHE_KEY, SAVE_KEY } from '@/services/pokeapi/keys'
import {
  TEST_CACHE_KEY,
  clearPokeCacheKey,
  makePokemonDto,
  seedPokeCache,
  stubPokeApiFetch,
} from '@/test/pokeapi-test-helpers'

const pokeapiDir = dirname(fileURLToPath(import.meta.url))
const servicesRoot = join(pokeapiDir, '..')

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
  it('writes CacheEnvelope version 1 with 151 DTOs to CACHE_KEY only', async () => {
    stubPokeApiFetch()
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, marker: 'keep-me' }))

    await ensureCache({ concurrency: 8, onProgress: () => {} })

    const raw = localStorage.getItem(CACHE_KEY)
    expect(raw).toBeTruthy()
    const envelope = JSON.parse(raw!) as {
      version: number
      pokemon: unknown[]
    }
    expect(envelope.version).toBe(1)
    expect(envelope.pokemon).toHaveLength(151)
    expect(localStorage.getItem(SAVE_KEY)).toContain('keep-me')
  })

  it('after hydrate, getPokemon works and fetch count does not increase', async () => {
    const fetchMock = stubPokeApiFetch()
    await ensureCache({ concurrency: 8, onProgress: () => {} })
    const callsAfterEnsure = fetchMock.mock.calls.length
    expect(callsAfterEnsure).toBe(151)

    resetCacheMemoryForTests()
    hydrateFromStorage()

    expect(getPokemon(25).name).toBe('p25')
    expect(hasValidCache()).toBe(true)
    expect(fetchMock.mock.calls.length).toBe(callsAfterEnsure)
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
      { version: 0 as 1 },
    )
    // Overwrite with explicit wrong version string in storage
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        version: 0,
        fetchedAt: new Date().toISOString(),
        pokemon: Array.from({ length: 151 }, (_, i) => makePokemonDto(i + 1)),
      }),
    )

    expect(hasValidCache()).toBe(false)

    const fetchMock = stubPokeApiFetch()
    await ensureCache({ concurrency: 8, onProgress: () => {} })

    expect(fetchMock.mock.calls.length).toBe(151)
    expect(hasValidCache()).toBe(true)
    const stored = JSON.parse(localStorage.getItem(CACHE_KEY)!) as { version: number }
    expect(stored.version).toBe(1)
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
})
