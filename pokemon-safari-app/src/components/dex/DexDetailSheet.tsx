import { useEffect, useRef } from 'react'
import { PixelButton } from '@/components/PixelButton'
import type { DexEntry } from '@/types/save'

type DexDetailSheetProps = {
  speciesId: number
  entry: DexEntry | undefined
  onClose: () => void
}

/**
 * Modal overlay for a single dex entry (D-08, D-13).
 * Stub branch is leak-free: ??? copy only — no name, sprite, or flavor.
 * Caught branch is a minimal shell filled by 06-06.
 */
export function DexDetailSheet({ speciesId, entry, onClose }: DexDetailSheetProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const isCaught = entry?.firstCapturedAt != null
  const labelledBy = isCaught ? 'dex-detail-caught-heading' : 'dex-detail-stub-heading'

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
          <div className="flex flex-col gap-4">
            <h2
              id="dex-detail-caught-heading"
              className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] tracking-[0.02em] text-text"
            >
              #{String(speciesId).padStart(3, '0')}
            </h2>
            <PixelButton variant="primary" className="w-full" onClick={onClose}>
              Close
            </PixelButton>
          </div>
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
