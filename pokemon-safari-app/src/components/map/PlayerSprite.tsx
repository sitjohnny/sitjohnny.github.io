import type { CSSProperties, RefObject } from 'react'
import { memo } from 'react'
import { PLAYER_SPRITE_H_PX, TILE_PX } from '@/data/exploreConfig'
import type { Direction } from '@/types/map'
import redDown0 from '@/assets/player/red-down-0.png'
import redDown1 from '@/assets/player/red-down-1.png'
import redDown2 from '@/assets/player/red-down-2.png'
import redUp0 from '@/assets/player/red-up-0.png'
import redUp1 from '@/assets/player/red-up-1.png'
import redUp2 from '@/assets/player/red-up-2.png'
import redLeft0 from '@/assets/player/red-left-0.png'
import redLeft1 from '@/assets/player/red-left-1.png'
import redLeft2 from '@/assets/player/red-left-2.png'
import redRight0 from '@/assets/player/red-right-0.png'
import redRight1 from '@/assets/player/red-right-1.png'
import redRight2 from '@/assets/player/red-right-2.png'

export type PlayerSpriteProps = {
  spriteRef: RefObject<HTMLDivElement | null>
  facing: Direction
}

type Frame = {
  dir: Direction
  walk: '0' | '1' | '2'
  src: string
}

/**
 * Every facing × frame is mounted once. Which one paints is decided purely by
 * the CSS `[data-facing][data-frame]` selectors in index.css matching each
 * img's `data-dir` / `data-walk` — never React state (MAP-04). The explore loop
 * is the sole writer of `data-frame` on the ref root.
 */
const FRAMES: readonly Frame[] = [
  { dir: 'down', walk: '0', src: redDown0 },
  { dir: 'down', walk: '1', src: redDown1 },
  { dir: 'down', walk: '2', src: redDown2 },
  { dir: 'up', walk: '0', src: redUp0 },
  { dir: 'up', walk: '1', src: redUp1 },
  { dir: 'up', walk: '2', src: redUp2 },
  { dir: 'left', walk: '0', src: redLeft0 },
  { dir: 'left', walk: '1', src: redLeft1 },
  { dir: 'left', walk: '2', src: redLeft2 },
  { dir: 'right', walk: '0', src: redRight0 },
  { dir: 'right', walk: '1', src: redRight1 },
  { dir: 'right', walk: '2', src: redRight2 },
]

/**
 * Character Red overworld walker. Position and walk-frame index are written
 * imperatively through `spriteRef` / `data-frame` by the frame loop; this
 * component only re-renders when the `facing` prop changes so CSS can reveal
 * the matching facing stack.
 *
 * Memoized so parent re-renders (encounter queue, toasts) do not reset
 * `data-frame="0"` from JSX and wipe the in-flight walk pose (MAP-04).
 */
export const PlayerSprite = memo(function PlayerSprite({
  spriteRef,
  facing,
}: PlayerSpriteProps) {
  return (
    <div
      ref={spriteRef}
      className="player-sprite absolute left-0 top-0"
      data-facing={facing}
      data-frame="0"
      aria-hidden="true"
      style={
        {
          width: TILE_PX,
          height: TILE_PX,
          '--player-sprite-h': `${PLAYER_SPRITE_H_PX}px`,
        } as CSSProperties
      }
    >
      {FRAMES.map((frame) => (
        <img
          key={`${frame.dir}-${frame.walk}`}
          src={frame.src}
          alt=""
          draggable={false}
          aria-hidden="true"
          className="pixelated"
          data-dir={frame.dir}
          data-walk={frame.walk}
        />
      ))}
    </div>
  )
})
