/** Exploration feel tuning — edit here only; UI must not hardcode these values. */

export const TILE_SIZE = 16
export const TILE_SCALE = 3
export const TILE_PX = 48
export const STEP_DURATION_MS = 200
export const CAMERA_STIFFNESS = 12
export const WALK_FRAME_MS = 100

/** Frame indices the explore loop cycles through via `data-frame`. */
export const WALK_FRAME_CLASSES = ['0', '1'] as const
