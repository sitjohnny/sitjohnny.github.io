import { useCallback, useEffect, useRef } from 'react'
import { AppearFlash } from '@/components/encounter/AppearFlash'
import { CaughtCard } from '@/components/encounter/CaughtCard'
import { EducationQuestion } from '@/components/encounter/EducationQuestion'
import { FailBeat } from '@/components/encounter/FailBeat'
import { FleeCard } from '@/components/encounter/FleeCard'
import { RecapCard } from '@/components/encounter/RecapCard'
import { ShakeSequence } from '@/components/encounter/ShakeSequence'
import { TimingBar } from '@/components/encounter/TimingBar'
import { EmptyState } from '@/components/EmptyState'
import { PixelButton } from '@/components/PixelButton'
import {
  advanceFromAppear,
  continueFromFlee,
  continueFromResult,
  dismissRecap,
  onShakeComplete,
  submitAnswer,
} from '@/hooks/useEncounterFlow'
import { getPokemon } from '@/services/pokeapi/cache'
import { useEncounterStore } from '@/store/encounterStore'
import type { EncounterEducationOutcome } from '@/types/encounter'
import type { PokemonDto } from '@/types/pokemon'

const ERROR_HEADING = 'That encounter got stuck.'
const ERROR_BODY = 'Tap Try Again to keep exploring.'

function resolveSessionPokemon(speciesId: number): PokemonDto | null {
  try {
    return getPokemon(speciesId)
  } catch {
    return null
  }
}

function operandsFromEducation(education: EncounterEducationOutcome): {
  a: number
  b: number
  product: number
} {
  const [aRaw, bRaw] = education.factKey.split('x')
  const a = Number(aRaw)
  const b = Number(bRaw)
  return { a, b, product: education.expected }
}

export function EncounterOverlay() {
  const stage = useEncounterStore((state) => state.stage)
  const session = useEncounterStore((state) => state.session)
  const question = useEncounterStore((state) => state.question)
  const feedback = useEncounterStore((state) => state.feedback)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const pokemon = session ? resolveSessionPokemon(session.speciesId) : null
  const labelledBy =
    stage === 'recap'
      ? 'encounter-recap-heading'
      : stage === 'result'
        ? 'encounter-caught-heading'
        : stage === 'flee'
          ? 'encounter-flee-heading'
          : 'encounter-stage-content'

  const onBallShakeComplete = useCallback(() => {
    onShakeComplete()
  }, [])

  useEffect(() => {
    if (stage === 'idle') {
      const previous = previousFocusRef.current
      previousFocusRef.current = null
      if (previous?.isConnected) {
        previous.focus()
      }
      return
    }

    if (previousFocusRef.current === null) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      dialogRef.current?.focus()
    }
  }, [stage])

  useEffect(() => {
    if (stage !== 'idle' && stage !== 'error' && session && !pokemon) {
      useEncounterStore.getState().fail()
    }
  }, [stage, session, pokemon])

  if (stage === 'idle') {
    return null
  }

  const showError = stage === 'error' || !session || !pokemon
  const showQuestion =
    (stage === 'question' || stage === 'feedback') && question && pokemon
  const education = session?.education
  const showRecap = stage === 'recap' && education && pokemon
  const grade = session?.lastGrade

  return (
    <div
      ref={dialogRef}
      className="encounter-scrim absolute inset-0 z-20 flex flex-col items-center justify-center px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      tabIndex={-1}
    >
      <div id="encounter-stage-content" className="w-full max-w-sm">
        {showError || !session || !pokemon ? (
          <div className="flex flex-col gap-4">
            <EmptyState heading={ERROR_HEADING} body={ERROR_BODY} />
            <PixelButton
              variant="primary"
              className="w-full"
              onClick={() => useEncounterStore.getState().close()}
            >
              Try Again
            </PixelButton>
          </div>
        ) : stage === 'appear' ? (
          <AppearFlash
            pokemon={pokemon}
            rarity={session.rarity}
            shiny={session.shiny}
            onComplete={advanceFromAppear}
          />
        ) : showQuestion ? (
          <EducationQuestion
            pokemon={pokemon}
            question={question}
            feedback={feedback}
            onSubmit={submitAnswer}
          />
        ) : stage === 'timing' ? (
          <TimingBar
            pokemon={pokemon}
            captureBonus={session.captureBonus}
            attemptsUsed={session.attemptsUsed}
            sweetSpot={session.sweetSpot}
            rarity={session.rarity}
            shiny={session.shiny}
          />
        ) : stage === 'shake' && grade ? (
          <ShakeSequence
            key={`${session.attemptsUsed}:${grade}`}
            grade={grade}
            caught={session.lastCaught === true}
            chance={session.lastChance ?? 0}
            onComplete={onBallShakeComplete}
          />
        ) : stage === 'failBeat' ? (
          <FailBeat />
        ) : stage === 'result' ? (
          <CaughtCard
            pokemon={pokemon}
            shiny={session.shiny}
            onContinue={continueFromResult}
          />
        ) : stage === 'flee' ? (
          <FleeCard pokemon={pokemon} onContinue={continueFromFlee} />
        ) : showRecap && education ? (
          <RecapCard
            {...operandsFromEducation(education)}
            onContinue={dismissRecap}
          />
        ) : null}
      </div>
    </div>
  )
}
