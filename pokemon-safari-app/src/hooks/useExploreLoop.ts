import { useEffect } from 'react'
import type { RefObject } from 'react'
import {
  IDLE_POSE,
  STEP_DURATION_MS,
  TILE_PX,
  WALK_CYCLE,
  WALK_FRAME_MS,
} from '@/data/exploreConfig'
import { clamp } from '@/game/camera'
import { completeStep, tileToPx, tryStep } from '@/game/movement'
import { drawTerrain, type TileImages } from '@/game/world/drawTerrain'
import type { WorldProvider } from '@/game/world/worldProvider'
import { prefersReducedMotion, useMapCamera } from '@/hooks/useMapCamera'
import { primaryDirection } from '@/hooks/usePlayerInput'
import { useEncounterStore } from '@/store/encounterStore'
import { useExploreStore } from '@/store/exploreStore'
import type { Direction, PlayerState, Vec2 } from '@/types/map'

export type ExploreLoopOptions = {
  world: WorldProvider
  heldRef: RefObject<Direction[]>
  worldRef: RefObject<HTMLDivElement | null>
  playerRef: RefObject<HTMLDivElement | null>
  viewportRef: RefObject<HTMLDivElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  imagesRef: RefObject<TileImages>
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

function paintTerrain(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  imagesRef: RefObject<TileImages>,
  world: WorldProvider,
  cam: { x: number; y: number },
  view: { w: number; h: number },
): void {
  const canvas = canvasRef.current
  if (!canvas || view.w <= 0 || view.h <= 0) {
    return
  }
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const cssW = Math.max(1, Math.floor(view.w))
  const cssH = Math.max(1, Math.floor(view.h))
  const pixelW = Math.floor(cssW * dpr)
  const pixelH = Math.floor(cssH * dpr)
  if (canvas.width !== pixelW || canvas.height !== pixelH) {
    canvas.width = pixelW
    canvas.height = pixelH
    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawTerrain(ctx, world, cam, { w: cssW, h: cssH }, imagesRef.current)
}

/**
 * The only per-frame code in the app.
 *
 * Frame state lives in effect-local variables, never React state. The store is
 * written at tile commit / step completion only; pixels, camera, terrain, and
 * walk frames are painted through refs.
 */
export function useExploreLoop({
  world,
  heldRef,
  worldRef,
  playerRef,
  viewportRef,
  canvasRef,
  imagesRef,
}: ExploreLoopOptions): void {
  const camera = useMapCamera(worldRef, useExploreStore.getState().tile)

  useEffect(() => {
    let frame = 0
    let viewportWidth = 0
    let viewportHeight = 0
    let tween: ActiveTween | null = null
    let walkPhaseMs = 0
    let lastTime = 0
    let playerPx: Vec2 = tileToPx(useExploreStore.getState().tile)

    world.ensureAround(useExploreStore.getState().tile)

    const boot = useExploreStore.getState()
    if (boot.moving) {
      boot.setPlayer({
        x: boot.tile.x,
        y: boot.tile.y,
        facing: boot.facing,
        moving: false,
      })
    }

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

    function setPose(pose: string) {
      if (playerRef.current) {
        playerRef.current.dataset.frame = pose
      }
    }

    function writeFacing(dir: Direction) {
      if (playerRef.current) {
        playerRef.current.dataset.facing = dir
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
          walkPhaseMs = 0
          setPose(IDLE_POSE)
        } else {
          walkPhaseMs = (walkPhaseMs + dtMs) % (WALK_CYCLE.length * WALK_FRAME_MS)
          setPose(WALK_CYCLE[Math.floor(walkPhaseMs / WALK_FRAME_MS)])
        }

        if (t >= 1) {
          tween = null
          const idle = completeStep(state)
          if (!samePlayer(state, idle)) {
            store.setPlayer(idle)
          }
        }
      }

      const encounterActive = useEncounterStore.getState().stage !== 'idle'

      if (!tween && !encounterActive) {
        store = useExploreStore.getState()
        state = {
          x: store.tile.x,
          y: store.tile.y,
          facing: store.facing,
          moving: store.moving,
        }

        const result = tryStep(state, primaryDirection(heldRef.current), world, now)

        if (!samePlayer(state, result.next)) {
          // Tick immunity only on tile commits (not turn-in-place). Fold into the
          // same setPlayer write so facing subscribers see one atomic update —
          // a follow-up immunity set in this rAF was desyncing data-facing.
          const moved = result.next.x !== state.x || result.next.y !== state.y
          store.setPlayer(result.next, { tickImmunity: moved })
          if (result.next.facing !== state.facing) {
            writeFacing(result.next.facing)
          }
          if (result.tween) {
            world.ensureAround({ x: result.next.x, y: result.next.y })
          }
        }
        if (result.events.length > 0) {
          for (const event of result.events) {
            if (import.meta.env.DEV)
              console.debug('[explore] encounter_candidate', event.x, event.y)
          }
          store.pushEncounters(result.events)
        }

        if (result.tween) {
          const durationMs = reduced ? 0 : result.tween.durationMs || STEP_DURATION_MS
          if (durationMs <= 0) {
            writePlayer(result.tween.to)
            walkPhaseMs = 0
            setPose(IDLE_POSE)
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
            writePlayer(result.tween.from)
            setPose(WALK_CYCLE[Math.floor(walkPhaseMs / WALK_FRAME_MS)])
          }
        } else if (!tween) {
          writePlayer(tileToPx(result.next))
          walkPhaseMs = 0
          setPose(IDLE_POSE)
        }
      }

      const view = { w: viewportWidth, h: viewportHeight }
      camera.follow(
        { x: playerPx.x + TILE_PX / 2, y: playerPx.y + TILE_PX / 2 },
        view,
        dtMs,
      )
      paintTerrain(canvasRef, imagesRef, world, camera.cameraRef.current, view)

      frame = requestAnimationFrame(tick)
    }

    measure()
    window.addEventListener('resize', measure)
    writePlayer(playerPx)
    camera.snapTo(
      { x: playerPx.x + TILE_PX / 2, y: playerPx.y + TILE_PX / 2 },
      { w: viewportWidth, h: viewportHeight },
    )
    paintTerrain(canvasRef, imagesRef, world, camera.cameraRef.current, {
      w: viewportWidth,
      h: viewportHeight,
    })
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
      const s = useExploreStore.getState()
      if (s.moving) {
        s.setPlayer({ x: s.tile.x, y: s.tile.y, facing: s.facing, moving: false })
      }
    }
  }, [world, heldRef, worldRef, playerRef, viewportRef, canvasRef, imagesRef, camera])
}
