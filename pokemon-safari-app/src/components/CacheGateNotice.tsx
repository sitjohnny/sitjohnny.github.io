import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'

/**
 * Game-only cache gate (D-02). Shown instead of the explore surface until the
 * Gen 1 cache is ready; Home, Dex, Pack, and Settings stay reachable.
 */
export function CacheGateNotice() {
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
