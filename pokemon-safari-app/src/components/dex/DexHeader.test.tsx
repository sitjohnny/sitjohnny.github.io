import type { ComponentType } from 'react'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MEGA_CATALOG_LENGTH } from '@/data/megaCatalog'
import { DexHeader } from '@/components/dex/DexHeader'
import type { DexFilterState, DexModeFilter, DexStatusFilter } from '@/game/dexFilters'
import { TOTAL_ROSTER_COUNT } from '@/services/pokeapi/keys'

type DexHeaderTestProps = {
  seen: number
  caught: number
  denominator: number
  filter: DexFilterState
  onStatusChange: (status: DexStatusFilter) => void
  onTypeChange: (type: string | null) => void
  onModeChange: (mode: DexModeFilter) => void
}

const TestDexHeader = DexHeader as unknown as ComponentType<DexHeaderTestProps>

afterEach(() => {
  cleanup()
})

function renderHeader(
  overrides: Partial<Pick<DexHeaderTestProps, 'seen' | 'caught' | 'denominator' | 'filter'>> = {},
) {
  const onModeChange = vi.fn()
  const filter: DexFilterState = overrides.filter ?? {
    status: 'all',
    type: null,
    mode: 'all',
  }

  render(
    <TestDexHeader
      seen={overrides.seen ?? 0}
      caught={overrides.caught ?? 0}
      denominator={overrides.denominator ?? TOTAL_ROSTER_COUNT}
      filter={filter}
      onStatusChange={() => {}}
      onTypeChange={() => {}}
      onModeChange={onModeChange}
    />,
  )

  return { onModeChange }
}

describe('DexHeader mode filters', () => {
  it('shows Seen/Caught over the mega denominator in mega mode', () => {
    renderHeader({
      seen: 1,
      caught: 0,
      denominator: MEGA_CATALOG_LENGTH,
      filter: { status: 'all', type: null, mode: 'mega' },
    })

    expect(
      screen.getByText(
        new RegExp(`Seen 1/${MEGA_CATALOG_LENGTH}\\s*·\\s*Caught 0/${MEGA_CATALOG_LENGTH}`),
      ),
    ).toBeInTheDocument()
  })

  it('renders mode chips and reports mode changes', async () => {
    const user = userEvent.setup()
    const { onModeChange } = renderHeader()

    const group = screen.getByRole('group', { name: 'Dex mode filter' })
    expect(within(group).getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(group).getByRole('button', { name: 'National' })).toBeInTheDocument()

    await user.click(within(group).getByRole('button', { name: 'Mega' }))

    expect(onModeChange).toHaveBeenCalledWith('mega')
  })
})
