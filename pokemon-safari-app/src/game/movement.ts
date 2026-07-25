/**
 * MAP-04: Pure discrete-step rules — no react/zustand/DOM imports.
 * This is the only place step legality is decided. The logical tile commit
 * happens the moment `tryStep` returns (the tween is presentation only),
 * which is why the grass event is emitted at step start.
 */

import { STEP_DURATION_MS, TILE_PX } from '@/data/exploreConfig'
import type { Direction, MapDef, PlayerState, StepResult, Vec2 } from '@/types/map'
import { isGrass, isWalkable } from './collision'
import { createEncounterCandidate } from './events'

export const DIRECTION_DELTA: Record<Direction, Vec2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export function offsetTile(pos: Vec2, dir: Direction): Vec2 {
  const delta = DIRECTION_DELTA[dir]
  return { x: pos.x + delta.x, y: pos.y + delta.y }
}

export function tileToPx(pos: Vec2): Vec2 {
  return { x: pos.x * TILE_PX, y: pos.y * TILE_PX }
}

export function tryStep(
  state: PlayerState,
  intent: Direction | null,
  map: MapDef,
  now: number,
): StepResult {
  if (intent === null) {
    return { next: state, events: [] }
  }

  if (state.moving) {
    return { next: state, events: [] }
  }

  if (intent !== state.facing) {
    return { next: { ...state, facing: intent }, events: [] }
  }

  const target = offsetTile(state, intent)
  if (!isWalkable(map, target.x, target.y)) {
    return { next: { ...state, facing: intent }, events: [] }
  }

  const next: PlayerState = {
    x: target.x,
    y: target.y,
    facing: intent,
    moving: true,
  }

  const events = isGrass(map, target.x, target.y)
    ? [createEncounterCandidate(map.id, target.x, target.y, now)]
    : []

  return {
    next,
    events,
    tween: {
      from: tileToPx(state),
      to: tileToPx(target),
      durationMs: STEP_DURATION_MS,
    },
  }
}

export function completeStep(state: PlayerState): PlayerState {
  return { ...state, moving: false }
}
