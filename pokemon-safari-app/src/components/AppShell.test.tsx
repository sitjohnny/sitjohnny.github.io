import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { useUiStore } from '@/store'
import { AppShell } from './AppShell'

afterEach(() => {
  cleanup()
  useUiStore.setState({
    cacheReady: false,
    quotaSoftFail: false,
    saveRecovered: false,
    dexSheetOpen: false,
  })
})

function renderShell() {
  return render(
    <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/game']}>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route path="game" element={<div>Game route</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppShell', () => {
  it('shows the saved-game recovery banner when saveRecovered is true', () => {
    useUiStore.setState({ saveRecovered: true })

    renderShell()

    expect(screen.getByRole('status')).toHaveTextContent(
      "We couldn't read a saved game",
    )
  })
})
