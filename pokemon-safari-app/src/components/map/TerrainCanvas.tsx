import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import groundTile from '@/assets/tiles/ground.png'
import grassTile from '@/assets/tiles/grass.png'
import obstacleTile from '@/assets/tiles/obstacle.png'
import type { TileId } from '@/types/map'
import type { TileImages } from '@/game/world/drawTerrain'

const TILE_URLS: Record<TileId, string> = {
  ground: groundTile,
  grass: grassTile,
  obstacle: obstacleTile,
}

export type TerrainCanvasProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  /** Populated when tile PNGs finish loading (or fail → null entry). */
  imagesRef: RefObject<TileImages>
}

/**
 * Viewport-sized canvas for procedural terrain. Drawing is driven by the
 * explore rAF loop via `drawTerrain` — this component only mounts the canvas
 * and loads tile images.
 */
export function TerrainCanvas({ canvasRef, imagesRef }: TerrainCanvasProps) {
  const localImages = useRef<TileImages>({})

  useEffect(() => {
    imagesRef.current = localImages.current
    let cancelled = false
    const entries = Object.entries(TILE_URLS) as [TileId, string][]

    for (const [id, url] of entries) {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        if (cancelled) return
        localImages.current[id] = img
        imagesRef.current = localImages.current
      }
      img.onerror = () => {
        if (cancelled) return
        localImages.current[id] = null
        imagesRef.current = localImages.current
      }
      img.src = url
    }

    return () => {
      cancelled = true
    }
  }, [imagesRef])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      data-testid="terrain-canvas"
    />
  )
}
