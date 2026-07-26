import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DexDetailSheet } from '@/components/dex/DexDetailSheet'
import { DexTile } from '@/components/dex/DexTile'
import { hydrateFromStorage, resetCacheMemoryForTests } from '@/services/pokeapi/cache'
import {
  clearPokeCacheKey,
  makePokemonDto,
  seedPokeCache,
} from '@/test/pokeapi-test-helpers'

afterEach(() => {
  cleanup()
  clearPokeCacheKey()
  resetCacheMemoryForTests()
})

beforeEach(() => {
  clearPokeCacheKey()
  resetCacheMemoryForTests()
})

const pikachu = makePokemonDto(25, {
  name: 'pikachu',
  types: ['electric'],
  genus: 'Mouse Pokémon',
  height: 4,
  weight: 60,
  flavorText: 'When several of these Pokémon gather, their electricity can cause lightning storms.',
  sprites: {
    front_default: 'https://example.test/25.png',
    front_shiny: 'https://example.test/s25.png',
    official_artwork: 'https://example.test/art/25.png',
  },
})

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

describe('DexDetailSheet caught lore (D-03, D-09, D-16, D-20)', () => {
  beforeEach(() => {
    seedPokeCache(
      Array.from({ length: 151 }, (_, i) =>
        i + 1 === 25 ? pikachu : makePokemonDto(i + 1),
      ),
    )
    hydrateFromStorage()
  })

  const caughtEntry = {
    seen: true,
    firstEncounteredAt: '2026-07-26T12:00:00.000Z',
    firstCapturedAt: '2026-07-25T12:00:00.000Z',
    catchCount: 2,
    shinyOwned: false,
  }

  it('caught sheet shows genus, types, artwork, size, name, flavor, meta, and Close', () => {
    render(
      <DexDetailSheet speciesId={25} entry={caughtEntry} onClose={() => {}} />,
    )
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Mouse Pokémon')).toBeInTheDocument()
    expect(within(dialog).getByText('Electric')).toBeInTheDocument()
    expect(within(dialog).getByText('0.4 m')).toBeInTheDocument()
    expect(within(dialog).getByText('6.0 kg')).toBeInTheDocument()
    expect(within(dialog).getByRole('img', { name: /pikachu/i })).toHaveAttribute(
      'src',
      'https://example.test/art/25.png',
    )
    expect(within(dialog).getByRole('heading', { name: /pikachu/i })).toBeInTheDocument()
    expect(within(dialog).getByText('#025')).toBeInTheDocument()
    expect(within(dialog).getByText(/electricity can cause lightning storms/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/Caught:\s*2/)).toBeInTheDocument()
    expect(within(dialog).getByText(/First seen:/)).toBeInTheDocument()
    expect(within(dialog).getByText(/First caught:/)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: /Show shiny|Show normal/i })).not.toBeInTheDocument()
  })

  it('null flavorText renders kid-friendly placeholder only in UI', () => {
    seedPokeCache(
      Array.from({ length: 151 }, (_, i) =>
        makePokemonDto(i + 1, {
          name: i + 1 === 25 ? 'pikachu' : `p${i + 1}`,
          flavorText: null,
        }),
      ),
    )
    hydrateFromStorage()
    render(
      <DexDetailSheet speciesId={25} entry={caughtEntry} onClose={() => {}} />,
    )
    expect(screen.getByText('No Pokédex entry yet.')).toBeInTheDocument()
  })

  it('shinyOwned opens on shiny sprite; Show normal swaps URL only', async () => {
    const user = userEvent.setup()
    render(
      <DexDetailSheet
        speciesId={25}
        entry={{ ...caughtEntry, shinyOwned: true }}
        onClose={() => {}}
      />,
    )
    const dialog = screen.getByRole('dialog')
    const img = within(dialog).getByRole('img', { name: /pikachu/i })
    expect(img).toHaveAttribute('src', 'https://example.test/s25.png')
    expect(within(dialog).getByRole('button', { name: 'Show normal' })).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Show normal' }))
    expect(img).toHaveAttribute('src', 'https://example.test/art/25.png')
    expect(within(dialog).getByRole('button', { name: 'Show shiny' })).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Show shiny' }))
    expect(img).toHaveAttribute('src', 'https://example.test/s25.png')
  })

  it('stub branch stays leak-free for uncaught ids', () => {
    render(
      <DexDetailSheet speciesId={25} entry={undefined} onClose={() => {}} />,
    )
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('???')).toBeInTheDocument()
    expect(within(dialog).queryByText(/pikachu/i)).not.toBeInTheDocument()
    expect(within(dialog).queryByText('Electric')).not.toBeInTheDocument()
    expect(within(dialog).queryByText(/Mouse Pokémon/)).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('img')).not.toBeInTheDocument()
    expect(within(dialog).queryByText(/First seen/)).not.toBeInTheDocument()
    expect(within(dialog).queryByText(/Caught:/)).not.toBeInTheDocument()
  })
})
