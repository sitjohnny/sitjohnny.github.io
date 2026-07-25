import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App, { APP_BASENAME, syncHashBasename } from './App'

afterEach(() => {
  cleanup()
})

beforeEach(() => {
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
    expect(screen.getByRole('heading', { name: /^game$/i })).toBeInTheDocument()
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
