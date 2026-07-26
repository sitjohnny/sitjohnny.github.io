import type { MapDef, TileId, TileSource } from '@/types/map'

const VALID_TILES = new Set<TileId>(['ground', 'grass', 'obstacle'])

/** Bounds-checked lookup on a finite MapDef. */
export function mapTileAt(map: MapDef, x: number, y: number): TileId | null {
  if (
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0 ||
    x >= map.width ||
    y >= map.height
  ) {
    return null
  }
  return map.tiles[y * map.width + x] ?? null
}

/** Adapt a finite MapDef into the TileSource collision API. */
export function asTileSource(map: MapDef): TileSource {
  return {
    id: map.id,
    tileAt: (x, y) => mapTileAt(map, x, y),
  }
}

export function tileAt(source: TileSource, x: number, y: number): TileId | null {
  return source.tileAt(x, y)
}

export function isWalkable(source: TileSource, x: number, y: number): boolean {
  const tile = tileAt(source, x, y)
  return tile === 'ground' || tile === 'grass'
}

export function isGrass(source: TileSource, x: number, y: number): boolean {
  return tileAt(source, x, y) === 'grass'
}

/**
 * True when dimensions are positive integers, tiles.length matches width*height,
 * every entry is a known TileId, and spawn is in-bounds and walkable.
 */
export function isValidMap(map: MapDef): boolean {
  if (
    !Number.isInteger(map.width) ||
    !Number.isInteger(map.height) ||
    map.width <= 0 ||
    map.height <= 0
  ) {
    return false
  }
  if (map.tiles.length !== map.width * map.height) {
    return false
  }
  for (const tile of map.tiles) {
    if (!VALID_TILES.has(tile)) {
      return false
    }
  }
  const { x, y } = map.spawn
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    return false
  }
  if (mapTileAt(map, x, y) === null) {
    return false
  }
  return isWalkable(asTileSource(map), x, y)
}
