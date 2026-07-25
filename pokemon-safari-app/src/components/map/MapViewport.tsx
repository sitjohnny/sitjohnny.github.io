import { useEffect } from 'react'
import type { ReactNode, RefObject } from 'react'

export type MapViewportProps = {
  viewportRef: RefObject<HTMLDivElement | null>
  worldRef: RefObject<HTMLDivElement | null>
  widthPx: number
  heightPx: number
  children: ReactNode
}

/**
 * Clip rect for the tile world. The world layer beneath is moved by the frame
 * loop through `worldRef` — this component never reads the store and never
 * re-renders while the player walks.
 */
export function MapViewport({
  viewportRef,
  worldRef,
  widthPx,
  heightPx,
  children,
}: MapViewportProps) {
  useEffect(() => {
    const node = viewportRef.current
    if (!node) {
      return
    }
    // Scoped to the viewport only so the page keeps native gestures elsewhere
    // (T-03-04).
    const prevent = (event: TouchEvent) => {
      event.preventDefault()
    }
    node.addEventListener('touchstart', prevent, { passive: false })
    node.addEventListener('touchmove', prevent, { passive: false })
    return () => {
      node.removeEventListener('touchstart', prevent)
      node.removeEventListener('touchmove', prevent)
    }
  }, [viewportRef])

  return (
    <div
      ref={viewportRef}
      className="relative flex-1 overflow-hidden bg-dominant touch-none select-none"
    >
      <div
        ref={worldRef}
        className="absolute left-0 top-0 will-change-transform"
        style={{ width: widthPx, height: heightPx }}
      >
        {children}
      </div>
    </div>
  )
}
