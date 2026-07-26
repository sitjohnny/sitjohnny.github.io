import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TypeBadge } from '@/components/TypeBadge'
import { typeColors } from '@/data/typeColors'

describe('TypeBadge', () => {
  it('renders capitalized label with type color background', () => {
    render(<TypeBadge type="fire" />)
    const badge = screen.getByText(/fire/i)
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveStyle({ backgroundColor: typeColors.fire })
  })
})
