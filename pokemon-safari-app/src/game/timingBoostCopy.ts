import { captureModifiers } from '@/data/captureModifiers'
import type { TimingGrade } from '@/game/timing'

/** Single-sourced timing bonus copy from captureModifiers.timing (DATA-03). */
export function timingBoostLabel(grade: TimingGrade): string {
  const delta = captureModifiers.timing[grade]
  const pct = Math.round(delta * 100)
  const signed = pct >= 0 ? `+${pct}` : `${pct}`
  const title = grade.charAt(0).toUpperCase() + grade.slice(1)
  return `Timing ${title} ${signed}%`
}
