type QuotaNoteProps = {
  onDismiss: () => void
}

/**
 * Non-blocking soft note when poke-cache persist hits QuotaExceeded (D-06).
 * Does not gate Explore — memory play remains allowed.
 */
export function QuotaNote({ onDismiss }: QuotaNoteProps) {
  return (
    <aside
      className="w-full max-w-[320px] border-l-4 border-accent bg-dominant px-3 py-3"
      role="status"
    >
      <p className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-muted">
        Couldn’t save Pokémon data on this device. You can still play this visit.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="touch-target mt-3 font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text underline touch-manipulation"
      >
        Got it
      </button>
    </aside>
  )
}
