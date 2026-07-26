import { describe, expect, it } from 'vitest'
import { formatRelativeDay } from '@/utils/relativeDay'

/** Local noon on 2026-07-26 — avoids DST midnight edge ambiguity. */
const NOW = new Date(2026, 6, 26, 12, 0, 0)

function localIso(y: number, m0: number, d: number, h = 15): string {
  return new Date(y, m0, d, h, 0, 0).toISOString()
}

describe('formatRelativeDay (D-20)', () => {
  it('same local calendar day → Today', () => {
    expect(formatRelativeDay(localIso(2026, 6, 26), NOW)).toBe('Today')
  })

  it('one local calendar day prior → Yesterday', () => {
    expect(formatRelativeDay(localIso(2026, 6, 25), NOW)).toBe('Yesterday')
  })

  it('2–6 days prior → N days ago', () => {
    expect(formatRelativeDay(localIso(2026, 6, 24), NOW)).toBe('2 days ago')
    expect(formatRelativeDay(localIso(2026, 6, 20), NOW)).toBe('6 days ago')
  })

  it('≥7 days prior → short local date', () => {
    const iso = localIso(2026, 6, 3)
    const expected = new Date(2026, 6, 3).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
    expect(formatRelativeDay(iso, NOW)).toBe(expected)
  })

  it('invalid ISO → Sometime', () => {
    expect(formatRelativeDay('not-a-date', NOW)).toBe('Sometime')
    expect(formatRelativeDay('', NOW)).toBe('Sometime')
  })

  it('near local midnight edges still uses calendar days', () => {
    const lateNow = new Date(2026, 6, 26, 0, 30, 0)
    const justBeforeMidnight = new Date(2026, 6, 25, 23, 45, 0).toISOString()
    expect(formatRelativeDay(justBeforeMidnight, lateNow)).toBe('Yesterday')

    const earlyIso = new Date(2026, 6, 26, 0, 5, 0).toISOString()
    expect(formatRelativeDay(earlyIso, lateNow)).toBe('Today')
  })
})
