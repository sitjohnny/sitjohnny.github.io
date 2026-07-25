import { Link } from 'react-router-dom'
import { useUiStore } from '@/store'

export function HomeScreen() {
  const setLastRoute = useUiStore((s) => s.setLastRoute)

  return (
    <section className="home-meadow flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="home-brand-fade flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 shrink-0 rounded-sm bg-accent"
          />
          <h1 className="font-[family-name:var(--font-display)] text-[32px] font-bold leading-[1.15] tracking-[0.02em] text-text">
            Pokémon Safari
          </h1>
        </div>
        <p className="max-w-xs font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text">
          Walk the grass. Meet Pokémon. Fill your Pokédex.
        </p>
      </div>
      <Link
        to="/game"
        onClick={() => setLastRoute('/game')}
        className="touch-target pixel-border inline-flex items-center justify-center bg-accent px-4 py-3 font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text touch-manipulation transition-transform duration-[80ms] ease-out active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        Start Safari
      </Link>
    </section>
  )
}
