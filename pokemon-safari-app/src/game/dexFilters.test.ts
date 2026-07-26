import { describe, expect, it } from 'vitest'
import type { DexData } from '@/types/save'
import {
  filterDexSpeciesIds,
  type DexFilterState,
} from '@/game/dexFilters'
import { GEN1_COUNT } from '@/services/pokeapi/keys'

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

const allIds = () => Array.from({ length: GEN1_COUNT }, (_, i) => i + 1)

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

describe('filterDexSpeciesIds', () => {
  const base: DexFilterState = { status: 'all', type: null }

  it('all + no type returns 1..151 ascending', () => {
    expect(filterDexSpeciesIds({}, base, typeOf)).toEqual(allIds())
  })

  it('caught returns only species with firstCapturedAt', () => {
    const dex = dexWithCaught([1, 25, 151])
    const ids = filterDexSpeciesIds(dex, { status: 'caught', type: null }, typeOf)
    expect(ids).toEqual([1, 25, 151])
  })

  it('missing excludes caught species', () => {
    const dex = dexWithCaught([1, 25])
    const ids = filterDexSpeciesIds(dex, { status: 'missing', type: null }, typeOf)
    expect(ids).not.toContain(1)
    expect(ids).not.toContain(25)
    expect(ids.length).toBe(GEN1_COUNT - 2)
    expect(ids).toEqual([...ids].sort((a, b) => a - b))
  })

  it('shiny returns only shinyOwned entries', () => {
    const dex = dexWithCaught([4, 25], [25])
    const ids = filterDexSpeciesIds(dex, { status: 'shiny', type: null }, typeOf)
    expect(ids).toEqual([25])
  })

  it('type filter keeps species whose types include the filter type', () => {
    const ids = filterDexSpeciesIds({}, { status: 'all', type: 'fire' }, typeOf)
    expect(ids).toEqual([4])
  })

  it('type AND caught combine', () => {
    const dex = dexWithCaught([4, 25])
    const ids = filterDexSpeciesIds(
      dex,
      { status: 'caught', type: 'electric' },
      typeOf,
    )
    expect(ids).toEqual([25])
  })

  it('typeOf throw excludes species when type filter is set', () => {
    const throwing = () => {
      throw new Error('cache miss')
    }
    expect(filterDexSpeciesIds({}, { status: 'all', type: 'fire' }, throwing)).toEqual([])
  })

  it('typeOf empty array excludes species when type filter is set', () => {
    const empty = () => [] as string[]
    expect(filterDexSpeciesIds({}, { status: 'all', type: 'fire' }, empty)).toEqual([])
  })

  it('preserves ascending id order', () => {
    const dex = dexWithCaught([151, 3, 50])
    const ids = filterDexSpeciesIds(dex, { status: 'caught', type: null }, typeOf)
    expect(ids).toEqual([3, 50, 151])
  })
})
