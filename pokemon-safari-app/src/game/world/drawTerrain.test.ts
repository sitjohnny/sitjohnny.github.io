import { describe, expect, it, vi } from 'vitest'
import { TILE_PX } from '@/data/exploreConfig'
import { createWorld } from './worldProvider'
import { drawTerrain } from './drawTerrain'

function mockCtx() {
  return {
    imageSmoothingEnabled: true,
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: '',
  }
}

describe('drawTerrain', () => {
  it('clears the canvas and disables image smoothing', () => {
    const world = createWorld()
    const ctx = mockCtx()
    drawTerrain(ctx as unknown as CanvasRenderingContext2D, world, { x: 24, y: 24 }, { w: 96, h: 96 })
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 96, 96)
    expect(ctx.imageSmoothingEnabled).toBe(false)
  })

  it('fills fallback colors when images are missing', () => {
    const world = createWorld()
    const ctx = mockCtx()
    drawTerrain(
      ctx as unknown as CanvasRenderingContext2D,
      world,
      { x: TILE_PX / 2, y: TILE_PX / 2 },
      { w: TILE_PX, h: TILE_PX },
    )
    expect(ctx.fillRect.mock.calls.length).toBeGreaterThan(0)
  })

  it('uses drawImage when a tile image is provided', () => {
    const world = createWorld()
    const ctx = mockCtx()
    const img = {} as CanvasImageSource
    drawTerrain(
      ctx as unknown as CanvasRenderingContext2D,
      world,
      { x: TILE_PX / 2, y: TILE_PX / 2 },
      { w: TILE_PX, h: TILE_PX },
      { ground: img, grass: img, obstacle: img },
    )
    expect(ctx.drawImage.mock.calls.length).toBeGreaterThan(0)
    expect(ctx.fillRect).not.toHaveBeenCalled()
  })

  it('no-ops when the view has zero size', () => {
    const world = createWorld()
    const ctx = mockCtx()
    drawTerrain(ctx as unknown as CanvasRenderingContext2D, world, { x: 0, y: 0 }, { w: 0, h: 100 })
    expect(ctx.clearRect).not.toHaveBeenCalled()
  })
})
