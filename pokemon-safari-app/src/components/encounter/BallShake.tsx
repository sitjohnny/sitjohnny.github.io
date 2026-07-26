import { useEffect, useState } from 'react'
import { encounterTimingMs } from '@/data/rates'
import { prefersReducedMotion } from '@/hooks/useMapCamera'
import ballClosed from '@/assets/encounter/ball-closed.png'
import ballMidOpen from '@/assets/encounter/ball-mid-open.png'
import ballFullOpen from '@/assets/encounter/ball-full-open.png'

type BallShakeProps = {
  caught: boolean
  onComplete: () => void
}

type Phase = 'shaking' | 'resolve-caught' | 'resolve-mid-open' | 'resolve-full-open'

/** Catch always gets 3 shakes; escape randomizes 1–3 for flavor suspense. */
export function shakeCountFor(caught: boolean): 1 | 2 | 3 {
  if (caught) return 3
  return (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3
}

function spriteFor(phase: Phase): string {
  if (phase === 'resolve-mid-open') return ballMidOpen
  if (phase === 'resolve-full-open') return ballFullOpen
  return ballClosed
}

/**
 * Flavor shakes to a pre-resolved caught flag (D-30 / D-31). Never rolls capture.
 * Fail ending opens the ball (mid → full hold) before onComplete → fail beat.
 */
export function BallShake({ caught, onComplete }: BallShakeProps) {
  const reducedMotion = prefersReducedMotion()
  const [shakes] = useState(() => shakeCountFor(caught))
  const [phase, setPhase] = useState<Phase>('shaking')
  /** While shaking (and not reduced), true only during each `shakeOnce` window. */
  const [rocking, setRocking] = useState(() => !reducedMotion)
  /** Alternate rock direction each shake: ltr = left→right, rtl = right→left. */
  const [rockDir, setRockDir] = useState<'ltr' | 'rtl'>('ltr')

  useEffect(() => {
    setPhase('shaking')
    setRockDir('ltr')
    let cancelled = false
    const timers: number[] = []

    const once = reducedMotion
      ? encounterTimingMs.reducedShakeOnce
      : encounterTimingMs.shakeOnce
    const gap = reducedMotion
      ? encounterTimingMs.reducedShakeGap
      : encounterTimingMs.shakeGap

    const schedule = (delay: number, fn: () => void) => {
      const id = window.setTimeout(() => {
        if (!cancelled) fn()
      }, delay)
      timers.push(id)
    }

    const beginResolve = () => {
      setRocking(false)
      if (caught) {
        setPhase('resolve-caught')
        schedule(
          reducedMotion
            ? encounterTimingMs.reducedShakeResolve
            : encounterTimingMs.shakeResolve,
          onComplete,
        )
        return
      }
      if (reducedMotion) {
        setPhase('resolve-full-open')
        schedule(encounterTimingMs.reducedShakeResolve, onComplete)
        return
      }
      setPhase('resolve-mid-open')
      schedule(encounterTimingMs.shakeOpen, () => {
        setPhase('resolve-full-open')
        schedule(encounterTimingMs.shakeEscapeHold, onComplete)
      })
    }

    // Distinct rocks with neutral gaps: rock for `once`, idle `gap`, repeat.
    // Direction flips each cycle so consecutive shakes mirror (L→R, R→L, …).
    let remaining = shakes
    let nextDir: 'ltr' | 'rtl' = 'ltr'
    const runShakeCycle = () => {
      if (reducedMotion) {
        setRocking(false)
        schedule(once, () => {
          remaining -= 1
          if (remaining <= 0) beginResolve()
          else schedule(gap, runShakeCycle)
        })
        return
      }
      setRockDir(nextDir)
      setRocking(true)
      schedule(once, () => {
        setRocking(false)
        remaining -= 1
        if (remaining <= 0) {
          beginResolve()
          return
        }
        nextDir = nextDir === 'ltr' ? 'rtl' : 'ltr'
        schedule(gap, runShakeCycle)
      })
    }
    runShakeCycle()

    return () => {
      cancelled = true
      for (const id of timers) window.clearTimeout(id)
    }
  }, [caught, onComplete, reducedMotion, shakes])

  const onceMs = reducedMotion
    ? encounterTimingMs.reducedShakeOnce
    : encounterTimingMs.shakeOnce

  return (
    <div className="gba-dialog flex w-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div
        aria-hidden="true"
        className={[
          'relative flex h-16 w-16 items-center justify-center',
          rocking ? 'ball-rock' : '',
          rocking && rockDir === 'rtl' ? 'ball-rock--rtl' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        data-shakes={shakes}
        data-caught={caught ? 'true' : 'false'}
        data-ending={caught ? 'caught' : 'broke-free'}
        data-phase={phase}
        data-rock-dir={rocking ? rockDir : undefined}
        style={
          rocking
            ? { animationDuration: `${onceMs}ms`, animationIterationCount: 1 }
            : undefined
        }
      >
        <img
          src={spriteFor(phase)}
          alt=""
          draggable={false}
          className="pixelated h-16 w-16"
        />
        {phase === 'resolve-caught'
          ? [0, 1, 2, 3].map((i) => (
              <span
                key={i}
                data-sparkle={i}
                className={['ball-sparkle', reducedMotion ? 'ball-sparkle--static' : '']
                  .filter(Boolean)
                  .join(' ')}
              />
            ))
          : null}
      </div>
      <p aria-live="polite" className="sr-only">
        {caught ? 'Caught' : 'Broke free'}
      </p>
    </div>
  )
}
