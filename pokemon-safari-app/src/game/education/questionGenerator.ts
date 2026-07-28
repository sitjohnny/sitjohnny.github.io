/**
 * EducationProvider — multiplication and division behind the D-22 seam.
 *
 * Selection and validation stay pure; config comes from data/. Keep free of
 * React, Zustand, and browser globals.
 */

import type { RarityBand } from '@/types/encounter'
import type {
  AdaptiveStats,
  EducationProvider,
  EducationQuestion,
  FactKey,
} from './questionTypes'
import type { Rng } from '@/utils/rng'
import { selectFact } from './adaptiveLearning'
import { validateAnswer } from './answerValidator'

function isDivisionKey(key: string): boolean {
  return key.includes('d') && !key.includes('x')
}

function parseFactKey(key: string): {
  a: number
  b: number
  category: 'multiplication' | 'division'
} {
  if (isDivisionKey(key)) {
    const [nStr, dStr] = key.split('d')
    return { a: Number(nStr), b: Number(dStr), category: 'division' }
  }
  const [aStr, bStr] = key.split('x')
  return { a: Number(aStr), b: Number(bStr), category: 'multiplication' }
}

function buildQuestion(factKey: FactKey): EducationQuestion {
  const { a, b, category } = parseFactKey(factKey)
  if (category === 'division') {
    const expected = a / b
    return {
      category: 'division',
      prompt: `What is ${a} ÷ ${b}?`,
      factKey,
      a,
      b,
      expected,
      recapLine: `${a} ÷ ${b} = ${expected}`,
    }
  }
  const expected = a * b
  return {
    category: 'multiplication',
    prompt: `What is ${a} × ${b}?`,
    factKey,
    a,
    b,
    expected,
    recapLine: `${a} × ${b} = ${expected}`,
  }
}

/** Unified provider used by encounter flow for all education categories. */
export const educationProvider: EducationProvider = {
  category: 'education',

  nextQuestion(
    rng: Rng,
    stats: AdaptiveStats,
    rarity: RarityBand,
    excludeFactKey?: string | null,
  ): EducationQuestion {
    const factKey = selectFact(rng, stats, excludeFactKey ?? null, rarity)
    return buildQuestion(factKey)
  },

  validate(question, raw) {
    return validateAnswer(question, raw)
  },
}

/** @deprecated Prefer educationProvider — kept for any residual imports. */
export const multiplicationProvider = educationProvider
