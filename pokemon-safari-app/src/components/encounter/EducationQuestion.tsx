import { useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { PixelButton } from '@/components/PixelButton'
import { PokemonSprite } from '@/components/PokemonSprite'
import type { EducationQuestion as EducationQuestionData } from '@/game/education/questionTypes'
import type { PokemonDto } from '@/types/pokemon'

export type EducationFeedback = {
  ok: boolean
  message: string
}

type EducationQuestionProps = {
  pokemon: PokemonDto
  question: EducationQuestionData
  feedback: EducationFeedback | null
  onSubmit: (raw: string) => void
}

const MAX_DIGITS = 4

export function EducationQuestion({
  pokemon,
  question,
  feedback,
  onSubmit,
}: EducationQuestionProps) {
  const [answer, setAnswer] = useState('')
  const locked = feedback !== null
  const canSubmit = !locked && answer.trim().length > 0

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setAnswer(event.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS))
  }

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit(answer)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="gba-dialog flex w-full flex-col items-center gap-6 px-8 py-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <PokemonSprite pokemon={pokemon} size={96} alt={pokemon.name} />
        <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] text-text">
          {pokemon.name}
        </h2>
      </div>

      <p className="font-[family-name:var(--font-display)] text-[32px] font-bold leading-[1.2] text-text">
        {question.prompt}
      </p>

      <div className="flex w-full flex-col gap-6">
        <div className="flex w-full flex-col gap-2 text-left">
          <label
            htmlFor="edu-answer"
            className="font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-muted"
          >
            Your answer
          </label>
          <input
            id="edu-answer"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            enterKeyHint="done"
            value={answer}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={locked}
            className="pixel-border min-h-12 w-full bg-surface px-3 py-3 font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text"
          />
        </div>

        <PixelButton
          type="button"
          variant="primary"
          className="w-full"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          Submit Answer
        </PixelButton>

        {feedback ? (
          <p
            aria-live="polite"
            className={[
              'font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text',
              feedback.ok ? 'border-l-2 border-accent pl-3' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {feedback.message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
