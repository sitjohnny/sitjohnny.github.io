/**
 * EducationProvider — multiplication, division, and spelling behind the D-22 seam.
 *
 * Selection and validation stay pure; config comes from data/. Keep free of
 * React, Zustand, and browser globals.
 */

import { spellingCopy, spellingMixProbability } from '@/data/educationConfig'
import { spellingWordByFactKey } from '@/data/spellingWords'
import type { RarityBand } from '@/types/encounter'
import type { Rng } from '@/utils/rng'
import { selectFact } from './adaptiveLearning'
import { validateAnswer } from './answerValidator'
import { selectSpellingFact } from './spellingSelection'
import type {
  AdaptiveStats,
  EducationProvider,
  EducationQuestion,
  MathEducationQuestion,
  SpellingEducationQuestion,
  SpellingFactKey,
} from './questionTypes'

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

type MathFactKey = `${number}x${number}` | `${number}d${number}`

function buildMathQuestion(factKey: MathFactKey): MathEducationQuestion {
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

function buildSpellingQuestion(factKey: SpellingFactKey): SpellingEducationQuestion {
  const entry = spellingWordByFactKey(factKey)
  if (!entry) {
    throw new Error(`buildSpellingQuestion: unknown factKey ${factKey}`)
  }
  const expected = entry.word.toLowerCase()
  return {
    category: 'spelling',
    prompt: spellingCopy.prompt,
    factKey,
    word: entry.word,
    imageUrl: entry.imageUrl,
    photographer: entry.photographer,
    pexelsUrl: entry.pexelsUrl,
    expected,
    recapLine: entry.word,
  }
}

export const mathEducationProvider: EducationProvider = {
  category: 'education',

  nextQuestion(
    rng: Rng,
    stats: AdaptiveStats,
    rarity: RarityBand,
    excludeFactKey?: string | null,
  ): EducationQuestion {
    const factKey = selectFact(rng, stats, excludeFactKey ?? null, rarity) as MathFactKey
    return buildMathQuestion(factKey)
  },

  validate(question, raw) {
    return validateAnswer(question, raw)
  },
}

export const spellingEducationProvider: EducationProvider = {
  category: 'spelling',

  nextQuestion(
    rng: Rng,
    stats: AdaptiveStats,
    _rarity: RarityBand,
    excludeFactKey?: string | null,
  ): EducationQuestion {
    const factKey = selectSpellingFact(rng, stats, excludeFactKey ?? null)
    return buildSpellingQuestion(factKey)
  },

  validate(question, raw) {
    return validateAnswer(question, raw)
  },
}

export function nextEducationQuestion(
  rng: Rng,
  stats: AdaptiveStats,
  rarity: RarityBand,
  excludeFactKey?: string | null,
  options?: { spellingEnabled?: boolean },
): EducationQuestion {
  const spellingEnabled = options?.spellingEnabled ?? false
  if (!spellingEnabled) {
    return mathEducationProvider.nextQuestion(rng, stats, rarity, excludeFactKey)
  }
  if (rng.next() < spellingMixProbability) {
    return spellingEducationProvider.nextQuestion(rng, stats, rarity, excludeFactKey)
  }
  return mathEducationProvider.nextQuestion(rng, stats, rarity, excludeFactKey)
}

/** @deprecated Prefer mathEducationProvider or nextEducationQuestion. */
export const educationProvider = mathEducationProvider

/** @deprecated Prefer mathEducationProvider — kept for any residual imports. */
export const multiplicationProvider = mathEducationProvider
