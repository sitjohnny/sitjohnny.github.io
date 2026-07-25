# Architecture Research

**Domain:** React + Zustand frontend-only tile capture game (config-driven)
**Researched:** 2026-07-25
**Confidence:** HIGH

## Standard Architecture

### System Overview

Frontend-only Safari games of this shape use a **four-layer stack**: presentation → reactive session state → pure game rules → config/services. React never owns encounter math; Zustand never embeds biome rates; PokéAPI is a boot-time prefetch, not a per-grass fetch.

```
┌─────────────────────────────────────────────────────────────────┐
│  Presentation (screens / components / hooks)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Explore  │ │ Capture  │ │ Pokédex  │ │ Menus    │           │
│  │ Screen   │ │ Overlay  │ │ Screen   │ │ + HUD    │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │ selectors / dispatch actions                           │
├───────┴────────────┴────────────┴────────────┴──────────────────┤
│  Session Store (Zustand slices + persist)                       │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │ phase  │ │ player │ │ invent │ │ dex    │ │ settings│      │
│  │ FSM    │ │ map    │ │ ory    │ │        │ │ + daily │      │
│  └────┬───┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬─────┘      │
│       │ actions call pure functions; partialize → localStorage │
├───────┴─────────┴──────────┴──────────┴────────────────────────┤
│  Game Rules (game/) — pure, testable, no React                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ movement │ │ encounter│ │ capture  │ │ unlocks  │           │
│  │ + camera │ │ roll     │ │ RPS/bar  │ │ + daily  │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │ reads config only                                      │
├───────┴────────────┴────────────┴────────────┴──────────────────┤
│  Data + Services                                                │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │ data/ (biomes, maps,│  │ services/ (pokeapi cache, audio, │ │
│  │ rates, items, tiles)│  │ save helpers, rng)               │ │
│  └─────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Screens** | Route-level compositions (boot, explore, dex, settings) | React Router pages; subscribe to phase + minimal selectors |
| **Components** | Presentational widgets (TileMap, DPad, CaptureRPS, TimingBar, DexEntry) | Props in / callbacks out; no config literals |
| **Hooks** | Input + lifecycle bridges (keyboard/touch, camera, boot prefetch) | Thin adapters that call store actions |
| **Store (Zustand)** | Session truth: phase FSM, position, biome, inventory, dex, settings, daily | Slices + `persist` with `partialize`; actions invoke `game/` |
| **Game logic** | Pure resolvers: move validity, grass roll, species pick, capture odds, unlocks | Plain TS modules; unit-tested; consume `data/` |
| **Data config** | Biomes, encounter tables, rates, maps, items, unlock thresholds | Typed TS/JSON manifests; versioned schema |
| **Services** | I/O: PokéAPI prefetch/cache, SFX, optional save migration | Async; no UI imports; thrice-idempotent boot |
| **Types** | Shared domain types (Tile, Phase, PokemonCacheEntry, SaveV1) | Single source; imported by all layers |
| **Utils** | RNG, coords, nearest-neighbor helpers | Stateless helpers |

## Recommended Project Structure

Matches PROJECT.md preferred layout:

```
src/
├── assets/                 # SFX, static tile images, fonts
├── components/             # Reusable UI (no game math)
│   ├── map/                # TileMap, PlayerSprite, CameraViewport
│   ├── controls/           # DPad, KeyboardHint
│   ├── capture/            # RPSButtons, TimingBar, CaptureResult
│   ├── dex/                # DexGrid, DexDetail, Silhouette
│   └── ui/                 # HUD, Modal, Button (shared chrome)
├── screens/                # Route pages
│   ├── BootScreen.tsx      # Prefetch + cache hydrate
│   ├── ExploreScreen.tsx   # Map + D-pad + HUD
│   ├── CaptureScreen.tsx   # Overlay/flow for RPS → timing → result
│   ├── PokedexScreen.tsx
│   └── SettingsScreen.tsx
├── hooks/                  # React bridges only
│   ├── usePlayerInput.ts
│   ├── useCameraFollow.ts
│   └── useBootPokemonCache.ts
├── services/               # Side effects / I/O
│   ├── pokeapi/
│   │   ├── client.ts       # Fetch Gen 1 metadata
│   │   ├── cache.ts        # Versioned localStorage JSON cache
│   │   └── sprites.ts      # URL helpers (no binary in localStorage)
│   ├── audio.ts            # Lightweight SFX
│   └── save.ts             # Migrate/validate save blob helpers
├── game/                   # Pure rules — no React, no fetch
│   ├── movement.ts
│   ├── camera.ts
│   ├── encounter.ts        # Grass roll + species selection
│   ├── capture.ts          # RPS resolve, timing window, catch roll, flee
│   ├── unlocks.ts          # Biome gates at catch thresholds
│   ├── daily.ts            # Once-per-day reward eligibility
│   └── phase.ts            # Allowed phase transitions (FSM table)
├── data/                   # Config manifests (tune without touching UI)
│   ├── biomes.ts
│   ├── encounterTables.ts
│   ├── rates.ts            # 45/25/20/8/2 grass weights, catch modifiers
│   ├── maps/               # Tile grids per biome
│   ├── items.ts
│   └── unlocks.ts
├── store/                  # Zustand
│   ├── index.ts            # Combined store + persist
│   ├── slices/
│   │   ├── phaseSlice.ts
│   │   ├── playerSlice.ts
│   │   ├── inventorySlice.ts
│   │   ├── dexSlice.ts
│   │   ├── dailySlice.ts
│   │   └── settingsSlice.ts
│   └── selectors.ts
├── types/
│   ├── game.ts
│   ├── pokemon.ts
│   ├── save.ts
│   └── phase.ts
└── utils/
    ├── rng.ts
    ├── coords.ts
    └── image.ts            # Nearest-neighbor CSS helpers
