import { PixelButton } from '@/components/PixelButton'
import { EncounterPokemonShowcase } from '@/components/encounter/EncounterPokemonShowcase'
import { captureCopy } from '@/data/educationConfig'
import { encounterDialogAccentProps } from '@/data/typeColors'
import type { PokemonDto } from '@/types/pokemon'

type FleeCardProps = {
  pokemon: PokemonDto
  shiny?: boolean
  onContinue: () => void
}

/**
 * Kind flee card after three failed throws (D-04 / D-28) — gba-dialog shell, never destructive chrome.
 * Heading/body come from captureCopy (DATA-03).
 */
export function FleeCard({ pokemon, shiny = false, onContinue }: FleeCardProps) {
  const accentProps = encounterDialogAccentProps(pokemon.types)

  return (
    <div
      className="gba-dialog flex w-full flex-col items-center gap-4 p-6 text-center"
      {...accentProps}
    >
      <EncounterPokemonShowcase pokemon={pokemon} shiny={shiny} />
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
