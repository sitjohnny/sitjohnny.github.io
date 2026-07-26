import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  grassOutcomeWeights,
  educationCaptureBonus,
  encounterTimingMs,
} from '@/data/rates'
import { biomeEncounterTables } from '@/data/encounterTables'
import {
  multiplicationRange,
  doubleDigitMultiplication,
  adaptiveWeights,
  masteryThreshold,
  feedbackCopy,
} from '@/data/educationConfig'
import { biomeUnlockThresholds } from '@/data/unlocks'
import { dailyRewardAmounts } from '@/data/dailyRewards'
import { captureModifiers } from '@/data/captureModifiers'

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function listSourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      out.push(...listSourceFiles(full))
      continue
    }
    if (!/\.(tsx?)$/.test(name)) continue
    if (/\.test\.tsx?$/.test(name)) continue
    out.push(full)
  }
  return out
}

function stripCommentLines(source: string): string {
  return source
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim()
      return !(trimmed.startsWith('//') || trimmed.startsWith('*'))
    })
    .join('\n')
}

describe('DATA-03 config surface', () => {
  it('exports grassOutcomeWeights with MAP-03 integer weights summing to 100', () => {
    expect(Object.keys(grassOutcomeWeights).sort()).toEqual(
      ['item', 'legendary', 'nothing', 'pokemon', 'rare'].sort(),
    )
    expect(grassOutcomeWeights.pokemon).toBe(45)
    expect(grassOutcomeWeights.nothing).toBe(25)
    expect(grassOutcomeWeights.item).toBe(20)
    expect(grassOutcomeWeights.rare).toBe(8)
    expect(grassOutcomeWeights.legendary).toBe(2)
    const total = Object.values(grassOutcomeWeights).reduce((a, b) => a + b, 0)
    expect(total).toBe(100)
    for (const w of Object.values(grassOutcomeWeights)) {
      expect(Number.isInteger(w)).toBe(true)
    }
  })

  it('exports educationCaptureBonus and encounterTimingMs knobs', () => {
    expect(educationCaptureBonus.correct).toBe(0.15)
    expect(educationCaptureBonus.incorrect).toBe(0)
    for (const key of [
      'appearFlash',
      'spriteReveal',
      'feedbackHold',
      'reducedFeedbackHold',
      'itemToast',
    ] as const) {
      expect(typeof encounterTimingMs[key]).toBe('number')
    }
  })

  it('exports biomeEncounterTables.forest rarity pools', () => {
    expect(Array.isArray(biomeEncounterTables.forest.common)).toBe(true)
    expect(Array.isArray(biomeEncounterTables.forest.rare)).toBe(true)
    expect(Array.isArray(biomeEncounterTables.forest.legendary)).toBe(true)
  })

  it('exports education adaptive knobs and copy with {boost} placeholder', () => {
    expect(multiplicationRange).toEqual({ min: 1, max: 9 })
    expect(doubleDigitMultiplication).toEqual({ min: 10, max: 20, probability: 0.2 })
    expect(typeof adaptiveWeights.starterWeight).toBe('number')
    expect(typeof adaptiveWeights.missBonus).toBe('number')
    expect(typeof adaptiveWeights.correctPenalty).toBe('number')
    expect(typeof adaptiveWeights.minWeight).toBe('number')
    expect(typeof adaptiveWeights.masteredReviewWeight).toBe('number')
    expect(typeof masteryThreshold.accuracy).toBe('number')
    expect(typeof masteryThreshold.minAttempts).toBe('number')
    expect(feedbackCopy.correct.length).toBeGreaterThan(0)
    expect(feedbackCopy.incorrect.length).toBeGreaterThan(0)
    expect(feedbackCopy.correctSuffix).toContain('{boost}')
    expect(feedbackCopy.incorrectSuffix.length).toBeGreaterThan(0)
    expect(feedbackCopy.correctSuffix).not.toMatch(/\b15\b/)
  })

  it('exports unlock thresholds, daily rewards, and capture modifiers', () => {
    expect(biomeUnlockThresholds.lake).toBe(10)
    expect(biomeUnlockThresholds.mountain).toBe(30)
    expect(typeof dailyRewardAmounts.pokeball).toBe('number')
    expect(typeof dailyRewardAmounts.greatball).toBe('number')
    expect(typeof dailyRewardAmounts.berry).toBe('number')
    expect(typeof captureModifiers).toBe('object')
    expect(captureModifiers).not.toBeNull()
  })
})

describe('DATA-03 rate-literal policy', () => {
  it('keeps rate decimals and percent strings out of components and screens', () => {
    const dirs = [join(srcRoot, 'components'), join(srcRoot, 'screens')]
    const rateLiteral =
      /(?<![\w.])(?:0\.45|0\.25|0\.2|0\.08|0\.02|0\.15)(?![\w.])|45%|25%|20%|8%|2%|15%/

    for (const dir of dirs) {
      for (const file of listSourceFiles(dir)) {
        const body = stripCommentLines(readFileSync(file, 'utf8'))
        expect(body, `${file} must not hardcode rate literals`).not.toMatch(rateLiteral)
      }
    }
  })

  it('forbids Math.random( under src/game/', () => {
    const gameDir = join(srcRoot, 'game')
    if (!existsSync(gameDir)) return
    for (const file of listSourceFiles(gameDir)) {
      const body = stripCommentLines(readFileSync(file, 'utf8'))
      expect(body, `${file} must not call Math.random(`).not.toMatch(/Math\.random\s*\(/)
    }
  })
})
