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
  // Warm cache so smoke tests skip Boot (D-03) and land on Game via index redirect.
  seedPokeCache()
  hydrateFromStorage()
  window.history.replaceState(null, '', '/')
  window.location.hash = ''
  syncHashBasename(APP_BASENAME)
})

describe('App route smoke', () => {
  it('lands on Game with walk controls', async () => {
    render(<App />)
    expect(
      await screen.findByRole('group', { name: 'Walk controls' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Forest')).not.toBeInTheDocument()
  })

  it('reaches Dex and Settings via BottomNav', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('link', { name: 'Pokédex' }))
    expect(screen.getByRole('heading', { name: /pokédex/i })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Settings' }))
    expect(
      await screen.findByRole('heading', { name: /^settings$/i }),
    ).toBeInTheDocument()
  })
})
