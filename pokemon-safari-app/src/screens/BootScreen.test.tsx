import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BootScreen } from '@/screens/BootScreen'

const retryMock = vi.fn()

vi.mock('@/hooks/usePokemonCache', () => ({
  usePokemonCache: vi.fn(),
}))

import { usePokemonCache } from '@/hooks/usePokemonCache'

const usePokemonCacheMock = vi.mocked(usePokemonCache)

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

beforeEach(() => {
  retryMock.mockReset()
})

function renderBoot() {
  return render(
    <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/boot']}>
      <BootScreen />
    </MemoryRouter>,
  )
}

describe('BootScreen loading', () => {
  it('shows Catching them all… with n/151 and progressbar named Catching them all', () => {
    usePokemonCacheMock.mockReturnValue({
      status: 'loading',
      progress: { done: 42, total: 151 },
      error: null,
      retry: retryMock,
    })

    renderBoot()

    expect(screen.getByText(/Catching them all…\s*42\/151/)).toBeInTheDocument()
    const bar = screen.getByRole('progressbar', { name: 'Catching them all' })
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '151')
    expect(bar).toHaveAttribute('aria-valuenow', '42')
  })
})

function LocationProbe() {
  const { pathname } = useLocation()
  return <div>path:{pathname}</div>
}

describe('BootScreen ready navigation', () => {
  it('navigates to /game with replace when cache status becomes ready', () => {
    usePokemonCacheMock.mockReturnValue({
      status: 'ready',
      progress: { done: 151, total: 151 },
      error: null,
      retry: retryMock,
    })

    render(
      <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/boot']}>
        <Routes>
          <Route path="/boot" element={<BootScreen />} />
          <Route path="/game" element={<div>Game surface</div>} />
        </Routes>
        <LocationProbe />
      </MemoryRouter>,
    )

    expect(screen.getByText('Game surface')).toBeInTheDocument()
    expect(screen.getByText('path:/game')).toBeInTheDocument()
  })
})

describe('BootScreen failure', () => {
  it('shows Couldn’t catch the Pokédex data and Try again; retry resumes without reload', async () => {
    const user = userEvent.setup()
    const reloadSpy = vi.fn()
    const originalLocation = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload: reloadSpy },
    })

    usePokemonCacheMock.mockReturnValue({
      status: 'error',
      progress: { done: 10, total: 151 },
      error: new Error('network'),
      retry: retryMock,
    })

    renderBoot()

    expect(screen.getByText('Couldn’t catch the Pokédex data')).toBeInTheDocument()
    expect(
      screen.getByText(
        /Check your connection, then tap Try again\. We\u2019ll keep what we already caught\./,
      ),
    ).toBeInTheDocument()
    const tryAgain = screen.getByRole('button', { name: 'Try again' })
    await user.click(tryAgain)

    expect(retryMock).toHaveBeenCalled()
    expect(reloadSpy).not.toHaveBeenCalled()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  it('shows offline body when navigator.onLine is false', () => {
    vi.stubGlobal('navigator', { onLine: false })

    usePokemonCacheMock.mockReturnValue({
      status: 'error',
      progress: { done: 0, total: 151 },
      error: new Error('network'),
      retry: retryMock,
    })

    renderBoot()

    expect(
      screen.getByText(
        "You're offline. Connect to the internet, then tap Try again. We'll keep what we already caught.",
      ),
    ).toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})
