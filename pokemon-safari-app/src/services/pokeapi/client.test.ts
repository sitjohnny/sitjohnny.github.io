import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchGen1All, toPokemonDto } from '@/services/pokeapi/client'
import { getFetchMaxInFlight, stubPokeApiFetch } from '@/test/pokeapi-test-helpers'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('toPokemonDto', () => {
  it('sorts types by slot and maps front_default + front_shiny', () => {
    const dto = toPokemonDto({
      id: 6,
      name: 'charizard',
      types: [
        { slot: 2, type: { name: 'flying' } },
        { slot: 1, type: { name: 'fire' } },
      ],
      sprites: {
        front_default: 'https://example.test/6.png',
        front_shiny: 'https://example.test/s6.png',
      },
    })

    expect(dto).toEqual({
      id: 6,
      name: 'charizard',
      types: ['fire', 'flying'],
      sprites: {
        front_default: 'https://example.test/6.png',
        front_shiny: 'https://example.test/s6.png',
      },
      flavorText: null,
    })
  })
})

describe('fetchGen1All', () => {
  it('uses concurrency ≤8 and reports onProgress(done, total)', async () => {
    const fetchMock = stubPokeApiFetch({ delayMs: 5 })
    const progress: Array<{ done: number; total: number }> = []

    const results = await fetchGen1All({
      concurrency: 8,
      onProgress: (done, total) => {
        progress.push({ done, total })
      },
    })

    expect(results).toHaveLength(151)
    expect(getFetchMaxInFlight(fetchMock)).toBeLessThanOrEqual(8)
    expect(progress.length).toBeGreaterThan(0)
    expect(progress.at(-1)).toEqual({ done: 151, total: 151 })
    expect(progress.every((p) => p.total === 151)).toBe(true)
    expect(progress.map((p) => p.done)).toEqual(
      [...progress.map((p) => p.done)].sort((a, b) => a - b),
    )
  })
})
