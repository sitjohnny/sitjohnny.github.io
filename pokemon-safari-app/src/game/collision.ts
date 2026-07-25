import type { MapDef, TileId } from '@/types/map'

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
