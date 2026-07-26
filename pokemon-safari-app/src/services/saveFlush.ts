import { dexSaveDebounceMs } from '@/data/rates'
import { persistSave } from '@/services/save'
import { useDexStore } from '@/store/dexStore'
import { useExploreStore } from '@/store/exploreStore'

const flushTimerRef: {
  current: ReturnType<typeof setTimeout> | null
} = { current: null }

function clearFlushTimer() {
  if (flushTimerRef.current !== null) {
    clearTimeout(flushTimerRef.current)
    flushTimerRef.current = null
  }
}

export function flushSaveNow(): void {
  clearFlushTimer()
  const dex = useDexStore.getState().dex
  const { tile, facing } = useExploreStore.getState()
  const result = persistSave({
    dex,
    explore: { x: tile.x, y: tile.y, facing },
  })
  if (result === 'quota') {
    useDexStore.setState({ saveSoftFail: true })
  }
}

export function scheduleSaveFlush(): void {
  clearFlushTimer()
  flushTimerRef.current = setTimeout(() => {
    flushTimerRef.current = null
    flushSaveNow()
  }, dexSaveDebounceMs)
}

function eagerFlushIfHidden() {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    flushSaveNow()
  }
}

function onPageHide() {
  flushSaveNow()
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', eagerFlushIfHidden)
}
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', onPageHide)
}
