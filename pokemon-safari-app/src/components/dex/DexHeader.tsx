import { ScreenTitle } from '@/components/ScreenTitle'
import { DEX_TYPE_FILTER_OPTIONS } from '@/data/dexFilterCopy'
import type { DexFilterState, DexStatusFilter } from '@/game/dexFilters'
import { GEN1_COUNT } from '@/services/pokeapi/keys'

type DexHeaderProps = {
  seen: number
  caught: number
  filter: DexFilterState
  onStatusChange: (status: DexStatusFilter) => void
  onTypeChange: (type: string | null) => void
}

const STATUS_OPTIONS: { value: DexStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'caught', label: 'Caught' },
  { value: 'missing', label: 'Missing' },
  { value: 'shiny', label: 'Shiny' },
]

function typeChipLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function FilterChip({
  pressed,
  label,
  onClick,
}: {
  pressed: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={[
        'shrink-0 rounded-[4px] border-2 px-2 py-1 font-[family-name:var(--font-label)] text-[12px] leading-tight',
        pressed
          ? 'border-accent bg-accent text-text'
          : 'border-muted/60 bg-dominant text-muted',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

/**
 * Sticky Seen/Caught counters + completion % (D-04, D-11, D-12).
 * Counts arrive pre-computed from pure selectors — header does not re-derive reveal rules.
 */
export function DexHeader({
  seen,
  caught,
  filter,
  onStatusChange,
  onTypeChange,
}: DexHeaderProps) {
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
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Dex status filter"
        >
          {STATUS_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              pressed={filter.status === opt.value}
              onClick={() => onStatusChange(opt.value)}
            />
          ))}
        </div>
        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
          role="group"
          aria-label="Dex type filter"
        >
          <FilterChip
            label="All types"
            pressed={filter.type === null}
            onClick={() => onTypeChange(null)}
          />
          {DEX_TYPE_FILTER_OPTIONS.map((type) => (
            <FilterChip
              key={type}
              label={typeChipLabel(type)}
              pressed={filter.type === type}
              onClick={() => onTypeChange(type)}
            />
          ))}
        </div>
      </div>
    </header>
  )
}
