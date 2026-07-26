import { PixelButton } from '@/components/PixelButton'
import { PokemonSprite } from '@/components/PokemonSprite'
import { captureCopy } from '@/data/educationConfig'
import type { PokemonDto } from '@/types/pokemon'

type CaughtCardProps = {
  pokemon: PokemonDto
  shiny?: boolean
  onContinue: () => void
}

/**
 * Gotcha result card (D-06 / D-32) — no dex / inventory UI.
 */
export function CaughtCard({ pokemon, shiny = false, onContinue }: CaughtCardProps) {
  const body = captureCopy.gotchaBody.replace('{Name}', pokemon.name)

  return (
    <div className="gba-dialog flex w-full flex-col items-center gap-4 p-6 text-center">
      <PokemonSprite pokemon={pokemon} size={96} shiny={shiny} alt={pokemon.name} />
      <h2
        id="encounter-caught-heading"
        className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] text-text"
      >
        {/* Gotcha! heading from captureCopy (D-32) */}
        {captureCopy.gotchaHeading}
      </h2>
      <p
        aria-live="polite"
        className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text"
      >
        {body}
      </p>
      {shiny ? (
        <p className="border-l-2 border-accent pl-3 font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-muted">
          {captureCopy.shiny}
        </p>
      ) : null}
      <PixelButton variant="primary" className="w-full" onClick={onContinue}>
        {captureCopy.continueCta}
      </PixelButton>
    </div>
  )
}
