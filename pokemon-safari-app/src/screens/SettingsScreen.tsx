import { useState } from 'react'
import { clearAdaptiveStats } from '@/game/education/adaptiveStore'
import { PixelButton } from '@/components/PixelButton'
import { ScreenTitle } from '@/components/ScreenTitle'
import { clearSave } from '@/services/save'
import { cancelPendingSaveFlush } from '@/services/saveFlush'
import { useEncounterStore } from '@/store/encounterStore'
import { useDexStore } from '@/store/dexStore'
import { useExploreStore } from '@/store/exploreStore'

/** Wipe player progress keys and session stores, then reload. Keeps poke-cache. */
export function eraseProgress(): void {
  cancelPendingSaveFlush()
  useDexStore.setState({ dex: {}, saveSoftFail: false })
  useExploreStore.getState().reset()
  useEncounterStore.getState().reset()
  clearSave()
  clearAdaptiveStats()
  window.location.reload()
}

export function SettingsScreen() {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
      <ScreenTitle>Settings</ScreenTitle>
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
            <PixelButton variant="secondary" onClick={() => setConfirmOpen(false)}>
              Keep Progress
            </PixelButton>
            <PixelButton variant="destructive" onClick={eraseProgress}>
              Erase Progress
            </PixelButton>
          </div>
        </div>
      ) : null}
    </section>
  )
}
