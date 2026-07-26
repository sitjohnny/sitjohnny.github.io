import { create } from 'zustand'

type UiState = {
  lastRoute: string
  setLastRoute: (route: string) => void
  /** Session flag — Gen 1 poke-cache ready in memory (no persist). */
  cacheReady: boolean
  setCacheReady: (ready: boolean) => void
  /** Session soft-fail when persist hit QuotaExceeded (D-06) — does not block Explore. */
  quotaSoftFail: boolean
  setQuotaSoftFail: (failed: boolean) => void
  /** Session flag — DexDetailSheet open on /dex so BottomNav goes inert (no persist). */
  dexSheetOpen: boolean
  setDexSheetOpen: (open: boolean) => void
  settings: {
    mute: boolean
  }
  setMute: (mute: boolean) => void
}

/** Session UI stub — no persist middleware (Phase 7). */
export const useUiStore = create<UiState>((set) => ({
  lastRoute: '/',
  setLastRoute: (route) => set({ lastRoute: route }),
  cacheReady: false,
  setCacheReady: (ready) => set({ cacheReady: ready }),
  quotaSoftFail: false,
  setQuotaSoftFail: (failed) => set({ quotaSoftFail: failed }),
  dexSheetOpen: false,
  setDexSheetOpen: (open) => set({ dexSheetOpen: open }),
  settings: {
    mute: false,
  },
  setMute: (mute) => set((state) => ({ settings: { ...state.settings, mute } })),
}))
