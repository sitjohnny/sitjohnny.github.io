import { useEffect } from 'react'
import { captureCopy } from '@/data/educationConfig'
import { encounterTimingMs } from '@/data/rates'
import type { TimingGrade } from '@/game/timing'
import { timingBoostLabel } from '@/game/timingBoostCopy'
import { prefersReducedMotion } from '@/hooks/useMapCamera'

type GradeFlashProps = {
  grade: TimingGrade
  onComplete: () => void
}

/**
 * Brief Perfect! / Great! / Good! / Miss! flash then hands off to shake (D-14).
 * AppearFlash-style presentational timer — no capture roll here.
 * Copy comes from captureCopy.grades.
 */
export function GradeFlash({ grade, onComplete }: GradeFlashProps) {
  const reducedMotion = prefersReducedMotion()

  useEffect(() => {
    const delay = reducedMotion
      ? encounterTimingMs.reducedGradeFlash
      : encounterTimingMs.gradeFlash
    const timer = setTimeout(onComplete, delay)
    return () => clearTimeout(timer)
  }, [onComplete, reducedMotion])

  return (
    <div className="gba-dialog flex w-full flex-col items-center justify-center gap-2 p-6 text-center">
      <p
        aria-live="polite"
        className="font-[family-name:var(--font-display)] text-[32px] font-bold leading-[1.2] text-text"
      >
        {captureCopy.grades[grade]}
      </p>
      <p className="font-[family-name:var(--font-label)] text-[16px] font-medium leading-[1.3] text-muted">
        {timingBoostLabel(grade)}
      </p>
    </div>
  )
}
