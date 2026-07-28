import { describe, expect, it } from 'vitest'
import { spellingMixProbability } from '@/data/educationConfig'
import type { Rng } from '@/utils/rng'
import { nextEducationQuestion } from './questionGenerator'

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

describe('nextEducationQuestion', () => {
  it('nextEducationQuestion picks spelling when enabled and roll < mix', () => {
    const q = nextEducationQuestion(
      stubRng([spellingMixProbability - 0.01, 0.1, 0]),
      {},
      null,
      { spellingEnabled: true },
    )
    expect(q.category).toBe('spelling')
  })

  it('nextEducationQuestion picks math when roll >= mix', () => {
    const q = nextEducationQuestion(
      stubRng([spellingMixProbability, 0, 0]),
      {},
      null,
      { spellingEnabled: true },
    )
    expect(q.category === 'multiplication' || q.category === 'division').toBe(
      true,
    )
  })

  it('nextEducationQuestion always picks math when spelling disabled', () => {
    const q = nextEducationQuestion(stubRng([0, 0, 0]), {}, null, {
      spellingEnabled: false,
    })
    expect(q.category === 'multiplication' || q.category === 'division').toBe(
      true,
    )
  })

  it('skips spelling subject roll when spellingEnabled is false', () => {
    const mathRolls = Array.from({ length: 12 }, () => 0)
    const { rng: enabledRng, getCount: enabledCount } = countingRng([
      spellingMixProbability + 0.01,
      ...mathRolls,
    ])
    nextEducationQuestion(enabledRng, {}, null, { spellingEnabled: true })
    const { rng: disabledRng, getCount: disabledCount } = countingRng(mathRolls)
    nextEducationQuestion(disabledRng, {}, null, { spellingEnabled: false })
    expect(disabledCount()).toBe(enabledCount() - 1)
  })

  it('defaults to spelling-enabled when options omitted', () => {
    const q = nextEducationQuestion(
      stubRng([spellingMixProbability - 0.01, 0.1, 0]),
      {},
      null,
    )
    expect(q.category).toBe('spelling')
  })
})
