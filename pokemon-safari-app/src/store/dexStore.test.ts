import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CACHE_KEY, EDU_STATS_KEY, SAVE_KEY } from '@/services/pokeapi/keys'
import { dexSaveDebounceMs } from '@/data/rates'
import { useExploreStore } from '@/store/exploreStore'
import { useDexStore } from '@/store/dexStore'

const SEEDED_CACHE = JSON.stringify({
  version: 1,
  fetchedAt: '2026-01-01T00:00:00.000Z',
  pokemon: [{ id: 1, name: 'bulbasaur' }],
})
const SEEDED_EDU = JSON.stringify({
  version: 1,
  facts: { '7x8': { correct: 1, incorrect: 0 } },
})

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.setItem(CACHE_KEY, SEEDED_CACHE)
  localStorage.setItem(EDU_STATS_KEY, SEEDED_EDU)
  // Reset in-memory dex and cancel any pending debounce before clearing SAVE_KEY
  // so flushNow cannot re-seed storage from a prior case.
  useDexStore.setState({ dex: {}, saveSoftFail: false })
  useDexStore.getState().flushNow()
  localStorage.removeItem(SAVE_KEY)
  useExploreStore.getState().reset()
})

afterEach(() => {
  useDexStore.getState().flushNow()
  vi.useRealTimers()
  vi.restoreAllMocks()
  localStorage.removeItem(SAVE_KEY)
})

describe('dexStore debounce flush (D-19, D-21)', () => {
  it('markSeen/recordCatch update in-memory dex immediately', () => {
    useDexStore.getState().markSeen(25)
    expect(useDexStore.getState().dex['25']?.seen).toBe(true)

    useDexStore.getState().recordCatch({ speciesId: 25, shiny: true })
    const entry = useDexStore.getState().dex['25']
    expect(entry?.catchCount).toBeGreaterThanOrEqual(1)
    expect(entry?.shinyOwned).toBe(true)
    expect(entry?.firstCapturedAt).toBeTruthy()
  })

  it('after advanceTimersByTime(dexSaveDebounceMs) SAVE_KEY receives envelope', () => {
    useDexStore.getState().markSeen(1)
    useDexStore.getState().recordCatch({ speciesId: 1, shiny: false })
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()

    vi.advanceTimersByTime(dexSaveDebounceMs)

    const raw = localStorage.getItem(SAVE_KEY)
    expect(raw).toBeTruthy()
    const envelope = JSON.parse(raw!) as {
      version: number
      data: {
        dex: Record<string, unknown>
        explore: { x: number; y: number; facing: string }
      }
    }
    expect(envelope.version).toBe(2)
    expect(envelope.data.dex['1']).toBeTruthy()
    expect(envelope.data.explore).toEqual(
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
        facing: expect.any(String),
      }),
    )
    expect(localStorage.getItem(CACHE_KEY)).toBe(SEEDED_CACHE)
    expect(localStorage.getItem(EDU_STATS_KEY)).toBe(SEEDED_EDU)
  })

  it('dex flush after explore move keeps both slices', () => {
    useExploreStore.setState({
      tile: { x: 4, y: 5 },
      facing: 'up',
      moving: false,
      pendingEncounters: [],
      pokemonImmunitySteps: 0,
    })
    useDexStore.getState().markSeen(7)
    vi.advanceTimersByTime(dexSaveDebounceMs)

    const envelope = JSON.parse(localStorage.getItem(SAVE_KEY)!) as {
      version: number
      data: {
        dex: Record<string, unknown>
        explore: { x: number; y: number; facing: string }
      }
    }
    expect(envelope.version).toBe(2)
    expect(envelope.data.dex['7']).toBeTruthy()
    expect(envelope.data.explore).toEqual({ x: 4, y: 5, facing: 'up' })
  })

  it('quota path sets saveSoftFail true without throwing', () => {
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

    expect(() => {
      useDexStore.getState().markSeen(4)
      vi.advanceTimersByTime(dexSaveDebounceMs)
    }).not.toThrow()

    expect(useDexStore.getState().saveSoftFail).toBe(true)
    expect(useDexStore.getState().dex['4']?.seen).toBe(true)
    expect(localStorage.getItem(CACHE_KEY)).toBe(SEEDED_CACHE)
    expect(localStorage.getItem(EDU_STATS_KEY)).toBe(SEEDED_EDU)
  })

  it('dismissSaveSoftFail clears the soft-fail flag', () => {
    useDexStore.setState({ saveSoftFail: true })
    useDexStore.getState().dismissSaveSoftFail()
    expect(useDexStore.getState().saveSoftFail).toBe(false)
  })
})
