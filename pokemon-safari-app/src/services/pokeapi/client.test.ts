import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchGen1All,
  selectGenus,
  selectHabitat,
  toPokemonDto,
} from '@/services/pokeapi/client'
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
        other: {
          'official-artwork': { front_default: 'https://example.test/art6.png' },
        },
      },
      height: 17,
      weight: 905,
    })

    expect(dto).toEqual({
      id: 6,
      name: 'charizard',
      types: ['fire', 'flying'],
      sprites: {
        front_default: 'https://example.test/6.png',
        front_shiny: 'https://example.test/s6.png',
        official_artwork: 'https://example.test/art6.png',
      },
      flavorText: null,
      genus: null,
      height: 17,
      weight: 905,
      habitat: null,
    })
  })

  it('sets official_artwork null when other or artwork URL is invalid', () => {
    const missingOther = toPokemonDto({
      id: 1,
      name: 'bulbasaur',
      types: [{ slot: 1, type: { name: 'grass' } }],
      sprites: {
        front_default: 'https://example.test/1.png',
        front_shiny: null,
      },
      height: 7,
      weight: 69,
    })
    expect(missingOther.sprites.official_artwork).toBeNull()

    const httpArt = toPokemonDto({
      id: 1,
      name: 'bulbasaur',
      types: [{ slot: 1, type: { name: 'grass' } }],
      sprites: {
        front_default: 'https://example.test/1.png',
        front_shiny: null,
        other: {
          'official-artwork': { front_default: 'http://example.test/art1.png' },
        },
      },
      height: 7,
      weight: 69,
    })
    expect(httpArt.sprites.official_artwork).toBeNull()
  })

  it('throws on invalid height or weight', () => {
    const base = {
      id: 1,
      name: 'bulbasaur',
      types: [{ slot: 1, type: { name: 'grass' } }],
      sprites: { front_default: null, front_shiny: null },
    }
    expect(() => toPokemonDto({ ...base, height: -1, weight: 69 })).toThrow()
    expect(() => toPokemonDto({ ...base, height: 7, weight: NaN })).toThrow()
    expect(() => toPokemonDto({ ...base, height: 1.5, weight: 69 })).toThrow()
  })
})

describe('selectGenus / selectHabitat', () => {
  it('selectGenus prefers English', () => {
    expect(
      selectGenus([
        { genus: 'Pokémon Plante', language: { name: 'fr' } },
        { genus: 'Seed Pokémon', language: { name: 'en' } },
      ]),
    ).toBe('Seed Pokémon')
  })

  it('selectGenus returns null when no English', () => {
    expect(selectGenus([{ genus: 'X', language: { name: 'fr' } }])).toBeNull()
  })

  it('selectHabitat reads name or null', () => {
    expect(selectHabitat({ name: 'forest' })).toBe('forest')
    expect(selectHabitat(null)).toBeNull()
    expect(selectHabitat(undefined)).toBeNull()
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
