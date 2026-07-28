import userEvent from '@testing-library/user-event'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RecapCard } from '@/components/encounter/RecapCard'
import { recapCopy, spellingCopy } from '@/data/educationConfig'
import { encounterTimingMs } from '@/data/rates'

afterEach(cleanup)

describe('RecapCard', () => {
  it('renders the Quick recap heading, full fact with ×, and closing line', () => {
    render(<RecapCard equation="7 × 8 = 56" onContinue={vi.fn()} />)

    expect(screen.getByRole('heading', { name: recapCopy.heading })).toBeInTheDocument()
    expect(screen.getByText('7 × 8 = 56.')).toBeInTheDocument()
    expect(screen.getByText(recapCopy.closing)).toBeInTheDocument()
  })

  it('renders spelling image and word on Quick recap', () => {
    render(
      <RecapCard
        equation="elephant"
        imageUrl="https://images.pexels.com/photos/66898/pexels-photo-66898.jpeg"
        photographer="Pixabay"
        pexelsUrl="https://www.pexels.com/photo/66898/"
        onContinue={vi.fn()}
      />,
    )
    expect(screen.getByRole('img', { name: /recap/i })).toBeInTheDocument()
    expect(screen.getByText('elephant.')).toBeInTheDocument()
  })

  it('shows attribution only after recap image loads', () => {
    render(
      <RecapCard
        equation="elephant"
        imageUrl="https://images.pexels.com/photos/66898/pexels-photo-66898.jpeg"
        photographer="Pixabay"
        pexelsUrl="https://www.pexels.com/photo/66898/"
        onContinue={vi.fn()}
      />,
    )
    expect(screen.queryByText(/Photo by Pixabay/i)).not.toBeInTheDocument()
    expect(screen.getByText(spellingCopy.loading)).toBeInTheDocument()
    fireEvent.load(screen.getByRole('img', { name: /recap/i }))
    expect(screen.queryByText(spellingCopy.loading)).not.toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Photo by Pixabay/i })
    expect(link).toHaveAttribute(
      'href',
      'https://www.pexels.com/photo/66898/',
    )
  })

  it('hides image and attribution when recap image errors', () => {
    render(
      <RecapCard
        equation="elephant"
        imageUrl="https://images.pexels.com/photos/66898/pexels-photo-66898.jpeg"
        photographer="Pixabay"
        onContinue={vi.fn()}
      />,
    )
    fireEvent.error(screen.getByRole('img', { name: /recap/i }))
    expect(screen.queryByRole('img', { name: /recap/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/Photo by Pixabay/i)).not.toBeInTheDocument()
    expect(screen.getByText('elephant.')).toBeInTheDocument()
  })

  it('renders a division equation on Quick recap', () => {
    render(<RecapCard equation="48 ÷ 6 = 8" onContinue={vi.fn()} />)

    expect(screen.getByText('48 ÷ 6 = 8.')).toBeInTheDocument()
  })

  it('renders the fact line in the numeral font, not the display font', () => {
    render(<RecapCard equation="7 × 8 = 56" onContinue={vi.fn()} />)

    const fact = screen.getByText('7 × 8 = 56.')
    expect(fact.className).toMatch(/var\(--font-numeral\)/)
    expect(fact.className).toMatch(/font-normal/)
    expect(fact.className).not.toMatch(/font-bold/)
    expect(fact.className).not.toMatch(/var\(--font-display\)/)
  })

  it('exposes a touch-sized Continue button that calls onContinue once', async () => {
    const user = userEvent.setup()
    const onContinue = vi.fn()
    render(<RecapCard equation="7 × 8 = 56" onContinue={onContinue} />)

    const cta = screen.getByRole('button', { name: 'Continue' })
    expect(cta.className).toMatch(/touch-target/)
    await user.click(cta)
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it('does not auto-advance — onContinue stays uncalled past the longest hold', async () => {
    vi.useFakeTimers()
    const onContinue = vi.fn()
    render(<RecapCard equation="7 × 8 = 56" onContinue={onContinue} />)

    const longest =
      Math.max(
        encounterTimingMs.appearFlash,
        encounterTimingMs.spriteReveal,
        encounterTimingMs.feedbackHold,
        encounterTimingMs.incorrectFeedbackHold,
      ) + 5000

    await act(async () => {
      vi.advanceTimersByTime(longest)
    })

    expect(onContinue).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    vi.useRealTimers()
  })
})
