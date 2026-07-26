import {
  GRASS_THRESHOLD,
  NOISE_SCALE,
  OBSTACLE_THRESHOLD,
  SPAWN_CARVE_RADIUS,
  WORLD_SPAWN,
} from '@/data/worldConfig'
import type { TileId } from '@/types/map'
import { noise2D } from './noise'

export function tileIdAt(seed: number, x: number, y: number): TileId {
  const carveX = Math.abs(x - WORLD_SPAWN.x)
  const carveY = Math.abs(y - WORLD_SPAWN.y)
  if (Math.max(carveX, carveY) <= SPAWN_CARVE_RADIUS) {
    return 'ground'
  }

  const n = noise2D(seed, x / NOISE_SCALE, y / NOISE_SCALE)
  if (n < OBSTACLE_THRESHOLD) {
    return 'obstacle'
  }
  if (n < GRASS_THRESHOLD) {
    return 'grass'
  }
  return 'ground'
}

/** Row-major TileId[chunkSize * chunkSize] for chunk (chunkX, chunkY). */
export function generateChunk(
  seed: number,
  chunkX: number,
  chunkY: number,
  chunkSize: number,
): TileId[] {
  const tiles: TileId[] = new Array(chunkSize * chunkSize)
  const originX = chunkX * chunkSize
  const originY = chunkY * chunkSize
  for (let ly = 0; ly < chunkSize; ly++) {
    for (let lx = 0; lx < chunkSize; lx++) {
      tiles[ly * chunkSize + lx] = tileIdAt(seed, originX + lx, originY + ly)
    }
  }
  return tiles
}
