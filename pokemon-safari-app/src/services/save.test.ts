import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WORLD_SPAWN } from '@/data/worldConfig'
import { CACHE_KEY, EDU_STATS_KEY, SAVE_KEY } from '@/services/pokeapi/keys'
import {
  clearSave,
  defaultExploreSave,
  loadSave,
  loadSaveWithMeta,
  persistSave,
  resetSaveForTests,
} from '@/services/save'
import type { DexData, ExploreSave } from '@/types/save'

const SEEDED_CACHE = JSON.stringify({
  version: 1,
  fetchedAt: '2026-01-01T00:00:00.000Z',
  pokemon: [{ id: 1, name: 'bulbasaur' }],
})
const SEEDED_EDU = JSON.stringify({
  version: 1,
  facts: { '7x8': { correct: 1, incorrect: 0 } },
})

const SAMPLE_DEX: DexData = {
  '25': {
    seen: true,
    firstEncounteredAt: '2026-07-26T12:00:00.000Z',
    firstCapturedAt: '2026-07-26T12:05:00.000Z',
    catchCount: 2,
    shinyOwned: false,
  },
}

const SAMPLE_EXPLORE: ExploreSave = { x: 3, y: -2, facing: 'left' }

beforeEach(() => {
  localStorage.removeItem(SAVE_KEY)
  localStorage.setItem(CACHE_KEY, SEEDED_CACHE)
  localStorage.setItem(EDU_STATS_KEY, SEEDED_EDU)
  resetSaveForTests()
})

function assertNeighborKeysUntouched() {
  expect(localStorage.getItem(CACHE_KEY)).toBe(SEEDED_CACHE)
  expect(localStorage.getItem(EDU_STATS_KEY)).toBe(SEEDED_EDU)
}

