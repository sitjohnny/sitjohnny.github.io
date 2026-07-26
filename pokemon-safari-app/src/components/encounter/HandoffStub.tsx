import { PixelButton } from '@/components/PixelButton'
import { PokemonSprite } from '@/components/PokemonSprite'
import { handoffCopy } from '@/data/educationConfig'
import type { PokemonDto } from '@/types/pokemon'

type HandoffStubProps = {
  pokemon: PokemonDto
  captureBonus: number
  onDismiss: () => void
}

export function HandoffStub({
  pokemon,
  captureBonus,
  onDismiss,
}: HandoffStubProps) {
  const bonusPercent = Math.round(captureBonus * 100)
  const hasBoost = captureBonus > 0

  return (
    <div className="gba-dialog flex w-full flex-col items-center gap-4 p-6 text-center">
      <PokemonSprite pokemon={pokemon} size={96} alt={pokemon.name} />
      <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] text-text">
        {handoffCopy.heading}
      </h2>
      <p className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text">
        {handoffCopy.body}
      </p>
      <p
        className={[
          'font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-muted',
          hasBoost ? 'border-l-2 border-accent pl-3' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        Catch boost: +{bonusPercent}%
      </p>
      <PixelButton variant="primary" className="w-full" onClick={onDismiss}>
        Got it
      </PixelButton>
    </div>
  )
}
