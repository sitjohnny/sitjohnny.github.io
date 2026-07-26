import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'

function Boom(): React.ReactElement {
  throw new Error('boom')
}

describe('AppErrorBoundary', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('shows friendly recovery UI when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    )
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go to game/i })).toBeInTheDocument()
    expect(screen.queryByText(/boom/i)).not.toBeInTheDocument()
    spy.mockRestore()
  })

  it('reloads when Reload is pressed', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    )
    await userEvent.click(screen.getByRole('button', { name: /reload/i }))
    expect(reload).toHaveBeenCalled()
    spy.mockRestore()
  })
})
