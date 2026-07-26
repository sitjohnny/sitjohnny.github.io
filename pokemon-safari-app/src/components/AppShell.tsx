import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="mx-auto flex h-dvh max-h-dvh max-w-[480px] flex-col overflow-hidden bg-dominant text-text">
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
