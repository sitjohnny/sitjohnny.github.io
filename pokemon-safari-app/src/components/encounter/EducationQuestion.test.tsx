import userEvent from '@testing-library/user-event'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EducationQuestion } from '@/components/encounter/EducationQuestion'
import {
  feedbackCopy,
  spellingCopy,
  spellingImageTimeoutMs,
} from '@/data/educationConfig'
import { educationCaptureBonus } from '@/data/rates'
import { typeColors } from '@/data/typeColors'
import { makePokemonDto } from '@/test/pokeapi-test-helpers'
import type {
  EducationQuestion as EducationQuestionData,
  SpellingEducationQuestion,
} from '@/game/education/questionTypes'

const pokemon = makePokemonDto(25, { name: 'pikachu' })
const spellingQuestion: SpellingEducationQuestion = {
  category: 'spelling',
  prompt: spellingCopy.prompt,
  factKey: 'spell:tiger',
  word: 'tiger',
  imageUrl: 'https://images.pexels.com/photos/631317/pexels-photo-631317.jpeg',
  photographer: 'Pixabay',
  pexelsUrl: 'https://www.pexels.com/photo/631317/',
  expected: 'tiger',
  recapLine: 'tiger',
}
const question: EducationQuestionData = {
  category: 'multiplication',
  prompt: 'What is 7 × 8?',
  factKey: '7x8',
  a: 7,
  b: 8,
  expected: 56,
  recapLine: '7 × 8 = 56',
}

function boostMessage(ok: boolean, lineIndex = 0): string {
  const boost = Math.round(educationCaptureBonus.correct * 100)
  if (ok) {
    return `${feedbackCopy.correct[lineIndex]} ${feedbackCopy.correctSuffix.replace('{boost}', String(boost))}`
  }
  return `${feedbackCopy.incorrect[lineIndex]} ${feedbackCopy.incorrectSuffix}`
}

afterEach(cleanup)

