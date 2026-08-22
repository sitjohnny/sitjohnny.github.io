import { describe, expect, it } from 'vitest'
import {
  adaptiveWeights,
  masteryThreshold,
  maxEnumeratePoolSize,
  type MathLevel,
  type MathOperator,
} from '@/data/educationConfig'
import { createRng } from '@/utils/rng'
import {
  additionFactKeyOf,
  digitClassOf,
  divisionFactKeyOf,
  factKeyOf,
  factsFor,
  factWeight,
  isMastered,
  sampleFact,
  selectFact,
  subtractionFactKeyOf,
} from './adaptiveLearning'
import {
  defaultMathEducationSettings,
  type MathEducationSettings,
} from './mathSettings'
import type { AdaptiveStats, FactKey } from './questionTypes'

const only = (
  patch: (settings: MathEducationSettings) => void,
): MathEducationSettings => {
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

function expectFactMatches(
  key: FactKey,
  operator: MathOperator,
  level: MathLevel,
): void {
  const separator = {
    addition: 'p',
    subtraction: 'm',
    multiplication: 'x',
    division: 'd',
  }[operator]
  const [a, b] = key.split(separator).map(Number)
  expect(Number.isInteger(a)).toBe(true)
  expect(Number.isInteger(b)).toBe(true)

  const actualClasses = [digitClassOf(a!), digitClassOf(b!)].sort()
  const expectedClasses = [...{
    1: [1, 1],
    2: [1, 2],
    3: [2, 2],
    4: [3, 1],
    5: [3, 2],
    6: [3, 3],
  }[level]].sort()
  expect(actualClasses).toEqual(expectedClasses)

  if (operator === 'subtraction') expect(a!).toBeGreaterThanOrEqual(b!)
  if (operator === 'multiplication') {
    expect(a!).toBeGreaterThanOrEqual(2)
    expect(b!).toBeGreaterThanOrEqual(2)
  }
  if (operator === 'division') {
    expect(b!).toBeGreaterThanOrEqual(2)
    expect(a! % b!).toBe(0)
    expect(a! / b!).toBeGreaterThan(0)
  }
}

describe('adaptiveLearning', () => {
  it('builds each math fact-key format', () => {
    expect(factKeyOf(7, 8)).toBe('7x8')
    expect(divisionFactKeyOf(48, 6)).toBe('48d6')
    expect(additionFactKeyOf(12, 3)).toBe('12p3')
    expect(subtractionFactKeyOf(12, 3)).toBe('12m3')
  })

  it('classifies one-, two-, and three-digit numbers', () => {
    expect(digitClassOf(1)).toBe(1)
    expect(digitClassOf(99)).toBe(2)
    expect(digitClassOf(100)).toBe(3)
  })

  it('factsFor enumerates both orders for mixed addition classes', () => {
    const facts = factsFor('addition', 2)
    expect(facts).toContain('1p10')
    expect(facts).toContain('10p1')
    expect(new Set(facts).size).toBe(facts.length)
  })

  it('factsFor canonicalizes subtraction and excludes trivial multiplication', () => {
    const subtraction = factsFor('subtraction', 2)
    expect(subtraction).toContain('10m1')
    expect(subtraction).not.toContain('1m10')
    for (const key of subtraction) {
      const [a, b] = key.split('m').map(Number)
      expect(a!).toBeGreaterThanOrEqual(b!)
    }

    for (const key of factsFor('multiplication', 1)) {
      const [a, b] = key.split('x').map(Number)
      expect(a!).toBeGreaterThanOrEqual(2)
      expect(b!).toBeGreaterThanOrEqual(2)
    }
  })

  it('factsFor division divides evenly and skips division by one', () => {
    for (const level of [1, 2, 3] as const) {
      const facts = factsFor('division', level)
      expect(facts.length).toBeGreaterThan(0)
      for (const key of facts) {
        const [numerator, divisor] = key.split('d').map(Number)
        expect(divisor!).toBeGreaterThanOrEqual(2)
        expect(numerator! % divisor!).toBe(0)
      }
    }
  })

  it('factsFor skips pools larger than maxEnumeratePoolSize', () => {
    expect(maxEnumeratePoolSize).toBe(12_000)
    expect(factsFor('addition', 6)).toEqual([])
  })

  it('sampleFact obeys every operator and level shape', () => {
    const rng = createRng(1407)
    const operators: MathOperator[] = [
      'addition',
      'subtraction',
      'multiplication',
      'division',
    ]
    const levels: MathLevel[] = [1, 2, 3, 4, 5, 6]
    for (const operator of operators) {
      for (const level of levels) {
        for (let draw = 0; draw < 10; draw++) {
          expectFactMatches(sampleFact(rng, operator, level), operator, level)
        }
      }
    }
  })

  it('factWeight preserves miss bias and mastery review', () => {
    expect(factWeight(undefined)).toBe(adaptiveWeights.starterWeight)
    expect(factWeight({ correct: 2, incorrect: 5 })).toBeGreaterThan(
      factWeight({ correct: 2, incorrect: 1 }),
    )
    expect(factWeight({ correct: 10_000, incorrect: 0 })).toBeGreaterThanOrEqual(
      adaptiveWeights.minWeight,
    )

    const mastered = { correct: masteryThreshold.minAttempts, incorrect: 0 }
    expect(isMastered(mastered)).toBe(true)
    expect(factWeight(mastered)).toBe(adaptiveWeights.masteredReviewWeight)
    expect(
      isMastered({ correct: masteryThreshold.minAttempts - 1, incorrect: 0 }),
    ).toBe(false)
  })

  it('selectFact with only addition and level 1 yields one-digit addition keys', () => {
    const settings = only((value) => {
      value.operators.addition = true
      value.levels[1] = true
    })
    const rng = createRng(1)
    for (let i = 0; i < 40; i++) {
      const key = selectFact(rng, {}, null, settings)
      expect(key).toMatch(/^\d+p\d+$/)
      const [a, b] = key.split('p').map(Number)
      expect(digitClassOf(a!)).toBe(1)
      expect(digitClassOf(b!)).toBe(1)
    }
  })

  it('default level 2 settings never emit level 6 shapes', () => {
    const settings = defaultMathEducationSettings()
    const rng = createRng(2027)
    for (let i = 0; i < 500; i++) {
      const key = selectFact(rng, {}, null, settings)
      const separator = key.match(/[xdpm]/)?.[0]
      expect(separator).toBeDefined()
      const [a, b] = key.split(separator!).map(Number)
      expect([digitClassOf(a!), digitClassOf(b!)].sort()).toEqual([1, 2])
    }
  })

  it('selectFact roughly equalizes two enabled operators', () => {
    const settings = only((value) => {
      value.operators.addition = true
      value.operators.subtraction = true
      value.levels[1] = true
    })
    const rng = createRng(729)
    let addition = 0
    const draws = 400
    for (let i = 0; i < draws; i++) {
      if (selectFact(rng, {}, null, settings).includes('p')) addition += 1
    }
    expect(Math.abs(addition / draws - 0.5)).toBeLessThan(0.08)
  })

  it('selectFact subtraction facts are non-negative', () => {
    const settings = only((value) => {
      value.operators.subtraction = true
      value.levels[4] = true
    })
    const rng = createRng(831)
    for (let i = 0; i < 100; i++) {
      const [a, b] = selectFact(rng, {}, null, settings).split('m').map(Number)
      expect(a!).toBeGreaterThanOrEqual(b!)
    }
  })

  it('selectFact division facts divide evenly and skip division by one', () => {
    const settings = only((value) => {
      value.operators.division = true
      value.levels[5] = true
    })
    const rng = createRng(915)
    for (let i = 0; i < 100; i++) {
      const [numerator, divisor] = selectFact(rng, {}, null, settings)
        .split('d')
        .map(Number)
      expect(divisor!).toBeGreaterThanOrEqual(2)
      expect(numerator! % divisor!).toBe(0)
    }
  })

  it('selectFact never returns excludeFactKey over 200 draws', () => {
    const settings = only((value) => {
      value.operators.multiplication = true
      value.levels[1] = true
    })
    const exclude: FactKey = '7x8'
    const stats: AdaptiveStats = {
      [exclude]: { correct: 0, incorrect: 10_000 },
    }
    const rng = createRng(1087)
    for (let i = 0; i < 200; i++) {
      expect(selectFact(rng, stats, exclude, settings)).not.toBe(exclude)
    }
  })

  it('uses default settings for an empty settings object', () => {
    const settings = only(() => {})
    const rng = createRng(1183)
    for (let i = 0; i < 20; i++) {
      const key = selectFact(rng, {}, null, settings)
      const separator = key.match(/[xdpm]/)?.[0]
      expect(separator).toBeDefined()
      const [a, b] = key.split(separator!).map(Number)
      expect([digitClassOf(a!), digitClassOf(b!)].sort()).toEqual([1, 2])
    }
  })
})
