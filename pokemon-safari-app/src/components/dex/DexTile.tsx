import { PokemonSprite } from '@/components/PokemonSprite'
import { dexTileState } from '@/game/dex'
import { getPokemon } from '@/services/pokeapi/cache'
import type { PokemonDto } from '@/types/pokemon'
import type { DexEntry } from '@/types/save'

type DexTileProps = {
  speciesId: number
  entry: DexEntry | undefined
  onSelect: (speciesId: number) => void
  /** Optional pre-resolved DTO; falls back to the session cache (never fetches). */
  pokemon?: PokemonDto
}

/** Resolve from the in-memory cache without throwing when a DTO is absent (DATA-02). */
function tryGetPokemon(speciesId: number): PokemonDto | null {
  try {
    return getPokemon(speciesId)
  } catch {
    return null
  }
}

/**
 * Button tile driven purely by `dexTileState` (D-06, D-07, D-09, T-06-02).
 * Unknown tiles never expose a species name in the a11y tree or text — the
 * silhouette of the real cached sprite is the only visual cue.
 */
export function DexTile({ speciesId, entry, onSelect, pokemon }: DexTileProps) {
  const dto = pokemon ?? tryGetPokemon(speciesId)
  const tile = dexTileState(entry, speciesId, dto?.name ?? '')
  const num = String(speciesId).padStart(3, '0')
  const isUnknown = tile.kind === 'unknown'
  const accessibleName = isUnknown
    ? `Pokémon #${num}`
    : tile.shinyOwned
      ? `${tile.label}, shiny owned`
      : tile.label

  return (
    <button
      type="button"
      aria-label={accessibleName}
      onClick={() => onSelect(speciesId)}
      className={[
        'touch-target pixel-border relative flex flex-col items-center justify-center gap-1 bg-dominant p-1 touch-manipulation',
        'transition-transform duration-[80ms] ease-out active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100',
        !isUnknown ? 'dex-tile-caught' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dto ? (
        <PokemonSprite
          pokemon={dto}
          shiny={!isUnknown && tile.shinyOwned}
          silhouette={isUnknown}
          size={64}
          alt={accessibleName}
          loading="lazy"
        />
      ) : (
        <span
          role="img"
          aria-label={accessibleName}
          className="pixelated bg-text/20"
          style={{ width: 64, height: 64 }}
        />
      )}
      <span
        aria-hidden="true"
        className="font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-text"
      >
        #{num}
      </span>
      {tile.shinyOwned ? (
        <span
          aria-hidden="true"
          className="dex-sparkle ball-sparkle ball-sparkle--static"
        />
      ) : null}
    </button>
  )
}
