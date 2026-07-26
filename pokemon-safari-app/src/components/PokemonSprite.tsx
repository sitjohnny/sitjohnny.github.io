import { useEffect, useState } from 'react'
import type { PokemonDto } from '@/types/pokemon'

type PokemonSpriteProps = {
  pokemon: PokemonDto
  shiny?: boolean
  variant?: 'pixel' | 'artwork'
  size?: 64 | 96 | 128
  alt: string
  /** Uncaught dex tiles pass true → `.sprite-silhouette` on the img (D-02 / D-07). */
  silhouette?: boolean
  /** Grid tiles pass 'lazy' — 151 hotlinked images (T-06-11). */
  loading?: 'lazy' | 'eager'
}

/**
 * Gen 1 sprite primitive — `.pixelated` scaling, shiny URL, silhouette on missing/broken (D-07–D-09).
 */
function resolveSpriteSrc(
  sprites: PokemonDto['sprites'],
  shiny: boolean,
  variant: 'pixel' | 'artwork',
): string | null {
  if (shiny) {
    return sprites.front_shiny ?? sprites.front_default
  }
  if (variant === 'artwork') {
    return sprites.official_artwork ?? sprites.front_default
  }
  return sprites.front_default
}

export function PokemonSprite({
  pokemon,
  shiny = false,
  variant = 'pixel',
  size = 96,
  alt,
  silhouette = false,
  loading,
}: PokemonSpriteProps) {
  const src = resolveSpriteSrc(pokemon.sprites, shiny, variant)
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
      className={['pixelated', silhouette ? 'sprite-silhouette' : '']
        .filter(Boolean)
        .join(' ')}
      width={size}
      height={size}
      src={src!}
      alt={alt}
      draggable={false}
      loading={loading}
      onError={() => setBroken(true)}
    />
  )
}
