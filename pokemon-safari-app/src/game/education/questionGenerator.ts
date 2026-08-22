/**
 * EducationProvider — adaptive math and spelling behind the D-22 seam.
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
import {
  defaultMathEducationSettings,
  type MathEducationSettings,
} from './mathSettings'
import { selectSpellingFact } from './spellingSelection'
import type {
  AdaptiveStats,
  EducationProvider,
  EducationQuestion,
  MathEducationQuestion,
  SpellingEducationQuestion,
  SpellingFactKey,
} from './questionTypes'

const FACT_KEY_PATTERN = /^(\d+)([xdpm])(\d+)$/

type MathFactKey = MathEducationQuestion['factKey']

function parseFactKey(key: string): {
  a: number
  b: number
  category: MathEducationQuestion['category']
} {
  const match = key.match(FACT_KEY_PATTERN)
  if (!match) {
    throw new Error(`parseFactKey: invalid math fact key ${key}`)
  }
  const [, aStr, operator, bStr] = match
  const a = Number(aStr)
  const b = Number(bStr)
  switch (operator) {
    case 'p':
      return { a, b, category: 'addition' }
    case 'm':
      return { a, b, category: 'subtraction' }
    case 'x':
      return { a, b, category: 'multiplication' }
    case 'd':
      return { a, b, category: 'division' }
    default:
      throw new Error(`parseFactKey: unknown operator ${operator}`)
  }
}

function buildMathQuestion(factKey: MathFactKey): MathEducationQuestion {
  const { a, b, category } = parseFactKey(factKey)
  if (category === 'addition') {
    const expected = a + b
    return {
      category: 'addition',
      prompt: `What is ${a} + ${b}?`,
      factKey,
      a,
      b,
      expected,
      recapLine: `${a} + ${b} = ${expected}`,
    }
  }
  if (category === 'subtraction') {
    const expected = a - b
    return {
      category: 'subtraction',
      prompt: `What is ${a} − ${b}?`,
      factKey,
      a,
      b,
      expected,
      recapLine: `${a} − ${b} = ${expected}`,
    }
  }
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
    _rarity: RarityBand,
    excludeFactKey?: string | null,
    mathSettings?: MathEducationSettings,
  ): EducationQuestion {
    const settings = mathSettings ?? defaultMathEducationSettings()
    const factKey = selectFact(rng, stats, excludeFactKey ?? null, settings)
    return buildMathQuestion(factKey as MathFactKey)
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
  options?: { spellingEnabled?: boolean; mathSettings?: MathEducationSettings },
): EducationQuestion {
  const spellingEnabled = options?.spellingEnabled ?? false
  const mathSettings = options?.mathSettings
  if (!spellingEnabled) {
    return mathEducationProvider.nextQuestion(
      rng,
      stats,
      rarity,
      excludeFactKey,
      mathSettings,
    )
  }
  if (rng.next() < spellingMixProbability) {
    return spellingEducationProvider.nextQuestion(rng, stats, rarity, excludeFactKey)
  }
  return mathEducationProvider.nextQuestion(
    rng,
    stats,
    rarity,
    excludeFactKey,
    mathSettings,
  )
}

/** @deprecated Prefer mathEducationProvider or nextEducationQuestion. */
export const educationProvider = mathEducationProvider

/** @deprecated Prefer mathEducationProvider — kept for any residual imports. */
export const multiplicationProvider = mathEducationProvider
