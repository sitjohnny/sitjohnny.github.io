/** Encounter session contracts — stages and resolutions shared by game, store, and UI. */

import type { TimingGrade } from '@/game/timing'
import type { BiomeId } from '@/types/map'

export type GrassOutcome = 'pokemon' | 'nothing' | 'rare' | 'legendary'
export type RarityBand = 'common' | 'rare' | 'legendary'

export type EncounterStage =
  | 'idle'
  | 'appear'
  | 'question'
  | 'feedback'
  | 'timing'
  | 'shake'
  | 'failBeat'
  | 'result'
  | 'flee'
  | 'recap'
  | 'error'

/** Filled by the education step (04-04); null until then. */
export type EncounterEducationOutcome = {
  factKey: string
  prompt: string
  expected: number | string
  correct: boolean
  /** Equation for Quick recap, e.g. `7 × 8 = 56`. */
  recapLine: string
  imageUrl?: string
  photographer?: string
  pexelsUrl?: string
}

export type EncounterSession = {
  speciesId: number
  rarity: RarityBand
  biome: BiomeId
  education: EncounterEducationOutcome | null
  /** Additive capture chance carried to Phase 5 (D-24). Sourced from educationCaptureBonus. */
  captureBonus: number
  /** Throws already used this encounter (0–3). */
  attemptsUsed: number
  /** Active sweet-spot center for the current timing attempt. */
  sweetSpot: number
  lastGrade: TimingGrade | null
  lastCaught: boolean | null
  lastChance: number | null
  /** Rolled once at session open (D-09); cosmetic client rarity. */
  shiny: boolean
}

export type EncounterResolution =
  { kind: 'nothing' } | { kind: 'pokemon'; speciesId: number; rarity: RarityBand }
