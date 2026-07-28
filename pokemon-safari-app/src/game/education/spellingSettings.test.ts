import { afterEach, describe, expect, it } from 'vitest'
import {
  SPELLING_ENABLED_KEY,
  loadSpellingEnabled,
  persistSpellingEnabled,
} from './spellingSettings'

afterEach(() => {
  localStorage.removeItem(SPELLING_ENABLED_KEY)
})

describe('spellingSettings', () => {
  it('loadSpellingEnabled defaults to true', () => {
    localStorage.removeItem(SPELLING_ENABLED_KEY)
    expect(loadSpellingEnabled()).toBe(true)
  })

  it('persistSpellingEnabled round-trips false', () => {
    persistSpellingEnabled(false)
    expect(loadSpellingEnabled()).toBe(false)
  })
})
