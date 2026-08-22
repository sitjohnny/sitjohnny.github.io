import { afterEach, describe, expect, it } from 'vitest'
import {
  MATH_SETTINGS_KEY,
  clearMathEducationSettings,
  defaultMathEducationSettings,
  isUsableMathEducationSettings,
  loadMathEducationSettings,
  persistMathEducationSettings,
} from './mathSettings'

afterEach(() => {
  localStorage.removeItem(MATH_SETTINGS_KEY)
})

describe('mathSettings', () => {
  it('loadMathEducationSettings defaults to all operators and level 2 only', () => {
    localStorage.removeItem(MATH_SETTINGS_KEY)
    expect(loadMathEducationSettings()).toEqual(defaultMathEducationSettings())
    expect(loadMathEducationSettings().levels[2]).toBe(true)
    expect(loadMathEducationSettings().levels[1]).toBe(false)
  })

  it('persistMathEducationSettings round-trips a custom usable set', () => {
    const next = defaultMathEducationSettings()
    next.operators.addition = false
    next.levels[2] = false
    next.levels[1] = true
    expect(persistMathEducationSettings(next)).toBe(true)
    expect(loadMathEducationSettings()).toEqual(next)
  })

  it('persistMathEducationSettings rejects zero operators', () => {
    const bad = defaultMathEducationSettings()
    bad.operators = {
      addition: false,
      subtraction: false,
      multiplication: false,
      division: false,
    }
    expect(isUsableMathEducationSettings(bad)).toBe(false)
    expect(persistMathEducationSettings(bad)).toBe(false)
    expect(localStorage.getItem(MATH_SETTINGS_KEY)).toBeNull()
  })

  it('loadMathEducationSettings returns defaults for corrupt JSON', () => {
    localStorage.setItem(MATH_SETTINGS_KEY, '{not-json')
    expect(loadMathEducationSettings()).toEqual(defaultMathEducationSettings())
  })

  it('clearMathEducationSettings removes the key', () => {
    persistMathEducationSettings(defaultMathEducationSettings())
    clearMathEducationSettings()
    expect(localStorage.getItem(MATH_SETTINGS_KEY)).toBeNull()
  })
})
