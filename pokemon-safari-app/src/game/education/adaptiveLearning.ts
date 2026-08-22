/**
 * Pure, settings-driven adaptive math fact selection.
 *
 * Keep this module free of React, Zustand, browser globals, and persisted
 * settings. Callers pass settings explicitly (or use the default).
 */

import {
  adaptiveWeights,
  digitRanges,
  levelDigitPairs,
  masteryThreshold,
  maxEnumeratePoolSize,
  trivialExclusions,
  type DigitClass,
  type MathLevel,
  type MathOperator,
} from '@/data/educationConfig'
import { weightedPick, type Rng } from '@/utils/rng'
import {
  defaultMathEducationSettings,
  type MathEducationSettings,
} from './mathSettings'
import type { AdaptiveStats, FactKey, FactStat } from './questionTypes'

const OPERATORS: readonly MathOperator[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
]
const LEVELS: readonly MathLevel[] = [1, 2, 3, 4, 5, 6]

const OPERATOR_SEPARATORS: Record<MathOperator, 'p' | 'm' | 'x' | 'd'> = {
  addition: 'p',
  subtraction: 'm',
  multiplication: 'x',
  division: 'd',
}

export function digitClassOf(n: number): DigitClass {
  if (!Number.isInteger(n) || n < digitRanges[1].min || n > digitRanges[3].max) {
    throw new RangeError(`digitClassOf: expected an integer from 1 to 999, got ${n}`)
  }
  if (n <= digitRanges[1].max) return 1
  if (n <= digitRanges[2].max) return 2
  return 3
}

export function factKeyOf(a: number, b: number): `${number}x${number}` {
  return `${a}x${b}`
}

export function divisionFactKeyOf(
  numerator: number,
  divisor: number,
): `${number}d${number}` {
  return `${numerator}d${divisor}`
}

export function additionFactKeyOf(
  a: number,
  b: number,
): `${number}p${number}` {
  return `${a}p${b}`
}

export function subtractionFactKeyOf(
  a: number,
  b: number,
): `${number}m${number}` {
  return `${a}m${b}`
}

function rangeSize(cls: DigitClass, minimum?: number): number {
  const range = digitRanges[cls]
  return Math.max(0, range.max - Math.max(range.min, minimum ?? range.min) + 1)
}

function estimatePoolSize(operator: MathOperator, level: MathLevel): number {
  const [leftClass, rightClass] = levelDigitPairs[level]
  const mixedClassMultiplier = leftClass === rightClass ? 1 : 2

  if (operator === 'addition') {
    return rangeSize(leftClass) * rangeSize(rightClass) * mixedClassMultiplier
  }
  if (operator === 'subtraction') {
    return rangeSize(leftClass) * rangeSize(rightClass)
  }
  if (operator === 'multiplication') {
    return (
      rangeSize(leftClass, trivialExclusions.multiplyMinFactor) *
      rangeSize(rightClass, trivialExclusions.multiplyMinFactor) *
      mixedClassMultiplier
    )
  }

  const [dividendClass, divisorClass] = divisionClasses(leftClass, rightClass)
  return (
    rangeSize(dividendClass) *
    rangeSize(divisorClass, trivialExclusions.divideMinDivisor)
  )
}

function valuesInClass(cls: DigitClass, minimum?: number): number[] {
  const range = digitRanges[cls]
  const first = Math.max(range.min, minimum ?? range.min)
  return Array.from({ length: Math.max(0, range.max - first + 1) }, (_, index) => {
    return first + index
  })
}

function divisionClasses(
  leftClass: DigitClass,
  rightClass: DigitClass,
): readonly [dividend: DigitClass, divisor: DigitClass] {
  if (leftClass === rightClass) return [leftClass, rightClass]
  return leftClass > rightClass
    ? [leftClass, rightClass]
    : [rightClass, leftClass]
}

function addOrderedPair(
  facts: Set<FactKey>,
  operator: 'addition' | 'multiplication',
  a: number,
  b: number,
  mixedClasses: boolean,
): void {
  facts.add(
    operator === 'addition' ? additionFactKeyOf(a, b) : factKeyOf(a, b),
  )
  if (mixedClasses) {
    facts.add(
      operator === 'addition' ? additionFactKeyOf(b, a) : factKeyOf(b, a),
    )
  }
}

