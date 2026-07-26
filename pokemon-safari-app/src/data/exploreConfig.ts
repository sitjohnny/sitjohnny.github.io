/** Exploration feel tuning — edit here only; UI must not hardcode these values. */

export const TILE_SIZE = 16
export const TILE_SCALE = 3
export const TILE_PX = TILE_SIZE * TILE_SCALE
export const STEP_DURATION_MS = 200
export const CAMERA_STIFFNESS = 12
export const WALK_FRAME_MS = 100

export const PLAYER_SPRITE_H = 20
export const PLAYER_SPRITE_H_PX = PLAYER_SPRITE_H * TILE_SCALE
export const IDLE_POSE = '0'

/** Pose ids the explore loop cycles through: step, stand, other step, stand. */
export const WALK_CYCLE = ['1', '0', '2', '0'] as const
