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

/** Max BallShake duration (3 flavor shakes + escape open/hold) so timers always resolve. */
const BALL_SHAKE_TOTAL_MS =
  3 * encounterTimingMs.shakeOnce +
  2 * encounterTimingMs.shakeGap +
  encounterTimingMs.shakeOpen +
  encounterTimingMs.shakeEscapeHold

/** Drive the store to a live timing-stage session for the seeded species. */
function openTimingSession(educationCorrect = true): void {
  act(() => {
    useEncounterStore.getState().open({
      speciesId: SEEDED_SPECIES,
      rarity: 'common',
      biome: 'forest',
      education: {
        factKey: '7x8',
        prompt: 'What is 7 × 8?',
        expected: 56,
        correct: educationCorrect,
        recapLine: '7 × 8 = 56',
      },
      captureBonus: educationCorrect ? 0.15 : 0,
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
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('mounts GradeFlash before BallShake on the first AND the second consecutive throw', async () => {
    vi.useFakeTimers()
    // Escape shakes are 1–3 random; pin to 3 so BALL_SHAKE_TOTAL_MS matches exactly.
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
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

describe('EncounterOverlay — shiny session threading (DEX-02 / D-09)', () => {
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

  function openShinyAppear(): void {
    act(() => {
      useEncounterStore.getState().open({
        speciesId: SEEDED_SPECIES,
        rarity: 'common',
        biome: 'forest',
        education: null,
        captureBonus: 0,
        shiny: true,
      })
    })
  }

  it('defaults omitted shiny to false on open', () => {
    act(() => {
      useEncounterStore.getState().open({
        speciesId: SEEDED_SPECIES,
        rarity: 'common',
        biome: 'forest',
        education: null,
        captureBonus: 0,
      })
    })
    expect(useEncounterStore.getState().session?.shiny).toBe(false)
  })

  it('renders shiny sprite on AppearFlash when session.shiny is true', () => {
    render(<EncounterOverlay />)
    openShinyAppear()
    const img = screen.getByRole('img', { name: /p1/i })
    expect(img).toHaveAttribute('src', 'https://example.test/s1.png')
  })

  it('renders shiny sprite on TimingBar when session.shiny is true', () => {
    render(<EncounterOverlay />)
    openShinyAppear()
    act(() => {
      useEncounterStore.getState().startTiming()
    })
    const img = screen.getByRole('img', { name: /p1/i })
    expect(img).toHaveAttribute('src', 'https://example.test/s1.png')
  })

  it('passes shiny through CaughtCard (Gotcha stage)', () => {
    render(<EncounterOverlay />)
    openShinyAppear()
    act(() => {
      useEncounterStore.getState().startTiming()
      useEncounterStore
        .getState()
        .registerThrow({ grade: 'perfect', caught: true, chance: 1 })
      useEncounterStore.getState().toResult()
    })
    const img = screen.getByRole('img', { name: /p1/i })
    expect(img).toHaveAttribute('src', 'https://example.test/s1.png')
    expect(screen.getByText(captureCopy.shiny)).toBeInTheDocument()
  })

  it('renders shiny sprite on EducationQuestion when session.shiny is true', () => {
    render(<EncounterOverlay />)
    openShinyAppear()
    act(() => {
      useEncounterStore.getState().askQuestion({
        category: 'multiplication',
        prompt: 'What is 2 × 3?',
        factKey: '2x3',
        a: 2,
        b: 3,
        expected: 6,
        recapLine: '2 × 3 = 6',
      })
    })
    const img = screen.getByRole('img', { name: /p1/i })
    expect(img).toHaveAttribute('src', 'https://example.test/s1.png')
  })

  it('renders shiny sprite on FleeCard when session.shiny is true', () => {
    render(<EncounterOverlay />)
    openShinyAppear()
    act(() => {
      useEncounterStore.getState().toFlee()
    })
    const img = screen.getByRole('img', { name: /p1/i })
    expect(img).toHaveAttribute('src', 'https://example.test/s1.png')
  })

  it('shows spelling recap image when education outcome includes imageUrl', () => {
    render(<EncounterOverlay />)
    const imageUrl =
      'https://images.pexels.com/photos/66898/pexels-photo-66898.jpeg'
    act(() => {
      useEncounterStore.getState().open({
        speciesId: SEEDED_SPECIES,
        rarity: 'common',
        biome: 'forest',
        captureBonus: 0,
        education: {
          factKey: 'spell:elephant',
          prompt: 'What is this?',
          expected: 'elephant',
          correct: false,
          recapLine: 'elephant',
          imageUrl,
          photographer: 'Pixabay',
          pexelsUrl: 'https://www.pexels.com/photo/66898/',
        },
      })
      useEncounterStore.getState().toRecap()
    })
    expect(screen.getByRole('img', { name: /recap/i })).toHaveAttribute('src', imageUrl)
    expect(screen.getByText('elephant')).toBeInTheDocument()
  })
})
