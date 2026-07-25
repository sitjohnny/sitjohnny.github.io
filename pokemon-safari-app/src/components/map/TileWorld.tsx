import { memo } from 'react'
import type { CSSProperties } from 'react'
import { TILE_PX } from '@/data/exploreConfig'
import type { MapDef, TileId } from '@/types/map'

export type TileWorldProps = {
  map: MapDef
}

/**
 * Static Forest tile layer. Rendered once per map and memoized — walking never
 * re-renders it, the world layer above simply translates.
 *
 * Grass carries a blade stipple as well as a darker hue so it stays distinct
 * from ground without relying on colour alone (UI-SPEC accessibility).
 */
const TILE_STYLE: Record<TileId, CSSProperties> = {
  ground: {
    backgroundColor: '#C8E6A0',
  },
  grass: {
    backgroundColor: '#3D8B4F',
    backgroundImage:
      'repeating-linear-gradient(90deg, #2F6B3C 0px, #2F6B3C 3px, transparent 3px, transparent 12px), repeating-linear-gradient(180deg, transparent 0px, transparent 21px, #2F6B3C 21px, #2F6B3C 24px)',
    backgroundSize: '24px 24px',
  },
  obstacle: {
    backgroundColor: '#1F5A36',
    backgroundImage:
      'linear-gradient(180deg, #1F5A36 0px, #1F5A36 32px, #6B4A2E 32px, #6B4A2E 48px)',
  },
}

export const TileWorld = memo(function TileWorld({ map }: TileWorldProps) {
  return (
    <div aria-hidden="true" className="pixelated absolute left-0 top-0">
      {map.tiles.map((tile, index) => {
        const x = index % map.width
        const y = Math.floor(index / map.width)
        return (
          <div
            key={index}
            className="absolute"
            style={{
              left: x * TILE_PX,
              top: y * TILE_PX,
              width: TILE_PX,
              height: TILE_PX,
              ...TILE_STYLE[tile],
            }}
          />
        )
      })}
    </div>
  )
})
