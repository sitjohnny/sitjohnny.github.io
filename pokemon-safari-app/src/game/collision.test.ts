import { describe, expect, it } from 'vitest'
import { forestMap } from '@/data/maps/forest'
import type { MapDef } from '@/types/map'
import { isGrass, isWalkable, tileAt } from './collision'

const sample: MapDef = {
  id: 'forest',
  width: 3,
  height: 2,
  tiles: ['ground', 'grass', 'obstacle', 'obstacle', 'ground', 'grass'],
  spawn: { x: 0, y: 0 },
}

describe('tileAt', () => {
  it('returns the expected TileId using row-major indexing', () => {
    // x !== y so a transposed index would fail: (2, 0) → tiles[0*3+2] = obstacle
    expect(tileAt(sample, 2, 0)).toBe('obstacle')
    expect(tileAt(sample, 1, 0)).toBe('grass')
    expect(tileAt(sample, 0, 1)).toBe('obstacle')
  })

  it('returns null for out-of-bounds and non-integer coordinates', () => {
    expect(tileAt(sample, -1, 0)).toBeNull()
    expect(tileAt(sample, 0, -1)).toBeNull()
    expect(tileAt(sample, 3, 0)).toBeNull()
    expect(tileAt(sample, 0, 2)).toBeNull()
    expect(tileAt(sample, 1.5, 0)).toBeNull()
    expect(tileAt(sample, 0, 0.5)).toBeNull()
  })
})

describe('isWalkable', () => {
  it('is true for ground and grass, false for obstacle and out of bounds', () => {
    expect(isWalkable(sample, 0, 0)).toBe(true)
    expect(isWalkable(sample, 1, 0)).toBe(true)
    expect(isWalkable(sample, 2, 0)).toBe(false)
    expect(isWalkable(sample, -1, 0)).toBe(false)
    expect(isWalkable(sample, 0, 99)).toBe(false)
  })
})

describe('isGrass', () => {
  it('is true only for grass tiles and false out of bounds', () => {
    expect(isGrass(sample, 1, 0)).toBe(true)
    expect(isGrass(sample, 0, 0)).toBe(false)
    expect(isGrass(sample, 2, 0)).toBe(false)
    expect(isGrass(sample, -1, 0)).toBe(false)
  })
})

describe('forestMap', () => {
  it('has tiles.length === width * height and a walkable spawn', () => {
    expect(forestMap.tiles.length).toBe(forestMap.width * forestMap.height)
    expect(forestMap.tiles.length).toBe(300)
    expect(isWalkable(forestMap, forestMap.spawn.x, forestMap.spawn.y)).toBe(true)
    expect(tileAt(forestMap, forestMap.spawn.x, forestMap.spawn.y)).toBe('ground')
  })
})
