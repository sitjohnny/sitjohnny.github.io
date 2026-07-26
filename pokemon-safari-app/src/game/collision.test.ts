import { describe, expect, it } from 'vitest'
import { forestMap } from '@/data/maps/forest'
import type { MapDef, TileSource } from '@/types/map'
import { asTileSource, isGrass, isValidMap, isWalkable, mapTileAt, tileAt } from './collision'
import { createWorld } from './world/worldProvider'

const sample: MapDef = {
  id: 'forest',
  width: 3,
  height: 2,
  tiles: ['ground', 'grass', 'obstacle', 'obstacle', 'ground', 'grass'],
  spawn: { x: 0, y: 0 },
}

const sampleSource = asTileSource(sample)

function gridSource(tiles: Record<string, 'ground' | 'grass' | 'obstacle'>): TileSource {
  return {
    id: 'forest',
    tileAt(x, y) {
      if (!Number.isInteger(x) || !Number.isInteger(y)) return null
      return tiles[`${x},${y}`] ?? null
    },
  }
}

describe('asTileSource / mapTileAt', () => {
  it('returns the expected TileId using row-major indexing', () => {
    expect(mapTileAt(sample, 2, 0)).toBe('obstacle')
    expect(tileAt(sampleSource, 1, 0)).toBe('grass')
    expect(tileAt(sampleSource, 0, 1)).toBe('obstacle')
  })

  it('returns null for out-of-bounds and non-integer coordinates', () => {
    expect(tileAt(sampleSource, -1, 0)).toBeNull()
    expect(tileAt(sampleSource, 0, -1)).toBeNull()
    expect(tileAt(sampleSource, 3, 0)).toBeNull()
    expect(tileAt(sampleSource, 0, 2)).toBeNull()
    expect(tileAt(sampleSource, 1.5, 0)).toBeNull()
    expect(tileAt(sampleSource, 0, 0.5)).toBeNull()
  })
})

describe('isWalkable', () => {
  it('is true for ground and grass, false for obstacle and missing tiles', () => {
    expect(isWalkable(sampleSource, 0, 0)).toBe(true)
    expect(isWalkable(sampleSource, 1, 0)).toBe(true)
    expect(isWalkable(sampleSource, 2, 0)).toBe(false)
    expect(isWalkable(sampleSource, -1, 0)).toBe(false)
    expect(isWalkable(sampleSource, 0, 99)).toBe(false)
  })

  it('works with an infinite WorldProvider', () => {
    const world = createWorld()
    expect(isWalkable(world, 0, 0)).toBe(true)
  })
})

describe('isGrass', () => {
  it('is true only for grass tiles', () => {
    expect(isGrass(sampleSource, 1, 0)).toBe(true)
    expect(isGrass(sampleSource, 0, 0)).toBe(false)
    expect(isGrass(sampleSource, 2, 0)).toBe(false)
    expect(isGrass(sampleSource, -1, 0)).toBe(false)
  })
})

describe('isValidMap', () => {
  it('accepts the authored forestMap', () => {
    expect(isValidMap(forestMap)).toBe(true)
  })

  it('rejects a tiles length off by one', () => {
    expect(
      isValidMap({
        ...forestMap,
        tiles: forestMap.tiles.slice(0, -1),
      }),
    ).toBe(false)
  })

  it('rejects an unknown tile string', () => {
    const bad = {
      ...sample,
      tiles: ['ground', 'grass', 'water', 'obstacle', 'ground', 'grass'],
    } as unknown as MapDef
    expect(isValidMap(bad)).toBe(false)
  })

  it('rejects a spawn outside bounds', () => {
    expect(isValidMap({ ...sample, spawn: { x: 99, y: 0 } })).toBe(false)
  })

  it('rejects a spawn on an obstacle tile', () => {
    expect(isValidMap({ ...sample, spawn: { x: 2, y: 0 } })).toBe(false)
  })

  it('rejects zero or negative dimensions', () => {
    expect(isValidMap({ ...sample, width: 0 })).toBe(false)
    expect(isValidMap({ ...sample, height: -1 })).toBe(false)
  })
})

describe('forestMap', () => {
  it('has tiles.length === width * height and a walkable spawn', () => {
    expect(forestMap.tiles.length).toBe(forestMap.width * forestMap.height)
    expect(forestMap.tiles.length).toBe(300)
    expect(isWalkable(asTileSource(forestMap), forestMap.spawn.x, forestMap.spawn.y)).toBe(true)
    expect(mapTileAt(forestMap, forestMap.spawn.x, forestMap.spawn.y)).toBe('ground')
  })
})

describe('sparse TileSource', () => {
  it('treats missing cells as non-walkable', () => {
    const source = gridSource({ '0,0': 'ground', '1,0': 'grass' })
    expect(isWalkable(source, 0, 0)).toBe(true)
    expect(isWalkable(source, 2, 0)).toBe(false)
  })
})
