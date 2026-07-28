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

export type SpellingFactKey = `spell:${string}`
export type FactKey =
  | `${number}x${number}`
  | `${number}d${number}`
  | SpellingFactKey

export type FactStat = { correct: number; incorrect: number }

export type AdaptiveStats = Record<string, FactStat>

export type MathEducationQuestion = {
  category: 'multiplication' | 'division'
  prompt: string
  factKey: `${number}x${number}` | `${number}d${number}`
  a: number
  b: number
  expected: number
  /** Equation shown on Quick recap, e.g. `7 × 8 = 56` or `48 ÷ 6 = 8`. */
  recapLine: string
}

export type SpellingEducationQuestion = {
  category: 'spelling'
  prompt: string
  factKey: SpellingFactKey
  word: string
  imageUrl: string
  photographer: string
  pexelsUrl: string
  expected: string // lowercase target
  recapLine: string // e.g. "elephant"
}

export type EducationQuestion =
  | MathEducationQuestion
  | SpellingEducationQuestion
export type EducationCategory = EducationQuestion['category']

export type MathAnswerResult = {
  ok: boolean
  expected: number
  parsed: number | null
}
export type SpellingAnswerResult = {
  ok: boolean
  expected: string
  parsed: string | null
}
export type AnswerResult = MathAnswerResult | SpellingAnswerResult

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
