import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CACHE_KEY, EDU_STATS_KEY, SAVE_KEY } from '@/services/pokeapi/keys'
import {
  loadAdaptiveStats,
  persistAdaptiveStats,
  recordAttempt,
  resetAdaptiveStatsForTests,
} from './adaptiveStore'

const SEEDED_CACHE = JSON.stringify({
  version: 1,
  fetchedAt: '2026-01-01T00:00:00.000Z',
  pokemon: [{ id: 1, name: 'bulbasaur' }],
})
const SEEDED_SAVE = 'phase7-save-marker-do-not-touch'

beforeEach(() => {
  localStorage.removeItem(EDU_STATS_KEY)
  localStorage.setItem(CACHE_KEY, SEEDED_CACHE)
  localStorage.setItem(SAVE_KEY, SEEDED_SAVE)
  try {
    resetAdaptiveStatsForTests()
  } catch {
    // Wave 0 — symbol may be missing until Task 3
  }
})

function assertNeighborKeysUntouched() {
  expect(localStorage.getItem(CACHE_KEY)).toBe(SEEDED_CACHE)
  expect(localStorage.getItem(SAVE_KEY)).toBe(SEEDED_SAVE)
}

describe('adaptiveStore (DATA-04, D-16)', () => {
  it('loadAdaptiveStats returns {} when no stored key', () => {
    expect(loadAdaptiveStats()).toEqual({})
    assertNeighborKeysUntouched()
  })

  it('recordAttempt returns a new object and does not mutate input', () => {
    const input = {}
    const next = recordAttempt(input, '7x8', false)
    expect(next).toEqual({ '7x8': { correct: 0, incorrect: 1 } })
    expect(input).toEqual({})
    expect(next).not.toBe(input)
    assertNeighborKeysUntouched()
  })

  it('second recordAttempt increments the right counter', () => {
    const once = recordAttempt({}, '7x8', false)
    const twice = recordAttempt(once, '7x8', true)
    expect(twice).toEqual({ '7x8': { correct: 1, incorrect: 1 } })
    assertNeighborKeysUntouched()
  })

  it('persistAdaptiveStats then loadAdaptiveStats round-trips stats', () => {
    const stats = recordAttempt({}, '7x8', false)
    expect(persistAdaptiveStats(stats)).toBe('ok')
    expect(loadAdaptiveStats()).toEqual(stats)
    assertNeighborKeysUntouched()
  })

  it('corrupt JSON at EDU_STATS_KEY returns {} without throwing', () => {
    localStorage.setItem(EDU_STATS_KEY, '{ not json')
    expect(() => loadAdaptiveStats()).not.toThrow()
    expect(loadAdaptiveStats()).toEqual({})
    assertNeighborKeysUntouched()
  })

  it('structurally wrong facts value returns {} without throwing', () => {
    localStorage.setItem(EDU_STATS_KEY, '{"version":1,"facts":42}')
    expect(() => loadAdaptiveStats()).not.toThrow()
    expect(loadAdaptiveStats()).toEqual({})
    assertNeighborKeysUntouched()
  })

  it('envelope with a different version returns {}', () => {
    localStorage.setItem(
      EDU_STATS_KEY,
      JSON.stringify({ version: 99, facts: { '7x8': { correct: 1, incorrect: 0 } } }),
    )
    expect(loadAdaptiveStats()).toEqual({})
    assertNeighborKeysUntouched()
  })

  it('QuotaExceededError on setItem returns quota instead of throwing', () => {
    const originalSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === EDU_STATS_KEY) {
        throw new DOMException('Quota exceeded', 'QuotaExceededError')
      }
      return originalSetItem.call(this, key, value)
    })

    expect(persistAdaptiveStats({ '7x8': { correct: 0, incorrect: 1 } })).toBe('quota')
    assertNeighborKeysUntouched()
    vi.restoreAllMocks()
  })

  it('unrelated setItem errors still propagate', () => {
    const originalSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (key === EDU_STATS_KEY) {
        throw new Error('disk exploded')
      }
      return originalSetItem.call(this, key, value)
    })

    expect(() =>
      persistAdaptiveStats({ '7x8': { correct: 0, incorrect: 1 } }),
    ).toThrow('disk exploded')
    assertNeighborKeysUntouched()
    vi.restoreAllMocks()
  })
})
