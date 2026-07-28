import { useState } from 'react'
import { BallShake } from '@/components/encounter/BallShake'
import { GradeFlash } from '@/components/encounter/GradeFlash'
import type { TimingGrade } from '@/game/timing'

type ShakeSequenceProps = {
  grade: TimingGrade
  caught: boolean
  educationCorrect?: boolean
  onComplete: () => void
}

/**
 * Owns the GradeFlash → BallShake handoff for a single throw (D-14).
 *
 * `flashDone` is local state that starts `false` on every mount, so a fresh
 * mount per throw (the Overlay keys this on throw identity) structurally
 * guarantees GradeFlash paints before BallShake — the reset happens via remount
 * before paint, immune to the stale-flag leak of VERIFICATION Truth #8.
 *
 * Presentational only: the catch outcome is pre-resolved in the flow layer
 * before shake (D-31); this component never touches the store or rolls capture.
 */
export function ShakeSequence({
  grade,
  caught,
  educationCorrect = true,
  onComplete,
}: ShakeSequenceProps) {
  const [flashDone, setFlashDone] = useState(false)

  if (!flashDone) {
    return (
      <GradeFlash
        grade={grade}
        showTimingBoost={educationCorrect}
        onComplete={() => setFlashDone(true)}
      />
    )
  }

  return (
    <BallShake
      caught={caught}
      educationCorrect={educationCorrect}
      onComplete={onComplete}
    />
  )
}
