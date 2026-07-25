import type { RefObject } from 'react'
import { TILE_PX } from '@/data/exploreConfig'
import type { Direction } from '@/types/map'

export type PlayerSpriteProps = {
  spriteRef: RefObject<HTMLDivElement | null>
  facing: Direction
}

/** Face marker placement — the only readable cue for the current facing until 03-03 adds walk frames. */
const FACE_POSITION: Record<Direction, string> = {
  up: 'left-1/2 top-0 -translate-x-1/2',
  down: 'bottom-0 left-1/2 -translate-x-1/2',
  left: 'left-0 top-1/2 -translate-y-1/2',
  right: 'right-0 top-1/2 -translate-y-1/2',
}

/**
 * Placeholder pixel player. Position is written imperatively by the frame loop
 * through `spriteRef`; this component only re-renders when facing changes.
 */
export function PlayerSprite({ spriteRef, facing }: PlayerSpriteProps) {
  return (
    <div
      ref={spriteRef}
      className="pixelated absolute left-0 top-0 will-change-transform"
      style={{ width: TILE_PX, height: TILE_PX }}
    >
      <div className="absolute inset-[6px] bg-secondary shadow-[0_0_0_2px_#1A3324]">
        <span
          aria-hidden="true"
          className={`absolute h-3 w-3 bg-on-secondary ${FACE_POSITION[facing]}`}
        />
      </div>
    </div>
  )
}