export function factsFor(
  operator: MathOperator,
  level: MathLevel,
): FactKey[] {
  if (estimatePoolSize(operator, level) > maxEnumeratePoolSize) return []

  const [leftClass, rightClass] = levelDigitPairs[level]
  const facts = new Set<FactKey>()

  if (operator === 'addition' || operator === 'multiplication') {
    const minimum =
      operator === 'multiplication'
        ? trivialExclusions.multiplyMinFactor
        : undefined
    const leftValues = valuesInClass(leftClass, minimum)
    const rightValues = valuesInClass(rightClass, minimum)
    for (const a of leftValues) {
      for (const b of rightValues) {
        addOrderedPair(
          facts,
          operator,
          a,
          b,
          leftClass !== rightClass,
        )
      }
    }
    return [...facts]
  }

  if (operator === 'subtraction') {
    for (const left of valuesInClass(leftClass)) {
      for (const right of valuesInClass(rightClass)) {
        const a = Math.max(left, right)
        const b = Math.min(left, right)
        facts.add(subtractionFactKeyOf(a, b))
      }
    }
    return [...facts]
  }

  const [dividendClass, divisorClass] = divisionClasses(leftClass, rightClass)
  const dividends = valuesInClass(dividendClass)
  const divisors = valuesInClass(
    divisorClass,
    trivialExclusions.divideMinDivisor,
  )
  for (const numerator of dividends) {
    for (const divisor of divisors) {
      if (numerator % divisor === 0 && numerator / divisor > 0) {
        facts.add(divisionFactKeyOf(numerator, divisor))
      }
    }
  }
  return [...facts]
}

function randomInDigitClass(
  rng: Rng,
  cls: DigitClass,
  minValue?: number,
): number {
  const range = digitRanges[cls]
  const lowerBound =
    minValue == null ? range.min : Math.max(range.min, minValue)
  const span = range.max - lowerBound + 1
  if (span <= 0) {
    throw new Error(`sampleFact: digit class ${cls} has no eligible values`)
  }
  return lowerBound + Math.floor(rng.next() * span)
}

function sampleDivisionFact(
  rng: Rng,
  leftClass: DigitClass,
  rightClass: DigitClass,
): `${number}d${number}` {
  const [dividendClass, divisorClass] = divisionClasses(leftClass, rightClass)
  const dividendRange = digitRanges[dividendClass]

  for (let attempt = 0; attempt < 24; attempt++) {
    const divisor = randomInDigitClass(
      rng,
      divisorClass,
      trivialExclusions.divideMinDivisor,
    )
    const quotientMin = Math.max(1, Math.ceil(dividendRange.min / divisor))
    const quotientMax = Math.floor(dividendRange.max / divisor)
    if (quotientMin <= quotientMax) {
      const quotient =
        quotientMin + Math.floor(rng.next() * (quotientMax - quotientMin + 1))
      return divisionFactKeyOf(divisor * quotient, divisor)
    }
  }

  for (const divisor of valuesInClass(
    divisorClass,
    trivialExclusions.divideMinDivisor,
  )) {
    const quotient = Math.max(1, Math.ceil(dividendRange.min / divisor))
    const numerator = divisor * quotient
    if (numerator <= dividendRange.max) {
      return divisionFactKeyOf(numerator, divisor)
    }
  }
  throw new Error('sampleFact: no exact positive division fact available')
}

export function sampleFact(
  rng: Rng,
  operator: MathOperator,
  level: MathLevel,
): FactKey {
  const [leftClass, rightClass] = levelDigitPairs[level]

  if (operator === 'division') {
    return sampleDivisionFact(rng, leftClass, rightClass)
  }

  const minimum =
    operator === 'multiplication'
      ? trivialExclusions.multiplyMinFactor
      : undefined
  let a = randomInDigitClass(rng, leftClass, minimum)
  let b = randomInDigitClass(rng, rightClass, minimum)

  if (
    (operator === 'addition' || operator === 'multiplication') &&
    leftClass !== rightClass &&
    rng.next() < 0.5
  ) {
    ;[a, b] = [b, a]
  }

  if (operator === 'addition') return additionFactKeyOf(a, b)
  if (operator === 'multiplication') return factKeyOf(a, b)
  if (a < b) [a, b] = [b, a]
  return subtractionFactKeyOf(a, b)
}

export function isMastered(
  stat: FactStat | undefined,
  threshold: { accuracy: number; minAttempts: number } = masteryThreshold,
): boolean {
  if (!stat) return false
  const attempts = stat.correct + stat.incorrect
  if (attempts < threshold.minAttempts || attempts === 0) return false
  return stat.correct / attempts >= threshold.accuracy
}

export function factWeight(
  stat: FactStat | undefined,
  cfg: typeof adaptiveWeights = adaptiveWeights,
  threshold: typeof masteryThreshold = masteryThreshold,
): number {
  if (!stat || stat.correct + stat.incorrect === 0) {
    return cfg.starterWeight
  }
  if (isMastered(stat, threshold)) {
    return cfg.masteredReviewWeight
  }
  return Math.max(
    cfg.minWeight,
    cfg.starterWeight +
      stat.incorrect * cfg.missBonus -
      stat.correct * cfg.correctPenalty,
  )
}

