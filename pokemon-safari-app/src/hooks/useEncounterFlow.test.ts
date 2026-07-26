import { createElement, useEffect } from 'react'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { captureCopy } from '@/data/educationConfig'
import { biomeEncounterTables } from '@/data/encounterTables'
import {
  educationCaptureBonus,
  encounterTimingMs,
  postEncounterPokemonImmunitySteps,
  shinyRate,
} from '@/data/rates'
import { allDoubleDigitFacts, allFacts } from '@/game/education/adaptiveLearning'
import {
  loadAdaptiveStats,
  persistAdaptiveStats,
  resetAdaptiveStatsForTests,
} from '@/game/education/adaptiveStore'
import {
  advanceFromAppear,
  capture,
  continueFromFlee,
  continueFromResult,
  onShakeComplete,
  submitAnswer,
  useEncounterFlow,
} from '@/hooks/useEncounterFlow'
import { hydrateFromStorage, resetCacheMemoryForTests } from '@/services/pokeapi/cache'
import { SAVE_KEY } from '@/services/pokeapi/keys'
import { useDexStore } from '@/store/dexStore'
import { useEncounterStore } from '@/store/encounterStore'
import { useExploreStore } from '@/store/exploreStore'
import {
  clearPokeCacheKey,
  makePokemonDto,
  seedPokeCache,
} from '@/test/pokeapi-test-helpers'
import type { EncounterCandidateEvent } from '@/types/map'
import type { Rng } from '@/utils/rng'

const FACT_SET = new Set([...allFacts(), ...allDoubleDigitFacts()])

const candidate = (at = 1): EncounterCandidateEvent => ({
  type: 'encounter_candidate',
  biome: 'forest',
  x: 10,
  y: 5,
  at,
})

function sequenceRng(...values: number[]): Rng {
  let index = 0
  return { next: () => values[Math.min(index++, values.length - 1)] ?? 0 }
}

function Harness({ rng }: { rng: Rng }) {
  useEncounterFlow({ rng })
  return null
}

function QueueLater({ rng, event }: { rng: Rng; event: EncounterCandidateEvent }) {
  useEncounterFlow({ rng })
  useEffect(() => {
    useExploreStore.getState().pushEncounters([event])
  }, [event])
  return null
}

async function openPokemonAppear(rng: Rng = sequenceRng(0, 0, 1)) {
  render(createElement(QueueLater, { rng, event: candidate() }))
  await waitFor(() => expect(useEncounterStore.getState().stage).toBe('appear'))
}

/** Reach timing after a correct answer hold (happy-path capture entry). */
async function reachTimingAfterCorrect(
  rng: Rng = sequenceRng(0, 0, 1, 0),
): Promise<void> {
  await openPokemonAppear(rng)
  vi.useFakeTimers()
  act(() => {
    advanceFromAppear()
  })
  const asked = useEncounterStore.getState().question!
  act(() => {
    submitAnswer(String(asked.expected))
  })
  act(() => {
    vi.advanceTimersByTime(encounterTimingMs.feedbackHold)
  })
  expect(useEncounterStore.getState().stage).toBe('timing')
}

function resetDexForTests() {
  useDexStore.setState({ dex: {}, saveSoftFail: false })
  useDexStore.getState().flushNow()
  localStorage.removeItem(SAVE_KEY)
}

