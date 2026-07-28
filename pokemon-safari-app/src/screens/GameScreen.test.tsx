import { MemoryRouter, Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BottomNav } from '@/components/BottomNav'
import { biomeEncounterTables } from '@/data/encounterTables'
import { encounterTimingMs } from '@/data/rates'
import { WORLD_SPAWN } from '@/data/worldConfig'
import { hydrateFromStorage, resetCacheMemoryForTests } from '@/services/pokeapi/cache'
import { findStepOnto } from '@/test/world-step-helpers'
import { GameScreen } from '@/screens/GameScreen'
import { useUiStore } from '@/store'
import { useEncounterStore } from '@/store/encounterStore'
import { useExploreStore } from '@/store/exploreStore'
import {
  clearPokeCacheKey,
  makePokemonDto,
  seedPokeCache,
} from '@/test/pokeapi-test-helpers'
import { flushFrames } from '@/test/setup'
import { setDefaultRngForTests } from '@/utils/rng'

function encounterRng(...values: number[]) {
  let index = 0
  return {
    next: () => values[Math.min(index++, values.length - 1)] ?? 0,
  }
}

beforeEach(() => {
  clearPokeCacheKey()
  resetCacheMemoryForTests()
  useUiStore.setState({ cacheReady: false })
})

afterEach(() => {
  cleanup()
  clearPokeCacheKey()
  resetCacheMemoryForTests()
  useUiStore.setState({ cacheReady: false })
})

