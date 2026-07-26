import { describe, expect, it } from 'vitest'
import {
  createRng,
  getDefaultRng,
  setDefaultRngForTests,
  weightedPick,
  type Rng,
} from '@/utils/rng'

function firstEight(rng: Rng): number[] {
  return Array.from({ length: 8 }, () => rng.next())
}

describe('createRng', () => {
  it('returns an object with a next function', () => {
    const rng = createRng(42)
    expect(typeof rng.next).toBe('function')
  })

  it('emits values in [0, 1)', () => {
    const values = firstEight(createRng(42))
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('is deterministic for the same seed and differs across seeds', () => {
    const a = firstEight(createRng(42))
    const b = firstEight(createRng(42))
    const c = firstEight(createRng(43))
    expect(a).toEqual(b)
    expect(c).not.toEqual(a)
  })
})

describe('weightedPick', () => {
  it("always returns 'a' when b has weight 0 for stub values across [0, 1)", () => {
    const entries = [
      { id: 'a' as const, weight: 1 },
      { id: 'b' as const, weight: 0 },
    ]
    for (const value of [0, 0.5, 0.999]) {
      const stub: Rng = { next: () => value }
      expect(weightedPick(stub, entries)).toBe('a')
    }
  })

  it('returns the last entry when the stub sits at the top of the range', () => {
    const entries = [
      { id: 'a' as const, weight: 1 },
      { id: 'b' as const, weight: 1 },
    ]
    const stub: Rng = { next: () => 0.999999 }
    expect(weightedPick(stub, entries)).toBe('b')
  })
})

describe('default rng seam', () => {
  it('setDefaultRngForTests injects a stub and null restores a real generator', () => {
    const stub: Rng = { next: () => 0.123 }
    setDefaultRngForTests(stub)
    expect(getDefaultRng()).toBe(stub)
    expect(getDefaultRng().next()).toBe(0.123)

    setDefaultRngForTests(null)
    const restored = getDefaultRng()
    expect(restored).not.toBe(stub)
    const v = restored.next()
    expect(v).toBeGreaterThanOrEqual(0)
    expect(v).toBeLessThan(1)
  })
})
