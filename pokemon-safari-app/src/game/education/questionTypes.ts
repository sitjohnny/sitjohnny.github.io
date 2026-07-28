/**
 * Category-agnostic education contracts (D-22 / D-23).
 *
 * Other subject categories implement `EducationProvider` — do not add
 * multiplication-specific fields or logic here. Config knobs live in
 * `@/data/educationConfig`. Keep this module free of React, Zustand, and
 * browser globals.
 */

import type { RarityBand } from '@/types/encounter'
import type { Rng } from '@/utils/rng'

/** Multiplication `7x8` or division `48d6` fact ids. */
export type FactKey = `${number}x${number}` | `${number}d${number}`

export type FactStat = { correct: number; incorrect: number }

export type AdaptiveStats = Record<string, FactStat>

export type EducationCategory = 'multiplication' | 'division'

export type EducationQuestion = {
  category: EducationCategory
  prompt: string
  factKey: FactKey
  a: number
  b: number
  expected: number
  /** Equation shown on Quick recap, e.g. `7 × 8 = 56` or `48 ÷ 6 = 8`. */
  recapLine: string
}

export type AnswerResult = { ok: boolean; expected: number; parsed: number | null }

/** Seam later categories plug into without touching encounter flow (D-22). */
export type EducationProvider = {
  category: string
  nextQuestion: (
    rng: Rng,
    stats: AdaptiveStats,
    rarity: RarityBand,
    excludeFactKey?: string | null,
  ) => EducationQuestion
  validate: (question: EducationQuestion, raw: string) => AnswerResult
}
