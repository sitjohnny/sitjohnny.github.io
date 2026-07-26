import { useRef } from 'react'
import { PixelButton } from '@/components/PixelButton'
import { PokemonSprite } from '@/components/PokemonSprite'
import { captureCopy } from '@/data/educationConfig'
import { capture } from '@/hooks/useEncounterFlow'
import type { PokemonDto } from '@/types/pokemon'

type TimingBarProps = {
  pokemon: PokemonDto
  captureBonus: number
  attemptsUsed: number
  /** Frozen indicator position when Capture fires; default center for MVP shell. */
  position?: number
}

/**
 * Happy-path timing shell (D-15 / D-18 / D-24). Ping-pong polish lands in 05-03;
 * Capture uses a static/default position so the catch path is testable now.
 */
export function TimingBar({
  pokemon,
  captureBonus,
  attemptsUsed,
  position = 0.5,
}: TimingBarProps) {
  const positionRef = useRef(position)
  positionRef.current = position
  const bonusPercent = Math.round(captureBonus * 100)
  const hasBoost = captureBonus > 0
  const throwLabel = captureCopy.throwOf.replace('{n}', String(attemptsUsed + 1))
  // Math boost chip label from captureCopy (D-15 / D-24)
  const boostLabel = captureCopy.mathBoost.replace('{n}', String(bonusPercent))

  return (
    <div className="gba-dialog flex w-full flex-col items-center gap-4 p-6 text-center">
      <PokemonSprite pokemon={pokemon} size={96} alt={pokemon.name} />
      <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] text-text">
        {pokemon.name}
      </h2>
      <p className="font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-muted">
        {throwLabel}
      </p>
      <p
        className={[
          'font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-muted',
          hasBoost ? 'border-l-2 border-accent pl-3' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {boostLabel}
      </p>
      <div
        className="relative h-6 w-full overflow-hidden pixel-border bg-surface"
        aria-hidden="true"
        data-testid="timing-track"
      >
        <div
          className="absolute inset-y-0 w-1 bg-text"
          style={{ left: `${positionRef.current * 100}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <PixelButton
        variant="primary"
        className="w-full min-h-14"
        onClick={() => capture(positionRef.current)}
      >
        {captureCopy.captureCta}
      </PixelButton>
    </div>
  )
}
