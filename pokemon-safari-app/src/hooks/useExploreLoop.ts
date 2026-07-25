import { useEffect } from 'react'
import type { RefObject } from 'react'
import { STEP_DURATION_MS, TILE_PX } from '@/data/exploreConfig'
import { completeStep, tileToPx, tryStep } from '@/game/movement'
import { primaryDirection } from '@/hooks/usePlayerInput'
import { useExploreStore } from '@/store/exploreStore'
import type { Direction, MapDef, PlayerState, Vec2 } from '@/types/map'

export type ExploreLoopOptions = {
  map: MapDef
  heldRef: RefObject<Direction[]>
  worldRef: RefObject<HTMLDivElement | null>
  playerRef: RefObject<HTMLDivElement | null>
  viewportRef: RefObject<HTMLDivElement | null>
}

function samePlayer(a: PlayerState, b: PlayerState): boolean {
  return a.x === b.x && a.y === b.y && a.facing === b.facing && a.moving === b.moving
}

/**
 * The only per-frame code in the app (MAP-04).
 *
 * Frame state lives in effect-local variables, never React state, and the
 * store is written at most once per frame — and in practice once per committed
 * tile. Both the world layer and the player are painted by direct DOM
 * transform writes.
 */
export function useExploreLoop({
  map,
  heldRef,
  worldRef,
  playerRef,
  viewportRef,
}: ExploreLoopOptions): void {
  useEffect(() => {
    let frame = 0
    let stepStartedAt = 0
    let viewportWidth = 0
    let viewportHeight = 0

    function measure() {
      const node = viewportRef.current
      if (!node) {
        return
      }
      const rect = node.getBoundingClientRect()
      viewportWidth = rect.width
      viewportHeight = rect.height
    }

    function paint(tile: Vec2) {
      const px = tileToPx(tile)
      if (playerRef.current) {
        playerRef.current.style.transform = `translate3d(${px.x}px, ${px.y}px, 0)`
      }
      if (worldRef.current) {
        const worldX = viewportWidth / 2 - (px.x + TILE_PX / 2)
        const worldY = viewportHeight / 2 - (px.y + TILE_PX / 2)
        worldRef.current.style.transform = `translate3d(${worldX}px, ${worldY}px, 0)`
      }
    }

    function tick(now: number) {
      const store = useExploreStore.getState()
      const committed: PlayerState = {
        x: store.tile.x,
        y: store.tile.y,
        facing: store.facing,
        moving: store.moving,
      }

      // 03-03 replaces instant arrival with the STEP_DURATION_MS tween and the
      // eased camera. Until then the move lock is released on the same clock so
      // one press still walks exactly one tile.
      const arrived =
        committed.moving && now - stepStartedAt >= STEP_DURATION_MS
          ? completeStep(committed)
          : committed

      const { next, events } = tryStep(arrived, primaryDirection(heldRef.current), map, now)

      if (next.moving && !arrived.moving) {
        stepStartedAt = now
      }
      if (!samePlayer(committed, next)) {
        store.setPlayer(next)
      }
      if (events.length > 0) {
        store.pushEncounters(events)
      }

      paint(next)
      frame = requestAnimationFrame(tick)
    }

    measure()
    window.addEventListener('resize', measure)
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
    }
  }, [map, heldRef, worldRef, playerRef, viewportRef])
}
