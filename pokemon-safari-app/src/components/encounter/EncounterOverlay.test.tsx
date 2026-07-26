import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EncounterOverlay } from '@/components/encounter/EncounterOverlay'
import { captureCopy } from '@/data/educationConfig'
import { encounterTimingMs } from '@/data/rates'
import { hydrateFromStorage, resetCacheMemoryForTests } from '@/services/pokeapi/cache'
import { useEncounterStore } from '@/store/encounterStore'
import { useExploreStore } from '@/store/exploreStore'
import { clearPokeCacheKey, seedPokeCache } from '@/test/pokeapi-test-helpers'

const SEEDED_SPECIES = 1

/** BallShake always plays 3 flavor shakes before resolve. */
const BALL_SHAKE_TOTAL_MS =
  3 * encounterTimingMs.shakeOnce +
  2 * encounterTimingMs.shakeGap +
  encounterTimingMs.shakeOpen +
  encounterTimingMs.shakeEscapeHold

/** Drive the store to a live timing-stage session for the seeded species. */
function openTimingSession(): void {
  act(() => {
    useEncounterStore.getState().open({
      speciesId: SEEDED_SPECIES,
      rarity: 'common',
      biome: 'forest',
      education: null,
      captureBonus: 0,
    })
  })
  act(() => {
    useEncounterStore.getState().startTiming()
  })
}

/** The BallShake ending marker (`data-ending="caught"|"broke-free"`). */
function ballShakeEl(container: HTMLElement): Element | null {
  return container.querySelector('[data-ending]')
}

/**
 * Count how many times a BallShake ending element was *added* to the DOM across
 * the given mutation records — including as a descendant of an added subtree.
 * The D-14 bug mounts BallShake on the shake-entry commit before a post-paint
 * effect swaps it for GradeFlash; the settled DOM hides that flash, so we watch
 * the commits directly.
 */
function ballShakeMountCount(records: MutationRecord[]): number {
  let count = 0
  for (const record of records) {
    record.addedNodes.forEach((node) => {
      if (node instanceof Element) {
        if (node.matches('[data-ending]') || node.querySelector('[data-ending]')) {
          count += 1
        }
      }
    })
  }
  return count
}

describe('EncounterOverlay — D-14 GradeFlash precedes BallShake on every throw', () => {
  beforeEach(() => {
    useExploreStore.getState().reset()
    useEncounterStore.getState().reset()
    clearPokeCacheKey()
    resetCacheMemoryForTests()
    seedPokeCache()
    hydrateFromStorage()
    vi.useRealTimers()
  })

  afterEach(() => {
    cleanup()
    useExploreStore.getState().reset()
    useEncounterStore.getState().reset()
    clearPokeCacheKey()
    resetCacheMemoryForTests()
    vi.useRealTimers()
  })

  it('mounts GradeFlash before BallShake on the first AND the second consecutive throw', async () => {
    vi.useFakeTimers()
    const { container } = render(<EncounterOverlay />)
    openTimingSession()

    // ---- Throw 1 ----
    act(() => {
      useEncounterStore
        .getState()
        .registerThrow({ grade: 'good', caught: false, chance: 0.5 })
    })

    // First shake paint: grade copy visible, BallShake not yet mounted.
    expect(screen.getByText(captureCopy.grades.good)).toBeInTheDocument()
    expect(ballShakeEl(container)).toBeNull()

    // After the grade-flash delay, BallShake takes over.
    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.gradeFlash)
    })
    expect(ballShakeEl(container)).not.toBeNull()

    // Resolve the shake → onShakeComplete → failBeat, then failBeat → timing.
    act(() => {
      vi.advanceTimersByTime(BALL_SHAKE_TOTAL_MS)
    })
    expect(useEncounterStore.getState().stage).toBe('failBeat')
    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.failBeat)
    })
    expect(useEncounterStore.getState().stage).toBe('timing')

    // ---- Throw 2 (regression): watch the shake-entry commits directly ----
    // The stale `gradeFlashDone` bug mounts BallShake for one commit before the
    // reset effect swaps to GradeFlash. Observe every commit, not just the last.
    const records: MutationRecord[] = []
    const observer = new MutationObserver((batch) => {
      records.push(...batch)
    })
    observer.observe(container, { childList: true, subtree: true })

    await act(async () => {
      useEncounterStore
        .getState()
        .registerThrow({ grade: 'miss', caught: false, chance: 0.1 })
      // Flush the MutationObserver microtask so intermediate commits are seen.
      await Promise.resolve()
    })
    records.push(...observer.takeRecords())
    observer.disconnect()

    // BallShake must never mount while entering the retry shake — GradeFlash first.
    expect(ballShakeMountCount(records)).toBe(0)

    // Settled DOM: grade copy visible, still no BallShake ending element.
    expect(screen.getByText(captureCopy.grades.miss)).toBeInTheDocument()
    expect(ballShakeEl(container)).toBeNull()

    // After the grade-flash delay, BallShake takes over on the retry too.
    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.gradeFlash)
    })
    expect(ballShakeEl(container)).not.toBeNull()
  })
})
