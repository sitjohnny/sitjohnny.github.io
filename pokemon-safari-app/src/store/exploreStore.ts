import { create } from 'zustand'
import { postEncounterPokemonImmunitySteps } from '@/data/rates'
import { WORLD_SPAWN } from '@/data/worldConfig'
import {
  drainEncounters as drainEncounterQueue,
  enqueueEncounters,
  MAX_PENDING_ENCOUNTERS,
} from '@/game/events'
import { loadSave } from '@/services/save'
import { scheduleSaveFlush } from '@/services/saveFlush'
import type { Direction, EncounterCandidateEvent, PlayerState, Vec2 } from '@/types/map'

/**
 * Coarse explore session state.
 *
 * This store holds integer tiles, facing, the move lock, and the encounter
 * queue only. Pixel offsets, tween progress, and camera translation must never
 * live here — the frame loop writes those straight to the DOM through refs.
 */
type ExploreState = {
  tile: Vec2
  facing: Direction
  moving: boolean
  pendingEncounters: EncounterCandidateEvent[]
  pokemonImmunitySteps: number
  setPlayer: (next: PlayerState, options?: { tickImmunity?: boolean }) => void
  pushEncounters: (events: EncounterCandidateEvent[]) => void
  drainEncounters: () => EncounterCandidateEvent[]
  armPokemonImmunity: () => void
  tickPokemonImmunity: () => void
  reset: () => void
}

function spawnState() {
  return {
    tile: { ...WORLD_SPAWN },
    facing: 'down' as Direction,
    moving: false,
    pendingEncounters: [] as EncounterCandidateEvent[],
    pokemonImmunitySteps: 0,
  }
}

function initialState() {
  const { explore } = loadSave()
  return {
    tile: { x: explore.x, y: explore.y },
    facing: explore.facing,
    moving: false,
    pendingEncounters: [] as EncounterCandidateEvent[],
    pokemonImmunitySteps: 0,
  }
}

export const useExploreStore = create<ExploreState>((set, get) => ({
  ...initialState(),
  setPlayer: (next, options) => {
    const prev = get()
    const tileChanged = prev.tile.x !== next.x || prev.tile.y !== next.y
    const facingChanged = prev.facing !== next.facing
    set((state) => ({
      tile: { x: next.x, y: next.y },
      facing: next.facing,
      moving: next.moving,
      pokemonImmunitySteps:
        options?.tickImmunity === true && state.pokemonImmunitySteps > 0
          ? state.pokemonImmunitySteps - 1
          : state.pokemonImmunitySteps,
    }))
    if (tileChanged || facingChanged) {
      scheduleSaveFlush()
    }
  },
  pushEncounters: (events) => {
    if (events.length === 0) {
      return
    }
    set({
      pendingEncounters: enqueueEncounters(
        get().pendingEncounters,
        events,
        MAX_PENDING_ENCOUNTERS,
      ),
    })
  },
  drainEncounters: () => {
    const { taken, remaining } = drainEncounterQueue(get().pendingEncounters)
    if (taken.length > 0 || get().pendingEncounters.length > 0) {
      set({ pendingEncounters: remaining })
    }
    return taken
  },
  armPokemonImmunity: () =>
    set({ pokemonImmunitySteps: postEncounterPokemonImmunitySteps }),
  tickPokemonImmunity: () => {
    const remaining = get().pokemonImmunitySteps
    if (remaining <= 0) {
      return
    }
    set({ pokemonImmunitySteps: remaining - 1 })
  },
  reset: () => set(spawnState()),
}))
