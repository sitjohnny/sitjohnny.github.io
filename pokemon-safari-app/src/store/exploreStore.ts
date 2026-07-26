import { create } from 'zustand'
import { forestMap } from '@/data/maps/forest'
import {
  drainEncounters as drainEncounterQueue,
  enqueueEncounters,
  MAX_PENDING_ENCOUNTERS,
} from '@/game/events'
import type { Direction, EncounterCandidateEvent, PlayerState, Vec2 } from '@/types/map'

/**
 * Coarse explore session state (MAP-04).
 *
 * This store holds integer tiles, facing, the move lock, and the encounter
 * queue only. Pixel offsets, tween progress, and camera translation must never
 * live here — the frame loop writes those straight to the DOM through refs, so
 * the store is touched at most once per committed tile. No persist middleware:
 * saving is Phase 7.
 */
type ExploreState = {
  tile: Vec2
  facing: Direction
  moving: boolean
  /**
   * Phase 4 integration point: pending `encounter_candidate` events from grass
   * steps. Phase 3 has no consumer by design — Phase 4 reads via
   * `useExploreStore.getState().drainEncounters()`. Capped at
   * {@link MAX_PENDING_ENCOUNTERS}.
   */
  pendingEncounters: EncounterCandidateEvent[]
  setPlayer: (next: PlayerState) => void
  pushEncounters: (events: EncounterCandidateEvent[]) => void
  drainEncounters: () => EncounterCandidateEvent[]
  reset: () => void
}

function initialState() {
  return {
    tile: { ...forestMap.spawn },
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