function pickAdaptive(
  rng: Rng,
  pool: FactKey[],
  stats: AdaptiveStats,
  excludeFactKey: string | null,
): FactKey | null {
  const entries = pool
    .filter((key) => key !== excludeFactKey)
    .map((id) => ({
      id,
      weight: Math.max(adaptiveWeights.minWeight, factWeight(stats[id])),
    }))
  return entries.length > 0 ? weightedPick(rng, entries) : null
}

function levelForClasses(
  leftClass: DigitClass,
  rightClass: DigitClass,
): MathLevel | null {
  for (const level of LEVELS) {
    const [expectedLeft, expectedRight] = levelDigitPairs[level]
    if (
      (leftClass === expectedLeft && rightClass === expectedRight) ||
      (leftClass === expectedRight && rightClass === expectedLeft)
    ) {
      return level
    }
  }
  return null
}

function parsedFactMatches(
  key: string,
  operator: MathOperator,
  level: MathLevel,
): key is FactKey {
  const match = key.match(/^(\d+)([pmxd])(\d+)$/)
  if (!match || match[2] !== OPERATOR_SEPARATORS[operator]) return false

  const a = Number(match[1])
  const b = Number(match[3])
  let leftClass: DigitClass
  let rightClass: DigitClass
  try {
    leftClass = digitClassOf(a)
    rightClass = digitClassOf(b)
  } catch {
    return false
  }
  if (levelForClasses(leftClass, rightClass) !== level) return false

  if (operator === 'subtraction') return a >= b
  if (operator === 'multiplication') {
    return (
      a >= trivialExclusions.multiplyMinFactor &&
      b >= trivialExclusions.multiplyMinFactor
    )
  }
  if (operator === 'division') {
    if (
      b < trivialExclusions.divideMinDivisor ||
      a % b !== 0 ||
      a / b <= 0
    ) {
      return false
    }
    return leftClass === rightClass || leftClass > rightClass
  }
  return true
}

function sampleWithoutExclusion(
  rng: Rng,
  operator: MathOperator,
  level: MathLevel,
  excludeFactKey: string | null,
): FactKey | null {
  for (let attempt = 0; attempt <= 8; attempt++) {
    const sampled = sampleFact(rng, operator, level)
    if (sampled !== excludeFactKey) return sampled
  }
  return null
}

function pickForOperatorAndLevel(
  rng: Rng,
  stats: AdaptiveStats,
  operator: MathOperator,
  level: MathLevel,
  excludeFactKey: string | null,
): FactKey | null {
  if (estimatePoolSize(operator, level) <= maxEnumeratePoolSize) {
    return pickAdaptive(rng, factsFor(operator, level), stats, excludeFactKey)
  }

  const review = Object.keys(stats).filter((key): key is FactKey => {
    return (
      key !== excludeFactKey && parsedFactMatches(key, operator, level)
    )
  })
  if (review.length > 0 && rng.next() < 0.5) {
    return pickAdaptive(rng, review, stats, excludeFactKey)
  }
  return sampleWithoutExclusion(
    rng,
    operator,
    level,
    excludeFactKey,
  )
}

function equalPick<T>(rng: Rng, values: readonly T[]): T {
  const pickedIndex = weightedPick(
    rng,
    values.map((_, index) => ({ id: String(index), weight: 1 })),
  )
  return values[Number(pickedIndex)]!
}

function enabledSelections(settings: MathEducationSettings): {
  operators: MathOperator[]
  levels: MathLevel[]
} {
  const operators = OPERATORS.filter((operator) => settings.operators[operator])
  const levels = LEVELS.filter((level) => settings.levels[level])
  if (operators.length > 0 && levels.length > 0) return { operators, levels }
  return enabledSelections(defaultMathEducationSettings())
}

export function selectFact(
  rng: Rng,
  stats: AdaptiveStats,
  excludeFactKey: string | null = null,
  settings: MathEducationSettings = defaultMathEducationSettings(),
): FactKey {
  const enabled = enabledSelections(settings)
  const firstOperator = equalPick(rng, enabled.operators)
  const firstLevel = equalPick(rng, enabled.levels)

  const first = pickForOperatorAndLevel(
    rng,
    stats,
    firstOperator,
    firstLevel,
    excludeFactKey,
  )
  if (first) return first

  for (const level of enabled.levels) {
    if (level === firstLevel) continue
    const picked = pickForOperatorAndLevel(
      rng,
      stats,
      firstOperator,
      level,
      excludeFactKey,
    )
    if (picked) return picked
  }

  for (const operator of enabled.operators) {
    if (operator === firstOperator) continue
    const startingLevel = equalPick(rng, enabled.levels)
    const orderedLevels = [
      startingLevel,
      ...enabled.levels.filter((level) => level !== startingLevel),
    ]
    for (const level of orderedLevels) {
      const picked = pickForOperatorAndLevel(
        rng,
        stats,
        operator,
        level,
        excludeFactKey,
      )
      if (picked) return picked
    }
  }

  return sampleFact(rng, firstOperator, firstLevel)
}
