import { useEffect } from 'react'
import { PokemonSprite } from '@/components/PokemonSprite'
import { encounterTimingMs } from '@/data/rates'
import { prefersReducedMotion } from '@/hooks/useMapCamera'
import type { RarityBand } from '@/types/encounter'
import type { PokemonDto } from '@/types/pokemon'

type AppearFlashProps = {
  pokemon: PokemonDto
  rarity: RarityBand
  shiny?: boolean
  onComplete: () => void
}

const RARITY_LABEL: Record<Exclude<RarityBand, 'common'>, string> = {
  rare: 'Rare!',
  legendary: 'Legendary!',
}

export function AppearFlash({
  pokemon,
  rarity,
  shiny = false,
  onComplete,
}: AppearFlashProps) {
  const reducedMotion = prefersReducedMotion()

  useEffect(() => {
    const delay = reducedMotion
      ? 0
      : encounterTimingMs.appearFlash + encounterTimingMs.spriteReveal
    const timer = setTimeout(onComplete, delay)
    return () => clearTimeout(timer)
  }, [onComplete, reducedMotion])

  return (
    <div className="gba-dialog relative flex w-full flex-col items-center gap-2 overflow-hidden p-6 text-center">
      {!reducedMotion ? (
        <div className="encounter-flash pointer-events-none absolute inset-0 z-10 bg-white" />
      ) : null}
      <PokemonSprite pokemon={pokemon} size={96} shiny={shiny} alt={pokemon.name} />
      <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] text-text">
        {pokemon.name}
      </h2>
      {rarity !== 'common' ? (
        <p className="font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-muted">
          {RARITY_LABEL[rarity]}
        </p>
      ) : null}
      <p aria-live="polite" className="font-[family-name:var(--font-body)] text-[16px]">
        A wild {pokemon.name} appeared!
      </p>
    </div>
  )
}
