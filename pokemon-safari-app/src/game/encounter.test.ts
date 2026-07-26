import { describe, expect, it } from 'vitest'
import { grassOutcomeWeights } from '@/data/rates'
import { biomeEncounterTables } from '@/data/encounterTables'
import { WORLD_SEED } from '@/data/worldConfig'
import {
  pickSpecies,
  pickSpeciesWeighted,
  rarityForOutcome,
  resolveCandidate,
  rollGrass,
  speciesWeightForPocket,
} from '@/game/encounter'
import { pocketAt } from '@/game/world/pocket'
import { createRng, type Rng } from '@/utils/rng'
import type { EncounterCandidateEvent } from '@/types/map'
import type { GrassOutcome } from '@/types/encounter'

const OUTCOMES = [
  'pokemon',
  'nothing',
  'rare',
  'legendary',
] as const satisfies readonly GrassOutcome[]

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
      probes.push({
        value: Math.min(0.999999999, edge + 1e-9),
        expected: edges[i + 1]!.outcome,
      })
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

describe('habitat weights', () => {
  it('speciesWeightForPocket favors waters-edge in wetland over forest', () => {
    expect(
      speciesWeightForPocket('waters-edge', 'wetland'),
    ).toBeGreaterThan(speciesWeightForPocket('forest', 'wetland'))
  })

  it('pickSpeciesWeighted skews wetland pocket toward waters-edge habitat ids', () => {
    const watersEdgeId = 60
    const forestId = 1
    const habitatOf = (id: number) =>
      id === watersEdgeId ? 'waters-edge' : 'forest'
    const pool = [forestId, watersEdgeId]
    let watersEdgePicks = 0
    const n = 500
    for (let seed = 0; seed < n; seed++) {
      const rng = createRng(seed)
      const id = pickSpeciesWeighted(rng, pool, 'wetland', habitatOf)
      if (id === watersEdgeId) watersEdgePicks++
    }
    expect(watersEdgePicks).toBeGreaterThan(n * 0.6)
  })

  it('pickSpeciesWeighted still picks when every habitat misses the pocket', () => {
    const pool = [3, 7, 11]
    const habitatOf = () => 'forest'
    for (let seed = 0; seed < 50; seed++) {
      const id = pickSpeciesWeighted(createRng(seed), pool, 'wetland', habitatOf)
      expect(pool).toContain(id)
    }
  })
})

function findCoordsForPocket(
  pocket: ReturnType<typeof pocketAt>,
): { x: number; y: number } {
  for (let y = -60; y <= 60; y++) {
    for (let x = -60; x <= 60; x++) {
      if (pocketAt(WORLD_SEED, x, y) === pocket) return { x, y }
    }
  }
  throw new Error(`no coords for pocket ${pocket}`)
}

