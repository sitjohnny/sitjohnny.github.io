/**
 * Phase 4 integration seam.
 *
 * Phase 3 emits `encounter_candidate` events when the player steps onto grass
 * and stores them in `useExploreStore.pendingEncounters`. Phase 4 consumes them
 * via `useExploreStore.getState().drainEncounters()` — that is the single
 * Phase 4 read point.
 *
 * Encounter rates, biome tables, and rolls belong in Phase 4's `data/` config
 * and must not be added to this file. Keep this module free of React, Zustand,
 * browser globals, and logging.
 */

import type { BiomeId, EncounterCandidateEvent } from '@/types/map'

export const ENCOUNTER_CANDIDATE = 'encounter_candidate' as const

/** Hard cap on the pending encounter queue (T-03-05). Oldest entries drop first. */
export const MAX_PENDING_ENCOUNTERS = 32

export function createEncounterCandidate(
  biome: BiomeId,
  x: number,
  y: number,
  at: number,
): EncounterCandidateEvent {
  return {
    type: ENCOUNTER_CANDIDATE,
    biome,
    x,
    y,
    at,
  }
}

/**
 * Appends events, dropping oldest beyond `max` (default MAX_PENDING_ENCOUNTERS).
 * Returns a new array; never mutates the inputs.
 */
export function enqueueEncounters(
  queue: readonly EncounterCandidateEvent[],
  events: readonly EncounterCandidateEvent[],
  max: number = MAX_PENDING_ENCOUNTERS,
): EncounterCandidateEvent[] {
  if (events.length === 0) {
    return queue.length <= max ? [...queue] : queue.slice(-max)
  }
  const next = [...queue, ...events]
  return next.length <= max ? next : next.slice(-max)
}

/**
 * FIFO drain: returns the queued events and an emptied remaining queue.
 * Does not mutate the input array.
 */
export function drainEncounters(
  queue: readonly EncounterCandidateEvent[],
): { taken: EncounterCandidateEvent[]; remaining: EncounterCandidateEvent[] } {
  return {
    taken: [...queue],
    remaining: [],
  }
}
