import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CACHE_KEY, EDU_STATS_KEY, SAVE_KEY } from '@/services/pokeapi/keys'
import { persistSave } from '@/services/save'
import { useDexStore } from '@/store/dexStore'
import { useExploreStore } from '@/store/exploreStore'
import { eraseProgress, SettingsScreen } from './SettingsScreen'

const SEEDED_CACHE = JSON.stringify({
  version: 1,
  fetchedAt: '2026-01-01T00:00:00.000Z',
  pokemon: [{ id: 1, name: 'bulbasaur' }],
})

beforeEach(() => {
  localStorage.setItem(CACHE_KEY, SEEDED_CACHE)
  localStorage.setItem(
    EDU_STATS_KEY,
    JSON.stringify({ version: 1, facts: { '7x8': { correct: 1, incorrect: 0 } } }),
  )
  persistSave({
    dex: {
      '25': {
        seen: true,
        firstEncounteredAt: '2026-07-26T12:00:00.000Z',
        firstCapturedAt: null,
        catchCount: 0,
        shinyOwned: false,
      },
    },
    explore: { x: 4, y: 5, facing: 'up' },
  })
  useDexStore.setState({
    dex: {
      '25': {
        seen: true,
        firstEncounteredAt: '2026-07-26T12:00:00.000Z',
        firstCapturedAt: null,
        catchCount: 0,
        shinyOwned: false,
      },
    },
  })
  useExploreStore.setState({ tile: { x: 4, y: 5 }, facing: 'up' })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.removeItem(SAVE_KEY)
  localStorage.removeItem(EDU_STATS_KEY)
  localStorage.removeItem(CACHE_KEY)
})

describe('SettingsScreen erase progress', () => {
  it('shows only Reset Save (no Safari isn’t ready empty state)', () => {
    render(
      <MemoryRouter>
        <SettingsScreen />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /^settings$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset save/i })).toBeInTheDocument()
    expect(screen.queryByText(/safari isn’t ready yet/i)).not.toBeInTheDocument()
  })

  it('eraseProgress clears save + edu-stats, keeps poke-cache, resets stores, reloads', () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })

    eraseProgress()

    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
    expect(localStorage.getItem(EDU_STATS_KEY)).toBeNull()
    expect(localStorage.getItem(CACHE_KEY)).toBe(SEEDED_CACHE)
    expect(useDexStore.getState().dex).toEqual({})
    expect(useExploreStore.getState().tile).toEqual(
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
    )
    expect(reload).toHaveBeenCalledOnce()
  })

  it('Erase Progress button runs eraseProgress', async () => {
    const user = userEvent.setup()
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })

    render(
      <MemoryRouter>
        <SettingsScreen />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /reset save/i }))
    await user.click(screen.getByRole('button', { name: /erase progress/i }))

    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
    expect(reload).toHaveBeenCalledOnce()
  })
})
