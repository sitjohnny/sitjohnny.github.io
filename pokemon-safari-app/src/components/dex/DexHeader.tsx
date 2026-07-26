import { ScreenTitle } from '@/components/ScreenTitle'
import { GEN1_COUNT } from '@/services/pokeapi/keys'

type DexHeaderProps = {
  seen: number
  caught: number
}

/**
 * Sticky Seen/Caught counters + completion % (D-04, D-11, D-12).
 * Counts arrive pre-computed from pure selectors — header does not re-derive reveal rules.
 */
export function DexHeader({ seen, caught }: DexHeaderProps) {
  const seenPct = Math.round((seen / GEN1_COUNT) * 100)
  const caughtPct = Math.round((caught / GEN1_COUNT) * 100)

  return (
    <header className="sticky top-0 z-10 bg-dominant px-4 pb-3 pt-[max(8px,env(safe-area-inset-top))]">
      <div className="flex flex-col gap-2">
        <ScreenTitle>Pokédex</ScreenTitle>
        <p className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text">
          Seen {seen}/{GEN1_COUNT} · Caught {caught}/{GEN1_COUNT}
        </p>
        <p className="font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-muted">
          {seenPct}% seen · {caughtPct}% caught
        </p>
        {caught === 0 ? (
          <p className="font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-muted">
            Catch Pokémon in the grass to fill your Pokédex.
          </p>
        ) : null}
      </div>
    </header>
  )
}
