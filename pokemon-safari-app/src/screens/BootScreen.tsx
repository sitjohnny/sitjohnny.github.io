import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenTitle } from '@/components/ScreenTitle'
import { usePokemonCache } from '@/hooks/usePokemonCache'

/**
 * Boot prefetch UX — progress bar + count while Gen 1 loads (D-01, D-04).
 * Failure / Try again UI lands in 02-03.
 */
export function BootScreen() {
  const navigate = useNavigate()
  const { status, progress } = usePokemonCache()
  const done = progress.done
  const total = progress.total || 151
  const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0

  useEffect(() => {
    if (status === 'ready' || status === 'quota') {
      navigate('/', { replace: true })
    }
  }, [status, navigate])

  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
      <div className="flex w-full max-w-[320px] flex-col items-center gap-6">
        <ScreenTitle>Getting ready</ScreenTitle>

        <p className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text">
          Catching them all… {done}/{total}
        </p>

        <div
          role="progressbar"
          aria-label="Catching them all"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          className="pixel-border h-4 w-full overflow-hidden bg-dominant"
        >
          <div
            className="h-full rounded-[4px] bg-accent transition-[width] duration-150 ease-out motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </section>
  )
}
