import { describe, expect, it } from 'vitest'
import {
  adaptiveWeights,
  doubleDigitMultiplication,
  masteryThreshold,
  multiplicationRange,
} from '@/data/educationConfig'
import { createRng } from '@/utils/rng'
import {
  allDoubleDigitFacts,
  allFacts,
  factKeyOf,
  factWeight,
  isMastered,
  selectFact,
} from './adaptiveLearning'
import type { AdaptiveStats, FactKey } from './questionTypes'

const allSelectableFacts = () => [...allFacts(), ...allDoubleDigitFacts()]

function isDoubleDigitFact(key: FactKey): boolean {
  const [aStr] = key.split('x')
  const a = Number(aStr)
  return a >= doubleDigitMultiplication.min && a <= doubleDigitMultiplication.max
}

describe('adaptiveLearning (D-17, D-18, D-19, D-20)', () => {
  it('factKeyOf(7, 8) is 7x8', () => {
    expect(factKeyOf(7, 8)).toBe('7x8')
  })

  it('allFacts returns 81 unique keys covering every pair in multiplicationRange', () => {
    const facts = allFacts()
    const { min, max } = multiplicationRange
    const expectedCount = (max - min + 1) ** 2
    expect(facts).toHaveLength(expectedCount)
    expect(new Set(facts).size).toBe(expectedCount)

    for (let a = min; a <= max; a++) {
      for (let b = min; b <= max; b++) {
        expect(facts).toContain(`${a}x${b}` as FactKey)
      }
    }
    for (const key of facts) {
      const [aStr, bStr] = key.split('x')
      const a = Number(aStr)
      const b = Number(bStr)
      expect(a).toBeGreaterThanOrEqual(min)
      expect(a).toBeLessThanOrEqual(max)
      expect(b).toBeGreaterThanOrEqual(min)
      expect(b).toBeLessThanOrEqual(max)
    }
  })

  it('allDoubleDigitFacts returns 99 unique keys for 10–20 × 1–9', () => {
    const facts = allDoubleDigitFacts()
    const { min, max } = doubleDigitMultiplication
    const { min: sMin, max: sMax } = multiplicationRange
    const expectedCount = (max - min + 1) * (sMax - sMin + 1)
    expect(facts).toHaveLength(expectedCount)
    expect(new Set(facts).size).toBe(expectedCount)

    for (let a = min; a <= max; a++) {
      for (let b = sMin; b <= sMax; b++) {
        expect(facts).toContain(`${a}x${b}` as FactKey)
      }
    }
    for (const key of facts) {
      const [aStr, bStr] = key.split('x')
      const a = Number(aStr)
      const b = Number(bStr)
      expect(a).toBeGreaterThanOrEqual(min)
      expect(a).toBeLessThanOrEqual(max)
      expect(b).toBeGreaterThanOrEqual(sMin)
      expect(b).toBeLessThanOrEqual(sMax)
    }
  })

  it('factWeight(undefined) equals starterWeight; never-attempted facts share that weight (D-19)', () => {
    expect(factWeight(undefined)).toBe(adaptiveWeights.starterWeight)
    const neverAttempted = [
      factWeight(undefined),
      factWeight({ correct: 0, incorrect: 0 }),
      factWeight(undefined, adaptiveWeights, masteryThreshold),
    ]
    expect(new Set(neverAttempted).size).toBe(1)
    expect(neverAttempted[0]).toBe(adaptiveWeights.starterWeight)
  })

  it('a fact with more incorrects has strictly greater weight than one with fewer (D-17)', () => {
    const weaker = factWeight({ correct: 2, incorrect: 5 })
    const stronger = factWeight({ correct: 2, incorrect: 1 })
    expect(weaker).toBeGreaterThan(stronger)
  })

  it('weight never drops below minWeight no matter how many corrects accumulate', () => {
    const heavyCorrects = factWeight({ correct: 10_000, incorrect: 0 })
    expect(heavyCorrects).toBeGreaterThanOrEqual(adaptiveWeights.minWeight)
  })

  it('isMastered is false below minAttempts even at 100% accuracy (D-18)', () => {
    const below = masteryThreshold.minAttempts - 1
    expect(isMastered({ correct: below, incorrect: 0 })).toBe(false)
  })

  it('isMastered is true only at or above both attempt count and accuracy (D-18)', () => {
    const min = masteryThreshold.minAttempts
    expect(isMastered({ correct: min, incorrect: 0 })).toBe(true)

    // Enough attempts but accuracy below threshold
    const incorrectNeeded = Math.ceil(min * (1 - masteryThreshold.accuracy)) + 1
    const correct = min
    const badAccuracy = { correct, incorrect: incorrectNeeded }
    const attempts = badAccuracy.correct + badAccuracy.incorrect
    const accuracy = badAccuracy.correct / attempts
    expect(attempts).toBeGreaterThanOrEqual(min)
    expect(accuracy).toBeLessThan(masteryThreshold.accuracy)
    expect(isMastered(badAccuracy)).toBe(false)
  })

  it('mastered fact weight equals masteredReviewWeight and is > 0 (D-18)', () => {
    const masteredStat = {
      correct: masteryThreshold.minAttempts,
      incorrect: 0,
    }
    expect(isMastered(masteredStat)).toBe(true)
    expect(factWeight(masteredStat)).toBe(adaptiveWeights.masteredReviewWeight)
    expect(factWeight(masteredStat)).toBeGreaterThan(0)
  })

  it('selectFact with a stub rng returns a FactKey in the selectable union', () => {
    const rng = createRng(42)
    const picked = selectFact(rng, {})
    expect(allSelectableFacts()).toContain(picked)
  })

  it('selectFact never returns excludeFactKey over 200 seeded draws (D-20)', () => {
    const exclude: FactKey = '7x8'
    const stats: AdaptiveStats = {
      [exclude]: { correct: 0, incorrect: 10_000 },
    }
    const selectable = new Set(allSelectableFacts())
    for (let seed = 0; seed < 200; seed++) {
      const rng = createRng(seed * 997 + 13)
      const picked = selectFact(rng, stats, exclude)
      expect(picked).not.toBe(exclude)
      expect(selectable.has(picked)).toBe(true)
    }
  })

  it('selectFact draws double-digit facts near the configured probability', () => {
    const draws = 2000
    const rng = createRng(2026)
    let doubleCount = 0
    for (let i = 0; i < draws; i++) {
      const picked = selectFact(rng, {})
      if (isDoubleDigitFact(picked)) doubleCount += 1
    }
    const rate = doubleCount / draws
    expect(rate).toBeGreaterThan(doubleDigitMultiplication.probability - 0.05)
    expect(rate).toBeLessThan(doubleDigitMultiplication.probability + 0.05)
  })

  it('weakest fact is favoured far more often than mastered, but mastered still appears (D-17)', () => {
    const weak: FactKey = '3x3'
    const mastered: FactKey = '2x2'
    const stats: AdaptiveStats = {
      [weak]: { correct: 0, incorrect: 40 },
      [mastered]: {
        correct: masteryThreshold.minAttempts,
        incorrect: 0,
      },
    }
    expect(isMastered(stats[mastered])).toBe(true)
    expect(factWeight(stats[weak])).toBeGreaterThan(factWeight(stats[mastered]))

    const counts: Record<string, number> = { [weak]: 0, [mastered]: 0 }
    const draws = 1000
    const rng = createRng(2026)
    for (let i = 0; i < draws; i++) {
      const picked = selectFact(rng, stats)
      if (picked === weak || picked === mastered) {
        counts[picked] = (counts[picked] ?? 0) + 1
      }
    }
    expect(counts[weak]!).toBeGreaterThan(counts[mastered]!)
    expect(counts[mastered]!).toBeGreaterThanOrEqual(1)
  })
})
