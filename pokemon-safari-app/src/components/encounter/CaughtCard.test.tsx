import userEvent from '@testing-library/user-event'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CaughtCard } from '@/components/encounter/CaughtCard'
import { captureCopy } from '@/data/educationConfig'
import { typeColors } from '@/data/typeColors'
import { makePokemonDto } from '@/test/pokeapi-test-helpers'

const grassPokemon = makePokemonDto(1, {
  name: 'bulbasaur',
  types: ['grass', 'poison'],
  sprites: {
    front_default: 'https://example.test/1.png',
    front_shiny: 'https://example.test/s1.png',
    official_artwork: 'https://example.test/art/1.png',
  },
})

afterEach(cleanup)

describe('CaughtCard', () => {
  it('shows artwork, type badges, and primary type accent', () => {
    render(<CaughtCard pokemon={grassPokemon} onContinue={vi.fn()} />)

    const img = screen.getByRole('img', { name: 'bulbasaur' })
    expect(img).toHaveAttribute('src', 'https://example.test/art/1.png')
    expect(screen.getByText('Grass')).toBeInTheDocument()
    expect(screen.getByText('Poison')).toBeInTheDocument()

    const dialog = screen.getByRole('heading', { name: captureCopy.gotchaHeading }).closest(
      '.gba-dialog',
    )
    expect(dialog).toHaveAttribute('data-primary-type', 'grass')
    expect(dialog).toHaveStyle({
      borderLeftWidth: '4px',
      borderLeftColor: typeColors.grass,
    })
  })

  it('calls onContinue from the primary button', async () => {
    const onContinue = vi.fn()
    const user = userEvent.setup()
    render(<CaughtCard pokemon={grassPokemon} onContinue={onContinue} />)

    await user.click(screen.getByRole('button', { name: captureCopy.continueCta }))
    expect(onContinue).toHaveBeenCalledOnce()
  })
})
