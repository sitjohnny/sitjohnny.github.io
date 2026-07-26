import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { DexTile } from '@/components/dex/DexTile'
import { makePokemonDto } from '@/test/pokeapi-test-helpers'

afterEach(() => {
  cleanup()
})

const pikachu = makePokemonDto(25, { name: 'pikachu' })

describe('DexTile a11y (D-06, D-07, D-09, T-06-02)', () => {
  it('unknown state accessible name is Pokémon #NNN without species name', () => {
    render(
      <DexTile
        speciesId={25}
        pokemon={pikachu}
        entry={undefined}
        onSelect={() => {}}
      />,
    )
    const btn = screen.getByRole('button', { name: 'Pokémon #025' })
    expect(btn).toBeInTheDocument()
    expect(btn.getAttribute('aria-label')).not.toMatch(/pikachu/i)
    expect(btn.textContent ?? '').not.toMatch(/pikachu/i)
  })

  it('seen-but-not-caught matches unknown a11y name (no name leak)', () => {
    render(
      <DexTile
        speciesId={25}
        pokemon={pikachu}
        entry={{
          seen: true,
          firstEncounteredAt: '2026-07-26T12:00:00.000Z',
          firstCapturedAt: null,
          catchCount: 0,
          shinyOwned: false,
        }}
        onSelect={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: 'Pokémon #025' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pikachu/i })).not.toBeInTheDocument()
  })

  it('caught state includes name in accessible name', () => {
    render(
      <DexTile
        speciesId={25}
        pokemon={pikachu}
        entry={{
          seen: true,
          firstEncounteredAt: '2026-07-26T12:00:00.000Z',
          firstCapturedAt: '2026-07-26T12:05:00.000Z',
          catchCount: 1,
          shinyOwned: false,
        }}
        onSelect={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: /#025 Pikachu/i })).toBeInTheDocument()
  })

  it('shinyOwned includes shiny owned in name / sparkle present', () => {
    const { container } = render(
      <DexTile
        speciesId={25}
        pokemon={pikachu}
        entry={{
          seen: true,
          firstEncounteredAt: '2026-07-26T12:00:00.000Z',
          firstCapturedAt: '2026-07-26T12:05:00.000Z',
          catchCount: 1,
          shinyOwned: true,
        }}
        onSelect={() => {}}
      />,
    )
    expect(
      screen.getByRole('button', { name: /#025 Pikachu.*shiny owned/i }),
    ).toBeInTheDocument()
    expect(container.querySelector('.dex-sparkle')).not.toBeNull()
  })
})
