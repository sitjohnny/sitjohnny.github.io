import { describe, expect, it } from 'vitest'
import { educationCaptureBonus } from '@/data/rates'
import { captureBonusFor, validateAnswer } from './answerValidator'
import type { EducationQuestion } from './questionTypes'

const q7x8: EducationQuestion = {
  category: 'multiplication',
  prompt: 'What is 7 × 8?',
  factKey: '7x8',
  a: 7,
  b: 8,
  expected: 56,
  recapLine: '7 × 8 = 56',
}

describe('answerValidator (D-11)', () => {
  it('validateAnswer accepts exact digit answer for 7 × 8', () => {
    expect(validateAnswer(q7x8, '56')).toEqual({
      ok: true,
      expected: 56,
      parsed: 56,
    })
  })

  it('validateAnswer trims leading/trailing whitespace', () => {
    expect(validateAnswer(q7x8, '56 ')).toEqual({
      ok: true,
      expected: 56,
      parsed: 56,
    })
    expect(validateAnswer(q7x8, ' 56')).toEqual({
      ok: true,
      expected: 56,
      parsed: 56,
    })
  })

  it('validateAnswer rejects wrong digit answer', () => {
    expect(validateAnswer(q7x8, '57')).toEqual({
      ok: false,
      expected: 56,
      parsed: 57,
    })
  })

  it('validateAnswer rejects non-digit forms with parsed null and never throws', () => {
    const rejects = ['', '   ', 'abc', '5.6', '-56', '5e1']
    for (const raw of rejects) {
      expect(() => validateAnswer(q7x8, raw)).not.toThrow()
      expect(validateAnswer(q7x8, raw)).toEqual({
        ok: false,
        expected: 56,
        parsed: null,
      })
    }
  })

  it('a very long digit string does not hang or produce Infinity', () => {
    const long = '9'.repeat(200)
    const result = validateAnswer(q7x8, long)
    expect(result.ok).toBe(false)
    expect(result.expected).toBe(56)
    if (result.parsed !== null) {
      expect(Number.isFinite(result.parsed)).toBe(true)
    }
  })

  it('captureBonusFor reads educationCaptureBonus from config', () => {
    expect(captureBonusFor({ ok: true, expected: 56, parsed: 56 })).toBe(
      educationCaptureBonus.correct,
    )
    expect(captureBonusFor({ ok: false, expected: 56, parsed: null })).toBe(
      educationCaptureBonus.incorrect,
    )
  })
})
