type QuotaNoteProps = {
  onDismiss: () => void
  /** Override soft-fail body; default keeps Phase 2 poke-cache copy. */
  message?: string
}

const DEFAULT_MESSAGE =
  "Couldn't save your progress on this device. You can still play this visit — new catches may not stick."

/**
 * Non-blocking soft note when persist hits QuotaExceeded (D-06 / D-21).
 * Does not gate Explore — memory play remains allowed.
 */
export function QuotaNote({ onDismiss, message = DEFAULT_MESSAGE }: QuotaNoteProps) {
  return (
    <aside
      className="w-full max-w-[320px] border-l-4 border-accent bg-dominant px-3 py-3"
      role="status"
    >
      <p className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-muted">
        {message}
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
