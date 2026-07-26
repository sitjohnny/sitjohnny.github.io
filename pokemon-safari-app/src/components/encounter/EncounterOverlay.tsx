import { useCallback, useEffect, useRef, useState } from 'react'
import { AppearFlash } from '@/components/encounter/AppearFlash'
import { BallShake } from '@/components/encounter/BallShake'
import { CaughtCard } from '@/components/encounter/CaughtCard'
import { EducationQuestion } from '@/components/encounter/EducationQuestion'
import { GradeFlash } from '@/components/encounter/GradeFlash'
import { RecapCard } from '@/components/encounter/RecapCard'
import { TimingBar } from '@/components/encounter/TimingBar'
import { EmptyState } from '@/components/EmptyState'
import { PixelButton } from '@/components/PixelButton'
import { PokemonSprite } from '@/components/PokemonSprite'
import { captureCopy } from '@/data/educationConfig'
import {
  advanceFromAppear,
  continueFromFlee,
  continueFromResult,
  dismissRecap,
  resolveAfterShake,
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

/**
 * Minimal flee shell so failed third throws do not hang GameScreen (05-04 owns polish).
 */
function FleePlaceholder({
  pokemon,
  onContinue,
}: {
  pokemon: PokemonDto
  onContinue: () => void
}) {
  return (
    <div className="gba-dialog flex w-full flex-col items-center gap-4 p-6 text-center">
      <PokemonSprite pokemon={pokemon} size={96} alt={pokemon.name} />
      <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] text-text">
        {captureCopy.fleeHeading}
      </h2>
      <p className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text">
        {captureCopy.fleeBody}
      </p>
      <PixelButton variant="primary" className="w-full" onClick={onContinue}>
        {captureCopy.continueCta}
      </PixelButton>
    </div>
  )
}

export function EncounterOverlay() {
  const stage = useEncounterStore((state) => state.stage)
  const session = useEncounterStore((state) => state.session)
  const question = useEncounterStore((state) => state.question)
  const feedback = useEncounterStore((state) => state.feedback)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const [gradeFlashDone, setGradeFlashDone] = useState(false)
  const pokemon = session ? resolveSessionPokemon(session.speciesId) : null
  const labelledBy =
    stage === 'recap'
      ? 'encounter-recap-heading'
      : stage === 'result'
        ? 'encounter-caught-heading'
        : 'encounter-stage-content'

  // Reset GradeFlash → BallShake handoff whenever we enter shake.
  useEffect(() => {
    if (stage === 'shake') {
      setGradeFlashDone(false)
    }
  }, [stage])

  const onGradeFlashComplete = useCallback(() => {
    setGradeFlashDone(true)
  }, [])

  const onBallShakeComplete = useCallback(() => {
    resolveAfterShake()
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
            position={session.sweetSpot}
          />
        ) : stage === 'shake' && grade && !gradeFlashDone ? (
          <GradeFlash grade={grade} onComplete={onGradeFlashComplete} />
        ) : stage === 'shake' && gradeFlashDone ? (
          <BallShake
            caught={session.lastCaught === true}
            chance={session.lastChance ?? 0}
            onComplete={onBallShakeComplete}
          />
        ) : stage === 'result' ? (
          <CaughtCard pokemon={pokemon} onContinue={continueFromResult} />
        ) : stage === 'flee' ? (
          <FleePlaceholder pokemon={pokemon} onContinue={continueFromFlee} />
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
