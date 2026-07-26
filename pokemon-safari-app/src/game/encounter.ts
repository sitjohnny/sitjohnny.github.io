/**
 * MAP-03: Pure config-driven grass resolver — no react/zustand/DOM imports.
 * All randomness is an injected Rng; rates and pools live in data/.
 */

import { grassOutcomeWeights } from '@/data/rates'
import { biomeEncounterTables } from '@/data/encounterTables'
import type { EncounterResolution, GrassOutcome, RarityBand } from '@/types/encounter'
import type { BiomeId, EncounterCandidateEvent } from '@/types/map'
import { weightedPick, type Rng } from '@/utils/rng'

type GrassOutcomeWeights = Record<GrassOutcome, number>

export function rollGrass(
  rng: Rng,
  weights: GrassOutcomeWeights = grassOutcomeWeights,
): GrassOutcome {
  return weightedPick(
    rng,
    (Object.entries(weights) as [GrassOutcome, number][]).map(([id, weight]) => ({
      id,
      weight,
    })),
  )
}

/** 'pokemon' -> 'common', 'rare' -> 'rare', 'legendary' -> 'legendary', else null. */
export function rarityForOutcome(outcome: GrassOutcome): RarityBand | null {
  if (outcome === 'pokemon') return 'common'
  if (outcome === 'rare') return 'rare'
  if (outcome === 'legendary') return 'legendary'
  return null
}

export function pickSpecies(
  rng: Rng,
  biome: BiomeId,
  rarity: RarityBand,
  tables: typeof biomeEncounterTables = biomeEncounterTables,
): number {
  const pool = tables[biome][rarity]
  if (pool.length === 0) {
    throw new Error(`Empty encounter pool for biome=${biome} rarity=${rarity}`)
  }
  const index = Math.min(Math.floor(rng.next() * pool.length), pool.length - 1)
  return pool[index]!
}

export type ResolveCandidateOptions = {
  /** When true, pokemon/rare/legendary weights are zeroed so only nothing remains. */
  suppressPokemon?: boolean
}

function grassWeightsForResolve(suppressPokemon: boolean): GrassOutcomeWeights {
  if (!suppressPokemon) {
    return grassOutcomeWeights
  }
  return {
    ...grassOutcomeWeights,
    pokemon: 0,
    rare: 0,
    legendary: 0,
  }
}

export function resolveCandidate(
  rng: Rng,
  event: EncounterCandidateEvent,
  options: ResolveCandidateOptions = {},
): EncounterResolution {
  const outcome = rollGrass(
    rng,
    grassWeightsForResolve(options.suppressPokemon === true),
  )
  if (outcome === 'nothing') return { kind: 'nothing' }
  const rarity = rarityForOutcome(outcome)
  if (!rarity) {
    throw new Error(`Unexpected grass outcome without rarity: ${outcome}`)
  }
  return {
    kind: 'pokemon',
    speciesId: pickSpecies(rng, event.biome, rarity),
    rarity,
  }
}
