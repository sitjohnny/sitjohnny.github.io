import { useEffect, useRef, useState } from 'react'
import { PixelButton } from '@/components/PixelButton'
import { PokemonSprite } from '@/components/PokemonSprite'
import { getPokemon } from '@/services/pokeapi/cache'
import type { PokemonDto } from '@/types/pokemon'
import type { DexEntry } from '@/types/save'
import { formatRelativeDay } from '@/utils/relativeDay'

type DexDetailSheetProps = {
  speciesId: number
  entry: DexEntry | undefined
  onClose: () => void
}

function tryGetPokemon(speciesId: number): PokemonDto | null {
  try {
    return getPokemon(speciesId)
  } catch {
    return null
  }
}

/**
 * Modal overlay for a single dex entry (D-08, D-09, D-13, D-16, D-20).
 * Stub branch is leak-free: ??? copy only — no name, sprite, or flavor.
 * Caught branch reveals sprite, lore, meta, and optional shiny toggle.
 */
export function DexDetailSheet({ speciesId, entry, onClose }: DexDetailSheetProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const isCaught = entry?.firstCapturedAt != null
  const labelledBy = isCaught ? 'dex-detail-caught-heading' : 'dex-detail-stub-heading'
  const pokemon = isCaught ? tryGetPokemon(speciesId) : null
  const [showShiny, setShowShiny] = useState(() => Boolean(entry?.shinyOwned))

  useEffect(() => {
    setShowShiny(Boolean(entry?.shinyOwned))
  }, [speciesId, entry?.shinyOwned])

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogRef.current?.focus()

    return () => {
      const previous = previousFocusRef.current
      previousFocusRef.current = null
      if (previous?.isConnected) {
        previous.focus()
      }
    }
  }, [speciesId])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const num = String(speciesId).padStart(3, '0')

  return (
    <div
      ref={dialogRef}
      className="encounter-scrim absolute inset-0 z-20 flex flex-col items-center justify-center px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="gba-dialog w-full max-w-sm p-4">
        {isCaught ? (
          pokemon ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <PokemonSprite
                pokemon={pokemon}
                shiny={showShiny}
                size={96}
                alt={pokemon.name}
              />
              <div className="flex w-full flex-col gap-1">
                <h2
                  id="dex-detail-caught-heading"
                  className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] tracking-[0.02em] text-text"
                >
                  {pokemon.name}
                </h2>
                <p className="font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-muted">
                  #{num}
                </p>
              </div>
              {entry.shinyOwned ? (
                <PixelButton
                  variant="secondary"
                  className="w-full"
                  onClick={() => setShowShiny((v) => !v)}
                >
                  {showShiny ? 'Show normal' : 'Show shiny'}
                </PixelButton>
              ) : null}
              {showShiny && entry.shinyOwned ? (
                <p className="border-l-2 border-accent pl-3 font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-muted self-start">
                  Shiny!
                </p>
              ) : null}
              <p className="w-full font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text">
                {pokemon.flavorText ?? 'No Pokédex entry yet.'}
              </p>
              <dl className="flex w-full flex-col gap-2 text-left">
                <div>
                  <dt className="font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-muted">
                    Caught
                  </dt>
                  <dd className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text">
                    Caught: {entry.catchCount}
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">First seen</dt>
                  <dd className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text">
                    First seen: {formatRelativeDay(entry.firstEncounteredAt ?? '')}
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">First caught</dt>
                  <dd className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text">
                    First caught: {formatRelativeDay(entry.firstCapturedAt ?? '')}
                  </dd>
                </div>
              </dl>
              <PixelButton variant="primary" className="w-full" onClick={onClose}>
                Close
              </PixelButton>
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-center">
              <h2
                id="dex-detail-caught-heading"
                className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] tracking-[0.02em] text-text"
              >
                That entry couldn’t load.
              </h2>
              <p className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text">
                Pokémon data may still be packing. Visit Boot if the problem continues.
              </p>
              <PixelButton variant="primary" className="w-full" onClick={onClose}>
                Close
              </PixelButton>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-4 text-center">
            <h2
              id="dex-detail-stub-heading"
              className="font-[family-name:var(--font-display)] text-[32px] font-bold leading-[1.15] tracking-[0.02em] text-text"
            >
              ???
            </h2>
            <p className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text">
              Not caught yet. Catch one in the grass to reveal this entry.
            </p>
            <PixelButton variant="primary" className="w-full" onClick={onClose}>
              Close
            </PixelButton>
          </div>
        )}
      </div>
    </div>
  )
}
