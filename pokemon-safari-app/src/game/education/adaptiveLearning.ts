/**
 * Pure miss-biased adaptive fact selection (D-17–D-21).
 *
 * Category-agnostic: weights and mastery thresholds are parameters (defaults
 * from `@/data/educationConfig`), never hardcoded constants. Must stay free of
 * React, Zustand, and browser globals. Selection uses only the injected Rng.
 */

import {
  adaptiveWeights,
  doubleDigitMultiplication,
  masteryThreshold,
  multiplicationRange,
} from '@/data/educationConfig'
import { weightedPick, type Rng } from '@/utils/rng'
import type { AdaptiveStats, FactKey, FactStat } from './questionTypes'

export function factKeyOf(a: number, b: number): FactKey {
  return `${a}x${b}`
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

export function selectFact(
  rng: Rng,
  stats: AdaptiveStats,
  excludeFactKey: string | null = null,
  cfg: typeof adaptiveWeights = adaptiveWeights,
  threshold: typeof masteryThreshold = masteryThreshold,
  doubleDigitCfg: typeof doubleDigitMultiplication = doubleDigitMultiplication,
): FactKey {
  const singlePool = allFacts()
  const doublePool = allDoubleDigitFacts(doubleDigitCfg)
  const preferDouble = rng.next() < doubleDigitCfg.probability
  const primary = preferDouble ? doublePool : singlePool
  const fallback = preferDouble ? singlePool : doublePool

  let entries = weightedEntriesForPool(primary, stats, excludeFactKey, cfg, threshold)
  if (entries.length === 0) {
    entries = weightedEntriesForPool(fallback, stats, excludeFactKey, cfg, threshold)
  }
  return weightedPick(rng, entries)
}
