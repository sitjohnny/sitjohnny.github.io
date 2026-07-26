import { describe, expect, it } from 'vitest'
import { formatHeightM, formatWeightKg } from '@/game/formatPokemon'

describe('formatPokemon size formatters', () => {
  it('formats height in decimeters as meters with one decimal', () => {
    expect(formatHeightM(17)).toBe('1.7 m')
    expect(formatHeightM(7)).toBe('0.7 m')
  })

  it('formats weight in hectograms as kilograms with one decimal', () => {
    expect(formatWeightKg(905)).toBe('90.5 kg')
  })
})
