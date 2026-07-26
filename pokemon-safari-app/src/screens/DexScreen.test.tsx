import { MemoryRouter } from 'react-router-dom'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DexScreen } from '@/screens/DexScreen'
import { clearPokeCacheKey, makePokemonDto, seedPokeCache } from '@/test/pokeapi-test-helpers'

afterEach(() => {
  cleanup()
  clearPokeCacheKey()
})

beforeEach(() => {
  seedPokeCache(
    Array.from({ length: 151 }, (_, i) =>
      makePokemonDto(i + 1, {
        name: i + 1 === 25 ? 'pikachu' : `p${i + 1}`,
      }),
    ),
  )
})

function renderDex() {
  return render(
    <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/dex']}>
      <DexScreen />
    </MemoryRouter>,
  )
}

describe('DexScreen browse + stub sheet (DEX-03)', () => {
  it('renders Pokédex heading and Seen 0/151 · Caught 0/151', () => {
    renderDex()
    expect(screen.getByRole('heading', { name: 'Pokédex' })).toBeInTheDocument()
    expect(screen.getByText(/Seen 0\/151\s*·\s*Caught 0\/151/)).toBeInTheDocument()
  })

  it('renders 151 tile buttons and no EmptyState placeholder', () => {
    renderDex()
    const tiles = screen.getAllByRole('button').filter((el) =>
      /Pokémon #\d{3}|#\d{3}/.test(el.getAttribute('aria-label') ?? el.textContent ?? ''),
    )
    expect(tiles.length).toBe(151)
    expect(screen.queryByText('Safari isn’t ready yet')).not.toBeInTheDocument()
  })

  it('tap uncaught opens dialog with ??? and Not caught yet; Close dismisses', async () => {
    const user = userEvent.setup()
    renderDex()

    const tile =
      screen.queryByRole('button', { name: /Pokémon #025/i }) ??
      screen.getByRole('button', { name: /#025/ })
    await user.click(tile)

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('???')).toBeInTheDocument()
    expect(
      within(dialog).getByText(
        'Not caught yet. Catch one in the grass to reveal this entry.',
      ),
    ).toBeInTheDocument()
    expect(within(dialog).queryByText(/pikachu/i)).not.toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
