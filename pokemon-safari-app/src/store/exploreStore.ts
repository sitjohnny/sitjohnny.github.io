import { create } from 'zustand'
import { WORLD_SPAWN } from '@/data/worldConfig'
import {
  drainEncounters as drainEncounterQueue,
  enqueueEncounters,
  MAX_PENDING_ENCOUNTERS,
} from '@/game/events'
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
  setPlayer: (next: PlayerState) => void
  pushEncounters: (events: EncounterCandidateEvent[]) => void
  drainEncounters: () => EncounterCandidateEvent[]
  reset: () => void
}

function initialState() {
  return {
    tile: { ...WORLD_SPAWN },
    facing: 'down' as Direction,
    moving: false,
    pendingEncounters: [] as EncounterCandidateEvent[],
  }
}

export const useExploreStore = create<ExploreState>((set, get) => ({
  ...initialState(),
  setPlayer: (next) =>
    set({
      tile: { x: next.x, y: next.y },
      facing: next.facing,
      moving: next.moving,
    }),
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
  reset: () => set(initialState()),
}))
