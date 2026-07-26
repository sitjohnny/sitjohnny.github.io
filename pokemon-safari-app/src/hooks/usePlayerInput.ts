import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { isEncounterActive } from '@/store/encounterStore'
import type { Direction } from '@/types/map'

/**
 * MAP-01: the single held-direction path. Keyboard and the on-screen D-pad both
 * push into the same stack, so the frame loop never learns where input came from.
 *
 * `KEY_DIRECTION` is the allowlist mitigating T-03-01 — any code outside it is
 * ignored and, crucially, never `preventDefault`ed, so ordinary page keys keep
 * working while the map is on screen.
 */
export const KEY_DIRECTION: Record<string, Direction> = Object.freeze({
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
})

/** Last press wins when several directions are held at once. */
export function primaryDirection(held: readonly Direction[]): Direction | null {
  return held.length === 0 ? null : held[held.length - 1]
}

export type PlayerInput = {
  heldRef: RefObject<Direction[]>
  press: (dir: Direction) => void
  release: (dir: Direction) => void
  clear: () => void
}

export function usePlayerInput(): PlayerInput {
  const heldRef = useRef<Direction[]>([])

  const press = useCallback((dir: Direction) => {
    heldRef.current = [...heldRef.current.filter((held) => held !== dir), dir]
  }, [])

  const release = useCallback((dir: Direction) => {
    heldRef.current = heldRef.current.filter((held) => held !== dir)
  }, [])

  const clear = useCallback(() => {
    heldRef.current = []
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) {
        return
      }
      const dir = KEY_DIRECTION[event.code]
      if (!dir) {
        return
      }
      if (isEncounterActive()) {
        clear()
        return
      }
      press(dir)
      event.preventDefault()
    }

    function onKeyUp(event: KeyboardEvent) {
      const dir = KEY_DIRECTION[event.code]
      if (!dir) {
        return
      }
      release(dir)
    }

    // A backgrounded tab never delivers keyup, which would leave the player
    // walking forever (T-03-06).
    function onLostFocus() {
      clear()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onLostFocus)
    document.addEventListener('visibilitychange', onLostFocus)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onLostFocus)
      document.removeEventListener('visibilitychange', onLostFocus)
      clear()
    }
  }, [press, release, clear])

  return useMemo(
    () => ({ heldRef, press, release, clear }),
    [heldRef, press, release, clear],
  )
}
