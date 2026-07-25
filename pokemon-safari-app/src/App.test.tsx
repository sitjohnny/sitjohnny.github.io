import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { hydrateFromStorage, resetCacheMemoryForTests } from '@/services/pokeapi/cache'
import { clearPokeCacheKey, seedPokeCache } from '@/test/pokeapi-test-helpers'
import App, { APP_BASENAME, syncHashBasename } from './App'

afterEach(() => {
  cleanup()
  clearPokeCacheKey()
  resetCacheMemoryForTests()
})

beforeEach(() => {
  // Warm cache so smoke tests land on Home (skip Boot — D-03); cold-open covered elsewhere.
  seedPokeCache()
  hydrateFromStorage()
  window.history.replaceState(null, '', '/')
  window.location.hash = ''
  syncHashBasename(APP_BASENAME)
})

describe('App route smoke', () => {
  it('shows Home brand text Pokémon Safari', () => {
    render(<App />)
    expect(screen.getByText('Pokémon Safari')).toBeInTheDocument()
  })

  it('navigates toward Game via Start Safari', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('link', { name: /start safari/i }))
    expect(screen.getByText('Forest')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Walk controls' })).toBeInTheDocument()
  })

  it('reaches Dex, Pack, and Settings via BottomNav', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('link', { name: 'Dex' }))
    expect(screen.getByRole('heading', { name: /pokédex/i })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Pack' }))
    expect(screen.getByRole('heading', { name: /^pack$/i })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Settings' }))
    expect(screen.getByRole('heading', { name: /^settings$/i })).toBeInTheDocument()
  })
})
