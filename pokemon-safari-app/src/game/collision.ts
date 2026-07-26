import type { MapDef, TileId } from '@/types/map'

const VALID_TILES = new Set<TileId>(['ground', 'grass', 'obstacle'])

/** Bounds-checked tile lookup — rejects non-integer and out-of-range coordinates (T-03-02). */
export function tileAt(map: MapDef, x: number, y: number): TileId | null {
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

export function isWalkable(map: MapDef, x: number, y: number): boolean {
  const tile = tileAt(map, x, y)
  return tile === 'ground' || tile === 'grass'
}

export function isGrass(map: MapDef, x: number, y: number): boolean {
  return tileAt(map, x, y) === 'grass'
}

/**
 * True when dimensions are positive integers, tiles.length matches width*height,
 * every entry is a known TileId, and spawn is in-bounds and walkable (T-03-11).
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
  if (tileAt(map, x, y) === null) {
    return false
  }
  return isWalkable(map, x, y)
}
