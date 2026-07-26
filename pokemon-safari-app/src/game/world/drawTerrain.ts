import { TILE_PX } from '@/data/exploreConfig'
import type { Camera, Size } from '@/game/camera'
import type { TileId } from '@/types/map'
import type { WorldProvider } from '@/game/world/worldProvider'

export type TileImages = Partial<Record<TileId, CanvasImageSource | null>>

const FALLBACK: Record<TileId, string> = {
  ground: '#6b8f4e',
  grass: '#3d6b2f',
  obstacle: '#2a4a1f',
}

/**
 * Paint every tile whose pixel rect intersects the camera viewport.
 * Camera is the world-pixel centre of the view.
 */
export function drawTerrain(
  ctx: CanvasRenderingContext2D,
  world: WorldProvider,
  cam: Camera,
  view: Size,
  images: TileImages = {},
): void {
  const { w, h } = view
  if (w <= 0 || h <= 0) {
    return
  }

  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, w, h)

  const left = cam.x - w / 2
  const top = cam.y - h / 2
  const tileLeft = Math.floor(left / TILE_PX)
  const tileTop = Math.floor(top / TILE_PX)
  const tileRight = Math.floor((left + w) / TILE_PX)
  const tileBottom = Math.floor((top + h) / TILE_PX)

  for (let ty = tileTop; ty <= tileBottom; ty++) {
    for (let tx = tileLeft; tx <= tileRight; tx++) {
      const tile = world.tileAt(tx, ty)
      if (tile === null) {
        continue
      }
      const screenX = Math.round(tx * TILE_PX - left)
      const screenY = Math.round(ty * TILE_PX - top)
      const img = images[tile]
      if (img) {
        ctx.drawImage(img, screenX, screenY, TILE_PX, TILE_PX)
      } else {
        ctx.fillStyle = FALLBACK[tile]
        ctx.fillRect(screenX, screenY, TILE_PX, TILE_PX)
      }
    }
  }
}
