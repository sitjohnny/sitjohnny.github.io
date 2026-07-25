import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PokemonSprite } from '@/components/PokemonSprite'

afterEach(() => {
  cleanup()
})

/** Slim DTO shape matching `@/types/pokemon` PokemonDto (Wave 0 local until types land). */
const sample = {
  id: 25,
  name: 'pikachu',
  types: ['electric'],
  sprites: {
    front_default: 'https://example.test/25.png',
    front_shiny: 'https://example.test/s25.png',
  },
}

describe('PokemonSprite (D-07, D-08, D-09)', () => {
  it('renders img with pixelated class and default front_default URL', () => {
    render(<PokemonSprite pokemon={sample} alt="Pikachu" size={96} />)
    const img = screen.getByRole('img', { name: 'Pikachu' })
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveClass('pixelated')
    expect(img).toHaveAttribute('src', 'https://example.test/25.png')
  })

  it('shiny=true uses front_shiny URL', () => {
    render(<PokemonSprite pokemon={sample} shiny alt="Shiny Pikachu" size={96} />)
    const img = screen.getByRole('img', { name: 'Shiny Pikachu' })
    expect(img).toHaveAttribute('src', 'https://example.test/s25.png')
    expect(img).toHaveClass('pixelated')
  })

  it('onError or null src shows role=img placeholder same size', () => {
    const missing = {
      ...sample,
      sprites: { front_default: null as string | null, front_shiny: null as string | null },
    }
    const { rerender } = render(
      <PokemonSprite pokemon={missing} alt="Missing" size={64} />,
    )
    const placeholder = screen.getByRole('img', { name: 'Missing' })
    expect(placeholder.tagName).not.toBe('IMG')
    expect(placeholder).toHaveStyle({ width: '64px', height: '64px' })

    rerender(<PokemonSprite pokemon={sample} alt="Broken" size={64} />)
    const img = screen.getByRole('img', { name: 'Broken' })
    fireEvent.error(img)
    const fallback = screen.getByRole('img', { name: 'Broken' })
    expect(fallback.tagName).not.toBe('IMG')
    expect(fallback).toHaveStyle({ width: '64px', height: '64px' })
  })
})
