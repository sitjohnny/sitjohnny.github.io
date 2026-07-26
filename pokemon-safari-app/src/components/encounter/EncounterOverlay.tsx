import { useEffect, useRef } from 'react'
import { AppearFlash } from '@/components/encounter/AppearFlash'
import { EducationQuestion } from '@/components/encounter/EducationQuestion'
import { HandoffStub } from '@/components/encounter/HandoffStub'
import { EmptyState } from '@/components/EmptyState'
import { PixelButton } from '@/components/PixelButton'
import {
  advanceFromAppear,
  submitAnswer,
} from '@/hooks/useEncounterFlow'
import { getPokemon } from '@/services/pokeapi/cache'
import { useEncounterStore } from '@/store/encounterStore'
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

export function EncounterOverlay() {
  const stage = useEncounterStore((state) => state.stage)
  const session = useEncounterStore((state) => state.session)
  const question = useEncounterStore((state) => state.question)
  const feedback = useEncounterStore((state) => state.feedback)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const pokemon = session ? resolveSessionPokemon(session.speciesId) : null

  useEffect(() => {
    if (stage !== 'idle') {
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

  return (
    <div
      ref={dialogRef}
      className="encounter-scrim absolute inset-0 z-20 flex flex-col items-center justify-center px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="encounter-stage-content"
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
        ) : stage === 'handoff' ? (
          <HandoffStub
            pokemon={pokemon}
            captureBonus={session.captureBonus}
            onDismiss={() => useEncounterStore.getState().close()}
          />
        ) : null}
      </div>
    </div>
  )
}
