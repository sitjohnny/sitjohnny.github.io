import { useEffect, useRef } from 'react'
import { encounterTimingMs } from '@/data/rates'
import { resolveCandidate } from '@/game/encounter'
import { getPokemon } from '@/services/pokeapi/cache'
import { useEncounterStore } from '@/store/encounterStore'
import { useExploreStore } from '@/store/exploreStore'
import { getDefaultRng, type Rng } from '@/utils/rng'

type EncounterFlowOptions = {
  rng?: Rng
}

/**
 * Single Phase 4 queue consumer: drain one candidate, restore the FIFO
 * remainder, then route the config-driven result into session UI state.
 */
export function useEncounterFlow(options: EncounterFlowOptions = {}): void {
  const rng = options.rng ?? getDefaultRng()
  const pendingEncounters = useExploreStore((state) => state.pendingEncounters)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (toastTimer.current !== null) {
        clearTimeout(toastTimer.current)
      }
    }
  }, [])

  useEffect(() => {
    if (
      pendingEncounters.length === 0 ||
      useEncounterStore.getState().stage !== 'idle'
    ) {
      return
    }

    const drained = useExploreStore.getState().drainEncounters()
    const [candidate, ...rest] = drained
    if (!candidate) {
      return
    }
    if (rest.length > 0) {
      useExploreStore.getState().pushEncounters(rest)
    }

    const resolution = resolveCandidate(rng, candidate)
    if (resolution.kind === 'nothing') {
      return
    }
    if (resolution.kind === 'item') {
      const encounter = useEncounterStore.getState()
      encounter.showItemToast()
      if (toastTimer.current !== null) {
        clearTimeout(toastTimer.current)
      }
      toastTimer.current = setTimeout(() => {
        useEncounterStore.getState().hideItemToast()
        toastTimer.current = null
      }, encounterTimingMs.itemToast)
      return
    }

    try {
      getPokemon(resolution.speciesId)
      useEncounterStore.getState().open({
        speciesId: resolution.speciesId,
        rarity: resolution.rarity,
        biome: candidate.biome,
        education: null,
        captureBonus: 0,
      })
    } catch {
      useEncounterStore.getState().fail()
    }
  }, [pendingEncounters, rng])
}
