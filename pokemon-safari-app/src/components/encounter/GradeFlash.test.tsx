import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { captureCopy } from '@/data/educationConfig'
import { GradeFlash } from '@/components/encounter/GradeFlash'
import { timingBoostLabel } from '@/game/timingBoostCopy'

vi.mock('@/hooks/useMapCamera', () => ({
  prefersReducedMotion: vi.fn(() => false),
}))

afterEach(() => {
  cleanup()
})

describe('GradeFlash', () => {
  it('shows grade shout and timing boost label beneath', () => {
    render(<GradeFlash grade="perfect" onComplete={vi.fn()} />)

    expect(screen.getByText(captureCopy.grades.perfect)).toBeInTheDocument()
    expect(screen.getByText(timingBoostLabel('perfect'))).toBeInTheDocument()
  })

  it('hides timing boost subtitle when showTimingBoost is false', () => {
    render(<GradeFlash grade="miss" showTimingBoost={false} onComplete={vi.fn()} />)

    expect(screen.getByText(captureCopy.grades.miss)).toBeInTheDocument()
    expect(screen.queryByText(timingBoostLabel('miss'))).not.toBeInTheDocument()
  })
})
