import {
  POCKET_NOISE_SCALE,
  pocketThresholds,
  type PocketId,
} from '@/data/pocketConfig'
import { noise2D } from './noise'

/** XOR seed so pocket field is decorrelated from terrain grass noise. */
const POCKET_SEED_MASK = 0x5f3759df

export function pocketAt(seed: number, x: number, y: number): PocketId {
  const n = noise2D(
    seed ^ POCKET_SEED_MASK,
    x / POCKET_NOISE_SCALE,
    y / POCKET_NOISE_SCALE,
  )
  if (n < pocketThresholds.wetland) return 'wetland'
  if (n < pocketThresholds.meadow) return 'meadow'
  if (n < pocketThresholds.woodland) return 'woodland'
  return 'canopy'
}
