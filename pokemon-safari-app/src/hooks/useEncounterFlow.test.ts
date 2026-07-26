import { createElement, useEffect } from 'react'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { biomeEncounterTables } from '@/data/encounterTables'
import { educationCaptureBonus, encounterTimingMs } from '@/data/rates'
import { allFacts } from '@/game/education/adaptiveLearning'
import {
  loadAdaptiveStats,
  persistAdaptiveStats,
  resetAdaptiveStatsForTests,
} from '@/game/education/adaptiveStore'
import {
  advanceFromAppear,
  submitAnswer,
  useEncounterFlow,
} from '@/hooks/useEncounterFlow'
import {
  hydrateFromStorage,
  resetCacheMemoryForTests,
} from '@/services/pokeapi/cache'
import { useEncounterStore } from '@/store/encounterStore'
import { useExploreStore } from '@/store/exploreStore'
import {
  clearPokeCacheKey,
  makePokemonDto,
  seedPokeCache,
} from '@/test/pokeapi-test-helpers'
import type { EncounterCandidateEvent } from '@/types/map'
import type { Rng } from '@/utils/rng'

const FACT_SET = new Set(allFacts())

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

async function openPokemonAppear(rng: Rng = sequenceRng(0, 0)) {
  render(createElement(QueueLater, { rng, event: candidate() }))
  await waitFor(() => expect(useEncounterStore.getState().stage).toBe('appear'))
}

describe('useEncounterFlow', () => {
  beforeEach(() => {
    useExploreStore.getState().reset()
    useEncounterStore.getState().reset()
    clearPokeCacheKey()
    resetCacheMemoryForTests()
    resetAdaptiveStatsForTests()
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
    vi.useRealTimers()
  })

  it('opens a common Forest session for a pokemon roll', async () => {
    render(createElement(QueueLater, { rng: sequenceRng(0, 0), event: candidate() }))

    await waitFor(() => expect(useEncounterStore.getState().stage).toBe('appear'))
    expect(useEncounterStore.getState().session).toEqual({
      speciesId: biomeEncounterTables.forest.common[0],
      rarity: 'common',
      biome: 'forest',
      education: null,
      captureBonus: 0,
    })
  })

  it.each([
    ['rare', 0.91, biomeEncounterTables.forest.rare],
    ['legendary', 0.99, biomeEncounterTables.forest.legendary],
  ] as const)('routes the %s band to its matching pool', async (rarity, roll, pool) => {
    render(createElement(QueueLater, { rng: sequenceRng(roll, 0), event: candidate() }))

    await waitFor(() => expect(useEncounterStore.getState().stage).toBe('appear'))
    expect(useEncounterStore.getState().session).toMatchObject({
      speciesId: pool[0],
      rarity,
    })
  })

  it('keeps nothing silent and idle', async () => {
    render(createElement(QueueLater, { rng: sequenceRng(0.5), event: candidate() }))

    await waitFor(() =>
      expect(useExploreStore.getState().pendingEncounters).toHaveLength(0),
    )
    expect(useEncounterStore.getState()).toMatchObject({
      stage: 'idle',
      itemToastVisible: false,
      session: null,
    })
  })

  it('shows an item toast without opening a modal stage', async () => {
    render(createElement(QueueLater, { rng: sequenceRng(0.75), event: candidate() }))

    await waitFor(() =>
      expect(useEncounterStore.getState().itemToastVisible).toBe(true),
    )
    expect(useEncounterStore.getState().stage).toBe('idle')
  })

  it('consumes exactly one candidate and re-queues the remainder in FIFO order', async () => {
    useExploreStore.getState().pushEncounters([candidate(1), candidate(2), candidate(3)])
    render(createElement(Harness, { rng: sequenceRng(0, 0) }))

    await waitFor(() => expect(useEncounterStore.getState().stage).toBe('appear'))
    expect(useExploreStore.getState().pendingEncounters.map((event) => event.at)).toEqual([
      2, 3,
    ])
  })

  it('does not consume another candidate while an encounter is active', async () => {
    render(createElement(Harness, { rng: sequenceRng(0, 0) }))
    act(() => {
      useEncounterStore.setState({ stage: 'handoff' })
      useExploreStore.getState().pushEncounters([candidate()])
    })

    await waitFor(() =>
      expect(useExploreStore.getState().pendingEncounters).toHaveLength(1),
    )
    expect(useEncounterStore.getState().stage).toBe('handoff')
  })

  it('routes a species missing from cache to error instead of throwing', async () => {
    seedPokeCache(
      Array.from({ length: 150 }, (_, index) => makePokemonDto(index + 2)),
    )
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

  it('applies a correct answer with capture bonus and advances to handoff after the hold', async () => {
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
    expect(state.stage).toBe('handoff')
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
    let draw = 0
    const rng: Rng = {
      next: () => {
        draw += 1
        // Outcome + species index stay at 0; later draws feed fact/copy picks.
        if (draw % 4 === 1 || draw % 4 === 2) return 0
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
      expect(useEncounterStore.getState().lastFactKey).toBe(asked.factKey)
      expect(useEncounterStore.getState().stage).toBe('idle')
    }
  })

  it('never reaches question for nothing or item outcomes', async () => {
    render(createElement(QueueLater, { rng: sequenceRng(0.5), event: candidate(1) }))
    await waitFor(() =>
      expect(useExploreStore.getState().pendingEncounters).toHaveLength(0),
    )
    expect(useEncounterStore.getState().stage).toBe('idle')
    expect(useEncounterStore.getState().question).toBeNull()

    cleanup()
    useExploreStore.getState().reset()
    useEncounterStore.getState().reset()

    render(createElement(QueueLater, { rng: sequenceRng(0.75), event: candidate(2) }))
    await waitFor(() =>
      expect(useEncounterStore.getState().itemToastVisible).toBe(true),
    )
    expect(useEncounterStore.getState().stage).toBe('idle')
    expect(useEncounterStore.getState().question).toBeNull()
  })
})
