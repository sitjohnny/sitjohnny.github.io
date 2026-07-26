import { createRef } from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PlayerSprite } from '@/components/map/PlayerSprite'

/**
 * Mirrors the `[data-facing][data-frame]` visibility contract that ships in
 * index.css. Vitest runs with `css: false`, so the component's real stylesheet
 * is never injected into jsdom — we install the same rules here to prove the
 * imperative `dataset.frame` swap toggles which stacked img is painted, with no
 * React re-render involved.
 */
const VISIBILITY_CSS = `
  .player-sprite > img { display: none; }
  .player-sprite[data-facing='up'][data-frame='0'] > img[data-dir='up'][data-walk='0'],
  .player-sprite[data-facing='up'][data-frame='1'] > img[data-dir='up'][data-walk='1'],
  .player-sprite[data-facing='up'][data-frame='2'] > img[data-dir='up'][data-walk='2'],
  .player-sprite[data-facing='down'][data-frame='0'] > img[data-dir='down'][data-walk='0'],
  .player-sprite[data-facing='down'][data-frame='1'] > img[data-dir='down'][data-walk='1'],
  .player-sprite[data-facing='down'][data-frame='2'] > img[data-dir='down'][data-walk='2'],
  .player-sprite[data-facing='left'][data-frame='0'] > img[data-dir='left'][data-walk='0'],
  .player-sprite[data-facing='left'][data-frame='1'] > img[data-dir='left'][data-walk='1'],
  .player-sprite[data-facing='left'][data-frame='2'] > img[data-dir='left'][data-walk='2'],
  .player-sprite[data-facing='right'][data-frame='0'] > img[data-dir='right'][data-walk='0'],
  .player-sprite[data-facing='right'][data-frame='1'] > img[data-dir='right'][data-walk='1'],
  .player-sprite[data-facing='right'][data-frame='2'] > img[data-dir='right'][data-walk='2'] {
    display: block;
  }
`

function installVisibilityCss(): HTMLStyleElement {
  const style = document.createElement('style')
  style.textContent = VISIBILITY_CSS
  document.head.appendChild(style)
  return style
}

afterEach(() => {
  cleanup()
  for (const style of document.head.querySelectorAll('style')) {
    style.remove()
  }
})

describe('PlayerSprite Red walker (MAP-04)', () => {
  it('mounts stacked pixelated Red frame imgs and no geometric leg stubs', () => {
    const ref = createRef<HTMLDivElement>()
    const { container } = render(<PlayerSprite spriteRef={ref} facing="down" />)

    expect(container.querySelectorAll('img.pixelated')).toHaveLength(12)
    expect(
      container.querySelectorAll('.player-leg-left, .player-leg-right').length,
    ).toBe(0)

    const root = ref.current
    expect(root).not.toBeNull()
    expect(root).toHaveClass('player-sprite')
    expect(root).toHaveAttribute('data-facing', 'down')
    expect(root).toHaveAttribute('data-frame', '0')
  })

  it('swaps the visible frame via dataset.frame alone — no React rerender', () => {
    installVisibilityCss()
    const ref = createRef<HTMLDivElement>()
    render(<PlayerSprite spriteRef={ref} facing="down" />)

    const root = ref.current as HTMLDivElement
    const frame0 = root.querySelector<HTMLImageElement>(
      "img[data-dir='down'][data-walk='0']",
    )
    const frame1 = root.querySelector<HTMLImageElement>(
      "img[data-dir='down'][data-walk='1']",
    )
    const frame2 = root.querySelector<HTMLImageElement>(
      "img[data-dir='down'][data-walk='2']",
    )
    expect(frame0).not.toBeNull()
    expect(frame1).not.toBeNull()
    expect(frame2).not.toBeNull()

    // Default frame 0 of the down facing is the only visible down img.
    expect(getComputedStyle(frame0 as HTMLImageElement).display).toBe('block')
    expect(getComputedStyle(frame1 as HTMLImageElement).display).toBe('none')

    // The explore loop's sole write path: mutate dataset.frame, no setState.
    root.dataset.frame = '1'

    expect(getComputedStyle(frame1 as HTMLImageElement).display).toBe('block')
    expect(getComputedStyle(frame0 as HTMLImageElement).display).toBe('none')

    root.dataset.frame = '2'

    expect(getComputedStyle(frame2 as HTMLImageElement).display).toBe('block')
    expect(getComputedStyle(frame1 as HTMLImageElement).display).toBe('none')
  })

  it('shows the matching facing stack when the facing prop changes', () => {
    installVisibilityCss()
    const ref = createRef<HTMLDivElement>()
    const { rerender } = render(<PlayerSprite spriteRef={ref} facing="down" />)

    const root = ref.current as HTMLDivElement
    const downIdle = root.querySelector<HTMLImageElement>(
      "img[data-dir='down'][data-walk='0']",
    )
    expect(getComputedStyle(downIdle as HTMLImageElement).display).toBe('block')

    rerender(<PlayerSprite spriteRef={ref} facing="up" />)
    expect(root).toHaveAttribute('data-facing', 'up')
    // Idle after a facing change is frame 0 of the new facing.
    root.dataset.frame = '0'

    const upIdle = root.querySelector<HTMLImageElement>(
      "img[data-dir='up'][data-walk='0']",
    )
    expect(getComputedStyle(upIdle as HTMLImageElement).display).toBe('block')
    expect(getComputedStyle(downIdle as HTMLImageElement).display).toBe('none')
  })
})
