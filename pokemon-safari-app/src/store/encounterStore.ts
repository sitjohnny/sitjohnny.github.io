import { create } from 'zustand'
import type { EncounterSession, EncounterStage } from '@/types/encounter'

/**
 * Ephemeral encounter-session state. Phase 5 extends the session payload;
 * long-lived save data remains owned by Phase 7.
 */
type EncounterState = {
  stage: EncounterStage
  session: EncounterSession | null
  itemToastVisible: boolean
  lastFactKey: string | null
  open: (session: EncounterSession) => void
  setStage: (stage: EncounterStage) => void
  fail: () => void
  showItemToast: () => void
  hideItemToast: () => void
  close: () => void
  reset: () => void
}

function initialState() {
  return {
    stage: 'idle' as EncounterStage,
    session: null as EncounterSession | null,
    itemToastVisible: false,
    lastFactKey: null as string | null,
  }
}

export const useEncounterStore = create<EncounterState>((set) => ({
  ...initialState(),
  open: (session) => set({ stage: 'appear', session }),
  setStage: (stage) => set({ stage }),
  fail: () => set({ stage: 'error' }),
  showItemToast: () => set({ itemToastVisible: true }),
  hideItemToast: () => set({ itemToastVisible: false }),
  close: () => set({ stage: 'idle', session: null }),
  reset: () => set(initialState()),
}))

/** Pause signal for frame loops and global input listeners outside React. */
export function isEncounterActive(): boolean {
  return useEncounterStore.getState().stage !== 'idle'
}
