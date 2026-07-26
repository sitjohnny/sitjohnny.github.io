import { describe, expect, it } from 'vitest'
import { timingBar } from '@/data/timingBar'
import { gradeAt, pingPong, sweetSpotFor } from '@/game/timing'

describe('gradeAt', () => {
  const sweetSpot = 0.62

  it('maps boundary probes around an off-center sweet spot for common', () => {
    const z = timingBar.zones.common
    expect(gradeAt(sweetSpot, sweetSpot, 'common')).toBe('perfect')
    expect(gradeAt(sweetSpot + z.perfect, sweetSpot, 'common')).toBe('perfect')
    expect(gradeAt(sweetSpot - z.perfect, sweetSpot, 'common')).toBe('perfect')
    expect(gradeAt(sweetSpot + z.perfect + 1e-9, sweetSpot, 'common')).toBe('great')
    expect(gradeAt(sweetSpot + z.great, sweetSpot, 'common')).toBe('great')
    expect(gradeAt(sweetSpot - z.great, sweetSpot, 'common')).toBe('great')
    expect(gradeAt(sweetSpot + z.great + 1e-9, sweetSpot, 'common')).toBe('good')
    expect(gradeAt(sweetSpot + z.good, sweetSpot, 'common')).toBe('good')
    expect(gradeAt(sweetSpot - z.good, sweetSpot, 'common')).toBe('good')
    expect(gradeAt(sweetSpot + z.good + 1e-9, sweetSpot, 'common')).toBe('miss')
    expect(gradeAt(0, sweetSpot, 'common')).toBe('miss')
  })

  it('maps legendary zones and keeps legendary perfect narrower than common (D-08)', () => {
    expect(timingBar.zones.legendary.perfect).toBeLessThan(timingBar.zones.common.perfect)

    const z = timingBar.zones.legendary
    expect(gradeAt(sweetSpot, sweetSpot, 'legendary')).toBe('perfect')
    expect(gradeAt(sweetSpot + z.perfect, sweetSpot, 'legendary')).toBe('perfect')
    expect(gradeAt(sweetSpot + z.perfect + 1e-9, sweetSpot, 'legendary')).toBe('great')
    expect(gradeAt(sweetSpot + z.great + 1e-9, sweetSpot, 'legendary')).toBe('good')
    expect(gradeAt(sweetSpot + z.good + 1e-9, sweetSpot, 'legendary')).toBe('miss')
  })

  it('keeps zone widths ordered common > rare > legendary (D-08)', () => {
    for (const key of ['perfect', 'great', 'good'] as const) {
      expect(timingBar.zones.common[key]).toBeGreaterThan(
        timingBar.zones.rare[key],
      )
      expect(timingBar.zones.rare[key]).toBeGreaterThan(
        timingBar.zones.legendary[key],
      )
    }
  })
})

describe('sweetSpotFor', () => {
  it('varies by attempt and stays inside config min/max (D-12)', () => {
    const a0 = sweetSpotFor(0)
    const a1 = sweetSpotFor(1)
    const a2 = sweetSpotFor(2)
    expect(new Set([a0, a1, a2]).size).toBeGreaterThan(1)
    for (const spot of [a0, a1, a2]) {
      expect(spot).toBeGreaterThanOrEqual(timingBar.sweetSpotMin)
      expect(spot).toBeLessThanOrEqual(timingBar.sweetSpotMax)
    }
  })
})

describe('pingPong', () => {
  it('triangle-waves 0 → 1 → 0 over one period', () => {
    const period = timingBar.periodMs
    expect(pingPong(0, period)).toBe(0)
    expect(pingPong(period / 4, period)).toBe(0.5)
    expect(pingPong(period / 2, period)).toBe(1)
    expect(pingPong((3 * period) / 4, period)).toBe(0.5)
  })
})
