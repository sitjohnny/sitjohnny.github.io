import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dexSaveDebounceMs } from '@/data/rates'
import { SAVE_KEY } from '@/services/pokeapi/keys'
import { persistSave, resetSaveForTests } from '@/services/save'
import { flushSaveNow, scheduleSaveFlush } from '@/services/saveFlush'
import { useDexStore } from '@/store/dexStore'
import { useExploreStore } from '@/store/exploreStore'

describe('saveFlush lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetSaveForTests()
    useDexStore.setState({ dex: {}, saveSoftFail: false })
    useExploreStore.getState().reset()
    useDexStore.getState().flushNow()
    resetSaveForTests()
  })

  afterEach(() => {
    useDexStore.getState().flushNow()
    vi.useRealTimers()
    resetSaveForTests()
  })

  function expectExploreSaved(x: number, y: number, facing: string) {
    const envelope = JSON.parse(localStorage.getItem(SAVE_KEY)!) as {
      version: number
      data: { explore: { x: number; y: number; facing: string } }
    }
    expect(envelope.version).toBe(2)
    expect(envelope.data.explore).toEqual({ x, y, facing })
  }

  it('flushSaveNow writes pending explore without waiting for debounce', () => {
    useExploreStore.getState().setPlayer({
      x: 4,
      y: -3,
      facing: 'left',
      moving: false,
    })
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
    flushSaveNow()
    expectExploreSaved(4, -3, 'left')
  })

  it('visibilitychange (hidden) flushes scheduled save before debounce elapses', () => {
    useExploreStore.getState().setPlayer({
      x: 7,
      y: 2,
      facing: 'right',
      moving: false,
    })
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))

    expectExploreSaved(7, 2, 'right')
    vi.advanceTimersByTime(dexSaveDebounceMs)
  })

  it('pagehide flushes scheduled save before debounce elapses', () => {
    useExploreStore.getState().setPlayer({
      x: -1,
      y: 5,
      facing: 'up',
      moving: false,
    })
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()

    window.dispatchEvent(new Event('pagehide'))

    expectExploreSaved(-1, 5, 'up')
  })

  it('scheduleSaveFlush still persists after debounce when no lifecycle event', () => {
    scheduleSaveFlush()
    useExploreStore.setState({
      tile: { x: 10, y: 11 },
      facing: 'down',
    })
    vi.advanceTimersByTime(dexSaveDebounceMs)
    expectExploreSaved(10, 11, 'down')
  })
})

describe('saveFlush with seeded save', () => {
  beforeEach(() => {
    resetSaveForTests()
    persistSave({
      dex: {},
      explore: { x: 0, y: 0, facing: 'down' },
    })
  })

  afterEach(() => {
    resetSaveForTests()
  })

  it('flushSaveNow merges dex mutations with current explore tile', () => {
    useExploreStore.getState().setPlayer({
      x: 3,
      y: 4,
      facing: 'left',
      moving: false,
    })
    useDexStore.getState().markSeen('1')
    flushSaveNow()
    const envelope = JSON.parse(localStorage.getItem(SAVE_KEY)!) as {
      data: {
        dex: Record<string, unknown>
        explore: { x: number; y: number; facing: string }
      }
    }
    expect(envelope.data.explore).toEqual({ x: 3, y: 4, facing: 'left' })
    expect(envelope.data.dex['1']).toBeDefined()
  })
})
