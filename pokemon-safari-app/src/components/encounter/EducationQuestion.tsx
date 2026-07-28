import { useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { PixelButton } from '@/components/PixelButton'
import { EncounterPokemonShowcase } from '@/components/encounter/EncounterPokemonShowcase'
import { encounterDialogAccentProps } from '@/data/typeColors'
import { spellingCopy } from '@/data/educationConfig'
import {
  pickSpellingHintIndices,
  rollSpellingHintRatio,
  spellingHintRevealCount,
} from '@/game/education/spellingHint'
import type { EducationQuestion as EducationQuestionData } from '@/game/education/questionTypes'
import type { PokemonDto } from '@/types/pokemon'
import { getDefaultRng } from '@/utils/rng'

export type EducationFeedback = {
  ok: boolean
  message: string
}

type EducationQuestionProps = {
  pokemon: PokemonDto
  question: EducationQuestionData
  feedback: EducationFeedback | null
  onSubmit: (raw: string) => void
  shiny?: boolean
  onImageError?: () => void
}

const MAX_DIGITS = 4

type ImageStatus = 'loading' | 'ready' | 'error'

export function EducationQuestion({
  pokemon,
  question,
  feedback,
  onSubmit,
  shiny = false,
  onImageError,
}: EducationQuestionProps) {
  const [answer, setAnswer] = useState('')
  const [imageStatus, setImageStatus] = useState<ImageStatus>(() =>
    question.category === 'spelling' ? 'loading' : 'ready',
  )
  const [hintIndices, setHintIndices] = useState<number[] | null>(null)
  const imageErrorCalledRef = useRef(false)

  const locked = feedback !== null
  const accentProps = encounterDialogAccentProps(pokemon.types)

  if (question.category === 'spelling') {
    const wordLength = question.word.length
    const canSubmit =
      !locked && imageStatus === 'ready' && answer.trim().length > 0
    const hintUsed = hintIndices !== null
    const canHint = imageStatus === 'ready' && feedback === null && !hintUsed

    function handleSpellingChange(event: ChangeEvent<HTMLInputElement>) {
      const filtered = event.target.value
        .toLowerCase()
        .replace(/[^a-z]/g, '')
        .slice(0, wordLength)
      setAnswer(filtered)
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

    function handleImageLoad() {
      setImageStatus('ready')
    }

    function handleImageError() {
      setImageStatus('error')
      if (!imageErrorCalledRef.current) {
        imageErrorCalledRef.current = true
        onImageError?.()
      }
    }

    function handleHint() {
      if (!canHint) return
      const rng = getDefaultRng()
      const ratio = rollSpellingHintRatio(rng)
      const count = spellingHintRevealCount(wordLength, ratio)
      const indices = pickSpellingHintIndices(wordLength, count, rng)
      setHintIndices(indices)
    }

    const blankCells = Array.from({ length: wordLength }, (_, i) => {
      const typed = answer[i]
      if (typed) return typed.toUpperCase()
      if (hintIndices?.includes(i)) {
        return question.word[i]!.toUpperCase()
      }
      return '_'
    })
    const blanksDisplay = blankCells.join(' ')

    const attribution =
      imageStatus === 'ready'
        ? spellingCopy.attribution.replace('{name}', question.photographer)
        : null

    return (
      <div
        className="gba-dialog flex w-full flex-col items-center gap-6 px-6 py-6 text-center"
        {...accentProps}
      >
        <EncounterPokemonShowcase pokemon={pokemon} shiny={shiny} />
        <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] text-text">
          {pokemon.name}
        </h2>

        <p className="font-[family-name:var(--font-body)] text-[18px] font-normal leading-[1.4] text-text">
          {question.prompt}
        </p>

        <div className="flex w-full flex-col items-center gap-3">
          <img
            src={question.imageUrl}
            alt="Spelling picture"
            onLoad={handleImageLoad}
            onError={handleImageError}
            className="max-h-40 w-full max-w-xs object-cover"
          />
          {imageStatus === 'loading' ? (
            <p className="font-[family-name:var(--font-body)] text-[14px] text-muted">
              {spellingCopy.loading}
            </p>
          ) : null}
          {attribution ? (
            <p className="font-[family-name:var(--font-label)] text-[12px] text-muted">
              {attribution}
            </p>
          ) : null}
        </div>

        <p
          data-testid="spelling-blanks"
          className="font-[family-name:var(--font-numeral)] text-[24px] tracking-[0.2em] text-text"
          aria-hidden
        >
          {blanksDisplay}
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
              inputMode="text"
              autoComplete="off"
              enterKeyHint="done"
              value={answer}
              onChange={handleSpellingChange}
              onKeyDown={handleKeyDown}
              disabled={locked}
              className="pixel-border min-h-12 w-full bg-surface px-3 py-3 font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text"
            />
          </div>

          <div className="flex w-full flex-col gap-3">
            <PixelButton
              type="button"
              variant="secondary"
              className="w-full"
              disabled={!canHint}
              onClick={handleHint}
            >
              {spellingCopy.hint}
            </PixelButton>

            <PixelButton
              type="button"
              variant="primary"
              className="w-full"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              Submit Answer
            </PixelButton>
          </div>

          {feedback ? (
            <p
              aria-live="polite"
              className={
                feedback.ok
                  ? 'font-[family-name:var(--font-body)] text-[16px] font-semibold leading-[1.5] text-secondary'
                  : 'font-[family-name:var(--font-body)] text-[16px] font-semibold leading-[1.5] text-destructive'
              }
            >
              {feedback.message}
            </p>
          ) : null}
        </div>
      </div>
    )
  }

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
    <div
      className="gba-dialog flex w-full flex-col items-center gap-6 px-6 py-6 text-center"
      {...accentProps}
    >
      <EncounterPokemonShowcase pokemon={pokemon} shiny={shiny} />
      <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] text-text">
        {pokemon.name}
      </h2>

      <p className="font-[family-name:var(--font-numeral)] text-[24px] font-normal leading-[1.2] tracking-[0.06em] text-text min-[360px]:text-[28px]">
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
            className={
              feedback.ok
                ? 'font-[family-name:var(--font-body)] text-[16px] font-semibold leading-[1.5] text-secondary'
                : 'font-[family-name:var(--font-body)] text-[16px] font-semibold leading-[1.5] text-destructive'
            }
          >
            {feedback.message}
          </p>
        ) : null}
      </div>
    </div>
  )
}
