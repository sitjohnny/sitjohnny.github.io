import { MemoryRouter, Route, Routes } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { encounterTimingMs } from '@/data/rates'
import { forestMap } from '@/data/maps/forest'
import {
  hydrateFromStorage,
  resetCacheMemoryForTests,
} from '@/services/pokeapi/cache'
import { GameScreen } from '@/screens/GameScreen'
import { HomeScreen } from '@/screens/HomeScreen'
import { SettingsScreen } from '@/screens/SettingsScreen'
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

const forestMock = vi.hoisted(() => ({ corrupt: false }))

vi.mock('@/data/maps/forest', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/data/maps/forest')>()
  return {
    get forestMap() {
      if (forestMock.corrupt) {
        return {
          ...mod.forestMap,
          tiles: mod.forestMap.tiles.slice(0, -1),
        }
      }
      return mod.forestMap
    },
  }
})

beforeEach(() => {
  forestMock.corrupt = false
  clearPokeCacheKey()
  resetCacheMemoryForTests()
  useUiStore.setState({ cacheReady: false })
})

afterEach(() => {
  forestMock.corrupt = false
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

  it('Home and Settings remain reachable outside the Game-only gate', () => {
    render(
      <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/']}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/game" element={<GameScreen />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Pokémon Safari')).toBeInTheDocument()
    expect(screen.queryByText('Safari is still packing…')).not.toBeInTheDocument()
  })
})