describe('resolve', () => {
  it('rarityForOutcome maps pokemon/rare/legendary and nulls nothing', () => {
    expect(rarityForOutcome('pokemon')).toBe('common')
    expect(rarityForOutcome('rare')).toBe('rare')
    expect(rarityForOutcome('legendary')).toBe('legendary')
    expect(rarityForOutcome('nothing')).toBeNull()
  })

  it('resolveCandidate returns nothing and pool-valid pokemon for forced bands', () => {
    const edges = cumulativeEdges()
    const mid = (lo: number, hi: number) => (lo + hi) / 2
    const starts = [0, ...edges.slice(0, -1).map((e) => e.edge)]

    const nothingValue = mid(starts[1]!, edges[1]!.edge)
    expect(resolveCandidate(stubRng([nothingValue]), candidate())).toEqual({
      kind: 'nothing',
    })

    const pokemonValue = mid(starts[0]!, edges[0]!.edge)
    const pokemon = resolveCandidate(stubRng([pokemonValue, 0]), candidate())
    expect(pokemon.kind).toBe('pokemon')
    if (pokemon.kind === 'pokemon') {
      expect(pokemon.rarity).toBe('common')
      expect(biomeEncounterTables.forest.common).toContain(pokemon.speciesId)
    }

    const rareValue = mid(starts[2]!, edges[2]!.edge)
    const rare = resolveCandidate(stubRng([rareValue, 0]), candidate())
    expect(rare.kind).toBe('pokemon')
    if (rare.kind === 'pokemon') {
      expect(rare.rarity).toBe('rare')
      expect(biomeEncounterTables.forest.rare).toContain(rare.speciesId)
    }

    const legendaryValue = mid(starts[3]!, edges[3]!.edge)
    const legendary = resolveCandidate(stubRng([legendaryValue, 0]), candidate())
    expect(legendary.kind).toBe('pokemon')
    if (legendary.kind === 'pokemon') {
      expect(legendary.rarity).toBe('legendary')
      expect(biomeEncounterTables.forest.legendary).toContain(
        legendary.speciesId,
      )
    }
  })

  it('suppressPokemon zeros pokemon bands so rolls become nothing only', () => {
    expect(
      resolveCandidate(stubRng([0]), candidate(), { suppressPokemon: true }),
    ).toEqual({ kind: 'nothing' })
    expect(
      resolveCandidate(stubRng([0.2]), candidate(), { suppressPokemon: true }),
    ).toEqual({ kind: 'nothing' })
    expect(
      resolveCandidate(stubRng([0.999]), candidate(), { suppressPokemon: true }),
    ).toEqual({ kind: 'nothing' })

    const pokemon = resolveCandidate(stubRng([0, 0]), candidate())
    expect(pokemon.kind).toBe('pokemon')
  })

  it('habitatOf skews species by grass pocket at candidate coords', () => {
    const wetland = findCoordsForPocket('wetland')
    const meadow = findCoordsForPocket('meadow')
    expect(pocketAt(WORLD_SEED, wetland.x, wetland.y)).toBe('wetland')
    expect(pocketAt(WORLD_SEED, meadow.x, meadow.y)).toBe('meadow')

    const common = biomeEncounterTables.forest.common
    const watersEdgeFixture = new Set(
      common.filter((id) => id >= 55 && id <= 64).slice(0, 8),
    )
    const grasslandFixture = new Set(
      common.filter((id) => id >= 10 && id <= 25).slice(0, 8),
    )
    expect(watersEdgeFixture.size).toBeGreaterThan(0)
    expect(grasslandFixture.size).toBeGreaterThan(0)

    const habitatOf = (id: number) => {
      if (watersEdgeFixture.has(id)) return 'waters-edge'
      if (grasslandFixture.has(id)) return 'grassland'
      return 'forest'
    }
    const opts = { habitatOf, worldSeed: WORLD_SEED }

    let wetlandWaters = 0
    let wetlandPokemon = 0
    let meadowGrass = 0
    let meadowPokemon = 0
    const n = 800
    for (let i = 0; i < n; i++) {
      const w = resolveCandidate(
        createRng(10_000 + i),
        {
          type: 'encounter_candidate',
          biome: 'forest',
          x: wetland.x,
          y: wetland.y,
          at: i,
        },
        opts,
      )
      if (w.kind === 'pokemon') {
        wetlandPokemon++
        if (watersEdgeFixture.has(w.speciesId)) wetlandWaters++
      }

      const m = resolveCandidate(
        createRng(20_000 + i),
        {
          type: 'encounter_candidate',
          biome: 'forest',
          x: meadow.x,
          y: meadow.y,
          at: i,
        },
        opts,
      )
      if (m.kind === 'pokemon') {
        meadowPokemon++
        if (grasslandFixture.has(m.speciesId)) meadowGrass++
      }
    }

    expect(wetlandPokemon).toBeGreaterThan(100)
    expect(meadowPokemon).toBeGreaterThan(100)
    expect(wetlandWaters / wetlandPokemon).toBeGreaterThan(0.12)
    expect(meadowGrass / meadowPokemon).toBeGreaterThan(0.12)
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
