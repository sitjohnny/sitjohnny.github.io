import { useEffect } from 'react'
import { encounterTimingMs } from '@/data/rates'
import { prefersReducedMotion } from '@/hooks/useMapCamera'

type BallShakeProps = {
  caught: boolean
  /** Pre-resolved catch chance — drives 1–3 flavor shakes only (D-30). */
  chance: number
  onComplete: () => void
}

function shakeCountFor(chance: number): 1 | 2 | 3 {
  if (chance >= 0.75) return 3
  if (chance >= 0.4) return 2
  return 1
}

/**
 * Flavor shakes to a pre-resolved caught flag (D-30 / D-31). Never rolls capture.
 * Fail ending opens the ball briefly before onComplete → fail beat (D-33).
 */
export function BallShake({ caught, chance, onComplete }: BallShakeProps) {
  const reducedMotion = prefersReducedMotion()
  const shakes = shakeCountFor(chance)

  useEffect(() => {
    const once = reducedMotion
      ? encounterTimingMs.reducedShakeOnce
      : encounterTimingMs.shakeOnce
    const gap = reducedMotion
      ? encounterTimingMs.reducedShakeGap
      : encounterTimingMs.shakeGap
    const resolve = reducedMotion
      ? encounterTimingMs.reducedShakeResolve
      : encounterTimingMs.shakeResolve
    const total = shakes * once + Math.max(0, shakes - 1) * gap + resolve
    const timer = setTimeout(onComplete, total)
    return () => clearTimeout(timer)
  }, [caught, onComplete, reducedMotion, shakes])

  return (
    <div className="gba-dialog flex w-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div
        aria-hidden="true"
        className={[
          'pixel-border flex h-16 w-16 items-center justify-center bg-accent text-text',
          caught ? '' : 'ball-broke-free opacity-90',
        ]
          .filter(Boolean)
          .join(' ')}
        data-shakes={shakes}
        data-caught={caught ? 'true' : 'false'}
        data-ending={caught ? 'caught' : 'broke-free'}
      >
        {caught ? '●' : '○'}
      </div>
      <p aria-live="polite" className="sr-only">
        {caught ? 'Caught' : 'Broke free'}
      </p>
    </div>
  )
}
