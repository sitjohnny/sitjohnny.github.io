import { describe, expect, it } from 'vitest'
import type { Rng } from '@/utils/rng'
import {
  pickSpellingHintIndices,
  rollSpellingHintRatio,
  spellingHintRevealCount,
} from './spellingHint'

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

describe('spellingHint', () => {
  it('spellingHintRevealCount keeps band and leaves a blank', () => {
    expect(spellingHintRevealCount(8, 0.25)).toBe(2)
    expect(spellingHintRevealCount(8, 0.33)).toBe(3)
    expect(spellingHintRevealCount(3, 0.33)).toBe(1)
    expect(spellingHintRevealCount(1, 0.3)).toBe(0)
    expect(spellingHintRevealCount(2, 0.3)).toBe(1)
  })

  it('pickSpellingHintIndices returns sorted unique indices', () => {
    const idxs = pickSpellingHintIndices(8, 3, stubRng([0.1, 0.5, 0.9]))
    expect(idxs).toHaveLength(3)
    expect(new Set(idxs).size).toBe(3)
    for (const i of idxs) {
      expect(i).toBeGreaterThanOrEqual(0)
      expect(i).toBeLessThan(8)
    }
  })

  it('rollSpellingHintRatio stays within config bounds', () => {
    expect(rollSpellingHintRatio(stubRng([0]))).toBeCloseTo(0.25)
    expect(rollSpellingHintRatio(stubRng([1]))).toBeCloseTo(0.33)
  })
})
