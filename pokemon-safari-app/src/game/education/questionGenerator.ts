/**
 * Multiplication EducationProvider — first category behind the D-22 seam.
 *
 * Selection and validation stay pure; config comes from data/. Keep free of
 * React, Zustand, and browser globals.
 */

import type { AdaptiveStats, EducationProvider, EducationQuestion } from './questionTypes'
import type { Rng } from '@/utils/rng'
import { selectFact } from './adaptiveLearning'
import { validateAnswer } from './answerValidator'

function parseFactKey(key: string): { a: number; b: number } {
  const [aStr, bStr] = key.split('x')
  return { a: Number(aStr), b: Number(bStr) }
}

export const multiplicationProvider: EducationProvider = {
  category: 'multiplication',

  nextQuestion(
    rng: Rng,
    stats: AdaptiveStats,
    excludeFactKey?: string | null,
  ): EducationQuestion {
    const factKey = selectFact(rng, stats, excludeFactKey ?? null)
    const { a, b } = parseFactKey(factKey)
    return {
      category: 'multiplication',
      prompt: `What is ${a} × ${b}?`,
      factKey,
      a,
      b,
      expected: a * b,
    }
  },

  validate(question, raw) {
    return validateAnswer(question, raw)
  },
}
