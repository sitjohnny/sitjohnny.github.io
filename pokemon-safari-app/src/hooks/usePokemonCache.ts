import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ensureCache,
  hasValidCache,
  hydrateFromStorage,
  isCacheReady,
} from '@/services/pokeapi/cache'
import { useUiStore } from '@/store'

export type PokemonCacheStatus = 'idle' | 'loading' | 'ready' | 'error' | 'quota'

export type PokemonCacheState = {
  status: PokemonCacheStatus
  progress: { done: number; total: number }
  error: Error | null
  retry: () => void
}

const GEN1_TOTAL = 151

/**
 * Boot prefetch hook — ensureCache when cache missing; exposes progress + retry (D-04, D-05).
 */
export function usePokemonCache(): PokemonCacheState {
  const setCacheReady = useUiStore((s) => s.setCacheReady)
  const setQuotaSoftFail = useUiStore((s) => s.setQuotaSoftFail)
  const [status, setStatus] = useState<PokemonCacheStatus>('idle')
  const [progress, setProgress] = useState({ done: 0, total: GEN1_TOTAL })
  const [error, setError] = useState<Error | null>(null)
  const running = useRef(false)

  const runEnsure = useCallback(
    async (resume: boolean) => {
      if (running.current) return
      running.current = true
      setStatus('loading')
      setError(null)
      try {
        const result = await ensureCache({
          concurrency: 8,
          resume,
          onProgress: (done, total) => {
            setProgress({ done, total })
          },
        })
        if (result === 'quota') {
          setStatus('quota')
          setQuotaSoftFail(true)
        } else {
          setStatus('ready')
        }
        setCacheReady(true)
        setProgress({ done: GEN1_TOTAL, total: GEN1_TOTAL })
      } catch (e) {
        setStatus('error')
        setError(e instanceof Error ? e : new Error(String(e)))
      } finally {
        running.current = false
      }
    },
    [setCacheReady, setQuotaSoftFail],
  )

  useEffect(() => {
    if (!isCacheReady() && hasValidCache()) {
      hydrateFromStorage()
    }
    if (hasValidCache() && isCacheReady()) {
      setStatus('ready')
      setCacheReady(true)
      setProgress({ done: GEN1_TOTAL, total: GEN1_TOTAL })
      return
    }
    if (!hasValidCache()) {
      void runEnsure(false)
    }
  }, [runEnsure, setCacheReady])

  /** In-process resume (D-05) — keeps partial memory IDs; no full page refresh. */
  const retry = useCallback(() => {
    void runEnsure(true)
  }, [runEnsure])

  return { status, progress, error, retry }
}