```

### Structure Rationale

- **`screens/` vs `components/`:** Screens own composition and routing; components stay reusable and dumb. Capture UI can be a screen or a full-screen overlay component — either way it only renders `phase` and dispatches actions.
- **`game/` vs `store/`:** Rules are pure `(state, input, config) → result`. Store applies results and persists. This keeps Vitest able to cover odds/unlocks without mounting React.
- **`data/` vs hardcoded UI:** PROJECT requires config-driven rates/biomes. UI reads labels/sprites from store/cache; never embeds `0.45` grass weights.
- **`services/` vs `game/`:** Network, audio, and storage are impure. Prefetch once on boot into a versioned cache; encounters read cache synchronously.
- **`hooks/` thin:** Input → `store.move(dir)`; boot → `services.pokeapi.ensureCache()`. No business rules in hooks.

## Architectural Patterns

### Pattern 1: Phase Finite State Machine in the Store

**What:** Explicit `GamePhase` enum drives which screen/overlay is active and which inputs are legal.
**When to use:** Always for explore → encounter → capture → resolve loops (kid UX needs predictable screens).
**Trade-offs:** Slight ceremony vs ad-hoc booleans; prevents illegal transitions (e.g. D-pad during RPS).

```typescript
// types/phase.ts
type GamePhase =
  | 'boot'
  | 'explore'
  | 'encounter_flash'
  | 'capture_rps'
  | 'capture_timing'
  | 'capture_result'
  | 'flee'
  | 'pokedex'
  | 'settings'

// game/phase.ts — pure guard table
const TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  explore: ['encounter_flash', 'pokedex', 'settings'],
  encounter_flash: ['capture_rps'],
  capture_rps: ['capture_timing'],
  capture_timing: ['capture_result'],
  capture_result: ['explore', 'flee', 'capture_rps'], // retry path
  flee: ['explore'],
  // ...
}
```

### Pattern 2: Zustand Slices + Partial Persist

**What:** One bound store composed from slices; `persist` at the root with `partialize` for save fields only.
**When to use:** Default for this stack (locked: Zustand + localStorage).
**Trade-offs:** Persist-at-root avoids per-slice storage races (official Zustand guidance). Ephemeral phase timers/UI must be excluded or reset on hydrate.

```typescript
export const useGameStore = create<GameStore>()(
  persist(
    (...a) => ({
      ...createPhaseSlice(...a),
      ...createPlayerSlice(...a),
      ...createInventorySlice(...a),
      ...createDexSlice(...a),
      ...createDailySlice(...a),
      ...createSettingsSlice(...a),
    }),
    {
      name: 'pokemon-safari-save-v1',
      partialize: (s) => ({
        player: s.player,
        inventory: s.inventory,
        dex: s.dex,
        daily: s.daily,
        settings: s.settings,
        unlockedBiomes: s.unlockedBiomes,
        stats: s.stats,
      }),
    },
  ),
)
```

### Pattern 3: Config-Driven Resolvers

**What:** Encounter/capture/unlock functions take manifests from `data/` as arguments (or import static config), never read React state.
**When to use:** All probability and progression logic.
**Trade-offs:** Tuning for ~7yo audience is a data edit; tests assert against fixtures.

```typescript
// game/encounter.ts
export function rollGrass(rng: Rng, rates: GrassRates): GrassOutcome {
  return weightedPick(rng, [
    ['pokemon', rates.pokemon],   // 0.45
    ['nothing', rates.nothing],   // 0.25
    ['item', rates.item],         // 0.20
    ['rare', rates.rare],         // 0.08
    ['legendary', rates.legendary], // 0.02
  ])
}

