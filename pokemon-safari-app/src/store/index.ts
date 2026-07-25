import { create } from 'zustand'

type UiState = {
  lastRoute: string
  setLastRoute: (route: string) => void
  /** Session flag — Gen 1 poke-cache ready in memory (no persist). */
  cacheReady: boolean
  setCacheReady: (ready: boolean) => void
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
  settings: {
    mute: false,
  },
  setMute: (mute) => set((state) => ({ settings: { ...state.settings, mute } })),
}))
