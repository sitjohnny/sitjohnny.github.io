import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DPad } from '@/components/controls/DPad'

afterEach(() => {
  cleanup()
})

describe('DPad hold/release', () => {
  it('calls onRelease when unmounted while a direction is still held', () => {
    const onPress = vi.fn()
    const onRelease = vi.fn()
    const { unmount } = render(<DPad onPress={onPress} onRelease={onRelease} />)

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Move left' }), {
      pointerId: 1,
    })
    expect(onPress).toHaveBeenCalledWith('left')

    unmount()

    expect(onRelease).toHaveBeenCalledWith('left')
  })
})
