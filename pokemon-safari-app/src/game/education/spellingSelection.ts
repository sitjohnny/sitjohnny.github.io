/**
 * Tiered spelling fact selection — challenge vs early pool, then adaptive pick.
 */

import { adaptiveWeights, spellingChallengeProbability } from '@/data/educationConfig'
import { spellingWordsByTier, type SpellingTier } from '@/data/spellingWords'
import { weightedPick, type Rng } from '@/utils/rng'
import { factWeight } from './adaptiveLearning'
import type { AdaptiveStats, SpellingFactKey } from './questionTypes'

function tierFactKeys(tier: SpellingTier): SpellingFactKey[] {
  return spellingWordsByTier(tier).map((w) => w.factKey)
}

function weightedEntriesForPool(
  pool: SpellingFactKey[],
  stats: AdaptiveStats,
  excludeFactKey: string | null,
): { id: SpellingFactKey; weight: number }[] {
  const entries: { id: SpellingFactKey; weight: number }[] = []
  for (const key of pool) {
    if (excludeFactKey != null && key === excludeFactKey) continue
    const raw = factWeight(stats[key])
    const weight = raw <= 0 ? adaptiveWeights.minWeight : raw
    entries.push({ id: key, weight })
  }
  return entries
}

function pickAdaptiveFromPools(
  rng: Rng,
  orderedPools: SpellingFactKey[][],
  stats: AdaptiveStats,
  excludeFactKey: string | null,
): SpellingFactKey {
  for (const pool of orderedPools) {
    const entries = weightedEntriesForPool(pool, stats, excludeFactKey)
    if (entries.length > 0) {
      return weightedPick(rng, entries)
    }
  }
  for (const pool of orderedPools) {
    if (pool.length > 0) {
      return weightedPick(
        rng,
        pool.map((id) => ({ id, weight: adaptiveWeights.minWeight })),
      )
    }
  }
  throw new Error('selectSpellingFact: no spelling facts available')
}

export function selectSpellingFact(
  rng: Rng,
  stats: AdaptiveStats,
  excludeFactKey: string | null = null,
): SpellingFactKey {
  const tier: SpellingTier =
    rng.next() < spellingChallengeProbability ? 'challenge' : 'early'
  const primary = tierFactKeys(tier)
  const fallback = tierFactKeys(tier === 'challenge' ? 'early' : 'challenge')
  return pickAdaptiveFromPools(rng, [primary, fallback], stats, excludeFactKey)
}