export function pickSpecies(
  rng: Rng,
  biomeId: BiomeId,
  tables: EncounterTables,
  cache: PokemonCache,
  band: EncounterBand,
): PokemonId {
  const pool = tables[biomeId][band]
  return rng.pick(pool)
}
```

### Pattern 4: Grid Movement (Not High-Frequency Engine)

**What:** Discrete tile steps on input; camera follows tile/pixel lerp in a small hook or CSS transition — **not** a RAF physics engine in a mutable `gameRef`.
**When to use:** This product (Emerald-like explore, D-pad, grass tiles). Arcade-style RAF+canvas separation is overkill here.
**Trade-offs:** Zustand can own `position` safely because updates are event-driven (key/tap), not 60fps. If later adding continuous slide animation, keep lerp local to the map component and commit tile coords only on arrival.

### Pattern 5: Boot Prefetch Then Synchronous Encounters

**What:** `BootScreen` / `useBootPokemonCache` ensures Gen 1 metadata is in a versioned localStorage (or memory) cache before explore unlocks. Sprites stay as URLs (browser cache / optional Cache API) — do not dump PNGs into localStorage.
**When to use:** Required by PROJECT performance constraint.
**Trade-offs:** First visit waits on prefetch; subsequent visits hydrate instantly. Cache key includes schema version so content format can bump without corrupt reads.

## Data Flow

### Explore → Encounter → Capture

```
User D-pad / keyboard
    ↓
usePlayerInput → store.tryMove(dir)
    ↓
game/movement (walkable? grass?)
    ↓
if grass: game/encounter.rollGrass(rates) + pickSpecies(biome tables, cache)
    ↓
store: setEncounter(pokemonId) → phase = capture_rps
    ↓
Capture UI ← selectors (species from cache, ball counts)
    ↓
RPS choice → game/capture.resolveRps → phase = capture_timing
    ↓
Timing result → game/capture.rollCatch(ball, berry, rarity) 
    ↓
success → dex + inventory + unlocks check → phase = explore
fail ×3 → flee → phase = explore
```

### State Management

```
data/ + services/pokeapi.cache  (immutable / boot-filled)
        ↓ read-only
