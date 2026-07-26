import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TileWorld } from '@/components/map/TileWorld'
import type { MapDef } from '@/types/map'

afterEach(() => {
  cleanup()
})

/** Tiny map with at least one of each TileId for src distinctness checks. */
const sampleMap: MapDef = {
  id: 'forest',
  width: 3,
  height: 1,
  tiles: ['ground', 'grass', 'obstacle'],
  spawn: { x: 0, y: 0 },
}

describe('TileWorld image-tile contract (MAP-02 / UI-SPEC D10)', () => {
  it('renders one pixelated img per map tile with aria-hidden root', () => {
    const { container } = render(<TileWorld map={sampleMap} />)

    const root = container.querySelector('[aria-hidden="true"]')
    expect(root).not.toBeNull()
    expect(root).toHaveAttribute('aria-hidden', 'true')

    const imgs = container.querySelectorAll('img')
    expect(imgs).toHaveLength(sampleMap.tiles.length)

    for (const img of imgs) {
      expect(img.className).toMatch(/pixelated/)
      expect(img.getAttribute('alt')).toBe('')
    }
  })

  it('uses distinct Vite-resolved srcs for ground, grass, and obstacle', () => {
    const { container } = render(<TileWorld map={sampleMap} />)
    const imgs = Array.from(container.querySelectorAll('img'))
    expect(imgs).toHaveLength(3)

    const groundSrc = imgs[0].getAttribute('src')
    const grassSrc = imgs[1].getAttribute('src')
    const obstacleSrc = imgs[2].getAttribute('src')

    expect(groundSrc).toBeTruthy()
    expect(grassSrc).toBeTruthy()
    expect(obstacleSrc).toBeTruthy()
    expect(grassSrc).not.toEqual(groundSrc)
    expect(obstacleSrc).not.toEqual(groundSrc)
    expect(obstacleSrc).not.toEqual(grassSrc)
  })

  it('does not paint terrain with inline backgroundColor alone', () => {
    const { container } = render(<TileWorld map={sampleMap} />)
    const imgs = container.querySelectorAll('img')
    expect(imgs.length).toBe(sampleMap.tiles.length)

    // Terrain must be image-based — no CSS hex fill as the sole paint.
    const paintedOnly = container.querySelectorAll('[style*="background"]')
    expect(paintedOnly.length).toBe(0)
  })
})
