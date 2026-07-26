import { useState, type FormEvent, type ChangeEvent } from 'react'
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

export function EducationQuestion({
  pokemon,
  question,
  feedback,
  onSubmit,
}: EducationQuestionProps) {
  const [answer, setAnswer] = useState('')
  const locked = feedback !== null
  const canSubmit = !locked && answer.length > 0

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setAnswer(event.target.value.replace(/\D/g, ''))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    onSubmit(answer)
  }

  return (
    <form
      className="gba-dialog flex w-full flex-col items-center gap-4 p-6 text-center"
      onSubmit={handleSubmit}
    >
      <PokemonSprite pokemon={pokemon} size={96} alt={pokemon.name} />
      <p className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] text-text">
        {question.prompt}
      </p>
      <label className="flex w-full flex-col gap-2 text-left">
        <span className="font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-muted">
          Your answer
        </span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={answer}
          onChange={handleChange}
          disabled={locked}
          className="pixel-border w-full bg-surface px-3 py-3 font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text"
        />
      </label>
      <PixelButton
        type="submit"
        variant="primary"
        className="w-full"
        disabled={!canSubmit}
      >
        Submit Answer
      </PixelButton>
      {feedback ? (
        <p
          aria-live="polite"
          className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text"
        >
          {feedback.message}
        </p>
      ) : null}
    </form>
  )
}
