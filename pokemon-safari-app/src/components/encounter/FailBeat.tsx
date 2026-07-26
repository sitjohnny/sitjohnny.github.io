import { captureCopy } from '@/data/educationConfig'

/**
 * Brief fail beat between a broke-free shake and remounted timing (D-26) — no Try Again gate.
 */
export function FailBeat() {
  return (
    <div className="gba-dialog flex w-full flex-col items-center justify-center gap-2 p-6 text-center">
      <p
        aria-live="polite"
        className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] text-text"
      >
        {captureCopy.failBeat}
      </p>
    </div>
  )
}