game/* pure functions
        ↓ results
Zustand store (session + persist)
        ↓ selectors
screens / components
```

Direction is one-way: UI → action → pure resolve → set state → UI. Components never call PokéAPI mid-encounter.

### Key Data Flows

1. **Boot:** App load → hydrate persist → ensure Pokémon cache (version check) → `phase: explore`.
2. **Movement:** Input → `tryMove` → collision against `data/maps` → optional grass roll → phase change.
3. **Capture:** Phase-gated UI events → pure capture pipeline → mutate inventory/dex/stats → unlock biomes via `game/unlocks`.
4. **Pokédex:** Read-only selectors over `dex` + cache metadata/sprites; silhouette until first encounter.
5. **Daily:** On boot/explore enter, `game/daily.isEligible(lastClaimDate)` → grant balls/berries once → persist date.
6. **Save:** Zustand persist middleware writes partialized blob; `services/save` validates/migrates on rehydrate.

## Suggested Build Order

Dependencies flow bottom-up; each step should compile and (where noted) be playable.

| Order | Build | Depends on | Deliverable |
|------:|-------|------------|-------------|
| 1 | `types/` + `data/` manifests (biomes, rates, one map) | — | Tunable config compiles |
| 2 | `utils/rng`, `utils/coords` | types | Deterministic tests possible |
| 3 | `services/pokeapi` client + versioned cache | types | Boot can prefetch Gen 1 |
| 4 | `game/movement`, `encounter`, `capture`, `phase`, `unlocks`, `daily` | data, utils | Pure logic unit-tested |
| 5 | `store/` slices + persist (partialize) | game, types | Session + save shell |
| 6 | `hooks/` input + boot | store, services | Controllers without full UI |
| 7 | `components/map` + `controls` + Explore screen | store, hooks, data/maps | **Playable: walk map** |
| 8 | Capture components + phase wiring | game/capture, store | **Playable: full loop** |
| 9 | Pokédex screen + silhouettes | cache, dex slice | Collection UI |
| 10 | Remaining biomes, unlocks, items, daily | data + unlocks | Full v1 shell |
| 11 | `services/audio` + polish CSS/nearest-neighbor | assets | Kid-facing feel |

**Phase ordering rationale for roadmap:** Ship vertical slices (walkable map → capture loop → persistence/dex → biome unlocks) rather than horizontal layers alone — but underlying modules still land in the order above so each vertical slice has its dependencies ready.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single child / GH Pages | Monolith SPA as designed; one Zustand store; Gen 1 cache ~fine in localStorage JSON |
| Larger dex / more gens | Keep metadata cache versioned; consider IndexedDB if JSON exceeds ~2–5MB comfort; still no backend |
| Heavier art / music | Out of scope; if revisited, asset CDN + Cache API — do not grow localStorage |

### Scaling Priorities

1. **First bottleneck:** First-load PokéAPI prefetch (151 detail requests) — batch/throttle, progress UI on BootScreen, aggressive cache hit path.
2. **Second bottleneck:** localStorage size / schema migrations — version keys, `partialize`, migrate in `services/save`.
3. **Non-issue:** Concurrent users — static hosting; no server state.

## Anti-Patterns

### Anti-Pattern 1: Encounter Math in React Components

**What people do:** `Math.random() < 0.45` inside a grass `onStep` handler in a component.
**Why it's wrong:** Untestable, un-tunable, duplicates kid-balance logic across UI.
**Do this instead:** `store.stepOnGrass()` → `game/encounter.rollGrass(rates from data/)`.

### Anti-Pattern 2: PokéAPI Call Per Encounter

**What people do:** `fetch('/pokemon/25')` when grass triggers.
**Why it's wrong:** Latency, flaky mobile networks, unnecessary load (API asks clients to be polite even without hard rate limits).
**Do this instead:** Boot prefetch + versioned cache; encounters are sync lookups.

### Anti-Pattern 3: Storing Sprite Binaries in localStorage

**What people do:** Base64 PNGs in the save/cache key.
**Why it's wrong:** Quota blowups; slow JSON parse; duplicates browser HTTP cache.
**Do this instead:** Cache JSON metadata (id, name, types, sprite URLs); let the browser cache images.

### Anti-Pattern 4: Persisting Ephemeral Phase UI

**What people do:** Persist `phase: 'capture_timing'` mid-bar.
**Why it's wrong:** Reload restores broken mid-minigame; kids get stuck.
**Do this instead:** `partialize` save fields only; on hydrate force `explore` (or safe resume) and clear active encounter.

### Anti-Pattern 5: Importing React into `game/`

**What people do:** Shared “helpers” that pull hooks or JSX into rules modules.
**Why it's wrong:** Breaks unit tests and the UI/logic boundary PROJECT requires.
**Do this instead:** `game/` and `data/` stay framework-free; hooks/store adapt.

### Anti-Pattern 6: Full ECS / Phaser for This Scope

**What people do:** Introduce Phaser or entity-component systems for a grid safari.
**Why it's wrong:** Stack is locked to React+Zustand; complexity dwarfs discrete tile + minigame needs.
**Do this instead:** Layered SPA above; optional canvas only for tiles if CSS proves insufficient — still driven by the same store.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PokéAPI | Boot-time GET `/pokemon/{1..151}`; map to slim cache records | GET-only; throttle; version cache schema |
| PokeAPI sprites (GitHub raw) | `<img src={url}>` with nearest-neighbor CSS | Optional Cache API later; not in save blob |
| localStorage | Zustand `persist` + separate Pokémon cache key | Distinct keys: save vs species cache |
| GitHub Pages | Vite `base: '/pokemon-safari/'` | No backend routes |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| components/screens ↔ store | Hooks + selectors / actions | No direct `data/rates` imports in UI |
| store ↔ game | Actions call pure functions, then `set` | Store owns side-effect timing (SFX) |
| game ↔ data | Static imports or injected config | Prefer inject in tests |
| store/services ↔ pokeapi cache | `ensureCache()` at boot; `getPokemon(id)` sync | Fail boot soft with retry UI |
| hooks ↔ store | Input adapters only | Keep hooks < ~50 LOC ideal |

## Sources

- Zustand slices + persist (combined store, partialize) — [Zustand docs](https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/slices-pattern.md), [persist middleware](https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/persist.md) — confidence: MEDIUM (Context7)
- React separation of concerns / Thinking in React — [react.dev](https://react.dev/learn/thinking-in-react) — confidence: MEDIUM (Context7)
- PokéAPI consumption model, pokemon + sprites fields — [pokeapi.co docs](https://pokeapi.co/docs/v2) — confidence: MEDIUM (Context7)
- React/Zustand game boundary (engine vs low-frequency store) — [danielmackay/pacman](https://github.com/danielmackay/pacman), Phaser↔Zustand bridge patterns — confidence: MEDIUM (web, cross-checked with Zustand getState usage)
- Manifest/config-driven content — Hyperscape manifests, data-driven RPG layouts — confidence: MEDIUM (web)
- Encounter/capture as phase FSM — battle/orchestrator architectures (AllOut Legends, card-game XState examples) adapted down to kid capture loop — confidence: MEDIUM (web; pattern transfer, not copy complexity)
- Sprite caching: metadata in localStorage/JSON cache; images via HTTP/Cache API — pokeapi-js-wrapper + MDN CacheStorage guidance — confidence: MEDIUM (web)

---
*Architecture research for: Pokémon Safari (React + Zustand tile capture game)*
*Researched: 2026-07-25*
