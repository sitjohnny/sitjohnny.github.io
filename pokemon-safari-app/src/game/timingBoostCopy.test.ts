import { describe, expect, it } from 'vitest'
import { timingBoostLabel } from '@/game/timingBoostCopy'

describe('timingBoostLabel', () => {
  it('formats perfect as +25% from captureModifiers.timing', () => {
    expect(timingBoostLabel('perfect')).toBe('Timing Perfect +25%')
  })

  it('formats miss as -5% from captureModifiers.timing', () => {
    expect(timingBoostLabel('miss')).toBe('Timing Miss -5%')
  })
})
