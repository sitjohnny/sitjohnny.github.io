import { describe, expect, it } from 'vitest'
import { sanitizeFlavorText, selectFlavorText } from '@/services/pokeapi/client'

type FlavorEntry = {
  flavor_text: string
  language: { name: string }
  version: { name: string }
}

function entry(
  version: string,
  text: string,
  lang = 'en',
): FlavorEntry {
  return {
    flavor_text: text,
    language: { name: lang },
    version: { name: version },
  }
}

describe('selectFlavorText (D-15, D-16)', () => {
  it('prefers emerald English when present', () => {
    const entries = [
      entry('ruby', 'Ruby text.'),
      entry('emerald', 'Emerald naps in sunlight.'),
      entry('firered', 'FireRed text.'),
    ]
    expect(selectFlavorText(entries)).toBe('Emerald naps in sunlight.')
  })

  it('falls back ruby → sapphire → firered when emerald missing', () => {
    expect(
      selectFlavorText([
        entry('sapphire', 'Sapphire lore.'),
        entry('ruby', 'Ruby lore.'),
        entry('firered', 'FireRed lore.'),
      ]),
    ).toBe('Ruby lore.')

    expect(
      selectFlavorText([
        entry('firered', 'FireRed lore.'),
        entry('sapphire', 'Sapphire lore.'),
      ]),
    ).toBe('Sapphire lore.')

    expect(selectFlavorText([entry('firered', 'FireRed lore.')])).toBe('FireRed lore.')
  })

  it('falls back to any English entry, else null', () => {
    expect(selectFlavorText([entry('red', 'Red English.')])).toBe('Red English.')
    expect(selectFlavorText([entry('emerald', '日本語', 'ja')])).toBeNull()
    expect(selectFlavorText([])).toBeNull()
  })
})

describe('sanitizeFlavorText (D-17)', () => {
  it('collapses \\n, \\f, and whitespace runs', () => {
    const raw = 'BULBASAUR can be seen\nnapping.\fThere is a seed\ton its back.'
    expect(sanitizeFlavorText(raw)).toBe(
      'BULBASAUR can be seen napping. There is a seed on its back.',
    )
  })

  it('preserves capitalization and trims edges', () => {
    expect(sanitizeFlavorText('  Seed Grows.\n')).toBe('Seed Grows.')
  })
})
