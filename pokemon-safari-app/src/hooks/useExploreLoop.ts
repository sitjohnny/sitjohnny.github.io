import { useEffect } from 'react'
import type { RefObject } from 'react'
import { STEP_DURATION_MS, TILE_PX, WALK_FRAME_MS } from '@/data/exploreConfig'
import { clamp } from '@/game/camera'
import { completeStep, tileToPx, tryStep } from '@/game/movement'
import { WALK_FRAME_CLASSES } from '@/components/map/PlayerSprite'
import { prefersReducedMotion, useMapCamera } from '@/hooks/useMapCamera'
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

type ActiveTween = {
  from: Vec2
  to: Vec2
  startedAt: number
  durationMs: number
}

function samePlayer(a: PlayerState, b: PlayerState): boolean {
  return a.x === b.x && a.y === b.y && a.facing === b.facing && a.moving === b.moving
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

/**
 * The only per-frame code in the app (MAP-04).
 *
 * Frame state lives in effect-local variables, never React state. The store is
 * written at tile commit / step completion only; pixels, camera, and walk
 * frames are painted through refs.
 */
export function useExploreLoop({
  map,
  heldRef,
  worldRef,
  playerRef,
  viewportRef,
}: ExploreLoopOptions): void {
  const camera = useMapCamera(map, worldRef)

  useEffect(() => {
    let frame = 0
    let viewportWidth = 0
    let viewportHeight = 0
    let tween: ActiveTween | null = null
    let frameStartedAt = 0
    let lastTime = 0
    let playerPx: Vec2 = tileToPx(useExploreStore.getState().tile)

    function measure() {
      const node = viewportRef.current
      if (!node) {
        return
      }
      const rect = node.getBoundingClientRect()
      viewportWidth = rect.width
      viewportHeight = rect.height
    }

    function writePlayer(px: Vec2) {
      playerPx = px
      if (playerRef.current) {
        playerRef.current.style.transform = `translate3d(${Math.round(px.x)}px, ${Math.round(px.y)}px, 0)`
      }
    }

    function setWalkFrame(index: number) {
      if (playerRef.current) {
        playerRef.current.dataset.frame = String(index % WALK_FRAME_CLASSES.length)
      }
    }

    function tick(now: number) {
      const rawDt = lastTime === 0 ? 16 : now - lastTime
      const dtMs = Math.min(Math.max(rawDt, 0), 50)
      lastTime = now

      const reduced = prefersReducedMotion()
      let store = useExploreStore.getState()
      let state: PlayerState = {
        x: store.tile.x,
        y: store.tile.y,
        facing: store.facing,
        moving: store.moving,
      }

      if (tween) {
        const t =
          tween.durationMs <= 0
            ? 1
            : clamp((now - tween.startedAt) / tween.durationMs, 0, 1)
        writePlayer({
          x: lerp(tween.from.x, tween.to.x, t),
          y: lerp(tween.from.y, tween.to.y, t),
        })

        if (reduced) {
          setWalkFrame(0)
        } else {
          if (frameStartedAt === 0) {
            frameStartedAt = now
          }
          setWalkFrame(Math.floor((now - frameStartedAt) / WALK_FRAME_MS))
        }

        if (t >= 1) {
          tween = null
          frameStartedAt = 0
          setWalkFrame(0)
          const idle = completeStep(state)
          if (!samePlayer(state, idle)) {
            store.setPlayer(idle)
          }
        }
      }

      // Only start a new step when no tween is in flight (Pitfall 6 one-step lock).
      if (!tween) {
        store = useExploreStore.getState()
        state = {
          x: store.tile.x,
          y: store.tile.y,
          facing: store.facing,
          moving: store.moving,
        }

        const result = tryStep(state, primaryDirection(heldRef.current), map, now)

        if (!samePlayer(state, result.next)) {
          store.setPlayer(result.next)
        }
        if (result.events.length > 0) {
          store.pushEncounters(result.events)
        }

        if (result.tween) {
          // Prefer the tween's duration (STEP_DURATION_MS from tryStep); reduced motion snaps.
          const durationMs = reduced ? 0 : result.tween.durationMs || STEP_DURATION_MS
          if (durationMs <= 0) {
            writePlayer(result.tween.to)
            setWalkFrame(0)
            const idle = completeStep(result.next)
            if (!samePlayer(result.next, idle)) {
              store.setPlayer(idle)
            }
          } else {
            tween = {
              from: result.tween.from,
              to: result.tween.to,
              startedAt: now,
              durationMs,
            }
            frameStartedAt = now
            writePlayer(result.tween.from)
            setWalkFrame(0)
          }
        } else if (!tween) {
          writePlayer(tileToPx(result.next))
          setWalkFrame(0)
        }
      }

      const view = { w: viewportWidth, h: viewportHeight }
      camera.follow(
        { x: playerPx.x + TILE_PX / 2, y: playerPx.y + TILE_PX / 2 },
        view,
        dtMs,
      )

      frame = requestAnimationFrame(tick)
    }

    measure()
    window.addEventListener('resize', measure)
    writePlayer(playerPx)
    camera.snapTo(
      { x: playerPx.x + TILE_PX / 2, y: playerPx.y + TILE_PX / 2 },
      { w: viewportWidth, h: viewportHeight },
    )
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
    }
  }, [map, heldRef, worldRef, playerRef, viewportRef, camera])
}
