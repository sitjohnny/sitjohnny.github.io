/**
 * Phase 4 integration seam: Phase 3 emits `encounter_candidate`; Phase 4 subscribes.
 * No rates, tables, or rolls belong in this file.
 */

import type { BiomeId, EncounterCandidateEvent } from '@/types/map'

export const ENCOUNTER_CANDIDATE = 'encounter_candidate' as const

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