describe('useEncounterFlow', () => {
  beforeEach(() => {
    useExploreStore.getState().reset()
    useEncounterStore.getState().reset()
    clearPokeCacheKey()
    resetCacheMemoryForTests()
    resetAdaptiveStatsForTests()
    resetDexForTests()
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
    resetAdaptiveStatsForTests()
    resetDexForTests()
    vi.useRealTimers()
  })

  it('opens a common Forest session for a pokemon roll', async () => {
    render(createElement(QueueLater, { rng: sequenceRng(0, 0), event: candidate() }))

    await waitFor(() => expect(useEncounterStore.getState().stage).toBe('appear'))
    expect(useEncounterStore.getState().session).toMatchObject({
      speciesId: biomeEncounterTables.forest.common[0],
      rarity: 'common',
      biome: 'forest',
      education: null,
      captureBonus: 0,
    })
  })

  it.each([
    ['rare', 0.91, biomeEncounterTables.forest.rare],
    ['legendary', 0.995, biomeEncounterTables.forest.legendary],
  ] as const)('routes the %s band to its matching pool', async (rarity, roll, pool) => {
    render(createElement(QueueLater, { rng: sequenceRng(roll, 0), event: candidate() }))

    await waitFor(() => expect(useEncounterStore.getState().stage).toBe('appear'))
    expect(useEncounterStore.getState().session).toMatchObject({
      speciesId: pool[0],
      rarity,
    })
  })

  it('keeps nothing silent and idle', async () => {
    // Mid of nothing band under weights pokemon80+nothing45+rare19+legendary1 (total 145)
    render(
      createElement(QueueLater, { rng: sequenceRng(0.71), event: candidate() }),
    )

    await waitFor(() =>
      expect(useExploreStore.getState().pendingEncounters).toHaveLength(0),
    )
    expect(useEncounterStore.getState()).toMatchObject({
      stage: 'idle',
      session: null,
    })
  })

  it('arms pokemon immunity when a session closes and suppresses pokemon rolls', async () => {
    await openPokemonAppear(sequenceRng(0, 0, 1, 0))
    act(() => {
      useEncounterStore.getState().close()
    })
    expect(useExploreStore.getState().pokemonImmunitySteps).toBe(
      postEncounterPokemonImmunitySteps,
    )
    expect(useEncounterStore.getState().stage).toBe('idle')

    act(() => {
      useExploreStore.getState().pushEncounters([candidate(2)])
    })

    await waitFor(() =>
      expect(useExploreStore.getState().pendingEncounters).toHaveLength(0),
    )
    expect(useEncounterStore.getState()).toMatchObject({
      stage: 'idle',
      session: null,
    })
  })

  it('consumes exactly one candidate and re-queues the remainder in FIFO order', async () => {
    useExploreStore.getState().pushEncounters([candidate(1), candidate(2), candidate(3)])
    render(createElement(Harness, { rng: sequenceRng(0, 0) }))

    await waitFor(() => expect(useEncounterStore.getState().stage).toBe('appear'))
    expect(useExploreStore.getState().pendingEncounters.map((event) => event.at)).toEqual(
      [2, 3],
    )
  })

  it('does not consume another candidate while an encounter is active', async () => {
    render(createElement(Harness, { rng: sequenceRng(0, 0) }))
    act(() => {
      useEncounterStore.setState({ stage: 'timing' })
      useExploreStore.getState().pushEncounters([candidate()])
    })

    await waitFor(() =>
      expect(useExploreStore.getState().pendingEncounters).toHaveLength(1),
    )
    expect(useEncounterStore.getState().stage).toBe('timing')
  })

  it('routes a species missing from cache to error instead of throwing', async () => {
    seedPokeCache(Array.from({ length: 150 }, (_, index) => makePokemonDto(index + 2)))
    hydrateFromStorage()
    render(createElement(QueueLater, { rng: sequenceRng(0, 0), event: candidate() }))

    await waitFor(() => expect(useEncounterStore.getState().stage).toBe('error'))
  })

  it('advances from appear to a question instead of handoff', async () => {
    await openPokemonAppear()
    act(() => {
      advanceFromAppear()
    })

    const state = useEncounterStore.getState()
    expect(state.stage).toBe('question')
    expect(state.question).not.toBeNull()
    expect(FACT_SET.has(state.question!.factKey)).toBe(true)
    expect(state.stage).not.toBe('handoff')
  })

  it('applies a correct answer with capture bonus and advances to timing after the hold', async () => {
    await openPokemonAppear(sequenceRng(0, 0, 0))
    vi.useFakeTimers()
    act(() => {
      advanceFromAppear()
    })

    const asked = useEncounterStore.getState().question!
    const beforeCorrect = loadAdaptiveStats()[asked.factKey]?.correct ?? 0

    act(() => {
      submitAnswer(String(asked.expected))
    })

    let state = useEncounterStore.getState()
    expect(state.stage).toBe('feedback')
    expect(state.session?.education).toMatchObject({
      correct: true,
      factKey: asked.factKey,
      prompt: asked.prompt,
      expected: asked.expected,
    })
    expect(state.session?.captureBonus).toBe(educationCaptureBonus.correct)
    expect(state.lastFactKey).toBe(asked.factKey)
    expect(loadAdaptiveStats()[asked.factKey]?.correct).toBe(beforeCorrect + 1)

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.feedbackHold)
    })

    state = useEncounterStore.getState()
    expect(state.stage).toBe('timing')
    expect(state.session?.captureBonus).toBe(educationCaptureBonus.correct)
  })

  it('applies a wrong answer with no capture bonus', async () => {
    await openPokemonAppear(sequenceRng(0, 0, 0))
    act(() => {
      advanceFromAppear()
    })

    const asked = useEncounterStore.getState().question!
    act(() => {
      submitAnswer(String(asked.expected + 1))
    })

    const state = useEncounterStore.getState()
    expect(state.stage).toBe('feedback')
    expect(state.session?.education?.correct).toBe(false)
    expect(state.session?.captureBonus).toBe(educationCaptureBonus.incorrect)
    expect(state.lastFactKey).toBe(asked.factKey)
  })

  it('treats a quota persist failure as a non-event that keeps the feedback stage', async () => {
    await openPokemonAppear(sequenceRng(0, 0, 0))
    act(() => {
      advanceFromAppear()
    })

    const asked = useEncounterStore.getState().question!
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      const err = new DOMException('quota', 'QuotaExceededError')
      throw err
    })

    act(() => {
      submitAnswer(String(asked.expected))
    })

    expect(useEncounterStore.getState().stage).toBe('feedback')
    expect(persistAdaptiveStats({ [asked.factKey]: { correct: 1, incorrect: 0 } })).toBe(
      'quota',
    )
    setItem.mockRestore()
  })

  it('never repeats lastFactKey on the next encounter', async () => {
    // Keep every grass roll in the pokemon band; vary only selection draws.
    // Per encounter: outcome + species + pool roll + fact pick + feedback = 5 draws.
    let draw = 0
    const rng: Rng = {
      next: () => {
        draw += 1
        // Outcome + species index stay at 0; later draws feed fact/copy picks.
        if (draw % 5 === 1 || draw % 5 === 2) return 0
        return ((draw * 17) % 100) / 100
      },
    }
    render(createElement(Harness, { rng }))

    const seen: string[] = []
    for (let i = 0; i < 5; i += 1) {
      act(() => {
        useExploreStore.getState().pushEncounters([candidate(i + 1)])
      })
      await waitFor(() => expect(useEncounterStore.getState().stage).toBe('appear'))
      act(() => {
        advanceFromAppear()
      })
      const asked = useEncounterStore.getState().question!
      expect(FACT_SET.has(asked.factKey)).toBe(true)
      if (seen.length > 0) {
        expect(asked.factKey).not.toBe(seen.at(-1))
      }
      seen.push(asked.factKey)
      act(() => {
        submitAnswer(String(asked.expected))
      })
      act(() => {
        useEncounterStore.getState().close()
      })
      // Immediate re-encounter loop is for fact uniqueness — clear step immunity.
      act(() => {
        useExploreStore.setState({ pokemonImmunitySteps: 0 })
      })
      expect(useEncounterStore.getState().lastFactKey).toBe(asked.factKey)
      expect(useEncounterStore.getState().stage).toBe('idle')
    }
  })

  it('never reaches question for nothing outcomes', async () => {
    render(createElement(QueueLater, { rng: sequenceRng(0.71), event: candidate(1) }))
    await waitFor(() =>
      expect(useExploreStore.getState().pendingEncounters).toHaveLength(0),
    )
    expect(useEncounterStore.getState().stage).toBe('idle')
    expect(useEncounterStore.getState().question).toBeNull()

    cleanup()
    useExploreStore.getState().reset()
    useEncounterStore.getState().reset()

    // 0.75 is still inside the nothing band (~0.55–0.86) under retuned weights
    render(createElement(QueueLater, { rng: sequenceRng(0.75), event: candidate(2) }))
    await waitFor(() =>
      expect(useExploreStore.getState().pendingEncounters).toHaveLength(0),
    )
    expect(useEncounterStore.getState().stage).toBe('idle')
    expect(useEncounterStore.getState().question).toBeNull()
  })

  it('closes to idle on unmount while preserving lastFactKey', async () => {
    const { unmount } = render(createElement(Harness, { rng: sequenceRng(0, 0) }))
    act(() => {
      useEncounterStore.setState({ stage: 'question', lastFactKey: '7x8' })
    })
    expect(useEncounterStore.getState().stage).toBe('question')
    expect(useEncounterStore.getState().lastFactKey).toBe('7x8')

    unmount()

    expect(useEncounterStore.getState().stage).toBe('idle')
    expect(useEncounterStore.getState().lastFactKey).toBe('7x8')
  })

  it('capture rolls before shake and stores lastGrade/lastCaught (D-31)', async () => {
    // Always-catch rng: next() stays at 0 after exhaustion.
    await reachTimingAfterCorrect(sequenceRng(0, 0, 0))
    const sweetSpot = useEncounterStore.getState().session!.sweetSpot

    act(() => {
      capture(sweetSpot)
    })

    const afterThrow = useEncounterStore.getState()
    expect(afterThrow.stage).toBe('shake')
    expect(afterThrow.session?.lastCaught).toBe(true)
    expect(afterThrow.session?.lastGrade).toBe('perfect')
    expect(afterThrow.session?.lastChance).toBeGreaterThan(0)

    act(() => {
      useEncounterStore.getState().toResult()
    })
    expect(useEncounterStore.getState().stage).toBe('result')
  })

  it('ignores capture when stage is not timing (D-21)', async () => {
    await reachTimingAfterCorrect(sequenceRng(0, 0, 0))
    act(() => {
      capture(useEncounterStore.getState().session!.sweetSpot)
    })
    expect(useEncounterStore.getState().stage).toBe('shake')
    const frozen = useEncounterStore.getState().session

    act(() => {
      capture(0.5)
    })
    expect(useEncounterStore.getState().stage).toBe('shake')
    expect(useEncounterStore.getState().session).toEqual(frozen)
  })

  it('continueFromResult closes when education was correct (D-29)', async () => {
    await reachTimingAfterCorrect(sequenceRng(0, 0, 0))
    act(() => {
      capture(useEncounterStore.getState().session!.sweetSpot)
    })
    act(() => {
      useEncounterStore.getState().toResult()
    })
    act(() => {
      continueFromResult()
    })
    expect(useEncounterStore.getState().stage).toBe('idle')
  })

  it('continueFromResult goes to recap when education was incorrect (D-29)', async () => {
    await openPokemonAppear(sequenceRng(0, 0, 0))
    vi.useFakeTimers()
    act(() => {
      advanceFromAppear()
    })
    const asked = useEncounterStore.getState().question!
    act(() => {
      submitAnswer(String(asked.expected + 1))
    })
    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.feedbackHold)
    })
    expect(useEncounterStore.getState().stage).toBe('timing')

    act(() => {
      capture(useEncounterStore.getState().session!.sweetSpot)
    })
    act(() => {
      useEncounterStore.getState().toResult()
    })
    act(() => {
      continueFromResult()
    })
    expect(useEncounterStore.getState().stage).toBe('recap')
  })

  describe('retry and flee (05-04)', () => {
    /** Force a failed throw without relying on catch rng (registerThrow is the single writer). */
    function failThrow(): void {
      useEncounterStore.getState().registerThrow({
        grade: 'miss',
        caught: false,
        chance: 0.1,
      })
    }

    it('three consecutive fails reach flee with attemptsUsed === 3', async () => {
      await reachTimingAfterCorrect(sequenceRng(0, 0, 0))
      vi.useFakeTimers()

      for (let n = 1; n <= 3; n += 1) {
        act(() => {
          failThrow()
        })
        expect(useEncounterStore.getState().stage).toBe('shake')
        act(() => {
          onShakeComplete()
        })
        if (n < 3) {
          // Fail beat holds before remounting timing (D-26) — not immediate startTiming.
          expect(useEncounterStore.getState().stage).not.toBe('timing')
          expect(useEncounterStore.getState().stage).not.toBe('flee')
          act(() => {
            vi.advanceTimersByTime(encounterTimingMs.failBeat)
          })
          expect(useEncounterStore.getState().stage).toBe('timing')
          expect(useEncounterStore.getState().session?.attemptsUsed).toBe(n)
        }
      }

      expect(useEncounterStore.getState().stage).toBe('flee')
      expect(useEncounterStore.getState().session?.attemptsUsed).toBe(3)
      expect(captureCopy.fleeHeading).toBe('It got away!')
      expect(captureCopy.fleeBody).toMatch(/you’ll find another|you'll find another/)
    })

    it('after first fail remounts timing with a different sweetSpot (D-12)', async () => {
      await reachTimingAfterCorrect(sequenceRng(0, 0, 0))
      vi.useFakeTimers()
      const priorSpot = useEncounterStore.getState().session!.sweetSpot

      act(() => {
        failThrow()
      })
      act(() => {
        onShakeComplete()
      })
      act(() => {
        vi.advanceTimersByTime(encounterTimingMs.failBeat)
      })

      const after = useEncounterStore.getState()
      expect(after.stage).toBe('timing')
      expect(after.session?.attemptsUsed).toBe(1)
      expect(after.session?.sweetSpot).not.toBe(priorSpot)
      expect(captureCopy.failBeat).toBe('Oh! It broke free!')
    })

    it('continueFromFlee routes to recap when education was wrong (D-29)', async () => {
      await openPokemonAppear(sequenceRng(0, 0, 0))
      vi.useFakeTimers()
      act(() => {
        advanceFromAppear()
      })
      const asked = useEncounterStore.getState().question!
      act(() => {
        submitAnswer(String(asked.expected + 1))
      })
      act(() => {
        vi.advanceTimersByTime(encounterTimingMs.feedbackHold)
      })
      expect(useEncounterStore.getState().stage).toBe('timing')

      for (let n = 0; n < 3; n += 1) {
        act(() => {
          failThrow()
        })
        act(() => {
          onShakeComplete()
        })
        if (n < 2) {
          act(() => {
            vi.advanceTimersByTime(encounterTimingMs.failBeat)
          })
        }
      }
      expect(useEncounterStore.getState().stage).toBe('flee')

      act(() => {
        continueFromFlee()
      })
      expect(useEncounterStore.getState().stage).toBe('recap')
    })

    it('continueFromFlee closes when education was correct (D-29)', async () => {
      await reachTimingAfterCorrect(sequenceRng(0, 0, 0))
      vi.useFakeTimers()

      for (let n = 0; n < 3; n += 1) {
        act(() => {
          failThrow()
        })
        act(() => {
          onShakeComplete()
        })
        if (n < 2) {
          act(() => {
            vi.advanceTimersByTime(encounterTimingMs.failBeat)
          })
        }
      }
      expect(useEncounterStore.getState().stage).toBe('flee')

      act(() => {
        continueFromFlee()
      })
      expect(useEncounterStore.getState().stage).toBe('idle')
    })

    it('capture is a no-op during shake and flee', async () => {
      await reachTimingAfterCorrect(sequenceRng(0, 0, 0))
      act(() => {
        failThrow()
      })
      expect(useEncounterStore.getState().stage).toBe('shake')
      const duringShake = useEncounterStore.getState().session
      act(() => {
        capture(0.5)
      })
      expect(useEncounterStore.getState().stage).toBe('shake')
      expect(useEncounterStore.getState().session).toEqual(duringShake)

      vi.useFakeTimers()
      act(() => {
        onShakeComplete()
      })
      // First fail → fail beat → timing; push two more fails to flee
      act(() => {
        vi.advanceTimersByTime(encounterTimingMs.failBeat)
      })
      act(() => {
        failThrow()
      })
      act(() => {
        onShakeComplete()
      })
      act(() => {
        vi.advanceTimersByTime(encounterTimingMs.failBeat)
      })
      act(() => {
        failThrow()
      })
      act(() => {
        onShakeComplete()
      })
      expect(useEncounterStore.getState().stage).toBe('flee')
      const duringFlee = useEncounterStore.getState().session
      act(() => {
        capture(0.5)
      })
      expect(useEncounterStore.getState().stage).toBe('flee')
      expect(useEncounterStore.getState().session).toEqual(duringFlee)
    })

    it('registerThrow is a no-op outside the timing stage (WR-03 / T-05-04)', async () => {
      await reachTimingAfterCorrect(sequenceRng(0, 0, 0))
      vi.useFakeTimers()

      // Reach a non-timing stage (failBeat) through a real failed throw.
      act(() => {
        failThrow()
      })
      act(() => {
        onShakeComplete()
      })
      expect(useEncounterStore.getState().stage).toBe('failBeat')
      const attemptsBefore = useEncounterStore.getState().session?.attemptsUsed

      // A stray registerThrow while not in timing must not fire — no attempts
      // inflation and no forced shake (single-writer / mash-lock, D-21).
      act(() => {
        useEncounterStore
          .getState()
          .registerThrow({ grade: 'good', caught: true, chance: 0.9 })
      })
      expect(useEncounterStore.getState().stage).toBe('failBeat')
      expect(useEncounterStore.getState().session?.attemptsUsed).toBe(attemptsBefore)

      // The legitimate timing → shake transition still works after the guard.
      act(() => {
        vi.advanceTimersByTime(encounterTimingMs.failBeat)
      })
      expect(useEncounterStore.getState().stage).toBe('timing')
      act(() => {
        useEncounterStore
          .getState()
          .registerThrow({ grade: 'good', caught: false, chance: 0.5 })
      })
      expect(useEncounterStore.getState().stage).toBe('shake')
      expect(useEncounterStore.getState().session?.attemptsUsed).toBe(
        (attemptsBefore ?? 0) + 1,
      )
    })
  })

  describe('dex bindings — seen on appear, catch on Gotcha, shiny roll (DEX-02)', () => {
    it('markSeen after open — species is seen with firstEncounteredAt', async () => {
      // grass + species + non-shiny third roll
      await openPokemonAppear(sequenceRng(0, 0, 1))
      const speciesId = biomeEncounterTables.forest.common[0]
      const entry = useDexStore.getState().dex[String(speciesId)]
      expect(entry?.seen).toBe(true)
      expect(typeof entry?.firstEncounteredAt).toBe('string')
      expect(entry?.firstEncounteredAt!.length).toBeGreaterThan(0)
    })

    it('flee leaves the species Seen (no unmark)', async () => {
      await openPokemonAppear(sequenceRng(0, 0, 1))
      const speciesId = biomeEncounterTables.forest.common[0]
      expect(useDexStore.getState().dex[String(speciesId)]?.seen).toBe(true)

      act(() => {
        useEncounterStore.getState().toFlee()
      })
      act(() => {
        continueFromFlee()
      })
      expect(useEncounterStore.getState().stage).toBe('idle')
      expect(useDexStore.getState().dex[String(speciesId)]?.seen).toBe(true)
      expect(useDexStore.getState().dex[String(speciesId)]?.catchCount ?? 0).toBe(0)
    })

    it('onShakeComplete with lastCaught calls recordCatch with session shiny', async () => {
      await reachTimingAfterCorrect(sequenceRng(0, 0, 1, 0))
      const speciesId = useEncounterStore.getState().session!.speciesId
      expect(useEncounterStore.getState().session?.shiny).toBe(false)

      act(() => {
        useEncounterStore
          .getState()
          .registerThrow({ grade: 'perfect', caught: true, chance: 1 })
      })
      act(() => {
        onShakeComplete()
      })

      expect(useEncounterStore.getState().stage).toBe('result')
      const entry = useDexStore.getState().dex[String(speciesId)]
      expect(entry?.catchCount).toBe(1)
      expect(entry?.firstCapturedAt).toBeTruthy()
      expect(entry?.shinyOwned).toBe(false)
      expect(entry?.seen).toBe(true)
    })

    it('seeded Rng forces shiny true when roll < shinyRate', async () => {
      expect(shinyRate).toBeGreaterThan(0)
      // Third roll 0 < shinyRate → shiny
      await openPokemonAppear(sequenceRng(0, 0, 0))
      expect(useEncounterStore.getState().session?.shiny).toBe(true)
    })

    it('seeded Rng forces shiny false when roll >= shinyRate', async () => {
      await openPokemonAppear(sequenceRng(0, 0, 1))
      expect(useEncounterStore.getState().session?.shiny).toBe(false)
    })

    it('recordCatch ORs shinyOwned when session was shiny', async () => {
      await reachTimingAfterCorrect(sequenceRng(0, 0, 0, 0))
      const speciesId = useEncounterStore.getState().session!.speciesId
      expect(useEncounterStore.getState().session?.shiny).toBe(true)

      act(() => {
        useEncounterStore
          .getState()
          .registerThrow({ grade: 'perfect', caught: true, chance: 1 })
      })
      act(() => {
        onShakeComplete()
      })

      expect(useDexStore.getState().dex[String(speciesId)]?.shinyOwned).toBe(true)
    })
  })
})
