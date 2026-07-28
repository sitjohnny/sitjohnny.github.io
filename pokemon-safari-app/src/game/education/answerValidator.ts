/**
 * Digit-only answer parsing and config-driven capture bonus (D-11 / D-24).
 *
 * Category-agnostic: bonus numerals live only in `@/data/rates`. Must stay free
 * of React, Zustand, browser globals, and feedback copy strings.
 */

import { educationCaptureBonus } from '@/data/rates'
import type { AnswerResult, EducationQuestion } from './questionTypes'

/** Cap so absurd digit strings cannot yield non-finite parsed values. */
const MAX_DIGIT_LENGTH = 15

const DIGITS_ONLY = /^\d+$/

function normalizeSpelling(raw: string): string | null {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return null
  const lettersOnly = trimmed.replace(/\s+/g, '')
  if (!/^[A-Za-z]+$/.test(lettersOnly)) return null
  return lettersOnly.toLowerCase()
}

export function validateAnswer(
  question: EducationQuestion,
  raw: string,
): AnswerResult {
  if (question.category === 'spelling') {
    const parsed = normalizeSpelling(raw)
    if (parsed === null) {
      return { ok: false, expected: question.expected, parsed: null }
    }
    return {
      ok: parsed === question.expected,
      expected: question.expected,
      parsed,
    }
  }

  const value = raw.trim()
  if (
    value.length === 0 ||
    value.length > MAX_DIGIT_LENGTH ||
    !DIGITS_ONLY.test(value)
  ) {
    return { ok: false, expected: question.expected, parsed: null }
  }
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) {
    return { ok: false, expected: question.expected, parsed: null }
  }
  return {
    ok: parsed === question.expected,
    expected: question.expected,
    parsed,
  }
}

export function captureBonusFor(result: AnswerResult): number {
  return result.ok
    ? educationCaptureBonus.correct
    : educationCaptureBonus.incorrect
}
