/**
 * Pure camera follow — no react/zustand/DOM imports.
 * Exponential ease toward a target centre; no map-edge clamp (infinite world).
 */

import { CAMERA_STIFFNESS } from '@/data/exploreConfig'
import type { Vec2 } from '@/types/map'

export type Camera = { x: number; y: number }
export type Size = { w: number; h: number }

export function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min
  }
  return Math.min(max, Math.max(min, value))
}

/**
 * Exponential ease toward target. No spatial clamp — camera may follow anywhere.
 */
export function updateCamera(
  cam: Camera,
  target: Camera,
  dtMs: number,
  stiffness: number = CAMERA_STIFFNESS,
): Camera {
  if (dtMs <= 0) {
    return cam
  }

  const follow = 1 - Math.exp((-stiffness * dtMs) / 1000)
  return {
    x: cam.x + (target.x - cam.x) * follow,
    y: cam.y + (target.y - cam.y) * follow,
  }
}

/** World-layer translation for a camera centre. */
export function worldTranslate(cam: Camera, view: Size): Vec2 {
  return { x: view.w / 2 - cam.x, y: view.h / 2 - cam.y }
}
