import { describe, expect, it } from 'vitest'
import { TILE_PX } from '@/data/exploreConfig'
import { forestMap } from '@/data/maps/forest'
import type { MapDef } from '@/types/map'
import { clamp, mapPixelSize, updateCamera, worldTranslate } from './camera'

const largeMap: MapDef = {
  id: 'forest',
  width: 40,
  height: 40,
  tiles: Array.from({ length: 40 * 40 }, () => 'ground' as const),
  spawn: { x: 20, y: 20 },
}

const letterboxMap: MapDef = {
  id: 'forest',
  width: 10,
  height: 10,
  tiles: Array.from({ length: 10 * 10 }, () => 'ground' as const),
  spawn: { x: 5, y: 5 },
}

describe('mapPixelSize', () => {
  it('returns forest map dimensions in pixels', () => {
    expect(mapPixelSize(forestMap)).toEqual({
      w: forestMap.width * TILE_PX,
      h: forestMap.height * TILE_PX,
    })
  })
})

describe('clamp', () => {
  it('returns the value inside range, the min below range, and the max above range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(99, 0, 10)).toBe(10)
  })
})

describe('updateCamera', () => {
  const view = { w: 320, h: 320 }
  const mapPx = mapPixelSize(largeMap)
  const target = { x: 480, y: 480 }
  const origin = { x: 0, y: 0 }

  it('eases toward the target without reaching it in one frame', () => {
    const result = updateCamera(origin, target, mapPx, view, 16)
    expect(result.x).toBeGreaterThan(0)
    expect(result.x).toBeLessThan(480)
    expect(result.y).toBeGreaterThan(0)
    expect(result.y).toBeLessThan(480)
  })

  it('moves further with a larger dtMs (frame-rate independence)', () => {
    const slow = updateCamera(origin, target, mapPx, view, 16)
    const fast = updateCamera(origin, target, mapPx, view, 100)
    const distSlow = Math.hypot(target.x - slow.x, target.y - slow.y)
    const distFast = Math.hypot(target.x - fast.x, target.y - fast.y)
    expect(distFast).toBeLessThan(distSlow)
  })

  it('converges within 1px of the target after many frames', () => {
    let cam = { ...origin }
    for (let i = 0; i < 200; i += 1) {
      cam = updateCamera(cam, target, mapPx, view, 16)
    }
    expect(Math.abs(cam.x - target.x)).toBeLessThan(1)
    expect(Math.abs(cam.y - target.y)).toBeLessThan(1)
  })

  it('returns the camera unchanged when dtMs is 0', () => {
    const cam = { x: 100, y: 200 }
    const result = updateCamera(cam, target, mapPx, view, 0)
    expect(result).toEqual(cam)
    expect(result).toBe(cam)
  })

  it('clamps at the near edge so half-view is the minimum centre', () => {
    let cam = { x: 0, y: 0 }
    const nearTarget = { x: 0, y: 0 }
    for (let i = 0; i < 200; i += 1) {
      cam = updateCamera(cam, nearTarget, mapPx, view, 16)
    }
    expect(cam).toEqual({ x: 160, y: 160 })
  })

  it('clamps at the far edge to mapPx minus half-view', () => {
    const farTarget = { x: mapPx.w, y: mapPx.h }
    let cam = { x: mapPx.w / 2, y: mapPx.h / 2 }
    for (let i = 0; i < 200; i += 1) {
      cam = updateCamera(cam, farTarget, mapPx, view, 16)
    }
    expect(cam.x).toBeCloseTo(mapPx.w - 160, 5)
    expect(cam.y).toBeCloseTo(mapPx.h - 160, 5)
  })

  it('letterboxes stably when the map is smaller than the view', () => {
    const smallPx = mapPixelSize(letterboxMap)
    const bigView = { w: 1000, h: 1000 }
    const half = 500
    const expectedX = Math.max(half, smallPx.w - half)
    const expectedY = Math.max(half, smallPx.h - half)
    let cam = { x: smallPx.w / 2, y: smallPx.h / 2 }
    const samples: Array<{ x: number; y: number }> = []
    for (let i = 0; i < 40; i += 1) {
      cam = updateCamera(cam, { x: smallPx.w / 2, y: smallPx.h / 2 }, smallPx, bigView, 16)
      samples.push({ ...cam })
    }
    for (const sample of samples) {
      expect(sample.x).toBe(expectedX)
      expect(sample.y).toBe(expectedY)
    }
  })

  it('does not mutate the input cam object', () => {
    const cam = { x: 10, y: 20 }
    updateCamera(cam, target, mapPx, view, 16)
    expect(cam).toEqual({ x: 10, y: 20 })
  })
})

describe('worldTranslate', () => {
  it('returns zero translation when the camera is at viewport centre', () => {
    expect(worldTranslate({ x: 160, y: 160 }, { w: 320, h: 320 })).toEqual({ x: 0, y: 0 })
  })

  it('yields a negative x when the camera is right of centre', () => {
    const t = worldTranslate({ x: 200, y: 160 }, { w: 320, h: 320 })
    expect(t.x).toBeLessThan(0)
    expect(t.y).toBe(0)
  })
})
