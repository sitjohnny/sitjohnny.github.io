import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App route smoke', () => {
  it('shows Home brand text Pokémon Safari', () => {
    render(<App />)
    expect(screen.getByText('Pokémon Safari')).toBeInTheDocument()
  })

  it('navigates toward Game via Start Safari', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('link', { name: /start safari/i }))
    expect(screen.getByText(/game/i)).toBeInTheDocument()
  })
})
