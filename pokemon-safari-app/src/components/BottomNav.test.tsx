import { MemoryRouter } from 'react-router-dom'
import { cleanup, render, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BottomNav } from './BottomNav'

afterEach(() => {
  cleanup()
})

function renderNav() {
  return render(
    <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/']}>
      <BottomNav />
    </MemoryRouter>,
  )
}

describe('BottomNav', () => {
  it('exposes five accessible links labeled Home, Game, Dex, Pack, Settings', () => {
    const { container } = renderNav()
    const view = within(container)

    expect(view.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(view.getByRole('link', { name: 'Game' })).toBeInTheDocument()
    expect(view.getByRole('link', { name: 'Dex' })).toBeInTheDocument()
    expect(view.getByRole('link', { name: 'Pack' })).toBeInTheDocument()
    expect(view.getByRole('link', { name: 'Settings' })).toBeInTheDocument()
  })

  it('applies touch-target class on nav controls', () => {
    const { container } = renderNav()
    const home = within(container).getByRole('link', { name: 'Home' })
    expect(home.className).toMatch(/touch-target/)
  })
})
