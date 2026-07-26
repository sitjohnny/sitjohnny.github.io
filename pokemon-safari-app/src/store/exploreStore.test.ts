import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dexSaveDebounceMs, postEncounterPokemonImmunitySteps } from '@/data/rates'
import { SAVE_KEY } from '@/services/pokeapi/keys'
import { loadSave, persistSave, resetSaveForTests } from '@/services/save'
import { useDexStore } from '@/store/dexStore'
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

describe('useExploreStore persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetSaveForTests()
    useDexStore.setState({ dex: {}, saveSoftFail: false })
    useExploreStore.getState().reset()
    useDexStore.getState().flushNow()
    resetSaveForTests()
  })

  afterEach(() => {
    useDexStore.getState().flushNow()
    vi.useRealTimers()
    resetSaveForTests()
  })

  it('setPlayer tile/facing change writes explore into SAVE_KEY after debounce', () => {
    useExploreStore.getState().setPlayer({
      x: 2,
      y: -1,
      facing: 'right',
      moving: false,
    })
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()

    vi.advanceTimersByTime(dexSaveDebounceMs)

    const envelope = JSON.parse(localStorage.getItem(SAVE_KEY)!) as {
      version: number
      data: {
        dex: Record<string, unknown>
        explore: { x: number; y: number; facing: string }
        pendingEncounters?: unknown
      }
    }
    expect(envelope.version).toBe(2)
    expect(envelope.data.explore).toEqual({ x: 2, y: -1, facing: 'right' })
    expect(envelope.data).not.toHaveProperty('pendingEncounters')
  })

  it('hydrates tile and facing from an existing v2 save on re-init path', () => {
    persistSave({
      dex: {},
      explore: { x: 9, y: 8, facing: 'up' },
    })
    const loaded = loadSave()
    useExploreStore.setState({
      tile: { x: loaded.explore.x, y: loaded.explore.y },
      facing: loaded.explore.facing,
      moving: false,
      pendingEncounters: [],
      pokemonImmunitySteps: 0,
    })
    expect(useExploreStore.getState().tile).toEqual({ x: 9, y: 8 })
    expect(useExploreStore.getState().facing).toBe('up')
  })

  it('moving-only updates do not schedule a save by themselves', () => {
    useExploreStore.setState({
      tile: { x: 1, y: 1 },
      facing: 'down',
      moving: false,
      pendingEncounters: [],
      pokemonImmunitySteps: 0,
    })
    useExploreStore.getState().setPlayer({
      x: 1,
      y: 1,
      facing: 'down',
      moving: true,
    })
    vi.advanceTimersByTime(dexSaveDebounceMs)
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
  })
})
