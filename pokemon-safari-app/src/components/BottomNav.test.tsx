import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { cleanup, render, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useEncounterStore } from '@/store/encounterStore'
import { BottomNav } from './BottomNav'

afterEach(() => {
  cleanup()
  useEncounterStore.getState().reset()
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

  it('leaves the Main nav without inert and focusable while the encounter is idle', async () => {
    const user = userEvent.setup()
    useEncounterStore.setState({ stage: 'idle' })
    const { container } = renderNav()
    const nav = within(container).getByRole('navigation', { name: 'Main' })

    expect(nav.hasAttribute('inert')).toBe(false)
    expect(nav).not.toHaveAttribute('inert')

    await user.tab()
    expect(document.activeElement).toBe(
      within(container).getByRole('link', { name: 'Home' }),
    )
  })

  it('sets inert on Main while an encounter is active so Tab cannot reach nav links', () => {
    useEncounterStore.setState({ stage: 'question' })
    const { container } = render(
      <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/']}>
        <button type="button">Before nav</button>
        <BottomNav />
      </MemoryRouter>,
    )
    const nav = within(container).getByLabelText('Main')

    // HTML `inert` removes the subtree from pointer/focus/a11y trees in browsers.
    // jsdom records the attribute but does not implement focus skipping or the
    // IDL `inert` boolean, so the attribute presence is the testable contract.
    expect(nav.hasAttribute('inert')).toBe(true)
    expect(nav.querySelectorAll('a').length).toBe(5)
  })
})
