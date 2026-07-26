import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { cleanup, render, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useEncounterStore } from '@/store/encounterStore'
import { useUiStore } from '@/store'
import { BottomNav } from './BottomNav'

afterEach(() => {
  cleanup()
  useEncounterStore.getState().reset()
  useUiStore.setState({ dexSheetOpen: false })
})

function renderNav() {
  return render(
    <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/']}>
      <BottomNav />
    </MemoryRouter>,
  )
}

describe('BottomNav', () => {
  it('exposes three accessible links labeled Game, Pokédex, Settings', () => {
    const { container } = renderNav()
    const view = within(container)

    expect(view.queryByRole('link', { name: 'Home' })).not.toBeInTheDocument()
    expect(view.getByRole('link', { name: 'Game' })).toBeInTheDocument()
    expect(view.getByRole('link', { name: 'Pokédex' })).toBeInTheDocument()
    expect(view.getByRole('link', { name: 'Settings' })).toBeInTheDocument()
  })

  it('applies touch-target class on nav controls', () => {
    const { container } = renderNav()
    const game = within(container).getByRole('link', { name: 'Game' })
    expect(game.className).toMatch(/touch-target/)
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
      within(container).getByRole('link', { name: 'Game' }),
    )
  })

  it('sets inert on Main while an encounter is active on /game so Tab cannot reach nav links', () => {
    useEncounterStore.setState({ stage: 'question' })
    const { container } = render(
      <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/game']}>
        <button type="button">Before nav</button>
        <BottomNav />
      </MemoryRouter>,
    )
    const nav = within(container).getByLabelText('Main')

    // HTML `inert` removes the subtree from pointer/focus/a11y trees in browsers.
    // jsdom records the attribute but does not implement focus skipping or the
    // IDL `inert` boolean, so the attribute presence is the testable contract.
    expect(nav.hasAttribute('inert')).toBe(true)
    expect(nav.querySelectorAll('a').length).toBe(3)
  })

  it('does not set inert on Main at Settings even when encounter stage is non-idle', () => {
    useEncounterStore.setState({ stage: 'question' })
    const { container } = render(
      <MemoryRouter
        basename="/pokemon-safari"
        initialEntries={['/pokemon-safari/settings']}
      >
        <BottomNav />
      </MemoryRouter>,
    )
    const nav = within(container).getByLabelText('Main')
    expect(nav.hasAttribute('inert')).toBe(false)
  })

  it('sets inert on Main when dexSheetOpen is true on /dex', () => {
    useUiStore.setState({ dexSheetOpen: true })
    const { container } = render(
      <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/dex']}>
        <BottomNav />
      </MemoryRouter>,
    )
    const nav = within(container).getByLabelText('Main')
    expect(nav.hasAttribute('inert')).toBe(true)
  })

  it('does not set inert on Main on /dex when dexSheetOpen is false', () => {
    useUiStore.setState({ dexSheetOpen: false })
    const { container } = render(
      <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/dex']}>
        <BottomNav />
      </MemoryRouter>,
    )
    const nav = within(container).getByLabelText('Main')
    expect(nav.hasAttribute('inert')).toBe(false)
  })

  it('does not set inert on Main on a non-dex route even when dexSheetOpen is true', () => {
    useUiStore.setState({ dexSheetOpen: true })
    const { container } = render(
      <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/']}>
        <BottomNav />
      </MemoryRouter>,
    )
    const nav = within(container).getByLabelText('Main')
    expect(nav.hasAttribute('inert')).toBe(false)
  })
})
