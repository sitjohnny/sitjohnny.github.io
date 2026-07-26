import { useEffect } from 'react'
import type { ReactNode, RefObject } from 'react'

export type MapViewportProps = {
  viewportRef: RefObject<HTMLDivElement | null>
  worldRef: RefObject<HTMLDivElement | null>
  /** Drawn behind the translated player layer (typically TerrainCanvas). */
  backdrop?: ReactNode
  children: ReactNode
}

/**
 * Clip rect for exploration. Backdrop (canvas) stays viewport-fixed; the world
 * layer under `worldRef` is translated by the frame loop for the player sprite.
 */
export function MapViewport({
  viewportRef,
  worldRef,
  backdrop,
  children,
}: MapViewportProps) {
  useEffect(() => {
    const node = viewportRef.current
    if (!node) {
      return
    }
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
      {backdrop}
      <div ref={worldRef} className="absolute left-0 top-0 will-change-transform">
        {children}
      </div>
    </div>
  )
}
