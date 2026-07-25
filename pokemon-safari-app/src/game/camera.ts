/**
 * MAP-04: Pure camera follow + clamp — no react/zustand/DOM imports.
 * Exponential ease toward a target centre, then clamp so the viewport never
 * shows space beyond the map (letterbox-stable when the map is smaller).
 */

import { CAMERA_STIFFNESS, TILE_PX } from '@/data/exploreConfig'
import type { MapDef, Vec2 } from '@/types/map'

export type Camera = { x: number; y: number }
export type Size = { w: number; h: number }

export function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min
  }
  return Math.min(max, Math.max(min, value))
}

export function mapPixelSize(map: MapDef): Size {
  return { w: map.width * TILE_PX, h: map.height * TILE_PX }
}

/**
 * Exponential ease toward target, then clamp so the viewport never leaves the map.
 */
export function updateCamera(
  cam: Camera,
  target: Camera,
  mapPx: Size,
  view: Size,
  dtMs: number,
  stiffness: number = CAMERA_STIFFNESS,
): Camera {
  if (dtMs <= 0) {
    return cam
  }

  const follow = 1 - Math.exp((-stiffness * dtMs) / 1000)
  const halfW = view.w / 2
  const halfH = view.h / 2
  const x = cam.x + (target.x - cam.x) * follow
  const y = cam.y + (target.y - cam.y) * follow

  return {
    x: clamp(x, halfW, Math.max(halfW, mapPx.w - halfW)),
    y: clamp(y, halfH, Math.max(halfH, mapPx.h - halfH)),
  }
}

/** World-layer translation for a camera centre. */
export function worldTranslate(cam: Camera, view: Size): Vec2 {
  return { x: view.w / 2 - cam.x, y: view.h / 2 - cam.y }
}
