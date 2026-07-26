import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { useRef } from 'react'
import { TerrainCanvas } from './TerrainCanvas'
import type { TileImages } from '@/game/world/drawTerrain'

function Harness() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imagesRef = useRef<TileImages>({})
  return <TerrainCanvas canvasRef={canvasRef} imagesRef={imagesRef} />
}

describe('TerrainCanvas', () => {
  it('mounts a canvas with the terrain test id', () => {
    const { getByTestId } = render(<Harness />)
    const canvas = getByTestId('terrain-canvas')
    expect(canvas.tagName).toBe('CANVAS')
  })
})
