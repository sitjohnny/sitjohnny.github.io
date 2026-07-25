import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { PixelButton } from '@/components/PixelButton'
import { QuotaNote } from '@/components/QuotaNote'
import { ScreenTitle } from '@/components/ScreenTitle'
import { usePokemonCache } from '@/hooks/usePokemonCache'
import { GEN1_COUNT } from '@/services/pokeapi/keys'
import { useUiStore } from '@/store'

/**
 * Boot prefetch UX — progress (D-04), failure + Try again resume (D-05),
 * quota soft note (D-06), same loading copy on version mismatch (D-10).
 * Retry stays in-process (no full page refresh).
 */
export function BootScreen() {
  const navigate = useNavigate()
  const { status, progress, retry } = usePokemonCache()
  const setQuotaSoftFail = useUiStore((s) => s.setQuotaSoftFail)
  const done = progress.done
  const total = progress.total || GEN1_COUNT
  const pct = total > 0 ? Math.min(100, (done / total) * 100) : 0

  useEffect(() => {
    if (status === 'ready') {
      navigate('/', { replace: true })
    }
  }, [status, navigate])

  if (status === 'error') {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
        <div className="flex w-full max-w-[320px] flex-col items-center gap-6">
          <EmptyState
            heading="Couldn’t catch the Pokédex data"
            body="Check your connection, then tap Try again. We’ll keep what we already caught."
          />
          <PixelButton variant="primary" onClick={retry}>
            Try again
          </PixelButton>
        </div>
      </section>
    )
  }

  if (status === 'quota') {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
        <div className="flex w-full max-w-[320px] flex-col items-center gap-6">
          <ScreenTitle>Getting ready</ScreenTitle>
          <p className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text">
            Catching them all… {done}/{total}
          </p>
          <QuotaNote
            onDismiss={() => {
              setQuotaSoftFail(false)
              navigate('/', { replace: true })
            }}
          />
        </div>
      </section>
    )
  }

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
