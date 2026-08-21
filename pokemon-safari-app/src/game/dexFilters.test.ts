import { describe, expect, it } from 'vitest'
import type { DexData } from '@/types/save'
import { MEGA_CATALOG } from '@/data/megaCatalog'
import {
  dexDenominator,
  filterDexSpeciesIds,
  rosterIdsForMode,
  type DexFilterState,
} from '@/game/dexFilters'
import { NATIONAL_DEX_COUNT, TOTAL_ROSTER_COUNT } from '@/services/pokeapi/keys'

function dexWithCaught(ids: number[], shinyIds: number[] = []): DexData {
  const dex: DexData = {}
  for (const id of ids) {
    dex[String(id)] = {
      seen: true,
      firstEncounteredAt: '2026-01-01T00:00:00.000Z',
      firstCapturedAt: '2026-01-01T00:00:00.000Z',
      catchCount: 1,
      shinyOwned: shinyIds.includes(id),
    }
  }
  return dex
}

const nationalIds = () => Array.from({ length: NATIONAL_DEX_COUNT }, (_, i) => i + 1)

const typeMap: Record<number, string[]> = {
  1: ['grass', 'poison'],
  4: ['fire'],
  7: ['water'],
  25: ['electric'],
  63: ['psychic'],
}

function typeOf(id: number): string[] {
  return typeMap[id] ?? ['normal']
}

describe('rosterIdsForMode', () => {
  it('national returns 1..649', () => {
    const ids = rosterIdsForMode('national')
    expect(ids[0]).toBe(1)
    expect(ids.at(-1)).toBe(649)
    expect(ids).toHaveLength(NATIONAL_DEX_COUNT)
  })

  it('mega returns catalog ids in order', () => {
    expect(rosterIdsForMode('mega')).toEqual(MEGA_CATALOG.map((e) => e.id))
  })

  it('all is national then megas', () => {
    const ids = rosterIdsForMode('all')
    expect(ids).toHaveLength(TOTAL_ROSTER_COUNT)
    expect(ids[648]).toBe(649)
    expect(ids[649]).toBe(MEGA_CATALOG[0]!.id)
  })
})

describe('dexDenominator', () => {
  it('matches roster length per mode', () => {
    expect(dexDenominator('national')).toBe(NATIONAL_DEX_COUNT)
    expect(dexDenominator('mega')).toBe(MEGA_CATALOG.length)
    expect(dexDenominator('all')).toBe(TOTAL_ROSTER_COUNT)
  })
})

describe('filterDexSpeciesIds', () => {
  const nationalBase: DexFilterState = { status: 'all', type: null, mode: 'national' }

  it('national + no type returns 1..649 ascending', () => {
    expect(filterDexSpeciesIds({}, nationalBase, typeOf)).toEqual(nationalIds())
  })

  it('mode national excludes mega ids', () => {
    const ids = filterDexSpeciesIds({}, { status: 'all', type: null, mode: 'national' }, () => [])
    expect(ids[0]).toBe(1)
    expect(ids.at(-1)).toBe(649)
    expect(ids).toHaveLength(649)
  })

  it('mode mega returns only catalog ids', () => {
    const ids = filterDexSpeciesIds({}, { status: 'all', type: null, mode: 'mega' }, () => [])
    expect(ids).toEqual(MEGA_CATALOG.map((e) => e.id))
  })

  it('mode all is national then megas', () => {
    const ids = filterDexSpeciesIds({}, { status: 'all', type: null, mode: 'all' }, () => [])
    expect(ids).toHaveLength(TOTAL_ROSTER_COUNT)
    expect(ids[648]).toBe(649)
    expect(ids[649]).toBe(MEGA_CATALOG[0]!.id)
  })

  it('caught returns only species with firstCapturedAt', () => {
    const dex = dexWithCaught([1, 25, 151])
    const ids = filterDexSpeciesIds(
      dex,
      { status: 'caught', type: null, mode: 'national' },
      typeOf,
    )
    expect(ids).toEqual([1, 25, 151])
  })

  it('missing excludes caught species', () => {
    const dex = dexWithCaught([1, 25])
    const ids = filterDexSpeciesIds(
      dex,
      { status: 'missing', type: null, mode: 'national' },
      typeOf,
    )
    expect(ids).not.toContain(1)
    expect(ids).not.toContain(25)
    expect(ids.length).toBe(NATIONAL_DEX_COUNT - 2)
    expect(ids).toEqual([...ids].sort((a, b) => a - b))
  })

  it('shiny returns only shinyOwned entries', () => {
    const dex = dexWithCaught([4, 25], [25])
    const ids = filterDexSpeciesIds(dex, { status: 'shiny', type: null, mode: 'national' }, typeOf)
    expect(ids).toEqual([25])
  })

  it('type filter on all status only includes caught species of that type', () => {
    expect(
      filterDexSpeciesIds({}, { status: 'all', type: 'fire', mode: 'national' }, typeOf),
    ).toEqual([])
    const dex = dexWithCaught([4, 25])
    expect(
      filterDexSpeciesIds(dex, { status: 'all', type: 'fire', mode: 'national' }, typeOf),
    ).toEqual([4])
    expect(
      filterDexSpeciesIds(dex, { status: 'all', type: 'electric', mode: 'national' }, typeOf),
    ).toEqual([25])
  })

  it('missing + type is always empty (type match requires caught)', () => {
    const dex = dexWithCaught([4])
    expect(
      filterDexSpeciesIds(dex, { status: 'missing', type: 'fire', mode: 'national' }, typeOf),
    ).toEqual([])
  })

  it('type AND caught combine', () => {
    const dex = dexWithCaught([4, 25])
    const ids = filterDexSpeciesIds(
      dex,
      { status: 'caught', type: 'electric', mode: 'national' },
      typeOf,
    )
    expect(ids).toEqual([25])
  })

  it('typeOf throw excludes species when type filter is set', () => {
    const throwing = () => {
      throw new Error('cache miss')
    }
    expect(
      filterDexSpeciesIds({}, { status: 'all', type: 'fire', mode: 'national' }, throwing),
    ).toEqual([])
  })

  it('typeOf empty array excludes species when type filter is set', () => {
    const empty = () => [] as string[]
    expect(
      filterDexSpeciesIds({}, { status: 'all', type: 'fire', mode: 'national' }, empty),
    ).toEqual([])
  })

  it('preserves ascending id order', () => {
    const dex = dexWithCaught([151, 3, 50])
    const ids = filterDexSpeciesIds(
      dex,
      { status: 'caught', type: null, mode: 'national' },
      typeOf,
    )
    expect(ids).toEqual([3, 50, 151])
  })
})
