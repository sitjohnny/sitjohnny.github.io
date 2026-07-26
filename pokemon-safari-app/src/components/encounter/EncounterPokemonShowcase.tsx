import { PokemonSprite } from '@/components/PokemonSprite'
import { TypeBadge } from '@/components/TypeBadge'
import type { PokemonDto } from '@/types/pokemon'

type EncounterPokemonShowcaseProps = {
  pokemon: PokemonDto
  shiny?: boolean
  size?: 64 | 96 | 128
}

/** Artwork sprite with type badges beneath — shared across encounter stages. */
export function EncounterPokemonShowcase({
  pokemon,
  shiny = false,
  size = 96,
}: EncounterPokemonShowcaseProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <PokemonSprite
        pokemon={pokemon}
        size={size}
        shiny={shiny}
        variant="artwork"
        alt={pokemon.name}
      />
      {pokemon.types.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-1">
          {pokemon.types.map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
