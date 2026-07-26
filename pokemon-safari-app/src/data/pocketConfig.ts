/** Forest encounter pocket ids — spatial bands from pocket noise. */

export type PocketId = 'woodland' | 'meadow' | 'wetland' | 'canopy'

export const POCKET_NOISE_SCALE = 14

/** Thresholds on noise in [0,1) — contiguous bands. */
export const pocketThresholds = {
  wetland: 0.22,
  meadow: 0.45,
  woodland: 0.72,
  // else canopy
} as const

/** Relative weights when scoring a species for a pocket. */
export const pocketHabitatWeights = {
  match: 5,
  miss: 1,
  meadowNull: 2,
  meadowUrban: 2,
} as const

export const pocketHabitats: Record<PocketId, readonly string[]> = {
  woodland: ['forest', 'grassland'],
  meadow: ['grassland'],
  wetland: ['waters-edge'],
  canopy: ['forest', 'rare'],
}
