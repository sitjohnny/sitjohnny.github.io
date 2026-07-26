/** Encounter session contracts — stages and resolutions shared by game, store, and UI. */

import type { BiomeId } from '@/types/map'

export type GrassOutcome = 'pokemon' | 'nothing' | 'item' | 'rare' | 'legendary'
export type RarityBand = 'common' | 'rare' | 'legendary'

export type EncounterStage =
  | 'idle'
  | 'appear'
  | 'question'
  | 'feedback'
  | 'handoff'
  | 'recap'
  | 'error'

/** Filled by the education step (04-04); null until then. */
export type EncounterEducationOutcome = {
  factKey: string
  prompt: string
  expected: number
  correct: boolean
}

export type EncounterSession = {
  speciesId: number
  rarity: RarityBand
  biome: BiomeId
  education: EncounterEducationOutcome | null
  /** Additive capture chance carried to Phase 5 (D-24). Sourced from educationCaptureBonus. */
  captureBonus: number
}

export type EncounterResolution =
  | { kind: 'nothing' }
  | { kind: 'item' }
  | { kind: 'pokemon'; speciesId: number; rarity: RarityBand }
