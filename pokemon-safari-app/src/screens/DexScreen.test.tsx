import { MemoryRouter } from 'react-router-dom'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BottomNav } from '@/components/BottomNav'
import { hydrateFromStorage, resetCacheMemoryForTests } from '@/services/pokeapi/cache'
import { SAVE_KEY } from '@/services/pokeapi/keys'
import { DexScreen } from '@/screens/DexScreen'
import { useUiStore } from '@/store'
import { useDexStore } from '@/store/dexStore'
import { clearPokeCacheKey, makePokemonDto, seedPokeCache } from '@/test/pokeapi-test-helpers'

function resetDexForTests() {
  useDexStore.setState({ dex: {}, saveSoftFail: false })
  useDexStore.getState().flushNow()
  localStorage.removeItem(SAVE_KEY)
}

afterEach(() => {
  cleanup()
  clearPokeCacheKey()
  resetCacheMemoryForTests()
  useUiStore.setState({ dexSheetOpen: false })
  resetDexForTests()
})

beforeEach(() => {
  clearPokeCacheKey()
  resetCacheMemoryForTests()
  useUiStore.setState({ dexSheetOpen: false })
  resetDexForTests()
  seedPokeCache(
    Array.from({ length: 151 }, (_, i) =>
      makePokemonDto(i + 1, {
        name: i + 1 === 25 ? 'pikachu' : `p${i + 1}`,
      }),
    ),
  )
  hydrateFromStorage()
})

function renderDex() {
  return render(
    <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/dex']}>
      <DexScreen />
    </MemoryRouter>,
  )
}

function renderDexWithNav() {
  return render(
    <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/dex']}>
      <DexScreen />
      <BottomNav />
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

  it('marks Main nav inert while the stub sheet is open and clears it after Close', async () => {
    const user = userEvent.setup()
    renderDexWithNav()

    const tile = screen.getByRole('button', { name: /Pokémon #025/i })
    await user.click(tile)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    const navOpen = document.querySelector('nav[aria-label="Main"]')
    expect(navOpen).not.toBeNull()
    expect(navOpen!.hasAttribute('inert')).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    const navClosed = document.querySelector('nav[aria-label="Main"]')
    expect(navClosed).not.toBeNull()
    expect(navClosed!.hasAttribute('inert')).toBe(false)
  })

  it('seeded catch lifts silhouette and increments Caught counter (DEX-01)', () => {
    useDexStore.setState({
      dex: {
        '25': {
          seen: true,
          catchCount: 1,
          firstEncounteredAt: '2026-01-01T00:00:00.000Z',
          firstCapturedAt: '2026-01-01T00:00:00.000Z',
          shinyOwned: false,
        },
      },
      saveSoftFail: false,
    })
    renderDex()

    expect(screen.getByText(/Seen 1\/151\s*·\s*Caught 1\/151/)).toBeInTheDocument()
    const tile = screen.getByRole('button', { name: /#025 Pikachu/i })
    const img = within(tile).getByRole('img')
    expect(img.className).not.toMatch(/sprite-silhouette/)
    expect(img).toHaveAttribute('src', 'https://example.test/25.png')
  })
})
