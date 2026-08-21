import { describe, expect, it } from 'vitest'
import { MEGA_CATALOG, MEGA_CATALOG_BY_ID, isMegaOrPrimalId } from './megaCatalog'
import { NATIONAL_DEX_COUNT } from '@/services/pokeapi/keys'

describe('megaCatalog', () => {
  it('starts at 650 and is contiguous with unique slugs', () => {
    expect(MEGA_CATALOG[0]?.id).toBe(NATIONAL_DEX_COUNT + 1)
    for (let i = 0; i < MEGA_CATALOG.length; i++) {
      expect(MEGA_CATALOG[i]!.id).toBe(NATIONAL_DEX_COUNT + 1 + i)
    }
    expect(new Set(MEGA_CATALOG.map((e) => e.pokeApiSlug)).size).toBe(MEGA_CATALOG.length)
  })

  it('only includes bases ≤649 and includes both primals + Charizard X/Y', () => {
    for (const e of MEGA_CATALOG) {
      expect(e.baseSpeciesId).toBeGreaterThanOrEqual(1)
      expect(e.baseSpeciesId).toBeLessThanOrEqual(NATIONAL_DEX_COUNT)
    }
    const slugs = new Set(MEGA_CATALOG.map((e) => e.pokeApiSlug))
    expect(slugs.has('charizard-mega-x')).toBe(true)
    expect(slugs.has('charizard-mega-y')).toBe(true)
    expect(slugs.has('kyogre-primal')).toBe(true)
    expect(slugs.has('groudon-primal')).toBe(true)
    expect(slugs.has('diancie-mega')).toBe(false)
  })

  it('BY_ID and isMegaOrPrimalId agree', () => {
    expect(isMegaOrPrimalId(25)).toBe(false)
    expect(isMegaOrPrimalId(MEGA_CATALOG[0]!.id)).toBe(true)
    expect(MEGA_CATALOG_BY_ID.get(MEGA_CATALOG[0]!.id)?.pokeApiSlug).toBe(
      MEGA_CATALOG[0]!.pokeApiSlug,
    )
  })
})
