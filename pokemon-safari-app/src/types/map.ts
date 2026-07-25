/** Tile-map exploration contracts — movement rules live in `game/`; render in Phase 3 UI. */

export type Direction = 'up' | 'down' | 'left' | 'right'
export type TileId = 'ground' | 'grass' | 'obstacle'
export type BiomeId = 'forest'
export type Vec2 = { x: number; y: number }

export type MapDef = {
  id: BiomeId
  width: number
  height: number
  /** Row-major, length === width * height */
  tiles: TileId[]
  spawn: Vec2
}

export type PlayerState = {
  x: number
  y: number
  facing: Direction
  moving: boolean
}

export type EncounterCandidateEvent = {
  type: 'encounter_candidate'
  biome: BiomeId
  x: number
  y: number
  at: number
}

export type StepTween = { from: Vec2; to: Vec2; durationMs: number }

export type StepResult = {
  next: PlayerState
  events: EncounterCandidateEvent[]
  tween?: StepTween
}