describe('save service v2 (Phase 7 persistence)', () => {
  it('persistSave then loadSave round-trips dex + explore under version 2', () => {
    expect(persistSave({ dex: SAMPLE_DEX, explore: SAMPLE_EXPLORE })).toBe('ok')
    expect(loadSave()).toEqual({ dex: SAMPLE_DEX, explore: SAMPLE_EXPLORE })
    const raw = localStorage.getItem(SAVE_KEY)
    expect(raw).toBeTruthy()
    const envelope = JSON.parse(raw!) as {
      version: number
      data: { dex: DexData; explore: ExploreSave }
    }
    expect(envelope.version).toBe(2)
    expect(envelope.data.dex).toEqual(SAMPLE_DEX)
    expect(envelope.data.explore).toEqual(SAMPLE_EXPLORE)
    expect(envelope.data).not.toHaveProperty('pendingEncounters')
    assertNeighborKeysUntouched()
  })

  it('missing SAVE_KEY returns empty defaults without marking recovered', () => {
    const result = loadSaveWithMeta()
    expect(result).toEqual({
      data: { dex: {}, explore: defaultExploreSave() },
      recovered: false,
    })
    assertNeighborKeysUntouched()
  })

  it('empty SAVE_KEY string returns empty defaults without marking recovered', () => {
    localStorage.setItem(SAVE_KEY, '')
    const result = loadSaveWithMeta()
    expect(result).toEqual({
      data: { dex: {}, explore: defaultExploreSave() },
      recovered: false,
    })
    assertNeighborKeysUntouched()
  })

  it('corrupt JSON returns empty dex + default explore without throwing', () => {
    localStorage.setItem(SAVE_KEY, '{ not json')
    expect(() => loadSave()).not.toThrow()
    expect(loadSave()).toEqual({ dex: {}, explore: defaultExploreSave() })
    assertNeighborKeysUntouched()
  })

  it('unknown envelope version returns empty dex + default explore', () => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 99,
        savedAt: '2026-07-26T00:00:00.000Z',
        data: { dex: SAMPLE_DEX, explore: SAMPLE_EXPLORE },
      }),
    )
    expect(loadSave()).toEqual({ dex: {}, explore: defaultExploreSave() })
    assertNeighborKeysUntouched()
  })

  it('migrates v1 envelope: keeps dex, explore defaults to spawn+down', () => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        savedAt: '2026-07-26T00:00:00.000Z',
        data: { dex: SAMPLE_DEX },
      }),
    )
    expect(loadSave()).toEqual({
      dex: SAMPLE_DEX,
      explore: {
        x: WORLD_SPAWN.x,
        y: WORLD_SPAWN.y,
        facing: 'down',
      },
    })
    expect(persistSave(loadSave())).toBe('ok')
    const envelope = JSON.parse(localStorage.getItem(SAVE_KEY)!) as {
      version: number
    }
    expect(envelope.version).toBe(2)
    assertNeighborKeysUntouched()
  })

  it('persistSave sanitizes invalid explore before writing', () => {
    persistSave({
      dex: SAMPLE_DEX,
      explore: { x: 1.5, y: 0, facing: 'north' as ExploreSave['facing'] },
    })
    expect(loadSave()).toEqual({
      dex: SAMPLE_DEX,
      explore: defaultExploreSave(),
    })
    assertNeighborKeysUntouched()
  })

  it('corrupt explore field keeps dex and defaults explore', () => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 2,
        savedAt: '2026-07-26T00:00:00.000Z',
        data: {
          dex: SAMPLE_DEX,
          explore: { x: 1.5, y: 'nope', facing: 'north' },
        },
      }),
    )
    expect(loadSave()).toEqual({
      dex: SAMPLE_DEX,
      explore: defaultExploreSave(),
    })
    assertNeighborKeysUntouched()
  })

  it('marks recovered when partially corrupt dex entries are dropped', () => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 2,
        savedAt: '2026-07-26T00:00:00.000Z',
        data: {
          dex: {
            ...SAMPLE_DEX,
            '26': {
              seen: 'yes',
              firstEncounteredAt: '2026-07-26T12:00:00.000Z',
              firstCapturedAt: null,
              catchCount: 1,
              shinyOwned: false,
            },
            '27': null,
          },
          explore: SAMPLE_EXPLORE,
        },
      }),
    )

    const result = loadSaveWithMeta()
    expect(result).toEqual({
      data: { dex: SAMPLE_DEX, explore: SAMPLE_EXPLORE },
      recovered: true,
    })
    assertNeighborKeysUntouched()
  })

  it('marks recovered when JSON is corrupt', () => {
    localStorage.setItem(SAVE_KEY, '{not-json')
    const result = loadSaveWithMeta()
    expect(result.recovered).toBe(true)
    expect(result.data).toEqual({ dex: {}, explore: defaultExploreSave() })
  })

  it('marks recovered false on clean v2 round-trip', () => {
    persistSave({ dex: SAMPLE_DEX, explore: SAMPLE_EXPLORE })
    expect(loadSaveWithMeta().recovered).toBe(false)
  })

  it('marks recovered false on valid v1 migration', () => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 1,
        savedAt: '2026-07-26T00:00:00.000Z',
        data: { dex: SAMPLE_DEX },
      }),
    )
    expect(loadSaveWithMeta().recovered).toBe(false)
  })

  it('marks recovered when v2 explore was sanitized from garbage', () => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 2,
        savedAt: '2026-07-26T00:00:00.000Z',
        data: {
          dex: SAMPLE_DEX,
          explore: { x: 1.5, y: 'nope', facing: 'north' },
        },
      }),
    )
    expect(loadSaveWithMeta().recovered).toBe(true)
  })

  it('QuotaExceededError on setItem returns quota instead of throwing', () => {
    const originalSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === SAVE_KEY) {
        throw new DOMException('Quota exceeded', 'QuotaExceededError')
      }
      return originalSetItem.call(this, key, value)
    })

    expect(persistSave({ dex: SAMPLE_DEX, explore: SAMPLE_EXPLORE })).toBe('quota')
    assertNeighborKeysUntouched()
    vi.restoreAllMocks()
  })

  it('clearSave removes SAVE_KEY and leaves poke-cache and edu-stats', () => {
    persistSave({ dex: SAMPLE_DEX, explore: SAMPLE_EXPLORE })
    expect(localStorage.getItem(SAVE_KEY)).not.toBeNull()
    clearSave()
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
    assertNeighborKeysUntouched()
  })
})