describe('GameScreen cache gate (D-02)', () => {
  it('when cache not ready, shows Safari is still packing… and See progress toward /boot', () => {
    render(
      <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/game']}>
        <Routes>
          <Route path="/game" element={<GameScreen />} />
          <Route path="/boot" element={<div>Boot route</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Safari is still packing…')).toBeInTheDocument()
    const cta = screen.getByRole('link', { name: 'See progress' })
    expect(cta).toHaveAttribute('href', expect.stringContaining('/boot'))
  })
})

function renderExplore() {
  return render(
    <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/game']}>
      <GameScreen />
    </MemoryRouter>,
  )
}

function renderExploreWithNav() {
  return render(
    <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/game']}>
      <GameScreen />
      <BottomNav />
    </MemoryRouter>,
  )
}

/** AppShell-shaped: BottomNav stays mounted when GameScreen unmounts. */
function renderAppShellLike({ showGame }: { showGame: boolean }) {
  return (
    <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/game']}>
      {showGame ? <GameScreen /> : null}
      <BottomNav />
    </MemoryRouter>
  )
}

function setupGrassApproach() {
  const step = findStepOnto('grass')
  useExploreStore.setState({
    tile: { ...step.from },
    facing: step.dir,
    moving: false,
  })
  return step
}

function arrowFor(dir: 'up' | 'down' | 'left' | 'right') {
  return dir === 'up'
    ? 'ArrowUp'
    : dir === 'down'
      ? 'ArrowDown'
      : dir === 'left'
        ? 'ArrowLeft'
        : 'ArrowRight'
}

async function walkIntoPokemonEncounter(user: ReturnType<typeof userEvent.setup>) {
  const step = findStepOnto('grass')
  const key = arrowFor(step.dir)
  useExploreStore.setState({ tile: { ...step.from }, facing: step.dir, moving: false })
  // outcome, species, pool roll (>=0.6 → single-digit), fact pick, feedback, catch roll
  setDefaultRngForTests(encounterRng(0, 0, 0.6, 0.3, 0.3, 0))

  fireEvent.keyDown(window, { code: key })
  await flushFrames(8)
  fireEvent.keyUp(window, { code: key })

  await screen.findByRole('dialog')
  const prompt = await screen.findByText(/What is \d+ × \d+\?/)
  const match = prompt.textContent?.match(/What is (\d+) × (\d+)\?/)
  expect(match).not.toBeNull()
  return { a: Number(match![1]), b: Number(match![2]), user }
}

describe('GameScreen explore surface (MAP-01 / MAP-02 / MAP-04)', () => {
  beforeEach(() => {
    useUiStore.setState({ cacheReady: true })
    useExploreStore.getState().reset()
    useEncounterStore.getState().reset()
    seedPokeCache()
    hydrateFromStorage()
  })

  afterEach(() => {
    useExploreStore.getState().reset()
    useEncounterStore.getState().reset()
    setDefaultRngForTests(null)
  })

  it('renders the Walk controls D-pad instead of the Phase 1 placeholder', () => {
    renderExplore()

    expect(screen.queryByText('Forest')).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Walk controls' })).toBeInTheDocument()

    for (const name of ['Move up', 'Move down', 'Move left', 'Move right']) {
      const arm = screen.getByRole('button', { name })
      expect(arm.className).toMatch(/dpad-target/)
    }

    expect(screen.queryByText(/Safari isn’t ready yet/)).toBeNull()
    expect(screen.queryByRole('heading', { name: /^game$/i })).toBeNull()
  })

  it('renders terrain canvas and pixelated player sprites on the explore surface', () => {
    renderExplore()

    expect(screen.queryByText('Forest')).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Walk controls' })).toBeInTheDocument()
    expect(screen.getByTestId('terrain-canvas')).toBeInTheDocument()
    expect(document.querySelectorAll('img.pixelated').length).toBeGreaterThan(0)
  })

  it('walks one tile down on an arrow key and stops once the key is released', async () => {
    renderExplore()
    const spawn = WORLD_SPAWN

    fireEvent.keyDown(window, { code: 'ArrowDown' })
    await flushFrames(4)
    expect(useExploreStore.getState().tile).toEqual({ x: spawn.x, y: spawn.y + 1 })

    fireEvent.keyUp(window, { code: 'ArrowDown' })
    const settled = useExploreStore.getState().tile
    await flushFrames(30)
    expect(useExploreStore.getState().tile).toEqual(settled)
  })

  it('walks one tile without leaving geometric leg-stub nodes on the surface', async () => {
    renderExplore()

    fireEvent.keyDown(window, { code: 'ArrowDown' })
    await flushFrames(4)
    fireEvent.keyUp(window, { code: 'ArrowDown' })
    await flushFrames(4)

    expect(document.querySelectorAll('.player-leg-left').length).toBe(0)
    expect(document.querySelectorAll('.player-leg-right').length).toBe(0)
  })

  it('alternates both step poses across consecutive tile steps', async () => {
    renderExplore()
    const player = document.querySelector<HTMLElement>('.player-sprite')
    expect(player).not.toBeNull()

    const observedPoses: string[] = []
    fireEvent.keyDown(window, { code: 'ArrowDown' })
    for (let frame = 0; frame < 26; frame += 1) {
      await flushFrames(1)
      const pose = player?.dataset.frame
      if (pose && pose !== observedPoses.at(-1)) {
        observedPoses.push(pose)
      }
    }
    fireEvent.keyUp(window, { code: 'ArrowDown' })

    expect(observedPoses.slice(0, 4)).toEqual(['1', '0', '2', '0'])
  })

  it('walks with WASD through the same held-direction path', async () => {
    renderExplore()
    const spawn = WORLD_SPAWN

    fireEvent.keyDown(window, { code: 'KeyD' })
    await flushFrames(4)
    fireEvent.keyUp(window, { code: 'KeyD' })

    expect(useExploreStore.getState().facing).toBe('right')
    expect(useExploreStore.getState().tile).toEqual({ x: spawn.x + 1, y: spawn.y })
  })

  it('updates sprite data-facing when turning after immunity is armed', async () => {
    useExploreStore.getState().armPokemonImmunity()
    renderExplore()
    const player = document.querySelector<HTMLElement>('.player-sprite')
    expect(player).not.toBeNull()
    expect(player).toHaveAttribute('data-facing', 'down')

    fireEvent.keyDown(window, { code: 'ArrowLeft' })
    await flushFrames(2)
    fireEvent.keyUp(window, { code: 'ArrowLeft' })
    await flushFrames(20)

    expect(useExploreStore.getState().facing).toBe('left')
    expect(player).toHaveAttribute('data-facing', 'left')

    fireEvent.keyDown(window, { code: 'ArrowUp' })
    await flushFrames(2)
    fireEvent.keyUp(window, { code: 'ArrowUp' })
    await flushFrames(20)

    expect(useExploreStore.getState().facing).toBe('up')
    expect(player).toHaveAttribute('data-facing', 'up')
  })

  it('walks when a D-pad arm is pressed and stops on pointer up', async () => {
    renderExplore()
    const spawn = WORLD_SPAWN
    const up = screen.getByRole('button', { name: 'Move up' })

    fireEvent.pointerDown(up, { pointerId: 1 })
    await flushFrames(4)
    expect(useExploreStore.getState().tile).toEqual({ x: spawn.x, y: spawn.y - 1 })

    fireEvent.pointerUp(up, { pointerId: 1 })
    const settled = useExploreStore.getState().tile
    await flushFrames(30)
    expect(useExploreStore.getState().tile).toEqual(settled)
  })

  it('ignores key codes outside the allowlist', async () => {
    renderExplore()
    const spawn = WORLD_SPAWN

    fireEvent.keyDown(window, { code: 'Space' })
    await flushFrames(6)

    expect(useExploreStore.getState().tile).toEqual(spawn)
    expect(useExploreStore.getState().facing).toBe('down')
    fireEvent.keyUp(window, { code: 'Space' })
  })

  it('blocks a step into an obstacle while still turning to face it', async () => {
    const step = findStepOnto('obstacle')
    useExploreStore.setState({ tile: { ...step.from }, facing: step.dir, moving: false })
    renderExplore()

    fireEvent.keyDown(window, { code: arrowFor(step.dir) })
    await flushFrames(8)
    fireEvent.keyUp(window, { code: arrowFor(step.dir) })

    expect(useExploreStore.getState().tile).toEqual(step.from)
    expect(useExploreStore.getState().facing).toBe(step.dir)
  })

  it('commits to the store per tile, not per frame (MAP-04)', async () => {
    renderExplore()
    const start = useExploreStore.getState().tile
    const notify = vi.fn()
    const unsubscribe = useExploreStore.subscribe(notify)

    fireEvent.keyDown(window, { code: 'ArrowDown' })
    await flushFrames(30)
    fireEvent.keyUp(window, { code: 'ArrowDown' })

    const end = useExploreStore.getState().tile
    const tilesWalked = Math.abs(end.x - start.x) + Math.abs(end.y - start.y)
    unsubscribe()

    expect(tilesWalked).toBeGreaterThan(0)
    expect(notify.mock.calls.length).toBeLessThanOrEqual(tilesWalked * 2)
    expect(notify.mock.calls.length).toBeLessThan(30)
  })

  it('stops responding to keys after unmount', async () => {
    const { unmount } = renderExplore()
    unmount()

    const before = useExploreStore.getState().tile
    fireEvent.keyDown(window, { code: 'ArrowDown' })
    await flushFrames(6)
    fireEvent.keyUp(window, { code: 'ArrowDown' })

    expect(useExploreStore.getState().tile).toEqual(before)
  })

  it('clears the move lock on unmount so remount can walk again', async () => {
    const spawn = WORLD_SPAWN
    const { unmount } = renderExplore()

    // Start a step, then leave /game before the tween finishes.
    fireEvent.keyDown(window, { code: 'ArrowDown' })
    await flushFrames(1)
    expect(useExploreStore.getState().moving).toBe(true)
    fireEvent.keyUp(window, { code: 'ArrowDown' })
    unmount()

    expect(useExploreStore.getState().moving).toBe(false)

    renderExplore()
    const afterRemount = useExploreStore.getState().tile
    fireEvent.keyDown(window, { code: 'ArrowRight' })
    await flushFrames(4)
    fireEvent.keyUp(window, { code: 'ArrowRight' })

    expect(useExploreStore.getState().tile).toEqual({
      x: afterRemount.x + 1,
      y: afterRemount.y,
    })
    // Sanity: we actually left spawn via the interrupted down step or remount walk.
    expect(
      useExploreStore.getState().tile.x !== spawn.x ||
        useExploreStore.getState().tile.y !== spawn.y,
    ).toBe(true)
  })

  it('shows a wild Pokémon, asks a question, then Capture / Math boost / Gotcha, and returns to the map', async () => {
    const user = userEvent.setup()
    const step = setupGrassApproach()
    // outcome, species, pool roll, fact pick, feedback, catch roll (0 = always catch)
    setDefaultRngForTests(encounterRng(0, 0, 0.6, 0.3, 0.3, 0))
    renderExplore()

    fireEvent.keyDown(window, { code: arrowFor(step.dir) })
    await flushFrames(8)
    fireEvent.keyUp(window, { code: arrowFor(step.dir) })

    const dialog = await screen.findByRole('dialog')
    const firstCommon = biomeEncounterTables.forest.common[0]!
    expect(dialog).toHaveTextContent(`A wild p${firstCommon} appeared!`)
    expect(useExploreStore.getState().pendingEncounters).toEqual([])

    const prompt = await screen.findByText(/What is \d+ × \d+\?/)
    expect(screen.getByLabelText('Your answer')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Ready to throw!' })).toBeNull()

    const match = prompt.textContent?.match(/What is (\d+) × (\d+)\?/)
    expect(match).not.toBeNull()
    const a = Number(match![1])
    const b = Number(match![2])
    await user.type(screen.getByLabelText('Your answer'), String(a * b))
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }))

    await waitFor(() => {
      expect(screen.getByText(/catch boost/i)).toBeInTheDocument()
    })

    expect(
      await screen.findByRole(
        'button',
        { name: 'Capture' },
        {
          timeout:
            Math.max(
              encounterTimingMs.feedbackHold,
              encounterTimingMs.incorrectFeedbackHold,
            ) + 1000,
        },
      ),
    ).toBeInTheDocument()
    expect(screen.getByText(/Math boost:/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Ready to throw!' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Capture' }))

    expect(
      await screen.findByRole('heading', { name: 'Gotcha!' }, { timeout: 8000 }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('group', { name: 'Walk controls' })).toBeInTheDocument()
  })

  it('keeps a nothing roll silent', async () => {
    const step = setupGrassApproach()
    setDefaultRngForTests(encounterRng(0.71))
    renderExplore()

    fireEvent.keyDown(window, { code: arrowFor(step.dir) })
    await flushFrames(8)
    fireEvent.keyUp(window, { code: arrowFor(step.dir) })

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('freezes keyboard movement and hides the D-pad while the dialog is open', async () => {
    const step = setupGrassApproach()
    setDefaultRngForTests(encounterRng(0, 0))
    renderExplore()

    fireEvent.keyDown(window, { code: arrowFor(step.dir) })
    await flushFrames(8)
    fireEvent.keyUp(window, { code: arrowFor(step.dir) })
    await screen.findByRole('dialog')
    const frozenTile = useExploreStore.getState().tile

    fireEvent.keyDown(window, { code: 'ArrowDown' })
    await flushFrames(8)
    fireEvent.keyUp(window, { code: 'ArrowDown' })

    expect(useExploreStore.getState().tile).toEqual(frozenTile)
    expect(screen.queryByRole('group', { name: 'Walk controls' })).toBeNull()
  })

  it('shows recovery UI when the rolled species is absent from cache', async () => {
    seedPokeCache(Array.from({ length: 150 }, (_, index) => makePokemonDto(index + 2)))
    hydrateFromStorage()
    const step = setupGrassApproach()
    setDefaultRngForTests(encounterRng(0, 0))
    renderExplore()

    fireEvent.keyDown(window, { code: arrowFor(step.dir) })
    await flushFrames(8)
    fireEvent.keyUp(window, { code: arrowFor(step.dir) })

    expect(
      await screen.findByRole('heading', { name: 'That encounter got stuck.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
  })

  it('emits nothing when stepping onto ground', async () => {
    // Spawn carve is all ground — step up onto (0, -1).
    useExploreStore.setState({
      tile: { ...WORLD_SPAWN },
      facing: 'up',
      moving: false,
      pendingEncounters: [],
    })
    renderExplore()

    fireEvent.keyDown(window, { code: 'ArrowUp' })
    await flushFrames(8)
    fireEvent.keyUp(window, { code: 'ArrowUp' })

    expect(useExploreStore.getState().tile).toEqual({ x: 0, y: -1 })
    expect(useExploreStore.getState().pendingEncounters).toEqual([])
  })

  it('never lets pendingEncounters grow past 32', () => {
    const events = Array.from({ length: 40 }, (_, i) => ({
      type: 'encounter_candidate' as const,
      biome: 'forest' as const,
      x: i,
      y: 0,
      at: i,
    }))
    useExploreStore.getState().pushEncounters(events)
    expect(useExploreStore.getState().pendingEncounters.length).toBeLessThanOrEqual(32)
    expect(useExploreStore.getState().pendingEncounters).toHaveLength(32)
  })

  it('drainEncounters remains FIFO and idempotent at the store boundary', () => {
    useExploreStore.getState().pushEncounters([
      {
        type: 'encounter_candidate',
        biome: 'forest',
        x: 10,
        y: 5,
        at: 1,
      },
    ])
    const first = useExploreStore.getState().drainEncounters()
    expect(first).toHaveLength(1)
    expect(first[0]).toMatchObject({ type: 'encounter_candidate', x: 10, y: 5 })
    expect(useExploreStore.getState().pendingEncounters).toEqual([])
    expect(useExploreStore.getState().drainEncounters()).toEqual([])
  })

  it('does not show map-error copy on a healthy explore surface', () => {
    renderExplore()

    expect(screen.queryByText(/Map didn’t load/)).toBeNull()
    expect(screen.getByRole('group', { name: 'Walk controls' })).toBeInTheDocument()
  })

  it('shows Quick recap after a wrong answer flee Continue, then returns to the map', async () => {
    const user = userEvent.setup()
    renderExplore()
    const { a, b } = await walkIntoPokemonEncounter(user)

    await user.type(screen.getByLabelText('Your answer'), String(a * b + 1))
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }))

    // Wrong education skips capture bar, Miss flash, and shake — flees immediately.
    expect(screen.queryByRole('button', { name: 'Capture' })).toBeNull()
    expect(screen.queryByText(/Math boost:/)).toBeNull()

    expect(
      await screen.findByRole(
        'heading',
        { name: 'It got away!' },
        {
          timeout:
            Math.max(
              encounterTimingMs.feedbackHold,
              encounterTimingMs.incorrectFeedbackHold,
            ) + 8000,
        },
      ),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(
      await screen.findByRole('heading', { name: 'Quick recap' }),
    ).toBeInTheDocument()
    expect(screen.getByText(`${a} × ${b} = ${a * b}.`)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('group', { name: 'Walk controls' })).toBeInTheDocument()

    const tile = useExploreStore.getState().tile
    fireEvent.keyDown(window, { code: 'ArrowDown' })
    await flushFrames(8)
    fireEvent.keyUp(window, { code: 'ArrowDown' })
    expect(useExploreStore.getState().tile).not.toEqual(tile)
  })

  it('skips Quick recap after a correct-answer Gotcha and returns straight to the map', async () => {
    const user = userEvent.setup()
    renderExplore()
    const { a, b } = await walkIntoPokemonEncounter(user)

    await user.type(screen.getByLabelText('Your answer'), String(a * b))
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }))

    expect(
      await screen.findByRole(
        'button',
        { name: 'Capture' },
        {
          timeout:
            Math.max(
              encounterTimingMs.feedbackHold,
              encounterTimingMs.incorrectFeedbackHold,
            ) + 1000,
        },
      ),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Capture' }))

    expect(
      await screen.findByRole('heading', { name: 'Gotcha!' }, { timeout: 8000 }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.queryByRole('heading', { name: 'Quick recap' })).toBeNull()
    expect(screen.queryByText(/Quick recap/)).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('group', { name: 'Walk controls' })).toBeInTheDocument()
  })

  it('marks Main nav inert while the encounter is open and clears it after close', async () => {
    const user = userEvent.setup()
    renderExploreWithNav()
    const { a, b } = await walkIntoPokemonEncounter(user)

    const navOpen = document.querySelector('nav[aria-label="Main"]')
    expect(navOpen).not.toBeNull()
    expect(navOpen!.hasAttribute('inert')).toBe(true)

    await user.type(screen.getByLabelText('Your answer'), String(a * b))
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }))
    expect(
      await screen.findByRole(
        'button',
        { name: 'Capture' },
        {
          timeout:
            Math.max(
              encounterTimingMs.feedbackHold,
              encounterTimingMs.incorrectFeedbackHold,
            ) + 1000,
        },
      ),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Capture' }))
    expect(
      await screen.findByRole('heading', { name: 'Gotcha!' }, { timeout: 8000 }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    const navClosed = document.querySelector('nav[aria-label="Main"]')
    expect(navClosed).not.toBeNull()
    expect(navClosed!.hasAttribute('inert')).toBe(false)
  })

  it('clears Main nav inert when GameScreen unmounts mid-encounter', async () => {
    const user = userEvent.setup()
    const { rerender } = render(renderAppShellLike({ showGame: true }))
    await walkIntoPokemonEncounter(user)

    const navOpen = document.querySelector('nav[aria-label="Main"]')
    expect(navOpen).not.toBeNull()
    expect(navOpen!.hasAttribute('inert')).toBe(true)
    expect(useEncounterStore.getState().stage).not.toBe('idle')

    // Leave /game without dismissing — unmount only GameScreen (AppShell shape).
    rerender(renderAppShellLike({ showGame: false }))

    expect(useEncounterStore.getState().stage).toBe('idle')
    expect(screen.queryByRole('dialog')).toBeNull()
    const navAfter = document.querySelector('nav[aria-label="Main"]')
    expect(navAfter).not.toBeNull()
    expect(navAfter!.hasAttribute('inert')).toBe(false)
  })

  it('completes the wrong-answer loop to Quick recap under prefers-reduced-motion', async () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia

    try {
      const user = userEvent.setup()
      renderExplore()
      const { a, b } = await walkIntoPokemonEncounter(user)

      await user.type(screen.getByLabelText('Your answer'), String(a * b + 1))
      await user.click(screen.getByRole('button', { name: 'Submit Answer' }))

      expect(screen.queryByRole('button', { name: 'Capture' })).toBeNull()
      expect(screen.queryByText(/Math boost:/)).toBeNull()

      expect(
        await screen.findByRole(
          'heading',
          { name: 'It got away!' },
          {
            timeout:
              Math.max(
                encounterTimingMs.feedbackHold,
                encounterTimingMs.incorrectFeedbackHold,
                encounterTimingMs.reducedFeedbackHold,
                encounterTimingMs.reducedIncorrectFeedbackHold,
              ) + 8000,
          },
        ),
      ).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Continue' }))

      expect(
        await screen.findByRole('heading', { name: 'Quick recap' }),
      ).toBeInTheDocument()
      expect(screen.getByText(`${a} × ${b} = ${a * b}.`)).toBeInTheDocument()
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  it('shows fail beat then kind flee after three misses — no Run CTA (CATCH-04)', async () => {
    const user = userEvent.setup()
    const step = setupGrassApproach()
    // outcome, species, pool, fact, feedback, then three always-miss catch rolls
    // Use 1.0 so even a clamped 100% chance still fails (rng.next() < chance).
    setDefaultRngForTests(encounterRng(0, 0, 0.6, 0.3, 0.3, 1, 1, 1))
    renderExplore()

    fireEvent.keyDown(window, { code: arrowFor(step.dir) })
    await flushFrames(8)
    fireEvent.keyUp(window, { code: arrowFor(step.dir) })

    const prompt = await screen.findByText(/What is \d+ × \d+\?/)
    const match = prompt.textContent?.match(/What is (\d+) × (\d+)\?/)
    expect(match).not.toBeNull()
    const a = Number(match![1])
    const b = Number(match![2])
    await user.type(screen.getByLabelText('Your answer'), String(a * b))
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }))

    expect(
      await screen.findByRole(
        'button',
        { name: 'Capture' },
        {
          timeout:
            Math.max(
              encounterTimingMs.feedbackHold,
              encounterTimingMs.incorrectFeedbackHold,
            ) + 1000,
        },
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Capture' }))

    expect(
      await screen.findByText('Oh! It broke free!', {}, { timeout: 8000 }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Run$/i })).toBeNull()

    expect(
      await screen.findByRole(
        'button',
        { name: 'Capture' },
        { timeout: encounterTimingMs.failBeat + 2000 },
      ),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Capture' }))

    expect(
      await screen.findByText('Oh! It broke free!', {}, { timeout: 8000 }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole(
        'button',
        { name: 'Capture' },
        { timeout: encounterTimingMs.failBeat + 2000 },
      ),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Capture' }))

    expect(
      await screen.findByRole('heading', { name: 'It got away!' }, { timeout: 8000 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /That’s okay — you’ll find another!|That's okay — you'll find another!/,
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Run$/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /Try Again/i })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  }, 30_000)
})
