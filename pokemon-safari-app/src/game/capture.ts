/**
 * CATCH-03: Pure additive catch chance + seeded roll — no react/zustand/DOM imports.
 * All randomness is an injected Rng; modifiers live in data/.
 */

import { captureModifiers } from '@/data/captureModifiers'
import type { TimingGrade } from '@/game/timing'
import type { RarityBand } from '@/types/encounter'
import type { Rng } from '@/utils/rng'

export type CatchInputs = {
  rarity: RarityBand
  educationBonus: number
  grade: TimingGrade
  ball?: 'poke' | 'great'
  berry?: boolean
}

function clampChance(sum: number): number {
  if (!Number.isFinite(sum)) return 0
  return Math.min(1, Math.max(0, sum))
}

export function computeCatchChance(
  inputs: CatchInputs,
  cfg: typeof captureModifiers = captureModifiers,
): number {
  const rarityBase = cfg.rarity[inputs.rarity]
  const timing = cfg.timing[inputs.grade]
  const ball = cfg.ball[inputs.ball ?? 'poke']
  const berry = inputs.berry ? cfg.berry : 0
  return clampChance(rarityBase + inputs.educationBonus + timing + ball + berry)
}

export function rollCapture(rng: Rng, chance: number): boolean {
  return rng.next() < chance
}
