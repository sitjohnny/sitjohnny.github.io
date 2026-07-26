/**
 * Pokédex session store — hydrates from SAVE_KEY, mutates via pure reducers,
 * and schedules persist through the shared saveFlush coordinator.
 */

import { create } from 'zustand'
import { markSeen as markSeenPure, recordCatch as recordCatchPure } from '@/game/dex'
import { loadSave } from '@/services/save'
import { flushSaveNow, scheduleSaveFlush } from '@/services/saveFlush'
import type { DexData } from '@/types/save'

type DexState = {
  dex: DexData
  saveSoftFail: boolean
  markSeen: (speciesId: number) => void
  recordCatch: (args: { speciesId: number; shiny: boolean }) => void
  dismissSaveSoftFail: () => void
  flushNow: () => void
}

function nowIso(): string {
  return new Date().toISOString()
}

const initial = loadSave()

export const useDexStore = create<DexState>((set) => ({
  dex: initial.dex,
  saveSoftFail: false,
  markSeen: (speciesId) => {
    set((state) => ({
      dex: markSeenPure(state.dex, speciesId, nowIso()),
    }))
    scheduleSaveFlush()
  },
  recordCatch: ({ speciesId, shiny }) => {
    set((state) => ({
      dex: recordCatchPure(state.dex, { speciesId, shiny }, nowIso()),
    }))
    scheduleSaveFlush()
  },
  dismissSaveSoftFail: () => set({ saveSoftFail: false }),
  flushNow: () => {
    flushSaveNow()
  },
}))
