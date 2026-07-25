import { useEffect, useState } from 'react'
import type { PokemonDto } from '@/types/pokemon'

type PokemonSpriteProps = {
  pokemon: PokemonDto
  shiny?: boolean
  size?: 64 | 96
  alt: string
}

/**
 * Gen 1 sprite primitive — `.pixelated` scaling, shiny URL, silhouette on missing/broken (D-07–D-09).
 */
export function PokemonSprite({
  pokemon,
  shiny = false,
  size = 96,
  alt,
}: PokemonSpriteProps) {
  const src = shiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default
  const [broken, setBroken] = useState(!src)

  useEffect(() => {
    setBroken(!src)
  }, [src])

  if (broken) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="pixelated bg-text/20"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <img
      className="pixelated"
      width={size}
      height={size}
      src={src!}
      alt={alt}
      draggable={false}
      onError={() => setBroken(true)}
    />
  )
}
