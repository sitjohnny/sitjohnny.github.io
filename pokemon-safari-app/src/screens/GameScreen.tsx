import { EmptyState } from '@/components/EmptyState'
import { ScreenTitle } from '@/components/ScreenTitle'

export function GameScreen() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
      <ScreenTitle>Game</ScreenTitle>
      <EmptyState />
    </section>
  )
}
