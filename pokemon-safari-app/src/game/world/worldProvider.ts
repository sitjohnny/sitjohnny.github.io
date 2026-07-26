import { CHUNK_EVICT_DISTANCE, CHUNK_SIZE, WORLD_SEED } from '@/data/worldConfig'
import type { BiomeId, TileId, Vec2 } from '@/types/map'
import { createChunkCache, warmNeighborhood, type ChunkCache } from './chunkCache'

export type WorldProvider = {
  id: BiomeId
  seed: number
  chunkSize: number
  tileAt: (x: number, y: number) => TileId | null
  isWalkable: (x: number, y: number) => boolean
  isGrass: (x: number, y: number) => boolean
  ensureAround: (player: Vec2) => void
  /** Test/introspection */
  cache: ChunkCache
}

export type CreateWorldOptions = {
  seed?: number
  biome?: BiomeId
  chunkSize?: number
  evictDistance?: number
}

export function createWorld(options: CreateWorldOptions = {}): WorldProvider {
  const seed = options.seed ?? WORLD_SEED
  const biome = options.biome ?? 'forest'
  const chunkSize = options.chunkSize ?? CHUNK_SIZE
  const evictDistance = options.evictDistance ?? CHUNK_EVICT_DISTANCE
  const cache = createChunkCache(seed, chunkSize)

  function tileAt(x: number, y: number): TileId | null {
    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      return null
    }
    return cache.tileAt(x, y)
  }

  function isWalkable(x: number, y: number): boolean {
    const tile = tileAt(x, y)
    return tile === 'ground' || tile === 'grass'
  }

  function isGrass(x: number, y: number): boolean {
    return tileAt(x, y) === 'grass'
  }

  function ensureAround(player: Vec2): void {
    const center = warmNeighborhood(cache, player, 1)
    cache.evictFarFrom(center, evictDistance)
  }

  return {
    id: biome,
    seed,
    chunkSize,
    tileAt,
    isWalkable,
    isGrass,
    ensureAround,
    cache,
  }
}
