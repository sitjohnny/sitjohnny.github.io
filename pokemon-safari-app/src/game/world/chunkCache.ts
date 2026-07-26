import { CHUNK_SIZE } from '@/data/worldConfig'
import type { TileId, Vec2 } from '@/types/map'
import { generateChunk } from './generateChunk'

export type ChunkCoord = { cx: number; cy: number }

export function chunkKey(cx: number, cy: number): string {
  return `${cx},${cy}`
}

export function worldToChunk(x: number, y: number, chunkSize: number = CHUNK_SIZE): ChunkCoord {
  return {
    cx: Math.floor(x / chunkSize),
    cy: Math.floor(y / chunkSize),
  }
}

export function createChunkCache(seed: number, chunkSize: number = CHUNK_SIZE) {
  const cache = new Map<string, TileId[]>()

  function get(cx: number, cy: number): TileId[] {
    const key = chunkKey(cx, cy)
    let tiles = cache.get(key)
    if (!tiles) {
      tiles = generateChunk(seed, cx, cy, chunkSize)
      cache.set(key, tiles)
    }
    return tiles
  }

  function has(cx: number, cy: number): boolean {
    return cache.has(chunkKey(cx, cy))
  }

  function size(): number {
    return cache.size
  }

  /**
   * Drop chunks whose Chebyshev distance from playerChunk exceeds maxDist.
   * Never drops the player's current chunk.
   */
  function evictFarFrom(playerChunk: ChunkCoord, maxDist: number): void {
    for (const key of [...cache.keys()]) {
      const [cxStr, cyStr] = key.split(',')
      const cx = Number(cxStr)
      const cy = Number(cyStr)
      const dist = Math.max(Math.abs(cx - playerChunk.cx), Math.abs(cy - playerChunk.cy))
      if (dist > maxDist) {
        if (cx === playerChunk.cx && cy === playerChunk.cy) {
          continue
        }
        cache.delete(key)
      }
    }
  }

  function tileAt(x: number, y: number): TileId {
    const { cx, cy } = worldToChunk(x, y, chunkSize)
    const tiles = get(cx, cy)
    const localX = ((x % chunkSize) + chunkSize) % chunkSize
    const localY = ((y % chunkSize) + chunkSize) % chunkSize
    return tiles[localY * chunkSize + localX]!
  }

  return { get, has, size, evictFarFrom, tileAt, chunkSize }
}

export type ChunkCache = ReturnType<typeof createChunkCache>

export function chebyshevChunks(a: ChunkCoord, b: ChunkCoord): number {
  return Math.max(Math.abs(a.cx - b.cx), Math.abs(a.cy - b.cy))
}

export function warmNeighborhood(
  cache: ChunkCache,
  player: Vec2,
  radius: number = 1,
): ChunkCoord {
  const center = worldToChunk(player.x, player.y, cache.chunkSize)
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      cache.get(center.cx + dx, center.cy + dy)
    }
  }
  return center
}
