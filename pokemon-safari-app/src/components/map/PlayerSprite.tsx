import type { RefObject } from 'react'
import { TILE_PX } from '@/data/exploreConfig'
import type { Direction } from '@/types/map'

export type PlayerSpriteProps = {
  spriteRef: RefObject<HTMLDivElement | null>
  facing: Direction
}

/** Face marker placement — the only React-driven cue; legs animate via data-frame CSS. */
const FACE_POSITION: Record<Direction, string> = {
  up: 'left-1/2 top-0 -translate-x-1/2',
  down: 'bottom-0 left-1/2 -translate-x-1/2',
  left: 'left-0 top-1/2 -translate-y-1/2',
  right: 'right-0 top-1/2 -translate-y-1/2',
}

/**
 * Placeholder pixel player. Position and walk frame are written imperatively by
 * the frame loop through `spriteRef` / `data-frame`; this component only
 * re-renders when facing changes.
 */
export function PlayerSprite({ spriteRef, facing }: PlayerSpriteProps) {
  return (
    <div
      ref={spriteRef}
      className="player-sprite pixelated absolute left-0 top-0"
      data-frame="0"
      aria-hidden="true"
      style={{ width: TILE_PX, height: TILE_PX }}
    >
      <div className="absolute inset-[6px] bg-secondary">
        <span
          aria-hidden="true"
          className={`absolute h-3 w-3 bg-on-secondary ${FACE_POSITION[facing]}`}
        />
        <span className="player-leg-left" aria-hidden="true" />
        <span className="player-leg-right" aria-hidden="true" />
      </div>
    </div>
  )
}
