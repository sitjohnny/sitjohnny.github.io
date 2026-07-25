import type { MapDef, TileId } from '@/types/map'

const CHAR_TILE: Record<string, TileId> = {
  '.': 'ground',
  g: 'grass',
  '#': 'obstacle',
}

/** 20×15 Forest layout — `.` ground, `g` grass, `#` obstacle. Spawn at (10, 7). */
const FOREST_ROWS = [
  '####################',
  '#.####.............#',
  '#.####.............#',
  '#..................#',
  '#......gggggg......#',
  '#......gggggg......#',
  '#..................#',
  '#....##......##....#',
  '#..###.............#',
  '#..................#',
  '#............####..#',
  '#............####..#',
  '#..gggggg..........#',
  '#..gggggg..........#',
  '####################',
] as const

function buildTiles(rows: readonly string[]): TileId[] {
  return rows.flatMap((row) =>
    [...row].map((ch) => {
      const tile = CHAR_TILE[ch]
      if (!tile) {
        throw new Error(`Unknown forest map char: ${JSON.stringify(ch)}`)
      }
      return tile
    }),
  )
}

export const forestMap: MapDef = {
  id: 'forest',
  width: 20,
  height: 15,
  tiles: buildTiles(FOREST_ROWS),
  spawn: { x: 10, y: 7 },
}
