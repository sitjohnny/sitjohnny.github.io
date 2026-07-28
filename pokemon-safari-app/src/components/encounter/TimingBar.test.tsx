import userEvent from '@testing-library/user-event'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { captureCopy } from '@/data/educationConfig'
import { encounterTimingMs } from '@/data/rates'
import { typeColors } from '@/data/typeColors'
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
    maxThrows?: number
    sweetSpot?: number
    rarity?: 'common' | 'rare' | 'legendary'
  } = {},
) {
  return render(
    <TimingBar
      pokemon={pokemon}
      captureBonus={overrides.captureBonus ?? 0.15}
      attemptsUsed={overrides.attemptsUsed ?? 0}
      maxThrows={overrides.maxThrows ?? 3}
      sweetSpot={overrides.sweetSpot ?? 0.62}
      rarity={overrides.rarity ?? 'common'}
      locked={overrides.locked}
    />,
  )
}

async function advanceFreezeHold(): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(encounterTimingMs.timingFreezeHold)
  })
}

beforeEach(() => {
  capture.mockClear()
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('TimingBar', () => {
  it('renders Capture with an accessible timing group name', () => {
    renderBar()

    expect(
      screen.getByRole('button', { name: captureCopy.captureCta }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('group', {
        name: /timing|capture/i,
      }),
    ).toBeInTheDocument()
  })

  it('freezes the marker then fires Capture once with a position in [0, 1]', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderBar()
    await flushFrames(2)

    await user.click(screen.getByRole('button', { name: captureCopy.captureCta }))

    expect(capture).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: captureCopy.captureCta })).toBeDisabled()

    await advanceFreezeHold()

    expect(capture).toHaveBeenCalledTimes(1)
    const position = capture.mock.calls[0]?.[0]
    expect(typeof position).toBe('number')
    expect(position).toBeGreaterThanOrEqual(0)
    expect(position).toBeLessThanOrEqual(1)
  })

  it('fires Capture once from Space and once from Enter on the focused button', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { unmount } = renderBar()
    const button = screen.getByRole('button', { name: captureCopy.captureCta })
    button.focus()

    await user.keyboard('{Enter}')
    expect(capture).not.toHaveBeenCalled()
    await advanceFreezeHold()
    expect(capture).toHaveBeenCalledTimes(1)

    capture.mockClear()
    unmount()
    renderBar()
    const again = screen.getByRole('button', { name: captureCopy.captureCta })
    again.focus()
    await user.keyboard(' ')
    await advanceFreezeHold()
    expect(capture).toHaveBeenCalledTimes(1)
  })

  it('does not capture when the track is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderBar()

    const track = screen.getByTestId('timing-track')
    await user.click(track)

    expect(capture).not.toHaveBeenCalled()
  })

  it('disables Capture and ignores clicks when locked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderBar({ locked: true })

    const button = screen.getByRole('button', { name: captureCopy.captureCta })
    expect(button).toBeDisabled()
    await user.click(button)
    await advanceFreezeHold()
    expect(capture).not.toHaveBeenCalled()
  })

  it('shows color bands without Perfect/Great/Good/Miss labels on the track', () => {
    const { container } = renderBar()

    expect(container.querySelector('.timing-track')).not.toBeNull()
    expect(
      container.querySelectorAll('[data-timing-band]').length,
    ).toBeGreaterThanOrEqual(3)

    const track = screen.getByTestId('timing-track')
    expect(track.textContent).not.toMatch(/Perfect|Great|Good|Miss/)
    expect(container.textContent).not.toMatch(/Perfect!|Great!|Good!|Miss!/)
  })

  it('shows Math boost and Throw n of max copy', () => {
    renderBar({ captureBonus: 0.15, attemptsUsed: 0 })

    expect(screen.getByText(/Throw 1 of 3/)).toBeInTheDocument()
    expect(screen.getByText(/Math boost: \+15%/)).toBeInTheDocument()
    expect(document.querySelector('.boost-chip')).not.toBeNull()
  })

  it('shows Throw 1 of 1 when maxThrows is 1', () => {
    renderBar({ captureBonus: 0, attemptsUsed: 0, maxThrows: 1 })
    expect(screen.getByText(/Throw 1 of 1/)).toBeInTheDocument()
  })

  it('shows artwork, type badges, and primary type accent', () => {
    const typed = makePokemonDto(25, {
      name: 'pikachu',
      types: ['electric'],
      sprites: {
        front_default: 'https://example.test/25.png',
        front_shiny: 'https://example.test/s25.png',
        official_artwork: 'https://example.test/art/25.png',
      },
    })
    render(
      <TimingBar
        pokemon={typed}
        captureBonus={0}
        attemptsUsed={0}
        maxThrows={3}
        sweetSpot={0.5}
        rarity="common"
      />,
    )

    expect(screen.getByRole('img', { name: 'pikachu' })).toHaveAttribute(
      'src',
      'https://example.test/art/25.png',
    )
    expect(screen.getByText('Electric')).toBeInTheDocument()
    const dialog = screen.getByRole('group', { name: /timing/i })
    expect(dialog).toHaveAttribute('data-primary-type', 'electric')
    expect(dialog).toHaveStyle({ borderLeftColor: typeColors.electric })
  })
})
