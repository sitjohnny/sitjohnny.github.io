import { useCallback, useEffect, useState } from 'react'
import { DexDetailSheet } from '@/components/dex/DexDetailSheet'
import { DexGrid } from '@/components/dex/DexGrid'
import { DexHeader } from '@/components/dex/DexHeader'
import { countCaught, countSeen } from '@/game/dex'
import { hydrateFromStorage } from '@/services/pokeapi/cache'
import { useUiStore } from '@/store'
import { useDexStore } from '@/store/dexStore'

/**
 * Pokédex browse surface — sticky header + 151-tile grid + stub detail sheet
 * (D-01, D-04, D-07–D-13). No /dex/:id route; no PokéAPI calls from this screen.
 */
export function DexScreen() {
  const dex = useDexStore((s) => s.dex)
  const setDexSheetOpen = useUiStore((s) => s.setDexSheetOpen)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const seen = countSeen(dex)
  const caught = countCaught(dex)

  useEffect(() => {
    // Sync hydrate so getPokemon lookups inside DexTile resolve without a Boot visit.
    hydrateFromStorage()
  }, [])

  useEffect(() => {
    setDexSheetOpen(selectedId !== null)
  }, [selectedId, setDexSheetOpen])

  useEffect(() => {
    return () => {
      // Mid-sheet navigate must not leave BottomNav stuck inert.
      useUiStore.getState().setDexSheetOpen(false)
    }
  }, [])

  const closeSheet = useCallback(() => {
    setSelectedId(null)
  }, [])

  const openSheet = useCallback((speciesId: number) => {
    setSelectedId(speciesId)
  }, [])

  return (
    <section className="relative flex flex-1 flex-col">
      <DexHeader seen={seen} caught={caught} />
      <div className="flex-1 overflow-y-auto px-4 pb-[max(48px,env(safe-area-inset-bottom))] pt-6">
        <DexGrid dex={dex} onSelect={openSheet} />
      </div>
      {selectedId !== null ? (
        <DexDetailSheet
          speciesId={selectedId}
          entry={dex[String(selectedId)]}
          onClose={closeSheet}
        />
      ) : null}
    </section>
  )
}
