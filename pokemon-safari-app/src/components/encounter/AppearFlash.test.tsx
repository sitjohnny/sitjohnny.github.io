import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppearFlash } from '@/components/encounter/AppearFlash'
import { typeColors } from '@/data/typeColors'
import { makePokemonDto } from '@/test/pokeapi-test-helpers'

vi.mock('@/hooks/useMapCamera', () => ({
  prefersReducedMotion: vi.fn(() => false),
}))

import { prefersReducedMotion } from '@/hooks/useMapCamera'

const prefersReducedMotionMock = vi.mocked(prefersReducedMotion)

const firePokemon = makePokemonDto(4, {
  name: 'charmander',
  types: ['fire', 'flying'],
  sprites: {
    front_default: 'https://example.test/4.png',
    front_shiny: 'https://example.test/s4.png',
    official_artwork: 'https://example.test/art/4.png',
  },
})

afterEach(() => {
  cleanup()
  prefersReducedMotionMock.mockReturnValue(false)
})

describe('AppearFlash', () => {
  it('shows artwork, type badges, and primary type accent', () => {
    render(
      <AppearFlash
        pokemon={firePokemon}
        rarity="common"
        onComplete={vi.fn()}
      />,
    )

    const img = screen.getByRole('img', { name: 'charmander' })
    expect(img).toHaveAttribute('src', 'https://example.test/art/4.png')
    expect(screen.getByText('Fire')).toBeInTheDocument()
    expect(screen.getByText('Flying')).toBeInTheDocument()

    const dialog = screen.getByText(/A wild charmander appeared!/i).closest('.gba-dialog')
    expect(dialog).toHaveAttribute('data-primary-type', 'fire')
    expect(dialog).toHaveStyle({
      borderLeftWidth: '4px',
      borderLeftColor: typeColors.fire,
    })
  })

  it('uses a type-tinted flash wash when motion is allowed', () => {
    prefersReducedMotionMock.mockReturnValue(false)
    const { container } = render(
      <AppearFlash
        pokemon={firePokemon}
        rarity="common"
        onComplete={vi.fn()}
      />,
    )

    const wash = container.querySelector('.encounter-flash')
    expect(wash).not.toBeNull()
    expect(wash).toHaveStyle({ backgroundColor: `${typeColors.fire}33` })
    expect(wash?.className).not.toMatch(/\bbg-white\b/)
  })

  it('omits flash wash when reduced motion is preferred', () => {
    prefersReducedMotionMock.mockReturnValue(true)
    const { container } = render(
      <AppearFlash
        pokemon={firePokemon}
        rarity="common"
        onComplete={vi.fn()}
      />,
    )

    expect(container.querySelector('.encounter-flash')).toBeNull()
    expect(screen.getByText('Fire')).toBeInTheDocument()
  })
})
