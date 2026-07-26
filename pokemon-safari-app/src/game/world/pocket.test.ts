import { describe, expect, it } from 'vitest'
import { WORLD_SEED } from '@/data/worldConfig'
import { pocketAt } from './pocket'

describe('pocketAt', () => {
  it('is deterministic for the same seed and coords', () => {
    expect(pocketAt(WORLD_SEED, 10, -7)).toBe(pocketAt(WORLD_SEED, 10, -7))
    expect(pocketAt(WORLD_SEED, 42, 99)).toBe(pocketAt(WORLD_SEED, 42, 99))
  })

  it('produces at least two distinct pockets on a small grid for WORLD_SEED', () => {
    const seen = new Set<string>()
    for (let y = -30; y <= 30; y++) {
      for (let x = -30; x <= 30; x++) {
        seen.add(pocketAt(WORLD_SEED, x, y))
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(2)
  })
})
