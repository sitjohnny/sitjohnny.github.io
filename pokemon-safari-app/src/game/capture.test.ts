import { describe, expect, it } from 'vitest'
import { captureModifiers } from '@/data/captureModifiers'
import { computeCatchChance, rollCapture } from '@/game/capture'
import { createRng, type Rng } from '@/utils/rng'

function stubRng(values: number[]): Rng {
  let i = 0
  return {
    next() {
      const v = values[i] ?? values[values.length - 1]!
      i += 1
      return v
    },
  }
}

describe('computeCatchChance', () => {
  it('sums rarity + education + timing + ball + berry then clamps to [0, 1] (D-22)', () => {
    const cfg = captureModifiers
    const chance = computeCatchChance({
      rarity: 'common',
      educationBonus: cfg.education.correct,
      educationCorrect: true,
      grade: 'perfect',
      ball: 'great',
      berry: true,
    })
    const expected =
      cfg.rarity.common +
      cfg.education.correct +
      cfg.timing.perfect +
      cfg.ball.great +
      cfg.berry
    expect(chance).toBe(Math.min(1, Math.max(0, expected)))
  })

  it('clamps sums above 1 and below 0, and NaN-safe clamps to 0', () => {
    expect(
      computeCatchChance({
        rarity: 'common',
        educationBonus: 10,
        educationCorrect: true,
        grade: 'perfect',
        ball: 'great',
        berry: true,
      }),
    ).toBe(1)

    expect(
      computeCatchChance({
        rarity: 'legendary',
        educationBonus: -10,
        educationCorrect: true,
        grade: 'miss',
      }),
    ).toBe(0)

    expect(
      computeCatchChance({
        rarity: 'common',
        educationBonus: Number.NaN,
        educationCorrect: true,
        grade: 'good',
      }),
    ).toBe(0)
  })

  it('defaults ball to poke and berry to false (D-23)', () => {
    const withDefaults = computeCatchChance({
      rarity: 'rare',
      educationBonus: 0,
      educationCorrect: true,
      grade: 'good',
    })
    const explicit = computeCatchChance({
      rarity: 'rare',
      educationBonus: 0,
      educationCorrect: true,
      grade: 'good',
      ball: 'poke',
      berry: false,
    })
    expect(withDefaults).toBe(explicit)
    expect(withDefaults).toBe(
      captureModifiers.rarity.rare +
        captureModifiers.timing.good +
        captureModifiers.ball.poke,
    )
  })

  it('Miss still yields a finite chance and can still catch when chance exceeds stub (D-07)', () => {
    const chance = computeCatchChance({
      rarity: 'common',
      educationBonus: captureModifiers.education.correct,
      educationCorrect: true,
      grade: 'miss',
    })
    expect(Number.isFinite(chance)).toBe(true)
    expect(chance).toBeGreaterThan(0)
    expect(rollCapture(stubRng([chance - 1e-9]), chance)).toBe(true)
  })

  it('equal grade yields equal chance across attempt indexes — no pity (D-25)', () => {
    const inputs = {
      rarity: 'rare' as const,
      educationBonus: captureModifiers.education.incorrect,
      educationCorrect: false,
      grade: 'great' as const,
    }
    // Attempt index is intentionally absent from CatchInputs — same inputs ⇒ same chance.
    expect(computeCatchChance(inputs)).toBe(computeCatchChance(inputs))
  })

  it('wrong education multiplies clamped chance by incorrectMultiplier (perfect zone)', () => {
    const correctChance = computeCatchChance({
      rarity: 'rare',
      educationBonus: 0,
      educationCorrect: true,
      grade: 'perfect',
    })
    const wrongChance = computeCatchChance({
      rarity: 'rare',
      educationBonus: captureModifiers.education.incorrect,
      educationCorrect: false,
      grade: 'perfect',
    })
    expect(correctChance).toBe(
      captureModifiers.rarity.rare + captureModifiers.timing.perfect,
    )
    expect(wrongChance).toBe(
      correctChance * captureModifiers.education.incorrectMultiplier,
    )
    expect(wrongChance).toBe(0.005)
  })
})

describe('rollCapture', () => {
  it('catches when rng.next() < chance and fails when >= chance', () => {
    const chance = 0.4
    expect(rollCapture(stubRng([chance - 1e-9]), chance)).toBe(true)
    expect(rollCapture(stubRng([chance]), chance)).toBe(false)
  })

  it('is pure for equal stubs and never touches localStorage', () => {
    const chance = 0.5
    const seq = [0.25]
    expect(rollCapture(stubRng(seq), chance)).toBe(rollCapture(stubRng(seq), chance))

    const setItem = localStorage.setItem.bind(localStorage)
    let touched = false
    localStorage.setItem = (...args: Parameters<typeof localStorage.setItem>) => {
      touched = true
      return setItem(...args)
    }
    try {
      rollCapture(stubRng([0.1]), chance)
      expect(touched).toBe(false)
    } finally {
      localStorage.setItem = setItem
    }
  })
})

describe('CATCH-05 distribution', () => {
  function catchRate(
    seed: number,
    n: number,
    inputs: Parameters<typeof computeCatchChance>[0],
  ): number {
    const rng = createRng(seed)
    const chance = computeCatchChance(inputs)
    let catches = 0
    for (let i = 0; i < n; i++) {
      if (rollCapture(rng, chance)) catches++
    }
    return catches / n
  }

  it('commons catch high and legendaries stay hard across two seeds × 10000 rolls', () => {
    const n = 10_000
    for (const seed of [42, 99]) {
      const commonRate = catchRate(seed, n, {
        rarity: 'common',
        educationBonus: captureModifiers.education.correct,
        educationCorrect: true,
        grade: 'good',
      })
      expect(commonRate).toBeGreaterThanOrEqual(0.7)

      const legendaryRate = catchRate(seed, n, {
        rarity: 'legendary',
        educationBonus: captureModifiers.education.incorrect,
        educationCorrect: false,
        grade: 'miss',
      })
      expect(legendaryRate).toBeLessThanOrEqual(0.2)
    }
  })
})
