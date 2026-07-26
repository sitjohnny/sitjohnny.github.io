import userEvent from '@testing-library/user-event'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EducationQuestion } from '@/components/encounter/EducationQuestion'
import { feedbackCopy } from '@/data/educationConfig'
import { educationCaptureBonus } from '@/data/rates'
import { typeColors } from '@/data/typeColors'
import { makePokemonDto } from '@/test/pokeapi-test-helpers'
import type { EducationQuestion as EducationQuestionData } from '@/game/education/questionTypes'

const pokemon = makePokemonDto(25, { name: 'pikachu' })
const question: EducationQuestionData = {
  category: 'multiplication',
  prompt: 'What is 7 × 8?',
  factKey: '7x8',
  a: 7,
  b: 8,
  expected: 56,
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
})