describe('EducationQuestion', () => {
  it('shows the Pokémon and one multiplication prompt', () => {
    render(
      <EducationQuestion
        pokemon={pokemon}
        question={question}
        feedback={null}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByText('What is 7 × 8?')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'pikachu' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'pikachu' })).toBeInTheDocument()
    expect(screen.queryByText(/timer|countdown/i)).toBeNull()
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('shiny=true uses front_shiny sprite URL', () => {
    render(
      <EducationQuestion
        pokemon={pokemon}
        question={question}
        feedback={null}
        onSubmit={vi.fn()}
        shiny
      />,
    )

    expect(screen.getByRole('img', { name: 'pikachu' })).toHaveAttribute(
      'src',
      'https://example.test/s25.png',
    )
  })

  it('renders the prompt in the numeral font, not the display font', () => {
    render(
      <EducationQuestion
        pokemon={pokemon}
        question={question}
        feedback={null}
        onSubmit={vi.fn()}
      />,
    )

    const prompt = screen.getByText('What is 7 × 8?')
    expect(prompt.className).toMatch(/var\(--font-numeral\)/)
    expect(prompt.className).toMatch(/font-normal/)
    expect(prompt.className).not.toMatch(/font-bold/)
    expect(prompt.className).not.toMatch(/var\(--font-display\)/)
  })

  it('accepts digits only through a labelled native numeric field', async () => {
    const user = userEvent.setup()
    render(
      <EducationQuestion
        pokemon={pokemon}
        question={question}
        feedback={null}
        onSubmit={vi.fn()}
      />,
    )

    const input = screen.getByLabelText('Your answer')
    expect(input).toHaveAttribute('inputMode', 'numeric')
    expect(input).toHaveAttribute('pattern', '[0-9]*')
    expect(input).toHaveAttribute('id', 'edu-answer')
    await user.type(input, 'abc')
    expect(input).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Submit Answer' })).toBeDisabled()
    await user.type(input, '56')
    expect(input).toHaveValue('56')
    expect(screen.getByRole('button', { name: 'Submit Answer' })).toBeEnabled()
  })

  it('caps digit length at four characters', async () => {
    const user = userEvent.setup()
    render(
      <EducationQuestion
        pokemon={pokemon}
        question={question}
        feedback={null}
        onSubmit={vi.fn()}
      />,
    )

    const input = screen.getByLabelText('Your answer')
    await user.type(input, '12345')
    expect(input).toHaveValue('1234')
  })

  it('submits once from the button and once from Enter', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const { rerender } = render(
      <EducationQuestion
        pokemon={pokemon}
        question={question}
        feedback={null}
        onSubmit={onSubmit}
      />,
    )

    const input = screen.getByLabelText('Your answer')
    await user.type(input, '56')
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenLastCalledWith('56')

    onSubmit.mockClear()
    rerender(
      <EducationQuestion
        pokemon={pokemon}
        question={question}
        feedback={null}
        onSubmit={onSubmit}
      />,
    )
    await user.type(input, '{Enter}')
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenLastCalledWith('56')
  })

  it('announces correct feedback and blocks another submit', () => {
    const message = boostMessage(true)
    render(
      <EducationQuestion
        pokemon={pokemon}
        question={question}
        feedback={{ ok: true, message }}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByText(message).closest('[aria-live="polite"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Submit Answer' })).toBeDisabled()
  })

  it('does not render a gold left border beside correct feedback', () => {
    const message = boostMessage(true)
    render(
      <EducationQuestion
        pokemon={pokemon}
        question={question}
        feedback={{ ok: true, message }}
        onSubmit={vi.fn()}
      />,
    )

    const feedback = screen.getByText(message)
    expect(feedback.className).not.toMatch(/border-l/)
    expect(feedback.className).not.toMatch(/border-accent/)
    expect(feedback.className).toMatch(/text-secondary/)
    expect(feedback.className).toMatch(/font-semibold/)
  })

  it('styles wrong feedback with destructive color for kid readability', () => {
    const message = boostMessage(false)
    render(
      <EducationQuestion
        pokemon={pokemon}
        question={question}
        feedback={{ ok: false, message }}
        onSubmit={vi.fn()}
      />,
    )

    const feedback = screen.getByText(message)
    expect(feedback.className).toMatch(/text-destructive/)
    expect(feedback.className).toMatch(/font-semibold/)
    expect(feedback.className).not.toMatch(/border-l/)
    expect(feedback.className).not.toMatch(/border-accent/)
  })

  it('keeps the expected product hidden after a wrong answer', () => {
    const message = boostMessage(false)
    const { container } = render(
      <EducationQuestion
        pokemon={pokemon}
        question={question}
        feedback={{ ok: false, message }}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByText(message).closest('[aria-live="polite"]')).not.toBeNull()
    expect(container.textContent).not.toContain('56')
    expect(container.textContent).not.toContain('=')
  })

  it('shows artwork, type badges, and primary type accent', () => {
    const electric = makePokemonDto(25, {
      name: 'pikachu',
      types: ['electric'],
      sprites: {
        front_default: 'https://example.test/25.png',
        front_shiny: 'https://example.test/s25.png',
        official_artwork: 'https://example.test/art/25.png',
      },
    })
    render(
      <EducationQuestion
        pokemon={electric}
        question={question}
        feedback={null}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('img', { name: 'pikachu' })).toHaveAttribute(
      'src',
      'https://example.test/art/25.png',
    )
    expect(screen.getByText('Electric')).toBeInTheDocument()
    const dialog = screen.getByRole('heading', { name: 'pikachu' }).closest('.gba-dialog')
    expect(dialog).toHaveAttribute('data-primary-type', 'electric')
    expect(dialog).toHaveStyle({ borderLeftColor: typeColors.electric })
  })

  it('shows loading copy before the image loads', () => {
    render(
      <EducationQuestion
        pokemon={pokemon}
        question={spellingQuestion}
        feedback={null}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByText(spellingCopy.loading)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
  })

  it('enables submit after image load and shows attribution', () => {
    render(
      <EducationQuestion
        pokemon={pokemon}
        question={spellingQuestion}
        feedback={null}
        onSubmit={vi.fn()}
      />,
    )
    fireEvent.load(screen.getByRole('img', { name: /spelling/i }))
    expect(screen.queryByText(spellingCopy.loading)).not.toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Photo by Pixabay/i })
    expect(link).toHaveAttribute('href', spellingQuestion.pexelsUrl)
  })

  it('calls onImageError once when the image load times out', async () => {
    vi.useFakeTimers()
    try {
      const onImageError = vi.fn()
      render(
        <EducationQuestion
          pokemon={pokemon}
          question={spellingQuestion}
          feedback={null}
          onSubmit={vi.fn()}
          onImageError={onImageError}
        />,
      )
      await act(async () => {
        vi.advanceTimersByTime(spellingImageTimeoutMs)
      })
      expect(onImageError).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('calls onImageError once when the image errors', () => {
    const onImageError = vi.fn()
    render(
      <EducationQuestion
        pokemon={pokemon}
        question={spellingQuestion}
        feedback={null}
        onSubmit={vi.fn()}
        onImageError={onImageError}
      />,
    )
    const img = screen.getByRole('img', { name: /spelling/i })
    fireEvent.error(img)
    fireEvent.error(img)
    expect(onImageError).toHaveBeenCalledTimes(1)
  })

  it('filters non-letters and caps length to the word', async () => {
    const user = userEvent.setup()
    render(
      <EducationQuestion
        pokemon={pokemon}
        question={spellingQuestion}
        feedback={null}
        onSubmit={vi.fn()}
      />,
    )
    fireEvent.load(screen.getByRole('img', { name: /spelling/i }))
    await user.type(screen.getByLabelText(/your answer/i), 'Ti1g@erXX')
    expect(screen.getByLabelText(/your answer/i)).toHaveValue('tiger')
  })

  it('renders blanks matching word length', () => {
    render(
      <EducationQuestion
        pokemon={pokemon}
        question={spellingQuestion}
        feedback={null}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByTestId('spelling-blanks')).toHaveTextContent('_ _ _ _ _')
  })

  it('hint reveals letters in blank positions and disables after one use', async () => {
    const user = userEvent.setup()
    render(
      <EducationQuestion
        pokemon={pokemon}
        question={spellingQuestion}
        feedback={null}
        onSubmit={vi.fn()}
      />,
    )
    fireEvent.load(screen.getByRole('img', { name: /spelling/i }))
    const hint = screen.getByRole('button', { name: spellingCopy.hint })
    expect(hint).toBeEnabled()
    await user.click(hint)
    expect(hint).toBeDisabled()
    const blanks = screen.getByTestId('spelling-blanks')
    const revealed = blanks.textContent!.match(/[A-Z]/g) ?? []
    // tiger length 5 → ~50% hint ≈ 2–3 letters, never the full word
    expect(revealed.length).toBeGreaterThanOrEqual(2)
    expect(revealed.length).toBeLessThan(5)
  })

  it('hint stays disabled while the image is loading', () => {
    render(
      <EducationQuestion
        pokemon={pokemon}
        question={spellingQuestion}
        feedback={null}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: spellingCopy.hint })).toBeDisabled()
  })
})
