import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetCacheMemoryForTests } from '@/services/pokeapi/cache'
import { GameScreen } from '@/screens/GameScreen'
import { HomeScreen } from '@/screens/HomeScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
import { useUiStore } from '@/store'
import { clearPokeCacheKey } from '@/test/pokeapi-test-helpers'

beforeEach(() => {
  clearPokeCacheKey()
  resetCacheMemoryForTests()
  useUiStore.setState({ cacheReady: false })
})

afterEach(() => {
  cleanup()
  clearPokeCacheKey()
  resetCacheMemoryForTests()
  useUiStore.setState({ cacheReady: false })
})

describe('GameScreen cache gate (D-02)', () => {
  it('when cache not ready, shows Safari is still packing… and See progress toward /boot', () => {
    render(
      <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/game']}>
        <Routes>
          <Route path="/game" element={<GameScreen />} />
          <Route path="/boot" element={<div>Boot route</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Safari is still packing…')).toBeInTheDocument()
    const cta = screen.getByRole('link', { name: 'See progress' })
    expect(cta).toHaveAttribute('href', expect.stringContaining('/boot'))
  })

  it('Home and Settings remain reachable outside the Game-only gate', () => {
    render(
      <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/']}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/game" element={<GameScreen />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Pokémon Safari')).toBeInTheDocument()
    expect(screen.queryByText('Safari is still packing…')).not.toBeInTheDocument()
  })
})
