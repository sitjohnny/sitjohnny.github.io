/**
 * CATCH-02: Pure timing grade + attempt-varying sweet spot — no react/zustand/DOM imports.
 * Zone widths and sweet-spot offsets live in data/timingBar.
 */

import { timingBar } from '@/data/timingBar'
import type { RarityBand } from '@/types/encounter'
import type { Rng } from '@/utils/rng'

export type TimingGrade = 'perfect' | 'great' | 'good' | 'miss'

/** Absorbs float noise when UI freezes position as sweetSpot ± half-width. */
const ZONE_EPS = 1e-10

export function gradeAt(
  position: number,
  sweetSpot: number,
  rarity: RarityBand,
  cfg: typeof timingBar = timingBar,
): TimingGrade {
  const z = cfg.zones[rarity]
  const d = Math.abs(position - sweetSpot)
  if (d <= z.perfect + ZONE_EPS) return 'perfect'
  if (d <= z.great + ZONE_EPS) return 'great'
  if (d <= z.good + ZONE_EPS) return 'good'
  return 'miss'
}

export function sweetSpotFor(
  attempt: number,
  cfg: typeof timingBar = timingBar,
  rng?: Rng,
): number {
  const offsets = cfg.sweetSpotOffsets
  const base = offsets[((attempt % offsets.length) + offsets.length) % offsets.length]!
  const jitter = rng ? (rng.next() - 0.5) * cfg.sweetSpotJitter : 0
  return Math.min(cfg.sweetSpotMax, Math.max(cfg.sweetSpotMin, base + jitter))
}

/** Triangle wave 0→1→0 over one period — for TimingBar indicator (05-03). */
export function pingPong(elapsedMs: number, periodMs: number): number {
  const t = (elapsedMs % periodMs) / periodMs
  return t < 0.5 ? t * 2 : 2 - t * 2
}
