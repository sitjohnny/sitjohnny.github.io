import { describe, expect, it } from 'vitest'
import { STEP_DURATION_MS, TILE_PX } from '@/data/exploreConfig'
import type { PlayerState, TileId, TileSource } from '@/types/map'
import { completeStep, offsetTile, tileToPx, tryStep } from './movement'

function sourceFromGrid(
  width: number,
  height: number,
  tiles: TileId[],
): TileSource {
  return {
    id: 'forest',
    tileAt(x, y) {
      if (
        !Number.isInteger(x) ||
        !Number.isInteger(y) ||
        x < 0 ||
        y < 0 ||
        x >= width ||
        y >= height
      ) {
        return null
      }
      return tiles[y * width + x] ?? null
    },
  }
}

const fixture3x3 = sourceFromGrid(3, 3, [
  'obstacle',
  'obstacle',
  'obstacle',
  'obstacle',
  'ground',
  'obstacle',
  'obstacle',
  'obstacle',
  'obstacle',
])

const fixture5x5 = sourceFromGrid(5, 5, [
  'obstacle',
  'obstacle',
  'obstacle',
  'obstacle',
  'obstacle',
  'obstacle',
  'ground',
  'ground',
  'grass',
  'obstacle',
  'obstacle',
  'ground',
  'ground',
  'ground',
  'obstacle',
  'obstacle',
  'obstacle',
  'ground',
  'obstacle',
  'obstacle',
  'obstacle',
  'obstacle',
  'obstacle',
  'obstacle',
  'obstacle',
])

function idleAt(x: number, y: number, facing: PlayerState['facing'] = 'down'): PlayerState {
  return { x, y, facing, moving: false }
}

describe('tryStep', () => {
  it('null intent returns identical state and empty events', () => {
    const state = idleAt(1, 1, 'right')
    const result = tryStep(state, null, fixture3x3, 1000)
    expect(result.next).toBe(state)
    expect(result.events).toEqual([])
    expect(result.tween).toBeUndefined()
  })

  it('turn-in-place updates facing only with no tween or events', () => {
    const state = idleAt(1, 1, 'down')
    const result = tryStep(state, 'left', fixture3x3, 1000)
    expect(result.next).toEqual({ ...state, facing: 'left' })
    expect(result.next).not.toBe(state)
    expect(result.events).toEqual([])
    expect(result.tween).toBeUndefined()
  })

  it('walkable step advances one tile with tween and moving true', () => {
    const state = idleAt(2, 2, 'up')
    const result = tryStep(state, 'up', fixture5x5, 1000)
    expect(result.next).toEqual({ x: 2, y: 1, facing: 'up', moving: true })
    expect(result.tween).toEqual({
      from: tileToPx({ x: 2, y: 2 }),
      to: tileToPx({ x: 2, y: 1 }),
      durationMs: STEP_DURATION_MS,
    })
    expect(result.events).toEqual([])
  })

  it('obstacle reject leaves tile unchanged with no tween or events', () => {
    const state = idleAt(1, 1, 'up')
    const result = tryStep(state, 'up', fixture3x3, 1000)
    expect(result.next).toEqual({ x: 1, y: 1, facing: 'up', moving: false })
    expect(result.events).toEqual([])
    expect(result.tween).toBeUndefined()
  })

  it('move-lock while moving ignores intent', () => {
    const state: PlayerState = { x: 2, y: 2, facing: 'right', moving: true }
    const result = tryStep(state, 'right', fixture5x5, 1000)
    expect(result.next).toBe(state)
    expect(result.events).toEqual([])
    expect(result.tween).toBeUndefined()
  })

  it('grass emission returns exactly one encounter_candidate at destination', () => {
    const state = idleAt(2, 1, 'right')
    const result = tryStep(state, 'right', fixture5x5, 4242)
    expect(result.next).toEqual({ x: 3, y: 1, facing: 'right', moving: true })
    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toEqual({
      type: 'encounter_candidate',
      biome: 'forest',
      x: 3,
      y: 1,
      at: 4242,
    })
  })

  it('ground step returns zero events', () => {
    const state = idleAt(1, 2, 'right')
    const result = tryStep(state, 'right', fixture5x5, 1000)
    expect(result.next.x).toBe(2)
    expect(result.next.y).toBe(2)
    expect(result.events).toEqual([])
  })

  it('missing tile reject leaves tile unchanged like an obstacle', () => {
    const openEdge = sourceFromGrid(2, 1, ['ground', 'ground'])
    const state = idleAt(1, 0, 'right')
    const result = tryStep(state, 'right', openEdge, 1000)
    expect(result.next).toEqual({ x: 1, y: 0, facing: 'right', moving: false })
    expect(result.events).toEqual([])
    expect(result.tween).toBeUndefined()
  })
})

describe('completeStep', () => {
  it('clears moving while preserving tile and facing', () => {
    const state: PlayerState = { x: 3, y: 4, facing: 'left', moving: true }
    expect(completeStep(state)).toEqual({ x: 3, y: 4, facing: 'left', moving: false })
  })
})

describe('offsetTile and tileToPx', () => {
  it('offsetTile returns the correct delta for all four directions', () => {
    const pos = { x: 5, y: 5 }
    expect(offsetTile(pos, 'up')).toEqual({ x: 5, y: 4 })
    expect(offsetTile(pos, 'down')).toEqual({ x: 5, y: 6 })
    expect(offsetTile(pos, 'left')).toEqual({ x: 4, y: 5 })
    expect(offsetTile(pos, 'right')).toEqual({ x: 6, y: 5 })
  })

  it('tileToPx multiplies by TILE_PX', () => {
    expect(tileToPx({ x: 2, y: 3 })).toEqual({ x: 2 * TILE_PX, y: 3 * TILE_PX })
  })
})
