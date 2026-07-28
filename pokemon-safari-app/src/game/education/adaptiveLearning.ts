/**
 * Pure miss-biased adaptive fact selection (D-17–D-21).
 *
 * Category-agnostic: weights and mastery thresholds are parameters (defaults
 * from `@/data/educationConfig`), never hardcoded constants. Must stay free of
 * React, Zustand, and browser globals. Selection uses only the injected Rng.
 */

import {
  adaptiveWeights,
  divisionProblems,
  doubleDigitMultiplication,
  longDivisionProblems,
  masteryThreshold,
  multiplicationRange,
} from '@/data/educationConfig'
import { weightedPick, type Rng } from '@/utils/rng'
import type { AdaptiveStats, FactKey, FactStat } from './questionTypes'

export function factKeyOf(a: number, b: number): FactKey {
  return `${a}x${b}`
}

export function divisionFactKeyOf(numerator: number, divisor: number): FactKey {
  return `${numerator}d${divisor}`
}

/** Every ordered pair in range inclusive — `3x7` and `7x3` are distinct facts. */
export function allFacts(
  range: { min: number; max: number } = multiplicationRange,
): FactKey[] {
  const out: FactKey[] = []
  for (let a = range.min; a <= range.max; a++) {
    for (let b = range.min; b <= range.max; b++) {
      out.push(factKeyOf(a, b))
    }
  }
  return out
}

/**
 * Double-digit × single-digit facts — double-digit operand first only
 * (e.g. `12x4`, never `4x12`).
 */
export function allDoubleDigitFacts(
  cfg: { min: number; max: number } = doubleDigitMultiplication,
  singleDigitRange: { min: number; max: number } = multiplicationRange,
): FactKey[] {
  const out: FactKey[] = []
  for (let a = cfg.min; a <= cfg.max; a++) {
    for (let b = singleDigitRange.min; b <= singleDigitRange.max; b++) {
      out.push(factKeyOf(a, b))
    }
  }
  return out
}

/**
 * Exact integer division facts: numerator ÷ divisor where
 * numeratorMin ≤ d·q ≤ numeratorMax for each divisor d.
 */
export function allDivisionFacts(
  cfg: typeof divisionProblems = divisionProblems,
): FactKey[] {
  const out: FactKey[] = []
  for (let d = cfg.divisorMin; d <= cfg.divisorMax; d++) {
    const qMin = Math.ceil(cfg.numeratorMin / d)
    const qMax = Math.floor(cfg.numeratorMax / d)
    for (let q = qMin; q <= qMax; q++) {
      const n = d * q
      if (n >= cfg.numeratorMin && n <= cfg.numeratorMax) {
        out.push(divisionFactKeyOf(n, d))
      }
    }
  }
  return out
}

/**
 * Exact integer long-division facts: two-digit ÷ two-digit with quotient ≥ quotientMin.
 */
export function allLongDivisionFacts(
  cfg: typeof longDivisionProblems = longDivisionProblems,
): FactKey[] {
  const out: FactKey[] = []
  for (let d = cfg.divisorMin; d <= cfg.divisorMax; d++) {
    const qMin = Math.max(cfg.quotientMin, Math.ceil(cfg.numeratorMin / d))
    const qMax = Math.floor(cfg.numeratorMax / d)
    for (let q = qMin; q <= qMax; q++) {
      const n = d * q
      if (n >= cfg.numeratorMin && n <= cfg.numeratorMax) {
        out.push(divisionFactKeyOf(n, d))
      }
    }
  }
  return out
}

export function isMastered(
  stat: FactStat | undefined,
  threshold: { accuracy: number; minAttempts: number } = masteryThreshold,
): boolean {
  if (!stat) return false
  const attempts = stat.correct + stat.incorrect
  if (attempts < threshold.minAttempts) return false
  if (attempts === 0) return false
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

function weightedEntriesForPool(
  pool: FactKey[],
  stats: AdaptiveStats,
  excludeFactKey: string | null,
  cfg: typeof adaptiveWeights,
  threshold: typeof masteryThreshold,
): { id: FactKey; weight: number }[] {
  const entries: { id: FactKey; weight: number }[] = []
  for (const key of pool) {
    if (excludeFactKey != null && key === excludeFactKey) continue
    const raw = factWeight(stats[key], cfg, threshold)
    const weight = raw <= 0 ? cfg.minWeight : raw
    entries.push({ id: key, weight })
  }
  return entries
}

function pickFromPools(
  rng: Rng,
  orderedPools: FactKey[][],
  stats: AdaptiveStats,
  excludeFactKey: string | null,
  cfg: typeof adaptiveWeights,
  threshold: typeof masteryThreshold,
): FactKey {
  for (const pool of orderedPools) {
    const entries = weightedEntriesForPool(pool, stats, excludeFactKey, cfg, threshold)
    if (entries.length > 0) {
      return weightedPick(rng, entries)
    }
  }
  // Exhausted exclude-only edge case: pick from the first non-empty raw pool.
  for (const pool of orderedPools) {
    if (pool.length > 0) {
      return weightedPick(
        rng,
        pool.map((id) => ({ id, weight: cfg.minWeight })),
      )
    }
  }
  throw new Error('selectFact: no education facts available')
}

/**
 * Mutually exclusive pool pick:
 * division → double-digit mult → single-digit mult (remainder).
 * Division draws nest a long-division share via withinDivisionProbability.
 */
export function selectFact(
  rng: Rng,
  stats: AdaptiveStats,
  excludeFactKey: string | null = null,
  cfg: typeof adaptiveWeights = adaptiveWeights,
  threshold: typeof masteryThreshold = masteryThreshold,
  doubleDigitCfg: typeof doubleDigitMultiplication = doubleDigitMultiplication,
  divisionCfg: typeof divisionProblems = divisionProblems,
  longDivisionCfg: typeof longDivisionProblems = longDivisionProblems,
): FactKey {
  const singlePool = allFacts()
  const doublePool = allDoubleDigitFacts(doubleDigitCfg)
  const shortDivisionPool = allDivisionFacts(divisionCfg)
  const longDivisionPool = allLongDivisionFacts(longDivisionCfg)
  const roll = rng.next()
  const divisionCut = divisionCfg.probability
  const doubleCut = divisionCut + doubleDigitCfg.probability

  let primary: FactKey[]
  let fallbacks: FactKey[][]
  if (roll < divisionCut) {
    const longRoll = rng.next()
    if (longRoll < longDivisionCfg.withinDivisionProbability) {
      primary = longDivisionPool
      fallbacks = [shortDivisionPool, doublePool, singlePool]
    } else {
      primary = shortDivisionPool
      fallbacks = [longDivisionPool, doublePool, singlePool]
    }
  } else if (roll < doubleCut) {
    primary = doublePool
    fallbacks = [singlePool, shortDivisionPool, longDivisionPool]
  } else {
    primary = singlePool
    fallbacks = [doublePool, shortDivisionPool, longDivisionPool]
  }

  return pickFromPools(
    rng,
    [primary, ...fallbacks],
    stats,
    excludeFactKey,
    cfg,
    threshold,
  )
}
