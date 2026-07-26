import '@testing-library/jest-dom/vitest'
import { act } from '@testing-library/react'

/**
 * jsdom shims for the exploration frame loop.
 *
 * `matchMedia` is only installed when jsdom does not provide one, so a real
 * implementation is never overwritten. The animation-frame pair is always
 * replaced: jsdom's `pretendToBeVisual` rAF fires on a real ~16ms wall clock,
 * which makes frame-driven tests slow and flaky. The replacement is backed by a
 * zero-delay macrotask so `flushFrames` can advance the loop one frame at a
 * time with a deterministic, monotonically increasing timestamp.
 */

const FRAME_MS = 16

type ShimmedWindow = Window & typeof globalThis & { __exploreFrameShim?: true }

const shimTarget = window as ShimmedWindow

if (typeof shimTarget.matchMedia !== 'function') {
  shimTarget.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}

if (!shimTarget.__exploreFrameShim) {
  shimTarget.__exploreFrameShim = true

  let frameTime = 0

  shimTarget.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    frameTime += FRAME_MS
    const timestamp = frameTime
    return setTimeout(() => callback(timestamp), 0) as unknown as number
  }) as typeof window.requestAnimationFrame

  shimTarget.cancelAnimationFrame = ((handle: number) => {
    clearTimeout(handle as unknown as ReturnType<typeof setTimeout>)
  }) as typeof window.cancelAnimationFrame
}

/**
 * Advance the shimmed animation-frame loop by `count` frames.
 *
 * Each iteration yields one macrotask, which runs exactly the frame callback
 * queued before it (timers of equal delay fire FIFO). Wrapped in `act` so store
 * commits made from inside the loop settle before the assertion runs.
 */
export async function flushFrames(count = 3): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await act(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
    })
  }
}
