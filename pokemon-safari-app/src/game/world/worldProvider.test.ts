import { describe, expect, it } from 'vitest'
import { CHUNK_SIZE, WORLD_SEED } from '@/data/worldConfig'
import { tileIdAt } from './generateChunk'
import { createChunkCache, worldToChunk } from './chunkCache'
import { createWorld } from './worldProvider'

describe('worldToChunk', () => {
  it('floors positive and negative world coords', () => {
    expect(worldToChunk(0, 0)).toEqual({ cx: 0, cy: 0 })
    expect(worldToChunk(15, 15)).toEqual({ cx: 0, cy: 0 })
    expect(worldToChunk(16, 0)).toEqual({ cx: 1, cy: 0 })
    expect(worldToChunk(-1, 0)).toEqual({ cx: -1, cy: 0 })
    expect(worldToChunk(-16, -17)).toEqual({ cx: -1, cy: -2 })
  })
})

describe('ChunkCache', () => {
  it('generates on miss and hits on second get', () => {
    const cache = createChunkCache(WORLD_SEED)
    expect(cache.has(0, 0)).toBe(false)
    const first = cache.get(0, 0)
    expect(cache.has(0, 0)).toBe(true)
    expect(cache.get(0, 0)).toBe(first)
    expect(cache.size()).toBe(1)
  })

  it('tileAt matches generateChunk / tileIdAt for negative coords', () => {
    const cache = createChunkCache(WORLD_SEED)
    expect(cache.tileAt(-5, -3)).toBe(tileIdAt(WORLD_SEED, -5, -3))
    expect(cache.tileAt(20, -1)).toBe(tileIdAt(WORLD_SEED, 20, -1))
  })

  it('evicts far chunks but never the player chunk', () => {
    const cache = createChunkCache(WORLD_SEED)
    cache.get(0, 0)
    cache.get(5, 0)
    cache.get(-5, -5)
    expect(cache.size()).toBe(3)
    cache.evictFarFrom({ cx: 0, cy: 0 }, 3)
    expect(cache.has(0, 0)).toBe(true)
    expect(cache.has(5, 0)).toBe(false)
    expect(cache.has(-5, -5)).toBe(false)
  })

  it('regenerates identical tiles after eviction', () => {
    const cache = createChunkCache(WORLD_SEED)
    const before = cache.get(2, 2).slice()
    cache.evictFarFrom({ cx: 0, cy: 0 }, 0)
    expect(cache.has(2, 2)).toBe(false)
    expect(cache.get(2, 2)).toEqual(before)
  })
})

describe('WorldProvider', () => {
  it('returns null for non-integer coords and TileId for integers', () => {
    const world = createWorld()
    expect(world.tileAt(1.5, 0)).toBeNull()
    expect(world.tileAt(0, 0.5)).toBeNull()
    expect(world.tileAt(0, 0)).toBe('ground')
  })

  it('isWalkable / isGrass follow tile ids', () => {
    const world = createWorld()
    expect(world.isWalkable(0, 0)).toBe(true)
    expect(world.isGrass(0, 0)).toBe(false)

    // Find a grass or obstacle outside carve for assertions
    let foundGrass = false
    let foundBlocked = false
    for (let y = -30; y <= 30 && (!foundGrass || !foundBlocked); y++) {
      for (let x = -30; x <= 30 && (!foundGrass || !foundBlocked); x++) {
        if (Math.max(Math.abs(x), Math.abs(y)) <= 2) continue
        const t = world.tileAt(x, y)
        if (t === 'grass') {
          expect(world.isGrass(x, y)).toBe(true)
          expect(world.isWalkable(x, y)).toBe(true)
          foundGrass = true
        }
        if (t === 'obstacle') {
          expect(world.isWalkable(x, y)).toBe(false)
          foundBlocked = true
        }
      }
    }
    expect(foundGrass || foundBlocked).toBe(true)
  })

  it('ensureAround warms neighborhood and bounds cache size', () => {
    const world = createWorld({ evictDistance: 3 })
    world.ensureAround({ x: 0, y: 0 })
    // 3×3 neighborhood
    expect(world.cache.size()).toBe(9)

    world.ensureAround({ x: 0, y: 0 })
    // Load a far chunk then ensureAround from origin should evict it
    world.cache.get(10, 10)
    expect(world.cache.has(10, 10)).toBe(true)
    world.ensureAround({ x: 0, y: 0 })
    expect(world.cache.has(10, 10)).toBe(false)
    expect(world.cache.has(0, 0)).toBe(true)
  })

  it('negative world tiles are stable across ensureAround', () => {
    const world = createWorld()
    const a = world.tileAt(-20, -8)
    world.ensureAround({ x: -20, y: -8 })
    world.ensureAround({ x: 100, y: 100 })
    world.ensureAround({ x: -20, y: -8 })
    expect(world.tileAt(-20, -8)).toBe(a)
    expect(a).toBe(tileIdAt(WORLD_SEED, -20, -8))
  })

  it('uses CHUNK_SIZE from config', () => {
    const world = createWorld()
    expect(world.chunkSize).toBe(CHUNK_SIZE)
    expect(world.id).toBe('forest')
  })
})
