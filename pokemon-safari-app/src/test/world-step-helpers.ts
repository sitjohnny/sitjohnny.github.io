import type { Direction, TileId, Vec2 } from '@/types/map'
import { createWorld } from '@/game/world/worldProvider'

const probeWorld = createWorld()

const DIRS: { dir: Direction; dx: number; dy: number }[] = [
  { dir: 'up', dx: 0, dy: -1 },
  { dir: 'down', dx: 0, dy: 1 },
  { dir: 'left', dx: -1, dy: 0 },
  { dir: 'right', dx: 1, dy: 0 },
]

/** Find a walkable tile from which one step lands on a tile matching `want`. */
export function findStepOnto(want: TileId): { from: Vec2; dir: Direction; to: Vec2 } {
  for (let y = -60; y <= 60; y++) {
    for (let x = -60; x <= 60; x++) {
      if (!probeWorld.isWalkable(x, y)) continue
      for (const { dir, dx, dy } of DIRS) {
        const tx = x + dx
        const ty = y + dy
        if (probeWorld.tileAt(tx, ty) === want) {
          return { from: { x, y }, dir, to: { x: tx, y: ty } }
        }
      }
    }
  }
  throw new Error(`no adjacent step onto ${want}`)
}
