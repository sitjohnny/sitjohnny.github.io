import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PixelButton } from '@/components/PixelButton'

describe('PixelButton', () => {
  it('uses muted grey styles when disabled instead of the gold accent', () => {
    render(
      <PixelButton variant="primary" disabled>
        Submit Answer
      </PixelButton>,
    )

    const button = screen.getByRole('button', { name: 'Submit Answer' })
    expect(button).toBeDisabled()
    expect(button.className).toMatch(/disabled:bg-muted/)
    expect(button.className).toMatch(/disabled:shadow-none/)
    expect(button.className).not.toMatch(/disabled:bg-accent/)
  })
})
