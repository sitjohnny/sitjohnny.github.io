import { describe, expect, it, beforeEach } from 'vitest'
import { postEncounterPokemonImmunitySteps } from '@/data/rates'
import { useExploreStore } from '@/store/exploreStore'

describe('useExploreStore pokemon immunity', () => {
  beforeEach(() => {
    useExploreStore.getState().reset()
  })

  it('armPokemonImmunity sets the configured step count', () => {
    useExploreStore.getState().armPokemonImmunity()
    expect(useExploreStore.getState().pokemonImmunitySteps).toBe(
      postEncounterPokemonImmunitySteps,
    )
  })

  it('tickPokemonImmunity decrements until zero and then no-ops', () => {
    useExploreStore.getState().armPokemonImmunity()
    for (let i = postEncounterPokemonImmunitySteps; i > 0; i--) {
      expect(useExploreStore.getState().pokemonImmunitySteps).toBe(i)
      useExploreStore.getState().tickPokemonImmunity()
    }
    expect(useExploreStore.getState().pokemonImmunitySteps).toBe(0)
    useExploreStore.getState().tickPokemonImmunity()
    expect(useExploreStore.getState().pokemonImmunitySteps).toBe(0)
  })

  it('reset clears immunity', () => {
    useExploreStore.getState().armPokemonImmunity()
    useExploreStore.getState().reset()
    expect(useExploreStore.getState().pokemonImmunitySteps).toBe(0)
  })

  it('setPlayer can tick immunity atomically with the player commit', () => {
    useExploreStore.getState().armPokemonImmunity()
    useExploreStore
      .getState()
      .setPlayer({ x: 1, y: 0, facing: 'right', moving: true }, { tickImmunity: true })
    const state = useExploreStore.getState()
    expect(state.facing).toBe('right')
    expect(state.tile).toEqual({ x: 1, y: 0 })
    expect(state.pokemonImmunitySteps).toBe(postEncounterPokemonImmunitySteps - 1)
  })

  it('setPlayer without tickImmunity leaves the counter unchanged', () => {
    useExploreStore.getState().armPokemonImmunity()
    useExploreStore.getState().setPlayer({ x: 0, y: 0, facing: 'left', moving: false })
    expect(useExploreStore.getState().facing).toBe('left')
    expect(useExploreStore.getState().pokemonImmunitySteps).toBe(
      postEncounterPokemonImmunitySteps,
    )
  })
})
