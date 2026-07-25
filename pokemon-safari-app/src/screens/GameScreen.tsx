import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { PokemonSprite } from '@/components/PokemonSprite'
import { QuotaNote } from '@/components/QuotaNote'
import { ScreenTitle } from '@/components/ScreenTitle'
import { getPokemon, isCacheReady } from '@/services/pokeapi/cache'
import { useUiStore } from '@/store'

/**
 * Explore/Game — blocked until Gen 1 cache ready (D-02).
 * Ready path uses sync getPokemon only — no PokéAPI client imports (DATA-02).
 */
export function GameScreen() {
  const storeReady = useUiStore((s) => s.cacheReady)
  const quotaSoftFail = useUiStore((s) => s.quotaSoftFail)
  const setQuotaSoftFail = useUiStore((s) => s.setQuotaSoftFail)
  const ready = isCacheReady() || storeReady

  if (!ready) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
        <EmptyState
          heading="Safari is still packing…"
          body="Pokémon data is still loading. Tap below to watch progress, or visit Home and Settings anytime."
        />
        <Link
          to="/boot"
          className="touch-target pixel-border inline-flex items-center justify-center bg-accent px-4 py-3 font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text touch-manipulation transition-transform duration-[80ms] ease-out active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          See progress
        </Link>
      </section>
    )
  }

  const sample = (() => {
    try {
      return getPokemon(25)
    } catch {
      try {
        return getPokemon(1)
      } catch {
        return null
      }
    }
  })()

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
      <ScreenTitle>Game</ScreenTitle>
      <p className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text">
        Safari pack is ready — adventure starts next.
      </p>
      {sample ? (
        <PokemonSprite pokemon={sample} alt={sample.name} size={96} />
      ) : (
        <EmptyState />
      )}
      {quotaSoftFail ? (
        <QuotaNote onDismiss={() => setQuotaSoftFail(false)} />
      ) : null}
    </section>
  )
}
