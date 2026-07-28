import { describe, expect, it } from 'vitest'
import {
  spellingWordByFactKey,
  spellingWords,
  spellingWordsByTier,
} from '@/data/spellingWords'
import type { Rng } from '@/utils/rng'
import type { AdaptiveStats } from './questionTypes'
import { selectSpellingFact } from './spellingSelection'

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

describe('selectSpellingFact', () => {
  it('selectSpellingFact returns a bank factKey', () => {
    const key = selectSpellingFact(stubRng([0, 0]), {})
    expect(spellingWords.some((w) => w.factKey === key)).toBe(true)
  })

  it('selectSpellingFact draws challenge when tier roll < challenge probability', () => {
    const key = selectSpellingFact(stubRng([0.1, 0]), {})
    const word = spellingWordByFactKey(key)!
    expect(word.tier).toBe('challenge')
  })

  it('selectSpellingFact draws early when tier roll >= challenge probability', () => {
    const key = selectSpellingFact(stubRng([0.3, 0]), {})
    const word = spellingWordByFactKey(key)!
    expect(word.tier).toBe('early')
  })

  it('selectSpellingFact prefers a heavily missed word within the chosen tier', () => {
    const challenge = spellingWordsByTier('challenge')
    const target = challenge[0]!.factKey
    const stats: AdaptiveStats = { [target]: { correct: 0, incorrect: 20 } }
    let hits = 0
    for (let n = 0; n < 40; n++) {
      const key = selectSpellingFact(stubRng([0.05, 0.01 + n * 0.001]), stats)
      if (key === target) hits++
    }
    expect(hits).toBeGreaterThan(5)
  })

  it('selectSpellingFact excludes last key when other keys exist in tier', () => {
    const challenge = spellingWordsByTier('challenge')
    const exclude = challenge[0]!.factKey
    const key = selectSpellingFact(stubRng([0.05, 0]), {}, exclude)
    expect(key).not.toBe(exclude)
  })
})
