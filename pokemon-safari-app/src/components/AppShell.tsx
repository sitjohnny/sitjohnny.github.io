import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-dominant text-text">
      <main className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
