/**
 * Category-agnostic education contracts (D-22 / D-23).
 *
 * Other subject categories implement `EducationProvider` — do not add
 * multiplication-specific fields or logic here. Config knobs live in
 * `@/data/educationConfig`. Keep this module free of React, Zustand, and
 * browser globals.
 */

import type { Rng } from '@/utils/rng'

/** Template-literal fact id, e.g. `'7x8'`. */
export type FactKey = `${number}x${number}`

export type FactStat = { correct: number; incorrect: number }

export type AdaptiveStats = Record<string, FactStat>

export type EducationQuestion = {
  category: 'multiplication'
  prompt: string
  factKey: FactKey
  a: number
  b: number
  expected: number
}

export type AnswerResult = { ok: boolean; expected: number; parsed: number | null }

/** Seam later categories plug into without touching encounter flow (D-22). */
export type EducationProvider = {
  category: string
  nextQuestion: (
    rng: Rng,
    stats: AdaptiveStats,
    excludeFactKey?: string | null,
  ) => EducationQuestion
  validate: (question: EducationQuestion, raw: string) => AnswerResult
}
