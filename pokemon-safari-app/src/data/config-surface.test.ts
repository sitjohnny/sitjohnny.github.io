import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  grassOutcomeWeights,
  educationCaptureBonus,
  encounterTimingMs,
  shinyRate,
  dexSaveDebounceMs,
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
import { timingBar } from '@/data/timingBar'
import { primaryTypeAccentStyle, primaryTypeColor, typeColors } from '@/data/typeColors'

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
  it('exports grassOutcomeWeights with 1% legendary among Pokémon outcomes', () => {
    expect(Object.keys(grassOutcomeWeights).sort()).toEqual(
      ['legendary', 'nothing', 'pokemon', 'rare'].sort(),
    )
    expect(grassOutcomeWeights.pokemon).toBe(80)
    expect(grassOutcomeWeights.nothing).toBe(45)
    expect(grassOutcomeWeights.rare).toBe(19)
    expect(grassOutcomeWeights.legendary).toBe(1)
    expect('item' in grassOutcomeWeights).toBe(false)

    const pokemonTotal =
      grassOutcomeWeights.pokemon +
      grassOutcomeWeights.rare +
      grassOutcomeWeights.legendary
    expect(pokemonTotal).toBe(100)
    expect(grassOutcomeWeights.legendary / pokemonTotal).toBe(0.01)

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
      'timingFreezeHold',
      'reducedTimingFreezeHold',
      'gradeFlash',
      'reducedGradeFlash',
      'failBeat',
      'reducedFailBeat',
      'shakeOnce',
      'reducedShakeOnce',
      'shakeGap',
      'reducedShakeGap',
      'shakeResolve',
      'reducedShakeResolve',
      'shakeOpen',
      'shakeEscapeHold',
    ] as const) {
      expect(typeof encounterTimingMs[key]).toBe('number')
    }
  })

  it('forest encounter pools partition Gen 1 (1..151) with no gaps or duplicates', () => {
    const { common, rare, legendary } = biomeEncounterTables.forest
    expect([...legendary].sort((a, b) => a - b)).toEqual([
      144, 145, 146, 150, 151,
    ])
    expect(new Set(rare).size).toBe(rare.length)
    expect(new Set(common).size).toBe(common.length)

    const all = [...common, ...rare, ...legendary]
    expect(all).toHaveLength(151)
    expect(new Set(all).size).toBe(151)
    expect([...all].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 151 }, (_, i) => i + 1),
    )
  })

  it('forest rare pool matches the approved finals / cool list', () => {
    const expectedRare = [
      3, 6, 9, 12, 15, 18, 22, 24, 26, 28, 31, 34, 36, 38, 40, 45, 47, 49, 51, 53,
      55, 57, 59, 62, 65, 68, 71, 73, 76, 78, 80, 82, 85, 87, 89, 91, 94, 97, 99,
      101, 103, 105, 106, 107, 110, 112, 113, 115, 117, 119, 121, 122, 123, 124,
      125, 126, 127, 128, 130, 131, 132, 134, 135, 136, 137, 139, 141, 142, 143,
      149,
    ]
    expect([...biomeEncounterTables.forest.rare].sort((a, b) => a - b)).toEqual(
      expectedRare,
    )
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
    expect(Object.keys(captureModifiers.timing).sort()).toEqual(
      ['good', 'great', 'miss', 'perfect'].sort(),
    )
  })

  it('exports timingBar period, zones, and sweet-spot config', () => {
    expect(typeof timingBar.periodMs).toBe('number')
    expect(typeof timingBar.reducedMotionScale).toBe('number')
    expect(timingBar.zones.common).toBeDefined()
    expect(timingBar.zones.rare).toBeDefined()
    expect(timingBar.zones.legendary).toBeDefined()
    expect(timingBar.sweetSpotOffsets.length).toBeGreaterThanOrEqual(3)
  })

  it('exports steeper capture rarity bases (common easiest, legendary hardest)', () => {
    expect(captureModifiers.rarity).toEqual({
      common: 0.75,
      rare: 0.25,
      legendary: 0.05,
    })
    expect(captureModifiers.rarity.common).toBeGreaterThan(
      captureModifiers.rarity.rare,
    )
    expect(captureModifiers.rarity.rare).toBeGreaterThan(
      captureModifiers.rarity.legendary,
    )
  })

  it('exports steeper timingBar zones with common > rare > legendary widths', () => {
    expect(timingBar.zones.common).toEqual({
      perfect: 0.12,
      great: 0.32,
      good: 0.5,
    })
    expect(timingBar.zones.rare).toEqual({
      perfect: 0.04,
      great: 0.15,
      good: 0.26,
    })
    expect(timingBar.zones.legendary).toEqual({
      perfect: 0.02,
      great: 0.08,
      good: 0.14,
    })

    for (const key of ['perfect', 'great', 'good'] as const) {
      expect(timingBar.zones.common[key]).toBeGreaterThan(
        timingBar.zones.rare[key],
      )
      expect(timingBar.zones.rare[key]).toBeGreaterThan(
        timingBar.zones.legendary[key],
      )
    }
  })

  it('exports typeColors for Gen 1 types and primaryTypeColor helper', () => {
    const gen1Types = [
      'normal',
      'fire',
      'water',
      'electric',
      'grass',
      'ice',
      'fighting',
      'poison',
      'ground',
      'flying',
      'psychic',
      'bug',
      'rock',
      'ghost',
      'dragon',
    ]
    for (const name of gen1Types) {
      expect(typeColors[name]).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
    expect(primaryTypeColor(['fire', 'flying'])).toBe(typeColors.fire)
    expect(primaryTypeColor([])).toBe('#787878')
    expect(primaryTypeColor(['unknown'])).toBe('#787878')
    expect(primaryTypeAccentStyle(['water'])).toEqual({
      borderLeftWidth: 4,
      borderLeftStyle: 'solid',
      borderLeftColor: typeColors.water,
    })
  })

  it('exports shinyRate and dexSaveDebounceMs for Phase 6 dex (DATA-03)', () => {
    expect(typeof shinyRate).toBe('number')
    expect(shinyRate).toBeGreaterThan(0)
    expect(shinyRate).toBeLessThanOrEqual(1)
    expect(shinyRate).toBe(1 / 50)
    expect(typeof dexSaveDebounceMs).toBe('number')
    expect(dexSaveDebounceMs).toBeGreaterThan(0)
    expect(dexSaveDebounceMs).toBe(800)
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
