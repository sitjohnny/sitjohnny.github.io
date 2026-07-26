import { describe, expect, it } from 'vitest'
import { CHUNK_SIZE, SPAWN_CARVE_RADIUS, WORLD_SEED } from '@/data/worldConfig'
import { generateChunk, tileIdAt } from './generateChunk'
import { noise2D } from './noise'

describe('noise2D', () => {
  it('returns values in [0, 1)', () => {
    for (let i = 0; i < 20; i++) {
      const n = noise2D(WORLD_SEED, i * 0.37, i * 0.11)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
    }
  })

  it('is deterministic for the same seed and sample', () => {
    expect(noise2D(WORLD_SEED, 1.5, 2.5)).toBe(noise2D(WORLD_SEED, 1.5, 2.5))
  })

  it('differs across seeds', () => {
    expect(noise2D(1, 1.5, 2.5)).not.toBe(noise2D(2, 1.5, 2.5))
  })
})

describe('tileIdAt', () => {
  it('is stable for the same seed and coords', () => {
    expect(tileIdAt(WORLD_SEED, 10, -7)).toBe(tileIdAt(WORLD_SEED, 10, -7))
  })

  it('carves a walkable ground region around spawn', () => {
    for (let y = -SPAWN_CARVE_RADIUS; y <= SPAWN_CARVE_RADIUS; y++) {
      for (let x = -SPAWN_CARVE_RADIUS; x <= SPAWN_CARVE_RADIUS; x++) {
        expect(tileIdAt(WORLD_SEED, x, y)).toBe('ground')
      }
    }
  })

  it('can produce non-ground tiles outside the carve', () => {
    const seen = new Set<string>()
    for (let y = -40; y <= 40; y++) {
      for (let x = -40; x <= 40; x++) {
        if (Math.max(Math.abs(x), Math.abs(y)) <= SPAWN_CARVE_RADIUS) {
          continue
        }
        seen.add(tileIdAt(WORLD_SEED, x, y))
      }
    }
    expect(seen.has('grass') || seen.has('obstacle')).toBe(true)
  })
})

describe('generateChunk', () => {
  it('returns chunkSize² tiles in row-major order', () => {
    const tiles = generateChunk(WORLD_SEED, 0, 0, CHUNK_SIZE)
    expect(tiles).toHaveLength(CHUNK_SIZE * CHUNK_SIZE)
    expect(tiles[0]).toBe(tileIdAt(WORLD_SEED, 0, 0))
    expect(tiles[CHUNK_SIZE - 1]).toBe(tileIdAt(WORLD_SEED, CHUNK_SIZE - 1, 0))
    expect(tiles[CHUNK_SIZE]).toBe(tileIdAt(WORLD_SEED, 0, 1))
  })

  it('supports negative chunk coordinates', () => {
    const tiles = generateChunk(WORLD_SEED, -1, -1, CHUNK_SIZE)
    expect(tiles).toHaveLength(CHUNK_SIZE * CHUNK_SIZE)
    const worldX = -1 * CHUNK_SIZE
    const worldY = -1 * CHUNK_SIZE
    expect(tiles[0]).toBe(tileIdAt(WORLD_SEED, worldX, worldY))
  })

  it('matches tileIdAt for every cell', () => {
    const cx = 2
    const cy = -3
    const tiles = generateChunk(WORLD_SEED, cx, cy, CHUNK_SIZE)
    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        expect(tiles[ly * CHUNK_SIZE + lx]).toBe(
          tileIdAt(WORLD_SEED, cx * CHUNK_SIZE + lx, cy * CHUNK_SIZE + ly),
        )
      }
    }
  })
})