function renderExplore() {
  return render(
    <MemoryRouter basename="/pokemon-safari" initialEntries={['/pokemon-safari/game']}>
      <GameScreen />
    </MemoryRouter>,
  )
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

  it('renders the Forest label and the Walk controls D-pad instead of the Phase 1 placeholder', () => {
    renderExplore()

    expect(screen.getByText('Forest')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Walk controls' })).toBeInTheDocument()

    for (const name of ['Move up', 'Move down', 'Move left', 'Move right']) {
      const arm = screen.getByRole('button', { name })
      expect(arm.className).toMatch(/dpad-target/)
    }

    expect(screen.queryByText(/Safari isn’t ready yet/)).toBeNull()
    expect(screen.queryByRole('heading', { name: /^game$/i })).toBeNull()
  })

  it('renders pixelated tile images on the explore surface (MAP-02 visual swap)', () => {
    renderExplore()

    expect(screen.getByText('Forest')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Walk controls' })).toBeInTheDocument()
    expect(document.querySelectorAll('img.pixelated').length).toBeGreaterThan(0)
  })

  it('walks one tile down on an arrow key and stops once the key is released', async () => {
    renderExplore()
    const spawn = forestMap.spawn

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
    const spawn = forestMap.spawn

    fireEvent.keyDown(window, { code: 'KeyD' })
    await flushFrames(4)
    fireEvent.keyUp(window, { code: 'KeyD' })

    expect(useExploreStore.getState().facing).toBe('right')
    expect(useExploreStore.getState().tile).toEqual({ x: spawn.x + 1, y: spawn.y })
  })

  it('walks when a D-pad arm is pressed and stops on pointer up', async () => {
    renderExplore()
    const spawn = forestMap.spawn
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
    const spawn = forestMap.spawn

    fireEvent.keyDown(window, { code: 'Space' })
    await flushFrames(6)

    expect(useExploreStore.getState().tile).toEqual(spawn)
    expect(useExploreStore.getState().facing).toBe('down')
    fireEvent.keyUp(window, { code: 'Space' })
  })

  it('blocks a step into an obstacle while still turning to face it', async () => {
    // (10, 13) is walkable ground; (10, 14) is the map's obstacle border row.
    useExploreStore.setState({ tile: { x: 10, y: 13 }, facing: 'up', moving: false })
    renderExplore()

    fireEvent.keyDown(window, { code: 'ArrowDown' })
    await flushFrames(8)
    fireEvent.keyUp(window, { code: 'ArrowDown' })

    expect(useExploreStore.getState().tile).toEqual({ x: 10, y: 13 })
    expect(useExploreStore.getState().facing).toBe('down')
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
    const spawn = forestMap.spawn
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

  it('shows a wild Pokémon, asks a question, then handoff, and returns to the map', async () => {
    const user = userEvent.setup()
    // (10, 6) is ground; (10, 5) is grass in the northern patch.
    useExploreStore.setState({ tile: { x: 10, y: 6 }, facing: 'up', moving: false })
    setDefaultRngForTests(encounterRng(0, 0, 0, 0.2, 0.3))
    renderExplore()

    fireEvent.keyDown(window, { code: 'ArrowUp' })
    await flushFrames(8)
    fireEvent.keyUp(window, { code: 'ArrowUp' })

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('A wild p10 appeared!')
    expect(useExploreStore.getState().pendingEncounters).toEqual([])

    const prompt = await screen.findByText(/What is \d × \d\?/)
    expect(screen.getByLabelText('Your answer')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Ready to throw!' })).toBeNull()

    const match = prompt.textContent?.match(/What is (\d) × (\d)\?/)
    expect(match).not.toBeNull()
    const a = Number(match![1])
    const b = Number(match![2])
    await user.type(screen.getByLabelText('Your answer'), String(a * b))
    await user.click(screen.getByRole('button', { name: 'Submit Answer' }))

    await waitFor(() => {
      expect(screen.getByText(/catch boost/i)).toBeInTheDocument()
    })

    expect(
      await screen.findByRole('heading', {
        name: 'Ready to throw!',
        timeout: encounterTimingMs.feedbackHold + 1000,
      }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Got it' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('group', { name: 'Walk controls' })).toBeInTheDocument()
  })

  it('keeps a nothing roll silent', async () => {
    useExploreStore.setState({ tile: { x: 10, y: 6 }, facing: 'up', moving: false })
    setDefaultRngForTests(encounterRng(0.5))
    renderExplore()

    fireEvent.keyDown(window, { code: 'ArrowUp' })
    await flushFrames(8)
    fireEvent.keyUp(window, { code: 'ArrowUp' })

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('shows a non-blocking item toast and keeps the D-pad present', async () => {
    useExploreStore.setState({ tile: { x: 10, y: 6 }, facing: 'up', moving: false })
    setDefaultRngForTests(encounterRng(0.75))
    renderExplore()

    fireEvent.keyDown(window, { code: 'ArrowUp' })
    await flushFrames(8)
    fireEvent.keyUp(window, { code: 'ArrowUp' })

    expect(await screen.findByRole('status')).toHaveTextContent('Found an item!')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('group', { name: 'Walk controls' })).toBeInTheDocument()
  })

  it('freezes keyboard movement and hides the D-pad while the dialog is open', async () => {
    useExploreStore.setState({ tile: { x: 10, y: 6 }, facing: 'up', moving: false })
    setDefaultRngForTests(encounterRng(0, 0))
    renderExplore()

    fireEvent.keyDown(window, { code: 'ArrowUp' })
    await flushFrames(8)
    fireEvent.keyUp(window, { code: 'ArrowUp' })
    await screen.findByRole('dialog')
    const frozenTile = useExploreStore.getState().tile

    fireEvent.keyDown(window, { code: 'ArrowDown' })
    await flushFrames(8)
    fireEvent.keyUp(window, { code: 'ArrowDown' })

    expect(useExploreStore.getState().tile).toEqual(frozenTile)
    expect(screen.queryByRole('group', { name: 'Walk controls' })).toBeNull()
  })

  it('shows recovery UI when the rolled species is absent from cache', async () => {
    seedPokeCache(
      Array.from({ length: 150 }, (_, index) => makePokemonDto(index + 2)),
    )
    hydrateFromStorage()
    useExploreStore.setState({ tile: { x: 10, y: 6 }, facing: 'up', moving: false })
    setDefaultRngForTests(encounterRng(0, 0))
    renderExplore()

    fireEvent.keyDown(window, { code: 'ArrowUp' })
    await flushFrames(8)
    fireEvent.keyUp(window, { code: 'ArrowUp' })

    expect(
      await screen.findByRole('heading', { name: 'That encounter got stuck.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
  })

  it('emits nothing when stepping onto ground', async () => {
    // Spawn (10, 7) → walk up onto (10, 6) ground.
    useExploreStore.setState({
      tile: { ...forestMap.spawn },
      facing: 'up',
      moving: false,
      pendingEncounters: [],
    })
    renderExplore()

    fireEvent.keyDown(window, { code: 'ArrowUp' })
    await flushFrames(8)
    fireEvent.keyUp(window, { code: 'ArrowUp' })

    expect(useExploreStore.getState().tile).toEqual({ x: 10, y: 6 })
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

  it('does not show map-error copy when forestMap is valid', () => {
    renderExplore()

    expect(screen.queryByText(/Map didn’t load/)).toBeNull()
    expect(screen.getByRole('group', { name: 'Walk controls' })).toBeInTheDocument()
  })
})

describe('GameScreen map-load error recovery', () => {
  beforeEach(() => {
    useUiStore.setState({ cacheReady: true })
    useExploreStore.getState().reset()
    forestMock.corrupt = true
  })

  afterEach(() => {
    forestMock.corrupt = false
    useExploreStore.getState().reset()
  })

  it('renders the Map didn’t load recovery card instead of Walk controls', () => {
    renderExplore()

    expect(screen.getByRole('heading', { name: 'Map didn’t load' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Something went wrong showing the Forest. Tap Try Again. If it keeps failing, go back Home.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Walk controls' })).toBeNull()
    expect(screen.getByText('Forest')).toBeInTheDocument()
  })
})
