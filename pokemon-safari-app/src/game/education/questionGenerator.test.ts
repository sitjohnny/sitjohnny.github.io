import { describe, expect, it } from 'vitest'
import { spellingMixProbability } from '@/data/educationConfig'
import type { Rng } from '@/utils/rng'
import {
  defaultMathEducationSettings,
  type MathEducationSettings,
} from './mathSettings'
import { mathEducationProvider, nextEducationQuestion } from './questionGenerator'

function onlySettings(
  patch: (settings: MathEducationSettings) => void,
): MathEducationSettings {
  const settings = defaultMathEducationSettings()
  for (const key of Object.keys(settings.operators) as Array<
    keyof MathEducationSettings['operators']
  >) {
    settings.operators[key] = false
  }
  for (const level of [1, 2, 3, 4, 5, 6] as const) {
    settings.levels[level] = false
  }
  patch(settings)
  return settings
}

function isMathCategory(
  category: string,
): category is 'addition' | 'subtraction' | 'multiplication' | 'division' {
  return (
    category === 'addition' ||
    category === 'subtraction' ||
    category === 'multiplication' ||
    category === 'division'
  )
}

function stubRng(values: number[]): Rng {
  let i = 0
  return {
    next() {
      const v = values[i] ?? values[values.length - 1]!
      i += 1
      return v
    },
  }
}

function countingRng(values: number[]): { rng: Rng; getCount: () => number } {
  let i = 0
  let count = 0
  return {
    rng: {
      next() {
        count += 1
        const v = values[i] ?? values[values.length - 1]!
        i += 1
        return v
      },
    },
    getCount: () => count,
  }
}

describe('mathEducationProvider', () => {
  it('nextQuestion with default settings yields a math category', () => {
    for (let i = 0; i < 50; i += 1) {
      const q = mathEducationProvider.nextQuestion(
        stubRng([0.1, 0.2, 0.3, 0.4, 0.5]),
        {},
        'common',
      )
      expect(isMathCategory(q.category)).toBe(true)
    }
  })

  it('builds addition questions from p keys via selectFact settings', () => {
    const settings = onlySettings((value) => {
      value.operators.addition = true
      value.levels[1] = true
    })
    const q = mathEducationProvider.nextQuestion(
      stubRng([0, 0, 0, 0]),
      {},
      'legendary',
      null,
      settings,
    )
    expect(q.category).toBe('addition')
    expect(q.prompt).toMatch(/\+/)
    expect(q.expected).toBe(q.a + q.b)
  })

  it('legendary rarity does not change category when only subtraction level 1 enabled', () => {
    const settings = onlySettings((value) => {
      value.operators.subtraction = true
      value.levels[1] = true
    })
    for (let i = 0; i < 50; i += 1) {
      const q = mathEducationProvider.nextQuestion(
        stubRng([0.1, 0.2, 0.3, 0.4, 0.5]),
        {},
        'legendary',
        null,
        settings,
      )
      expect(q.category).toBe('subtraction')
    }
  })
})

describe('nextEducationQuestion', () => {
  it('nextEducationQuestion never picks spelling while mix probability is 0', () => {
    const q = nextEducationQuestion(stubRng([0, 0.1, 0]), {}, 'common', null, {
      spellingEnabled: true,
    })
    expect(isMathCategory(q.category)).toBe(true)
  })

  it('nextEducationQuestion picks math when roll >= mix', () => {
    const q = nextEducationQuestion(
      stubRng([spellingMixProbability, 0, 0]),
      {},
      'common',
      null,
      { spellingEnabled: true },
    )
    expect(isMathCategory(q.category)).toBe(true)
  })

  it('nextEducationQuestion always picks math when spelling disabled', () => {
    const q = nextEducationQuestion(stubRng([0, 0, 0]), {}, 'common', null, {
      spellingEnabled: false,
    })
    expect(isMathCategory(q.category)).toBe(true)
  })

  it('skips spelling subject roll when spellingEnabled is false', () => {
    const mathRolls = Array.from({ length: 12 }, () => 0)
    const { rng: enabledRng, getCount: enabledCount } = countingRng([
      spellingMixProbability + 0.01,
      ...mathRolls,
    ])
    nextEducationQuestion(enabledRng, {}, 'common', null, {
      spellingEnabled: true,
    })
    const { rng: disabledRng, getCount: disabledCount } = countingRng(mathRolls)
    nextEducationQuestion(disabledRng, {}, 'common', null, {
      spellingEnabled: false,
    })
    expect(disabledCount()).toBe(enabledCount() - 1)
  })

  it('defaults to spelling-disabled when options omitted', () => {
    const q = nextEducationQuestion(stubRng([0, 0.1, 0]), {}, 'common', null)
    expect(isMathCategory(q.category)).toBe(true)
  })
})
