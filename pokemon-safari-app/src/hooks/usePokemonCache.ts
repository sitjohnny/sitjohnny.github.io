import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ensureCache,
  hasValidCache,
  hydrateFromStorage,
  isCacheReady,
} from '@/services/pokeapi/cache'
import { GEN1_COUNT } from '@/services/pokeapi/keys'
import { useUiStore } from '@/store'

export type PokemonCacheStatus = 'idle' | 'loading' | 'ready' | 'error' | 'quota'

export type PokemonCacheState = {
  status: PokemonCacheStatus
  progress: { done: number; total: number }
  error: Error | null
  retry: () => void
}

/**
 * Boot prefetch hook — ensureCache when cache missing; exposes progress + retry (D-04, D-05).
 */
export function usePokemonCache(): PokemonCacheState {
  const setCacheReady = useUiStore((s) => s.setCacheReady)
  const setQuotaSoftFail = useUiStore((s) => s.setQuotaSoftFail)
  const [status, setStatus] = useState<PokemonCacheStatus>('idle')
  const [progress, setProgress] = useState({ done: 0, total: GEN1_COUNT })
  const [error, setError] = useState<Error | null>(null)
  const running = useRef(false)
  const cancelled = useRef(false)

  const runEnsure = useCallback(
    async (resume: boolean) => {
      if (running.current) return
      running.current = true
      if (!cancelled.current) {
        setStatus('loading')
        setError(null)
      }
      try {
        const result = await ensureCache({
          concurrency: 8,
          resume,
          onProgress: (done, total) => {
            if (!cancelled.current) {
              setProgress({ done, total })
            }
          },
        })
        // Unlock Explore even if Boot unmounted mid-prefetch.
        setCacheReady(true)
        if (result === 'quota') {
          setQuotaSoftFail(true)
        }
        if (!cancelled.current) {
          if (result === 'quota') {
            setStatus('quota')
          } else {
            setStatus('ready')
          }
          setProgress({ done: GEN1_COUNT, total: GEN1_COUNT })
        }
      } catch (e) {
        if (!cancelled.current) {
          setStatus('error')
          setError(e instanceof Error ? e : new Error(String(e)))
        }
      } finally {
        running.current = false
      }
    },
    [setCacheReady, setQuotaSoftFail],
  )

  useEffect(() => {
    cancelled.current = false

    if (!isCacheReady() && hasValidCache()) {
      hydrateFromStorage()
    }
    if (hasValidCache() && isCacheReady()) {
      setStatus('ready')
      setCacheReady(true)
      setProgress({ done: GEN1_COUNT, total: GEN1_COUNT })
      return () => {
        cancelled.current = true
      }
    }
    // Cold miss, or storage looked valid but hydrate left memory incomplete — refetch.
    if (!isCacheReady()) {
      void runEnsure(false)
    }

    return () => {
      cancelled.current = true
    }
  }, [runEnsure, setCacheReady])

  /** In-process resume (D-05) — keeps partial memory IDs; no full page refresh. */
  const retry = useCallback(() => {
    void runEnsure(true)
  }, [runEnsure])

  return { status, progress, error, retry }
}
