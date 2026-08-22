import { describe, expect, it } from 'vitest'
import { MEGA_CATALOG, MEGA_CATALOG_BY_ID, isMegaOrPrimalId } from './megaCatalog'
import { NATIONAL_DEX_COUNT } from '@/services/pokeapi/keys'

describe('megaCatalog', () => {
  it('freezes the 46-slot ordered Mega and Primal slug catalog', () => {
    expect(MEGA_CATALOG).toHaveLength(46)
    expect(MEGA_CATALOG.map((e) => e.pokeApiSlug)).toEqual([
      'venusaur-mega',
      'charizard-mega-x',
      'charizard-mega-y',
      'blastoise-mega',
      'beedrill-mega',
      'pidgeot-mega',
      'alakazam-mega',
      'slowbro-mega',
      'gengar-mega',
      'kangaskhan-mega',
      'pinsir-mega',
      'gyarados-mega',
      'aerodactyl-mega',
      'mewtwo-mega-x',
      'mewtwo-mega-y',
      'ampharos-mega',
      'steelix-mega',
      'scizor-mega',
      'heracross-mega',
      'houndoom-mega',
      'tyranitar-mega',
      'blaziken-mega',
      'gardevoir-mega',
      'mawile-mega',
      'aggron-mega',
      'medicham-mega',
      'manectric-mega',
      'sharpedo-mega',
      'camerupt-mega',
      'altaria-mega',
      'banette-mega',
      'absol-mega',
      'glalie-mega',
      'salamence-mega',
      'metagross-mega',
      'latias-mega',
      'latios-mega',
      'rayquaza-mega',
      'kyogre-primal',
      'groudon-primal',
      'lopunny-mega',
      'garchomp-mega',
      'lucario-mega',
      'abomasnow-mega',
      'gallade-mega',
      'audino-mega',
    ])
  })

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
