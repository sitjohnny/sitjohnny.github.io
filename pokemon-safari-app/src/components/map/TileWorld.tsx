import { memo } from 'react'
import { TILE_PX } from '@/data/exploreConfig'
import type { MapDef, TileId } from '@/types/map'
import groundTile from '@/assets/tiles/ground.png'
import grassTile from '@/assets/tiles/grass.png'
import obstacleTile from '@/assets/tiles/obstacle.png'

export type TileWorldProps = {
  map: MapDef
}

const TILE_SRC: Record<TileId, string> = {
  ground: groundTile,
  grass: grassTile,
  obstacle: obstacleTile,
}

/**
 * Static Forest tile layer. Rendered once per map and memoized — walking never
 * re-renders it, the world layer above simply translates.
 *
 * Gen 1–3–style 16×16 PNGs scaled to TILE_PX with `.pixelated` nearest-neighbor
 * (UI-SPEC D10). Tall grass uses a distinct blade silhouette, not hue alone.
 */
export const TileWorld = memo(function TileWorld({ map }: TileWorldProps) {
  return (
    <div
      aria-hidden="true"
      className="absolute left-0 top-0"
      style={{ width: map.width * TILE_PX, height: map.height * TILE_PX }}
    >
      {map.tiles.map((tile, index) => {
        const x = index % map.width
        const y = Math.floor(index / map.width)
        return (
          <img
            key={index}
            src={TILE_SRC[tile]}
            alt=""
            draggable={false}
            className="pixelated absolute"
            style={{
              left: x * TILE_PX,
              top: y * TILE_PX,
              width: TILE_PX,
              height: TILE_PX,
            }}
          />
        )
      })}
    </div>
  )
})
