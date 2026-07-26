import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchSpeciesFlavor, fetchSpeciesMeta } from '@/services/pokeapi/client'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchSpeciesMeta', () => {
  it('returns flavor text, genus, and habitat from species JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          flavor_text_entries: [
            {
              flavor_text: 'Emerald lore.',
              language: { name: 'en' },
              version: { name: 'emerald' },
            },
          ],
          genera: [
            { genus: 'Pokémon Graine', language: { name: 'fr' } },
            { genus: 'Seed Pokémon', language: { name: 'en' } },
          ],
          habitat: { name: 'grassland' },
        }),
      })),
    )

    await expect(fetchSpeciesMeta(1)).resolves.toEqual({
      flavorText: 'Emerald lore.',
      genus: 'Seed Pokémon',
      habitat: 'grassland',
    })
  })

  it('fetchSpeciesFlavor delegates to fetchSpeciesMeta', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          flavor_text_entries: [
            {
              flavor_text: 'Only flavor.',
              language: { name: 'en' },
              version: { name: 'emerald' },
            },
          ],
          genera: [],
          habitat: null,
        }),
      })),
    )

    await expect(fetchSpeciesFlavor(1)).resolves.toBe('Only flavor.')
  })
})
