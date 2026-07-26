import { describe, expect, it } from 'vitest'
import { clamp, updateCamera, worldTranslate } from './camera'

describe('clamp', () => {
  it('returns the value inside range, the min below range, and the max above range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(99, 0, 10)).toBe(10)
  })
})

describe('updateCamera', () => {
  const target = { x: 480, y: 480 }
  const origin = { x: 0, y: 0 }

  it('eases toward the target without reaching it in one frame', () => {
    const result = updateCamera(origin, target, 16)
    expect(result.x).toBeGreaterThan(0)
    expect(result.x).toBeLessThan(480)
    expect(result.y).toBeGreaterThan(0)
    expect(result.y).toBeLessThan(480)
  })

  it('moves further with a larger dtMs (frame-rate independence)', () => {
    const slow = updateCamera(origin, target, 16)
    const fast = updateCamera(origin, target, 100)
    const distSlow = Math.hypot(target.x - slow.x, target.y - slow.y)
    const distFast = Math.hypot(target.x - fast.x, target.y - fast.y)
    expect(distFast).toBeLessThan(distSlow)
  })

  it('converges within 1px of the target after many frames', () => {
    let cam = { ...origin }
    for (let i = 0; i < 200; i += 1) {
      cam = updateCamera(cam, target, 16)
    }
    expect(Math.abs(cam.x - target.x)).toBeLessThan(1)
    expect(Math.abs(cam.y - target.y)).toBeLessThan(1)
  })

  it('returns the camera unchanged when dtMs is 0', () => {
    const cam = { x: 100, y: 200 }
    const result = updateCamera(cam, target, 0)
    expect(result).toEqual(cam)
    expect(result).toBe(cam)
  })

  it('follows targets far from the origin without clamping', () => {
    const far = { x: 50_000, y: -40_000 }
    let cam = { x: 0, y: 0 }
    for (let i = 0; i < 300; i += 1) {
      cam = updateCamera(cam, far, 16)
    }
    expect(Math.abs(cam.x - far.x)).toBeLessThan(1)
    expect(Math.abs(cam.y - far.y)).toBeLessThan(1)
  })

  it('can sit at the player near the world origin (no half-view floor)', () => {
    let cam = { x: 100, y: 100 }
    const nearTarget = { x: 24, y: 24 }
    for (let i = 0; i < 200; i += 1) {
      cam = updateCamera(cam, nearTarget, 16)
    }
    expect(Math.abs(cam.x - nearTarget.x)).toBeLessThan(1)
    expect(Math.abs(cam.y - nearTarget.y)).toBeLessThan(1)
  })

  it('does not mutate the input cam object', () => {
    const cam = { x: 10, y: 20 }
    updateCamera(cam, target, 16)
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
