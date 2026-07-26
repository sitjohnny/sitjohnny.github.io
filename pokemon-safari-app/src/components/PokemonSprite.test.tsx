import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PokemonSprite } from '@/components/PokemonSprite'

afterEach(() => {
  cleanup()
})

/** Minimal v3 PokemonDto fixture (pixel + official_artwork). */
const sample = {
  id: 25,
  name: 'pikachu',
  types: ['electric'],
  height: 4,
  weight: 60,
  sprites: {
    front_default: 'https://example.test/25.png',
    front_shiny: 'https://example.test/s25.png',
    official_artwork: 'https://example.test/art25.png',
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

  it('default variant uses pixel front_default URL', () => {
    render(<PokemonSprite pokemon={sample} alt="Pikachu" />)
    expect(screen.getByRole('img', { name: 'Pikachu' })).toHaveAttribute(
      'src',
      'https://example.test/25.png',
    )
  })

  it('variant="artwork" uses official_artwork URL', () => {
    render(<PokemonSprite pokemon={sample} variant="artwork" alt="Pikachu" />)
    expect(screen.getByRole('img', { name: 'Pikachu' })).toHaveAttribute(
      'src',
      'https://example.test/art25.png',
    )
  })

  it('shiny with variant artwork still uses shiny pixel URL', () => {
    render(
      <PokemonSprite pokemon={sample} shiny variant="artwork" alt="Shiny Pikachu" />,
    )
    expect(screen.getByRole('img', { name: 'Shiny Pikachu' })).toHaveAttribute(
      'src',
      'https://example.test/s25.png',
    )
  })

  it('artwork null falls back to front_default', () => {
    const noArt = {
      ...sample,
      sprites: { ...sample.sprites, official_artwork: null as string | null },
    }
    render(<PokemonSprite pokemon={noArt} variant="artwork" alt="Pikachu" />)
    expect(screen.getByRole('img', { name: 'Pikachu' })).toHaveAttribute(
      'src',
      'https://example.test/25.png',
    )
  })

  it('size={128} sets width and height 128', () => {
    render(<PokemonSprite pokemon={sample} alt="Pikachu" size={128} />)
    const img = screen.getByRole('img', { name: 'Pikachu' })
    expect(img).toHaveAttribute('width', '128')
    expect(img).toHaveAttribute('height', '128')
  })
})
