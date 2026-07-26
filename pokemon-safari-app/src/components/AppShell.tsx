import { Outlet } from 'react-router-dom'
import { useUiStore } from '@/store'
import { BottomNav } from './BottomNav'
import { QuotaNote } from './QuotaNote'

const SAVE_RECOVERED_MESSAGE =
  "We couldn't read a saved game, so some progress may have reset. Your Pokémon data cache is fine."

export function AppShell() {
  const saveRecovered = useUiStore((s) => s.saveRecovered)
  const dismissSaveRecovered = useUiStore((s) => s.dismissSaveRecovered)

  return (
    <div className="mx-auto flex h-dvh max-h-dvh max-w-[480px] flex-col overflow-hidden bg-dominant text-text">
      {saveRecovered ? (
        <div className="z-20 shrink-0 px-4 pt-[max(8px,env(safe-area-inset-top))]">
          <QuotaNote
            message={SAVE_RECOVERED_MESSAGE}
            onDismiss={() => dismissSaveRecovered()}
          />
        </div>
      ) : null}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
