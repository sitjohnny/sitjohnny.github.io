import { useEffect, useRef } from 'react'
import { CacheGateNotice } from '@/components/CacheGateNotice'
import { DPad } from '@/components/controls/DPad'
import { EncounterOverlay } from '@/components/encounter/EncounterOverlay'
import { ItemToast } from '@/components/encounter/ItemToast'
import { MapViewport } from '@/components/map/MapViewport'
import { PlayerSprite } from '@/components/map/PlayerSprite'
import { TerrainCanvas } from '@/components/map/TerrainCanvas'
import { QuotaNote } from '@/components/QuotaNote'
import type { TileImages } from '@/game/world/drawTerrain'
import { createWorld } from '@/game/world/worldProvider'
import { useEncounterFlow } from '@/hooks/useEncounterFlow'
import { useExploreLoop } from '@/hooks/useExploreLoop'
import { usePlayerInput } from '@/hooks/usePlayerInput'
import { isCacheReady } from '@/services/pokeapi/cache'
import { useUiStore } from '@/store'
import { useEncounterStore } from '@/store/encounterStore'
import { useExploreStore } from '@/store/exploreStore'

/**
 * Explore/Game — infinite procedural Forest, behind the Gen 1 cache gate (D-02).
 */
export function GameScreen() {
  const storeReady = useUiStore((s) => s.cacheReady)
  const quotaSoftFail = useUiStore((s) => s.quotaSoftFail)
  const setQuotaSoftFail = useUiStore((s) => s.setQuotaSoftFail)
  const ready = isCacheReady() || storeReady

  if (!ready) {
    return <CacheGateNotice />
  }

  return (
    <ExploreSurface
      quotaSoftFail={quotaSoftFail}
      onDismissQuota={() => setQuotaSoftFail(false)}
    />
  )
}

type ExploreSurfaceProps = {
  quotaSoftFail: boolean
  onDismissQuota: () => void
}

function ExploreSurface({ quotaSoftFail, onDismissQuota }: ExploreSurfaceProps) {
  const facing = useExploreStore((s) => s.facing)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const worldLayerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imagesRef = useRef<TileImages>({})
  const worldRef = useRef(createWorld())
  const world = worldRef.current
  const input = usePlayerInput()
  const stage = useEncounterStore((state) => state.stage)
  const itemToastVisible = useEncounterStore((state) => state.itemToastVisible)

  useEncounterFlow()

  useExploreLoop({
    world,
    heldRef: input.heldRef,
    worldRef: worldLayerRef,
    playerRef,
    viewportRef,
    canvasRef,
    imagesRef,
  })

  const { clear } = input
  useEffect(() => clear, [clear])

  return (
    <section className="relative flex min-h-0 flex-1 flex-col">
      <p className="px-4 py-2 font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-text">
        Forest
      </p>

      <MapViewport
        viewportRef={viewportRef}
        worldRef={worldLayerRef}
        backdrop={<TerrainCanvas canvasRef={canvasRef} imagesRef={imagesRef} />}
      >
        <PlayerSprite spriteRef={playerRef} facing={facing} />
      </MapViewport>

      {stage === 'idle' ? (
        <DPad
          onPress={input.press}
          onRelease={input.release}
          className="absolute bottom-4 left-[max(16px,env(safe-area-inset-left))]"
        />
      ) : null}

      {quotaSoftFail ? (
        <div className="absolute left-1/2 top-10 z-10 -translate-x-1/2">
          <QuotaNote onDismiss={onDismissQuota} />
        </div>
      ) : null}

      {itemToastVisible ? (
        <div className="absolute left-1/2 top-10 z-10 -translate-x-1/2">
          <ItemToast onDismiss={() => useEncounterStore.getState().hideItemToast()} />
        </div>
      ) : null}

      <EncounterOverlay />
    </section>
  )
}
