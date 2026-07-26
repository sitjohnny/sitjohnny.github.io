/**
 * Pokédex session store — hydrates from SAVE_KEY, mutates via pure reducers,
 * and debounces persist with eager flush on visibility loss (D-19, D-21).
 */

import { create } from 'zustand'
import { dexSaveDebounceMs } from '@/data/rates'
import { markSeen as markSeenPure, recordCatch as recordCatchPure } from '@/game/dex'
import { loadSave, persistSave } from '@/services/save'
import type { DexData } from '@/types/save'

type DexState = {
  dex: DexData
  saveSoftFail: boolean
  markSeen: (speciesId: number) => void
  recordCatch: (args: { speciesId: number; shiny: boolean }) => void
  dismissSaveSoftFail: () => void
  flushNow: () => void
}

const flushTimerRef: {
  current: ReturnType<typeof setTimeout> | null
} = { current: null }

function clearFlushTimer() {
  if (flushTimerRef.current !== null) {
    clearTimeout(flushTimerRef.current)
    flushTimerRef.current = null
  }
}

function scheduleFlush() {
  clearFlushTimer()
  flushTimerRef.current = setTimeout(() => {
    flushTimerRef.current = null
    useDexStore.getState().flushNow()
  }, dexSaveDebounceMs)
}

function nowIso(): string {
  return new Date().toISOString()
}

export const useDexStore = create<DexState>((set, get) => ({
  dex: loadSave(),
  saveSoftFail: false,
  markSeen: (speciesId) => {
    set((state) => ({
      dex: markSeenPure(state.dex, speciesId, nowIso()),
    }))
    scheduleFlush()
  },
  recordCatch: ({ speciesId, shiny }) => {
    set((state) => ({
      dex: recordCatchPure(state.dex, { speciesId, shiny }, nowIso()),
    }))
    scheduleFlush()
  },
  dismissSaveSoftFail: () => set({ saveSoftFail: false }),
  flushNow: () => {
    clearFlushTimer()
    const result = persistSave(get().dex)
    if (result === 'quota') {
      set({ saveSoftFail: true })
    }
  },
}))

function eagerFlushIfHidden() {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    useDexStore.getState().flushNow()
  }
}

function onPageHide() {
  useDexStore.getState().flushNow()
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', eagerFlushIfHidden)
}
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', onPageHide)
}
