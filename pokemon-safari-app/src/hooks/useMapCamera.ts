import { useRef } from 'react'
import type { RefObject } from 'react'
import { TILE_PX } from '@/data/exploreConfig'
import { WORLD_SPAWN } from '@/data/worldConfig'
import { updateCamera, worldTranslate, type Camera, type Size } from '@/game/camera'
import { tileToPx } from '@/game/movement'
import type { Vec2 } from '@/types/map'

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export type MapCamera = {
  cameraRef: RefObject<Camera>
  /** Ease toward target and write the world transform. dtMs = 0 or reduced motion => snap. */
  follow: (target: Camera, view: Size, dtMs: number) => void
  snapTo: (target: Camera, view: Size) => void
}

function writeWorldTransform(
  worldRef: RefObject<HTMLDivElement | null>,
  cam: Camera,
  view: Size,
): void {
  const node = worldRef.current
  if (!node) {
    return
  }
  const t = worldTranslate(cam, view)
  node.style.transform = `translate3d(${Math.round(t.x)}px, ${Math.round(t.y)}px, 0)`
}

/**
 * Camera state lives in a ref; the world layer transform is written imperatively.
 * No React state — callers drive follow/snap from the rAF loop.
 */
export function useMapCamera(
  worldRef: RefObject<HTMLDivElement | null>,
  spawn: Vec2 = WORLD_SPAWN,
): MapCamera {
  const spawnPx = tileToPx(spawn)
  const cameraRef = useRef<Camera>({
    x: spawnPx.x + TILE_PX / 2,
    y: spawnPx.y + TILE_PX / 2,
  })
  const worldRefLatest = useRef(worldRef)
  worldRefLatest.current = worldRef

  const apiRef = useRef<MapCamera | null>(null)
  if (apiRef.current === null) {
    apiRef.current = {
      cameraRef,
      snapTo(target, view) {
        cameraRef.current = { x: target.x, y: target.y }
        writeWorldTransform(worldRefLatest.current, cameraRef.current, view)
      },
      follow(target, view, dtMs) {
        if (prefersReducedMotion() || dtMs <= 0) {
          cameraRef.current = { x: target.x, y: target.y }
        } else {
          cameraRef.current = updateCamera(cameraRef.current, target, dtMs)
        }
        writeWorldTransform(worldRefLatest.current, cameraRef.current, view)
      },
    }
  }

  return apiRef.current
}
