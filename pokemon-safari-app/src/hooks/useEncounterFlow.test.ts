import { createElement, useEffect } from 'react'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { biomeEncounterTables } from '@/data/encounterTables'
import { useEncounterFlow } from '@/hooks/useEncounterFlow'
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

describe('useEncounterFlow', () => {
  beforeEach(() => {
    useExploreStore.getState().reset()
    useEncounterStore.getState().reset()
    clearPokeCacheKey()
    resetCacheMemoryForTests()
    seedPokeCache()
    hydrateFromStorage()
  })

  afterEach(() => {
    cleanup()
    useExploreStore.getState().reset()
    useEncounterStore.getState().reset()
    clearPokeCacheKey()
    resetCacheMemoryForTests()
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
})
