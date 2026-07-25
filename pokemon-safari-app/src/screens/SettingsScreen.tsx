import { useState } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { PixelButton } from '@/components/PixelButton'
import { ScreenTitle } from '@/components/ScreenTitle'

export function SettingsScreen() {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
      <ScreenTitle>Settings</ScreenTitle>
      <EmptyState />
      <PixelButton variant="destructive" onClick={() => setConfirmOpen(true)}>
        Reset Save
      </PixelButton>

      {confirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-save-title"
          className="pixel-border fixed inset-x-4 top-1/3 z-20 mx-auto max-w-sm bg-dominant p-4 shadow-none"
        >
          <h2
            id="reset-save-title"
            className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] tracking-[0.02em] text-text"
          >
            Reset Save
          </h2>
          <p className="mt-3 font-[family-name:var(--font-body)] text-[16px] leading-[1.5] text-text">
            Erase your Safari progress on this device? This cannot be undone.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <PixelButton
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
            >
              Keep Progress
            </PixelButton>
            <PixelButton
              variant="destructive"
              onClick={() => {
                // Stub only — no localStorage writes in Phase 1 (T-01-06).
                setConfirmOpen(false)
              }}
            >
              Erase Progress
            </PixelButton>
          </div>
        </div>
      ) : null}
    </section>
  )
}
