import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CACHE_KEY, EDU_STATS_KEY, SAVE_KEY } from '@/services/pokeapi/keys'
import { loadSave, persistSave, resetSaveForTests } from '@/services/save'
import type { DexData } from '@/types/save'

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

beforeEach(() => {
  localStorage.removeItem(SAVE_KEY)
  localStorage.setItem(CACHE_KEY, SEEDED_CACHE)
  localStorage.setItem(EDU_STATS_KEY, SEEDED_EDU)
  try {
    resetSaveForTests()
  } catch {
    // Wave 0 — symbol may be missing until 06-02
  }
})

function assertNeighborKeysUntouched() {
  expect(localStorage.getItem(CACHE_KEY)).toBe(SEEDED_CACHE)
  expect(localStorage.getItem(EDU_STATS_KEY)).toBe(SEEDED_EDU)
}

describe('save service (D-18, D-21)', () => {
  it('persistSave then loadSave round-trips DexData under SAVE_KEY version 1', () => {
    expect(persistSave(SAMPLE_DEX)).toBe('ok')
    expect(loadSave()).toEqual(SAMPLE_DEX)
    const raw = localStorage.getItem(SAVE_KEY)
    expect(raw).toBeTruthy()
    const envelope = JSON.parse(raw!) as { version: number; data: { dex: DexData } }
    expect(envelope.version).toBe(1)
    expect(envelope.data.dex).toEqual(SAMPLE_DEX)
    assertNeighborKeysUntouched()
  })

  it('missing SAVE_KEY returns {}', () => {
    expect(loadSave()).toEqual({})
    assertNeighborKeysUntouched()
  })

  it('corrupt JSON at SAVE_KEY returns {} without throwing', () => {
    localStorage.setItem(SAVE_KEY, '{ not json')
    expect(() => loadSave()).not.toThrow()
    expect(loadSave()).toEqual({})
    assertNeighborKeysUntouched()
  })

  it('wrong envelope version returns {}', () => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ version: 99, savedAt: '2026-07-26T00:00:00.000Z', data: { dex: SAMPLE_DEX } }),
    )
    expect(loadSave()).toEqual({})
    assertNeighborKeysUntouched()
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

    expect(persistSave(SAMPLE_DEX)).toBe('quota')
    assertNeighborKeysUntouched()
    vi.restoreAllMocks()
  })
})
