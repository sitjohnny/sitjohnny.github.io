import { useRef } from 'react'
import type { RefObject } from 'react'
import { TILE_PX } from '@/data/exploreConfig'
import {
  clamp,
  mapPixelSize,
  updateCamera,
  worldTranslate,
  type Camera,
  type Size,
} from '@/game/camera'
import { tileToPx } from '@/game/movement'
import type { MapDef } from '@/types/map'

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

function clampToMap(target: Camera, mapPx: Size, view: Size): Camera {
  const halfW = view.w / 2
  const halfH = view.h / 2
  return {
    x: clamp(target.x, halfW, Math.max(halfW, mapPx.w - halfW)),
    y: clamp(target.y, halfH, Math.max(halfH, mapPx.h - halfH)),
  }
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
 * No React state — callers drive follow/snap from the rAF loop (MAP-04).
 * The returned API object is stable across renders so the explore effect can depend on it.
 */
export function useMapCamera(
  map: MapDef,
  worldRef: RefObject<HTMLDivElement | null>,
): MapCamera {
  const spawnPx = tileToPx(map.spawn)
  const cameraRef = useRef<Camera>({
    x: spawnPx.x + TILE_PX / 2,
    y: spawnPx.y + TILE_PX / 2,
  })
  const mapRef = useRef(map)
  mapRef.current = map
  const worldRefLatest = useRef(worldRef)
  worldRefLatest.current = worldRef

  const apiRef = useRef<MapCamera | null>(null)
  if (apiRef.current === null) {
    apiRef.current = {
      cameraRef,
      snapTo(target, view) {
        const mapPx = mapPixelSize(mapRef.current)
        cameraRef.current = clampToMap(target, mapPx, view)
        writeWorldTransform(worldRefLatest.current, cameraRef.current, view)
      },
      follow(target, view, dtMs) {
        const mapPx = mapPixelSize(mapRef.current)
        if (prefersReducedMotion() || dtMs <= 0) {
          // Snap + clamp (T-03-09) so reduced-motion never reveals empty map space.
          cameraRef.current = clampToMap(target, mapPx, view)
        } else {
          cameraRef.current = updateCamera(cameraRef.current, target, mapPx, view, dtMs)
        }
        writeWorldTransform(worldRefLatest.current, cameraRef.current, view)
      },
    }
  }

  return apiRef.current
}
