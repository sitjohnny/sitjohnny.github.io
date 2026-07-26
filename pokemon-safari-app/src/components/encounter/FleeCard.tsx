import { PixelButton } from '@/components/PixelButton'
import { PokemonSprite } from '@/components/PokemonSprite'
import { captureCopy } from '@/data/educationConfig'
import type { PokemonDto } from '@/types/pokemon'

type FleeCardProps = {
  pokemon: PokemonDto
  onContinue: () => void
}

/**
 * Kind flee card after three failed throws (D-04 / D-28) — gba-dialog shell, never destructive chrome.
 * Copy contract: "It got away!" / "That’s okay — you’ll find another!" via captureCopy (DATA-03).
 */
export function FleeCard({ pokemon, onContinue }: FleeCardProps) {
  return (
    <div className="gba-dialog flex w-full flex-col items-center gap-4 p-6 text-center">
      <PokemonSprite pokemon={pokemon} size={96} alt={pokemon.name} />
      <h2
        id="encounter-flee-heading"
        className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] text-text"
      >
        {/* It got away! */}
        {captureCopy.fleeHeading}
      </h2>
      <p
        aria-live="polite"
        className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text"
      >
        {/* That’s okay — you’ll find another! */}
        {captureCopy.fleeBody}
      </p>
      <PixelButton variant="primary" className="w-full" onClick={onContinue}>
        {captureCopy.continueCta}
      </PixelButton>
    </div>
  )
}
