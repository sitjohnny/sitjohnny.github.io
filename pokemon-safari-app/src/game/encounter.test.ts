import { describe, expect, it } from 'vitest'
import { grassOutcomeWeights } from '@/data/rates'
import { biomeEncounterTables } from '@/data/encounterTables'
import {
  pickSpecies,
  rarityForOutcome,
  resolveCandidate,
  rollGrass,
} from '@/game/encounter'
import { createRng, type Rng } from '@/utils/rng'
import type { EncounterCandidateEvent } from '@/types/map'
import type { GrassOutcome } from '@/types/encounter'

const OUTCOMES = ['pokemon', 'nothing', 'item', 'rare', 'legendary'] as const satisfies readonly GrassOutcome[]

function weightTotal(): number {
  return OUTCOMES.reduce((sum, key) => sum + grassOutcomeWeights[key], 0)
}

function cumulativeEdges(): { outcome: GrassOutcome; edge: number }[] {
  const total = weightTotal()
  let acc = 0
  return OUTCOMES.map((outcome) => {
    acc += grassOutcomeWeights[outcome]
    return { outcome, edge: acc / total }
  })
}

function stubRng(values: number[]): Rng {
  let i = 0
  return {
    next() {
      const v = values[i] ?? values[values.length - 1]!
      i += 1
      return v
    },
  }
}

function candidate(): EncounterCandidateEvent {
  return { type: 'encounter_candidate', biome: 'forest', x: 1, y: 2, at: 100 }
}

describe('weights', () => {
  function tally(seed: number, n: number): Record<GrassOutcome, number> {
    const rng = createRng(seed)
    const counts: Record<GrassOutcome, number> = {
      pokemon: 0,
      nothing: 0,
      item: 0,
      rare: 0,
      legendary: 0,
    }
    for (let i = 0; i < n; i++) {
      counts[rollGrass(rng)]++
    }
    return counts
  }

  it('matches config-derived shares within 2pp for two seeds at 10000 draws', () => {
    const n = 10_000
    const total = weightTotal()
    for (const seed of [42, 99]) {
      const counts = tally(seed, n)
      for (const key of OUTCOMES) {
        const expectedShare = grassOutcomeWeights[key] / total
        const observedShare = counts[key] / n
        expect(Math.abs(observedShare - expectedShare)).toBeLessThan(0.02)
      }
    }
  })
})

describe('threshold', () => {
  it('maps scripted rng values using cumulative edges from grassOutcomeWeights', () => {
    const edges = cumulativeEdges()
    const probes: { value: number; expected: GrassOutcome }[] = [
      { value: 0, expected: edges[0]!.outcome },
    ]

    for (let i = 0; i < edges.length - 1; i++) {
      const edge = edges[i]!.edge
      probes.push({ value: Math.max(0, edge - 1e-9), expected: edges[i]!.outcome })
      probes.push({ value: Math.min(0.999999999, edge + 1e-9), expected: edges[i + 1]!.outcome })
    }
    probes.push({ value: 0.999999999, expected: edges[edges.length - 1]!.outcome })

    for (const { value, expected } of probes) {
      expect(rollGrass(stubRng([value]))).toBe(expected)
    }
  })
})

describe('pool', () => {
  it('returns only Forest pool ids for each rarity across 200 seeded draws', () => {
    for (const rarity of ['common', 'rare', 'legendary'] as const) {
      const pool = biomeEncounterTables.forest[rarity]
      expect(pool.length).toBeGreaterThan(0)
      expect(new Set(pool).size).toBe(pool.length)

      const rng = createRng(7 + rarity.length)
      for (let i = 0; i < 200; i++) {
        const id = pickSpecies(rng, 'forest', rarity)
        expect(pool).toContain(id)
        expect(Number.isInteger(id)).toBe(true)
        expect(id).toBeGreaterThanOrEqual(1)
        expect(id).toBeLessThanOrEqual(151)
      }
    }
  })
})

describe('resolve', () => {
  it('rarityForOutcome maps pokemon/rare/legendary and nulls nothing/item', () => {
    expect(rarityForOutcome('pokemon')).toBe('common')
    expect(rarityForOutcome('rare')).toBe('rare')
    expect(rarityForOutcome('legendary')).toBe('legendary')
    expect(rarityForOutcome('nothing')).toBeNull()
    expect(rarityForOutcome('item')).toBeNull()
  })

  it('resolveCandidate returns nothing, item, and pool-valid pokemon for forced bands', () => {
    const edges = cumulativeEdges()
    const mid = (lo: number, hi: number) => (lo + hi) / 2
    const starts = [0, ...edges.slice(0, -1).map((e) => e.edge)]

    const nothingValue = mid(starts[1]!, edges[1]!.edge)
    expect(resolveCandidate(stubRng([nothingValue]), candidate())).toEqual({ kind: 'nothing' })

    const itemValue = mid(starts[2]!, edges[2]!.edge)
    expect(resolveCandidate(stubRng([itemValue]), candidate())).toEqual({ kind: 'item' })

    const pokemonValue = mid(starts[0]!, edges[0]!.edge)
    const pokemon = resolveCandidate(stubRng([pokemonValue, 0]), candidate())
    expect(pokemon.kind).toBe('pokemon')
    if (pokemon.kind === 'pokemon') {
      expect(pokemon.rarity).toBe('common')
      expect(biomeEncounterTables.forest.common).toContain(pokemon.speciesId)
    }

    const rareValue = mid(starts[3]!, edges[3]!.edge)
    const rare = resolveCandidate(stubRng([rareValue, 0]), candidate())
    expect(rare.kind).toBe('pokemon')
    if (rare.kind === 'pokemon') {
      expect(rare.rarity).toBe('rare')
      expect(biomeEncounterTables.forest.rare).toContain(rare.speciesId)
    }

    const legendaryValue = mid(starts[4]!, edges[4]!.edge)
    const legendary = resolveCandidate(stubRng([legendaryValue, 0]), candidate())
    expect(legendary.kind).toBe('pokemon')
    if (legendary.kind === 'pokemon') {
      expect(legendary.rarity).toBe('legendary')
      expect(biomeEncounterTables.forest.legendary).toContain(legendary.speciesId)
    }
  })

  it('resolveCandidate is pure for equal stub sequences and never touches localStorage', () => {
    const edges = cumulativeEdges()
    const pokemonValue = edges[0]!.edge / 2
    const seq = [pokemonValue, 0.25]
    const a = resolveCandidate(stubRng(seq), candidate())
    const b = resolveCandidate(stubRng(seq), candidate())
    expect(a).toEqual(b)

    const setItem = localStorage.setItem.bind(localStorage)
    let touched = false
    localStorage.setItem = (...args: Parameters<typeof localStorage.setItem>) => {
      touched = true
      return setItem(...args)
    }
    try {
      resolveCandidate(stubRng(seq), candidate())
      expect(touched).toBe(false)
    } finally {
      localStorage.setItem = setItem
    }
  })
})
