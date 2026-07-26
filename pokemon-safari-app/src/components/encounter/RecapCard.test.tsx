import userEvent from '@testing-library/user-event'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RecapCard } from '@/components/encounter/RecapCard'
import { recapCopy } from '@/data/educationConfig'
import { encounterTimingMs } from '@/data/rates'

afterEach(cleanup)

describe('RecapCard', () => {
  it('renders the Quick recap heading, full fact with ×, and closing line', () => {
    render(<RecapCard a={7} b={8} product={56} onContinue={vi.fn()} />)

    expect(
      screen.getByRole('heading', { name: recapCopy.heading }),
    ).toBeInTheDocument()
    expect(screen.getByText('7 × 8 = 56.')).toBeInTheDocument()
    expect(screen.getByText(recapCopy.closing)).toBeInTheDocument()
  })

  it('exposes a touch-sized Continue button that calls onContinue once', async () => {
    const user = userEvent.setup()
    const onContinue = vi.fn()
    render(<RecapCard a={7} b={8} product={56} onContinue={onContinue} />)

    const cta = screen.getByRole('button', { name: 'Continue' })
    expect(cta.className).toMatch(/touch-target/)
    await user.click(cta)
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it('does not auto-advance — onContinue stays uncalled past the longest hold', async () => {
    vi.useFakeTimers()
    const onContinue = vi.fn()
    render(<RecapCard a={7} b={8} product={56} onContinue={onContinue} />)

    const longest =
      Math.max(
        encounterTimingMs.appearFlash,
        encounterTimingMs.spriteReveal,
        encounterTimingMs.feedbackHold,
        encounterTimingMs.itemToast,
      ) + 5000

    await act(async () => {
      vi.advanceTimersByTime(longest)
    })

    expect(onContinue).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    vi.useRealTimers()
  })
})
