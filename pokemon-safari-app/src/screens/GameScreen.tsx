import { useEffect, useRef, useState } from 'react'
import { CacheGateNotice } from '@/components/CacheGateNotice'
import { DPad } from '@/components/controls/DPad'
import { EmptyState } from '@/components/EmptyState'
import { MapViewport } from '@/components/map/MapViewport'
import { PlayerSprite } from '@/components/map/PlayerSprite'
import { TileWorld } from '@/components/map/TileWorld'
import { PixelButton } from '@/components/PixelButton'
import { QuotaNote } from '@/components/QuotaNote'
import { TILE_PX } from '@/data/exploreConfig'
import { forestMap } from '@/data/maps/forest'
import { isValidMap } from '@/game/collision'
import { useExploreLoop } from '@/hooks/useExploreLoop'
import { usePlayerInput } from '@/hooks/usePlayerInput'
import { isCacheReady } from '@/services/pokeapi/cache'
import { useUiStore } from '@/store'
import { useExploreStore } from '@/store/exploreStore'

const WORLD_WIDTH_PX = forestMap.width * TILE_PX
const WORLD_HEIGHT_PX = forestMap.height * TILE_PX

const MAP_ERROR_HEADING = 'Map didn’t load'
const TRY_AGAIN_LABEL = 'Try Again'
const MAP_ERROR_BODY =
  `Something went wrong showing the Forest. Tap ${TRY_AGAIN_LABEL}. If it keeps failing, go back Home.`

/**
 * Explore/Game — the Forest surface, still behind the Gen 1 cache gate (D-02).
 */
export function GameScreen() {
  const storeReady = useUiStore((s) => s.cacheReady)
  const quotaSoftFail = useUiStore((s) => s.quotaSoftFail)
  const setQuotaSoftFail = useUiStore((s) => s.setQuotaSoftFail)
  const ready = isCacheReady() || storeReady
  // reloadKey forces a re-check of map integrity after recovery (T-03-11).
  const [reloadKey, setReloadKey] = useState(0)
  const mapOk = isValidMap(forestMap)

  if (!ready) {
    return <CacheGateNotice />
  }

  if (!mapOk) {
    return (
      <section className="relative flex flex-1 flex-col" key={reloadKey}>
        <p className="px-4 py-2 font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-text">
          Forest
        </p>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 pb-8">
          <EmptyState heading={MAP_ERROR_HEADING} body={MAP_ERROR_BODY} />
          <PixelButton
            variant="primary"
            onClick={() => {
              useExploreStore.getState().reset()
              setReloadKey((k) => k + 1)
            }}
          >
            {TRY_AGAIN_LABEL}
          </PixelButton>
        </div>
      </section>
    )
  }

  return (
    <ExploreSurface
      key={reloadKey}
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
  // Facing changes at most once per step — a coarse subscription, not per frame.
  const facing = useExploreStore((s) => s.facing)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const worldRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<HTMLDivElement | null>(null)
  const input = usePlayerInput()

  useExploreLoop({
    map: forestMap,
    heldRef: input.heldRef,
    worldRef,
    playerRef,
    viewportRef,
  })

  // Leaving /game mid-walk must not leave a direction held.
  const { clear } = input
  useEffect(() => clear, [clear])

  return (
    <section className="relative flex flex-1 flex-col">
      <p className="px-4 py-2 font-[family-name:var(--font-label)] text-[14px] font-normal leading-[1.4] text-text">
        Forest
      </p>

      <MapViewport
        viewportRef={viewportRef}
        worldRef={worldRef}
        widthPx={WORLD_WIDTH_PX}
        heightPx={WORLD_HEIGHT_PX}
      >
        <TileWorld map={forestMap} />
        <PlayerSprite spriteRef={playerRef} facing={facing} />
      </MapViewport>

      {/* The shell already clears the BottomNav and its safe area, so the
          overlay only needs its own 16px inset. */}
      <DPad
        onPress={input.press}
        onRelease={input.release}
        className="absolute bottom-4 left-[max(16px,env(safe-area-inset-left))]"
      />

      {quotaSoftFail ? (
        <div className="absolute left-1/2 top-10 z-10 -translate-x-1/2">
          <QuotaNote onDismiss={onDismissQuota} />
        </div>
      ) : null}
    </section>
  )
}
