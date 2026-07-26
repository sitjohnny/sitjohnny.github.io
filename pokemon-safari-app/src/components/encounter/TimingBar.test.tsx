import userEvent from '@testing-library/user-event'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { captureCopy } from '@/data/educationConfig'
import { makePokemonDto } from '@/test/pokeapi-test-helpers'
import { flushFrames } from '@/test/setup'

const capture = vi.fn()

vi.mock('@/hooks/useEncounterFlow', () => ({
  capture: (...args: unknown[]) => capture(...args),
}))

const { TimingBar } = await import('@/components/encounter/TimingBar')

const pokemon = makePokemonDto(25, { name: 'pikachu' })

function renderBar(
  overrides: {
    locked?: boolean
    captureBonus?: number
    attemptsUsed?: number
    sweetSpot?: number
    rarity?: 'common' | 'rare' | 'legendary'
  } = {},
) {
  return render(
    <TimingBar
      pokemon={pokemon}
      captureBonus={overrides.captureBonus ?? 0.15}
      attemptsUsed={overrides.attemptsUsed ?? 0}
      sweetSpot={overrides.sweetSpot ?? 0.62}
      rarity={overrides.rarity ?? 'common'}
      locked={overrides.locked}
    />,
  )
}

beforeEach(() => {
  capture.mockClear()
})

afterEach(cleanup)

describe('TimingBar', () => {
  it('renders Capture with an accessible timing group name', () => {
    renderBar()

    expect(screen.getByRole('button', { name: captureCopy.captureCta })).toBeInTheDocument()
    expect(
      screen.getByRole('group', {
        name: /timing|capture/i,
      }),
    ).toBeInTheDocument()
  })

  it('fires Capture once with a position in [0, 1]', async () => {
    const user = userEvent.setup()
    renderBar()
    await flushFrames(2)

    await user.click(screen.getByRole('button', { name: captureCopy.captureCta }))

    expect(capture).toHaveBeenCalledTimes(1)
    const position = capture.mock.calls[0]?.[0]
    expect(typeof position).toBe('number')
    expect(position).toBeGreaterThanOrEqual(0)
    expect(position).toBeLessThanOrEqual(1)
  })

  it('fires Capture once from Space and once from Enter on the focused button', async () => {
    const user = userEvent.setup()
    const { unmount } = renderBar()
    const button = screen.getByRole('button', { name: captureCopy.captureCta })
    button.focus()

    await user.keyboard('{Enter}')
    expect(capture).toHaveBeenCalledTimes(1)

    capture.mockClear()
    unmount()
    renderBar()
    const again = screen.getByRole('button', { name: captureCopy.captureCta })
    again.focus()
    await user.keyboard(' ')
    expect(capture).toHaveBeenCalledTimes(1)
  })

  it('does not capture when the track is clicked', async () => {
    const user = userEvent.setup()
    renderBar()

    const track = screen.getByTestId('timing-track')
    await user.click(track)

    expect(capture).not.toHaveBeenCalled()
  })

  it('disables Capture and ignores clicks when locked', async () => {
    const user = userEvent.setup()
    renderBar({ locked: true })

    const button = screen.getByRole('button', { name: captureCopy.captureCta })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(capture).not.toHaveBeenCalled()
  })

  it('shows color bands without Perfect/Great/Good/Miss labels on the track', () => {
    const { container } = renderBar()

    expect(container.querySelector('.timing-track')).not.toBeNull()
    expect(container.querySelectorAll('[data-timing-band]').length).toBeGreaterThanOrEqual(3)

    const track = screen.getByTestId('timing-track')
    expect(track.textContent).not.toMatch(/Perfect|Great|Good|Miss/)
    expect(container.textContent).not.toMatch(/Perfect!|Great!|Good!|Miss!/)
  })

  it('shows Math boost and Throw n of 3 copy', () => {
    renderBar({ captureBonus: 0.15, attemptsUsed: 0 })

    expect(screen.getByText(/Throw 1 of 3/)).toBeInTheDocument()
    expect(screen.getByText(/Math boost: \+15%/)).toBeInTheDocument()
    expect(document.querySelector('.boost-chip')).not.toBeNull()
  })
})
