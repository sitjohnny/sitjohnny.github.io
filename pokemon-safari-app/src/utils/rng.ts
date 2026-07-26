// Injectable seeded RNG — UI and game logic must never call Math.random.

export type Rng = { next: () => number }

export function createRng(seed: number): Rng {
  let t = seed >>> 0
  return {
    next() {
      t = (t + 0x6d2b79f5) >>> 0
      let r = t
      r = Math.imul(r ^ (r >>> 15), r | 1)
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61)
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296
    },
  }
}

export function weightedPick<T extends string>(
  rng: Rng,
  entries: readonly { id: T; weight: number }[],
): T {
  const total = entries.reduce((s, e) => s + e.weight, 0)
  let r = rng.next() * total
  for (const e of entries) {
    r -= e.weight
    if (r < 0) return e.id
  }
  return entries[entries.length - 1]!.id
}

let defaultRng: Rng | null = null

/** Module singleton used by production callers; seeded from Date.now() on first use. */
export function getDefaultRng(): Rng {
  if (!defaultRng) {
    defaultRng = createRng(Date.now())
  }
  return defaultRng
}

/** Test-only override (mirrors resetCacheMemoryForTests convention). Pass null to restore. */
export function setDefaultRngForTests(rng: Rng | null): void {
  defaultRng = rng
}
