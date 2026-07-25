import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { Direction } from '@/types/map'

export type DPadProps = {
  onPress: (dir: Direction) => void
  onRelease: (dir: Direction) => void
  className?: string
}

const ARM_LABEL: Record<Direction, string> = {
  up: 'Move up',
  down: 'Move down',
  left: 'Move left',
  right: 'Move right',
}

const ARM_CELL: Record<Direction, string> = {
  up: 'col-start-2 row-start-1',
  down: 'col-start-2 row-start-3',
  left: 'col-start-1 row-start-2',
  right: 'col-start-3 row-start-2',
}

const ARMS: Direction[] = ['up', 'left', 'right', 'down']

/**
 * Touch D-pad. It only reports which direction is held — step legality, map
 * data, and the store all live behind `usePlayerInput` and the frame loop.
 *
 * Bounding box is 208px: three 64px arms (UI-SPEC minimum hit target) plus two
 * 8px gaps around the inactive centre cell.
 */
export function DPad({ onPress, onRelease, className = '' }: DPadProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const heldRef = useRef<Direction | null>(null)
  const [heldDir, setHeldDir] = useState<Direction | null>(null)

  useEffect(() => {
    const node = rootRef.current
    if (!node) {
      return
    }
    // Scoped to this node only so the rest of the page keeps its native
    // scroll/zoom gestures (T-03-04).
    const prevent = (event: TouchEvent) => {
      event.preventDefault()
    }
    node.addEventListener('touchstart', prevent, { passive: false })
    node.addEventListener('touchmove', prevent, { passive: false })
    return () => {
      node.removeEventListener('touchstart', prevent)
      node.removeEventListener('touchmove', prevent)
    }
  }, [])

  function handlePress(event: ReactPointerEvent<HTMLButtonElement>, dir: Direction) {
    event.preventDefault()
    heldRef.current = dir
    setHeldDir(dir)
    onPress(dir)
  }

  function handleRelease(dir: Direction) {
    if (heldRef.current !== dir) {
      return
    }
    heldRef.current = null
    setHeldDir(null)
    onRelease(dir)
  }

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label="Walk controls"
      className={[
        'grid h-[208px] w-[208px] grid-cols-3 grid-rows-3 gap-2 touch-none select-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {ARMS.map((dir) => {
        const pressed = heldDir === dir
        return (
          <button
            key={dir}
            type="button"
            aria-label={ARM_LABEL[dir]}
            onPointerDown={(event) => handlePress(event, dir)}
            onPointerUp={() => handleRelease(dir)}
            onPointerLeave={() => handleRelease(dir)}
            onPointerCancel={() => handleRelease(dir)}
            onLostPointerCapture={() => handleRelease(dir)}
            className={[
              'dpad-target pixel-border flex items-center justify-center rounded-[4px]',
              'shadow-[2px_2px_0_#1A3324] touch-manipulation transition-transform duration-[80ms]',
              'ease-out active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100',
              ARM_CELL[dir],
              pressed ? 'bg-accent text-text' : 'bg-secondary text-on-secondary',
            ].join(' ')}
          >
            <Chevron dir={dir} />
          </button>
        )
      })}
      <span
        aria-hidden="true"
        className="col-start-2 row-start-2 rounded-[4px] bg-muted/40"
      />
    </div>
  )
}

const CHEVRON_PATH: Record<Direction, string> = {
  up: 'M5 15 12 8l7 7',
  down: 'M5 9l7 7 7-7',
  left: 'M15 5 8 12l7 7',
  right: 'M9 5l7 7-7 7',
}

function Chevron({ dir }: { dir: Direction }) {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <path d={CHEVRON_PATH[dir]} />
    </svg>
  )
}
