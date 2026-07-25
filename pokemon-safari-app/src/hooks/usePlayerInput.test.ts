import { describe, expect, it } from 'vitest'
import { KEY_DIRECTION, primaryDirection } from '@/hooks/usePlayerInput'

describe('KEY_DIRECTION allowlist (MAP-01, T-03-01)', () => {
  it('maps arrow keys to the four directions', () => {
    expect(KEY_DIRECTION.ArrowUp).toBe('up')
    expect(KEY_DIRECTION.ArrowDown).toBe('down')
    expect(KEY_DIRECTION.ArrowLeft).toBe('left')
    expect(KEY_DIRECTION.ArrowRight).toBe('right')
  })

  it('maps WASD to the same four directions', () => {
    expect(KEY_DIRECTION.KeyW).toBe('up')
    expect(KEY_DIRECTION.KeyS).toBe('down')
    expect(KEY_DIRECTION.KeyA).toBe('left')
    expect(KEY_DIRECTION.KeyD).toBe('right')
  })

  it('omits every other key code so unknown input is ignored', () => {
    for (const code of ['Space', 'Enter', 'KeyQ', 'Tab', 'Escape', 'Digit1']) {
      expect(KEY_DIRECTION[code]).toBeUndefined()
    }
  })
})

describe('primaryDirection', () => {
  it('returns null when nothing is held', () => {
    expect(primaryDirection([])).toBeNull()
  })

  it('returns the only held direction', () => {
    expect(primaryDirection(['up'])).toBe('up')
  })

  it('lets the last press win', () => {
    expect(primaryDirection(['up', 'left'])).toBe('left')
    expect(primaryDirection(['left', 'up'])).toBe('up')
    expect(primaryDirection(['down', 'right', 'up'])).toBe('up')
  })
})
