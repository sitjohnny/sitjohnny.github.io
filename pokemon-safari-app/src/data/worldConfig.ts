/** Infinite world generation tuning — edit here only. */

import type { Vec2 } from '@/types/map'

export const WORLD_SEED = 1337
export const CHUNK_SIZE = 16
/** World units between noise lattice points — larger = bigger patches. */
export const NOISE_SCALE = 10
export const OBSTACLE_THRESHOLD = 0.18
export const GRASS_THRESHOLD = 0.45
/** Chebyshev radius around spawn forced to ground (5×5 when 2). */
export const SPAWN_CARVE_RADIUS = 2
export const WORLD_SPAWN: Vec2 = { x: 0, y: 0 }
/** Evict chunks farther than this Chebyshev distance from the player chunk. */
export const CHUNK_EVICT_DISTANCE = 3
