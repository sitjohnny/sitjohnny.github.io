import { cleanup, render, screen, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { encounterTimingMs } from '@/data/rates'
import { BallShake } from '@/components/encounter/BallShake'

vi.mock('@/hooks/useMapCamera', () => ({
  prefersReducedMotion: vi.fn(() => false),
}))

import { prefersReducedMotion } from '@/hooks/useMapCamera'

const prefersReducedMotionMock = vi.mocked(prefersReducedMotion)

function ballRoot() {
  return document.querySelector('[data-ending]') as HTMLElement
}

function phase() {
  return ballRoot().getAttribute('data-phase')
}

function spriteSrc() {
  const img = ballRoot().querySelector('img') as HTMLImageElement
  return img?.getAttribute('src') ?? ''
}

function shakeTotalMs(shakes: number, reduced = false) {
  const once = reduced ? encounterTimingMs.reducedShakeOnce : encounterTimingMs.shakeOnce
  const gap = reduced ? encounterTimingMs.reducedShakeGap : encounterTimingMs.shakeGap
  return shakes * once + Math.max(0, shakes - 1) * gap
}

beforeEach(() => {
  prefersReducedMotionMock.mockReturnValue(false)
  vi.useFakeTimers()
  vi.spyOn(Math, 'random').mockReturnValue(0) // escape → 1 shake unless overridden
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('BallShake sprites + phases', () => {
  it('on catch: always reports 3 shakes regardless of Math.random', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const onComplete = vi.fn()
    render(<BallShake caught onComplete={onComplete} />)

    expect(ballRoot().getAttribute('data-shakes')).toBe('3')
    expect(ballRoot().getAttribute('data-caught')).toBe('true')
    expect(ballRoot().getAttribute('data-ending')).toBe('caught')
    expect(phase()).toBe('shaking')
    expect(spriteSrc()).toMatch(/ball-closed/)
    expect(screen.getByText('Caught')).toBeInTheDocument()
  })

  it('on escape: randomizes shake count in 1–3', () => {
    // Math.floor(r * 3) + 1 → 1, 2, 3 for r in [0,1/3), [1/3,2/3), [2/3,1)
    for (const [r, expected] of [
      [0, '1'],
      [0.34, '2'],
      [0.67, '3'],
    ] as const) {
      cleanup()
      vi.spyOn(Math, 'random').mockReturnValue(r)
      render(<BallShake caught={false} onComplete={vi.fn()} />)
      expect(ballRoot().getAttribute('data-shakes')).toBe(expected)
    }
  })

  it('wrong education: always 1 shake even on catch or high Math.random', () => {
    for (const caught of [true, false]) {
      cleanup()
      vi.spyOn(Math, 'random').mockReturnValue(0.99)
      render(<BallShake caught={caught} educationCorrect={false} onComplete={vi.fn()} />)
      expect(ballRoot().getAttribute('data-shakes')).toBe('1')
    }
  })

  it('on catch: after 3 shakes enters resolve-caught with sparkles, never opens, then completes', () => {
    const onComplete = vi.fn()
    render(<BallShake caught onComplete={onComplete} />)

    act(() => {
      vi.advanceTimersByTime(shakeTotalMs(3))
    })
    expect(phase()).toBe('resolve-caught')
    expect(spriteSrc()).toMatch(/ball-closed/)
    expect(ballRoot().querySelectorAll('[data-sparkle]')).toHaveLength(4)
    expect(spriteSrc()).not.toMatch(/open/)

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.shakeResolve)
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('on escape: mid-open then full-open hold after randomized shakes, then completes', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0) // 1 shake
    const onComplete = vi.fn()
    render(<BallShake caught={false} onComplete={onComplete} />)
    expect(ballRoot().getAttribute('data-caught')).toBe('false')
    expect(ballRoot().getAttribute('data-ending')).toBe('broke-free')
    expect(ballRoot().getAttribute('data-shakes')).toBe('1')
    expect(screen.getByText('Broke free')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(shakeTotalMs(1))
    })
    expect(phase()).toBe('resolve-mid-open')
    expect(spriteSrc()).toMatch(/ball-mid-open/)

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.shakeOpen)
    })
    expect(phase()).toBe('resolve-full-open')
    expect(spriteSrc()).toMatch(/ball-full-open/)

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.shakeEscapeHold)
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('reduced motion: skip mid-open on escape; complete after reducedShakeResolve', () => {
    prefersReducedMotionMock.mockReturnValue(true)
    vi.spyOn(Math, 'random').mockReturnValue(0.34) // 2 shakes
    const onComplete = vi.fn()
    render(<BallShake caught={false} onComplete={onComplete} />)

    act(() => {
      vi.advanceTimersByTime(shakeTotalMs(2, true))
    })
    expect(phase()).toBe('resolve-full-open')
    expect(spriteSrc()).toMatch(/ball-full-open/)

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.reducedShakeResolve)
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('reduced motion: on catch, resolve-caught with static sparkles, never opens, then completes', () => {
    prefersReducedMotionMock.mockReturnValue(true)
    const onComplete = vi.fn()
    render(<BallShake caught onComplete={onComplete} />)

    act(() => {
      vi.advanceTimersByTime(shakeTotalMs(3, true))
    })
    expect(phase()).toBe('resolve-caught')
    expect(spriteSrc()).toMatch(/ball-closed/)
    expect(spriteSrc()).not.toMatch(/open/)
    const sparkles = ballRoot().querySelectorAll('[data-sparkle]')
    expect(sparkles).toHaveLength(4)
    for (const el of sparkles) {
      expect(el).toHaveClass('ball-sparkle--static')
    }

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.reducedShakeResolve)
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(spriteSrc()).not.toMatch(/open/)
  })

  it('clears scheduled timers on unmount so onComplete is not called', () => {
    const onComplete = vi.fn()
    const { unmount } = render(<BallShake caught onComplete={onComplete} />)
    unmount()
    act(() => {
      vi.runAllTimers()
    })
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('applies ball-rock while shaking unless reduced motion', () => {
    const { unmount } = render(<BallShake caught onComplete={vi.fn()} />)
    expect(ballRoot().className).toMatch(/ball-rock/)
    unmount()

    prefersReducedMotionMock.mockReturnValue(true)
    render(<BallShake caught onComplete={vi.fn()} />)
    expect(ballRoot().className).not.toMatch(/ball-rock/)
  })

  it('alternates rock direction across consecutive shakes', () => {
    render(<BallShake caught onComplete={vi.fn()} />)
    expect(ballRoot().getAttribute('data-rock-dir')).toBe('ltr')
    expect(ballRoot().className).not.toMatch(/ball-rock--rtl/)

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.shakeOnce + encounterTimingMs.shakeGap)
    })
    expect(ballRoot().getAttribute('data-rock-dir')).toBe('rtl')
    expect(ballRoot().className).toMatch(/ball-rock--rtl/)

    act(() => {
      vi.advanceTimersByTime(encounterTimingMs.shakeOnce + encounterTimingMs.shakeGap)
    })
    expect(ballRoot().getAttribute('data-rock-dir')).toBe('ltr')
    expect(ballRoot().className).not.toMatch(/ball-rock--rtl/)
  })
})
