# Phase 3: Exploration - Research

**Researched:** 2026-07-25
**Domain:** Grid-based tile exploration (React + pure `game/` + mobile D-pad)
**Confidence:** HIGH

## Summary

Phase 3 delivers a walkable Forest tile map with shared keyboard/D-pad input, collision, walking animation, smoothed camera follow, and pixelated rendering — without opening encounters or depending on PokéAPI. The non-negotiable constraint is MAP-04: movement/collision stay in pure `game/` modules; the render path must not drive the world with per-frame React `setState`.

Existing project research and STATE already point the same way as Emerald-style discrete tile steps: **event-driven tile commits + imperative visual interpolation**. Prefer a **CSS-transform world layer** behind a stable `components/map` boundary (per STATE), with optional Canvas 2D as a later swap if profiling demands it. Camera/player pixel offsets update via refs + `requestAnimationFrame`, not Zustand subscriptions that re-render the HUD tree. Grass steps return an `encounter_candidate` event from pure logic; Phase 3 only records/emits it — Phase 4 subscribes and rolls.

**Primary recommendation:** Implement discrete tile-to-tile movement in `game/movement.ts` + collision against typed map data; bridge input through one `InputIntent` path; render with an imperative CSS world transform + `.pixelated` assets; emit grass encounter events without UI.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Forest biome is the only biome in this phase
- Tile map drives the world (tile-based movement, not free movement)
- Grass tiles exist as a distinct tile type on the map
- Scrolling camera with the player centered
- Camera smoothing (eased follow, not hard-locked snapping)
- Pixel-perfect rendering (nearest-neighbor scaling, no blurry tiles — Emerald-inspired style per MAP-02)
- On-screen D-pad controls (large, touch-friendly per MAP-01)
- Keyboard controls (arrows/WASD per MAP-01)
- Mobile touch controls
- All input funnels through one shared input path (MAP-01)
- Collision detection — player cannot walk through obstacles
- Walking animation on the player sprite
- Movement and collision resolve in pure `game/` logic, not per-frame React setState (MAP-04)
- Walking through grass emits an encounter event
- Encounter events do NOT open encounters in this phase — no encounter UI, no rolls, no tables
- The event is the integration point Phase 4 will subscribe to
- Create reusable hooks (e.g., input, game loop, camera) so later phases can consume them

### Claude's Discretion
- Tile size, map dimensions, and map data format
- Canvas vs. DOM rendering approach (subject to MAP-04 performance constraint and RESEARCH.md findings)
- Game loop implementation details (rAF cadence, fixed timestep, etc.)
- Exact camera smoothing function/constants
- Walking animation frame source and timing (placeholder sprites acceptable — Pokémon data layer is Phase 2, may not exist yet)

### Deferred Ideas (OUT OF SCOPE)
- Encounter outcome rolls, rates, and per-biome tables (Phase 4, MAP-03/DATA-03)
- Encounter flash/UI when a Pokémon appears (Phase 4)
- Lake and Mountain biomes (Phase 7 unlocks)
- Movement sound effects (Phase 8, AUDIO-01)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MAP-01 | Walk Forest via large D-pad (touch) and arrows/WASD through one shared input path | Shared `InputIntent` + `usePlayerInput`; D-pad pointer/touch + keyboard → same held-direction state; `touch-action: none` + non-passive `preventDefault` on control surface |
| MAP-02 | Camera follows player; nearest-neighbor / pixelated Emerald-inspired tiles | Camera clamp + ease in `game/camera.ts`; render via CSS transforms + existing `.pixelated` utility (or Canvas `imageSmoothingEnabled = false` if graduated) |
| MAP-04 | Movement/collision in pure `game/` (not per-frame React setState of every tile) | Pure `tryStep` / collision against map layers; visual lerp via refs/rAF; Zustand only on tile-commit / coarse session fields |
</phase_requirements>

## Project Constraints (from .cursor/rules/)

Actionable directives from `.cursor/rules/gsd.md` relevant to this phase:

- **Locked stack:** React, TypeScript (strict), Vite, Tailwind, Zustand, React Router, localStorage, PokéAPI — do not introduce Phaser/Pixi/Redux
- **Hosting:** GitHub Pages only; Vite `base` `/pokemon-safari/` (already set)
- **Performance:** Game logic testable in `game/`; no Pokémon data hardcoded in UI
- **Art:** Simple CSS/canvas tiles OK; nearest-neighbor scaling required
- **Code quality:** Prefer config in `data/`; keep UI thin
- **GSD workflow:** Plan/execute through GSD commands (this research feeds `/gsd-plan-phase`)

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Held direction / D-pad + keyboard | Browser / Client | — | Pointer/keyboard events live in the browser; unify into one intent stream |
| Movement validity + collision | Browser / Client (`game/`) | — | Pure TS; no server; MAP-04 ownership |
| Walking tween / sprite frame | Browser / Client | — | Imperative DOM/canvas paint; not React reconcile |
| Camera follow + map clamp | Browser / Client (`game/` + map view) | — | Math in `game/camera`; apply via transform/draw |
| Grass encounter *event* emit | Browser / Client (`game/`) | Zustand (queue) | Pure function returns event; store/bus holds for Phase 4 |
| Encounter rolls / UI | — (deferred Phase 4) | — | Explicitly out of scope |
| Tile/map config | CDN / Static (`data/maps`) | — | Compile-time TS modules shipped as static assets |
| HUD / D-pad chrome | Browser / Client (React) | — | Declarative React + Tailwind; large touch targets |
| Pokémon sprites / PokéAPI | — (Phase 2) | — | Not required for Phase 3 movement |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React + react-dom | 19.2.8 (installed) | Explore screen shell, D-pad, hooks | Locked; refs for imperative map paint [VERIFIED: npm ls] |
| TypeScript | 5.9.3 (installed) | Strict types for map/movement | Locked; pinned for eslint peers [VERIFIED: package.json] |
| Vite | 8.1.5 (installed) | Dev/build | Locked; `base: '/pokemon-safari/'` [VERIFIED: vite.config.ts] |
| Zustand | 5.0.14 (installed) | Coarse session state (tile position commit, event queue) | Locked; use `getState`/`subscribe` for transient paint [CITED: Context7 /pmndrs/zustand] |
| Tailwind CSS | 4.3.3 (installed) | D-pad / layout chrome | Locked; reuse `.touch-target`, `.pixelated` [VERIFIED: index.css] |
| Vitest | 4.1.10 (installed) | Unit tests for `game/` | Locked; already wired with jsdom default [VERIFIED: package.json] |
| Native CSS transforms + `requestAnimationFrame` | — | World scroll + walk lerp | Matches Emerald discrete steps + MAP-04; aligns with STATE CSS-first note [ASSUMED] for “best fit”; architecture Pattern 4 agrees [CITED: .planning/research/ARCHITECTURE.md] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native Canvas 2D API | — | Alternative map renderer | Only if CSS transform path fails mid-tier phone profiling; keep behind `components/map` [CITED: .planning/research/STACK.md] |
| `@testing-library/react` + `user-event` | 16.3.2 / 14.6.1 (installed) | D-pad / keyboard integration tests | Optional Wave 0 for MAP-01 chrome; not for rAF loop |
| Placeholder PNG/SVG tiles in `src/assets/tiles/` | — | Forest ground/grass/obstacle/player walk | Prefer hand-made 16×16 placeholders or Kenney CC0 if importing art [CITED: kenney.nl license CC0] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS world transform | Canvas 2D full map | Canvas better for large maps / heavy culling; more code; STATE says start CSS |
| CSS world transform | Phaser / Pixi | Forbidden by stack; overkill for grid safari |
| Event-driven tile steps | Continuous physics + fixed timestep engine | Unnecessary for Emerald feel; harder kid controls |
| Zustand tile commit | React `useState` every frame | Violates MAP-04; causes re-render storm [CITED: .planning/research/PITFALLS.md Pitfall 5] |
| External event bus lib | Return events from `tryStep` + tiny store queue | No new deps; Phase 4 can `subscribe` |

**Installation:**

```bash
# No new npm packages required for Phase 3
# (movement uses existing React/Zustand/Vitest + browser APIs)
```

**Version verification:** Installed versions confirmed via `npm ls` in `pokemon-safari-app/` on 2026-07-25: `react@19.2.8`, `zustand@5.0.14`, `vitest@4.1.10`.

## Package Legitimacy Audit

> Phase 3 installs **no new external packages**. Audit covers existing toolchain only for completeness.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| zustand | npm | mature | ~47M/wk | github.com/pmndrs/zustand | OK | Already installed — Approved |
| vitest | npm | mature (seam flagged “too-new” on latest publish date) | ~82M/wk | github.com/vitest-dev/vitest | SUS (too-new signal only) | Already installed Phase 1 — keep; **do not reinstall**; no planner checkpoint needed for new install |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** vitest (false-positive “too-new” on an already-adopted runner — do not add a human-verify install gate)

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────┐   ┌──────────────┐
│ Keyboard     │   │ On-screen    │
│ arrows/WASD  │   │ D-pad (touch)│
└──────┬───────┘   └──────┬───────┘
       │                  │
       └────────┬─────────┘
                ▼
        usePlayerInput
        (normalize → InputIntent)
                │
                ▼
        explore loop (rAF)
        reads held direction from ref
                │
                ▼
   ┌────────────────────────────┐
   │ game/movement.tryStep(...) │
   │  - collision vs map layers │
   │  - commit tile on arrival  │
   │  - if grass → EncounterEvt │
   └────────────┬───────────────┘
                │
       ┌────────┴────────┐
       ▼                 ▼
 game/camera.update   store (coarse):
 (ease + clamp)       tilePos, facing,
       │              pendingEvents[]
       ▼
 components/map (imperative):
  world.style.transform = translate(...)
  player sprite frame via refs
       │
       ▼
 React HUD (D-pad / BottomNav)
  — does NOT subscribe to pixel offsets
```

### Recommended Project Structure

```
pokemon-safari-app/src/
├── assets/
│   ├── tiles/              # forest floor, grass, tree/rock blockers
│   └── player/             # 4-dir walk cycle placeholders
├── components/
│   ├── map/
│   │   ├── MapViewport.tsx # overflow clip + world layer host
│   │   ├── TileWorld.tsx   # static tile layer (DOM or canvas swap)
│   │   └── PlayerSprite.tsx
│   └── controls/
│       └── DPad.tsx        # large touch targets, pointer handlers
├── screens/
│   └── GameScreen.tsx      # compose map + D-pad (replace EmptyState)
├── hooks/
│   ├── usePlayerInput.ts   # keyboard + D-pad → shared intent ref/store
│   ├── useExploreLoop.ts   # rAF: tween, camera apply, step when free
│   └── useMapCamera.ts     # bind camera math → DOM transform
├── game/
│   ├── movement.ts         # tryStep, turn-in-place, held-repeat rules
│   ├── collision.ts        # isWalkable(map, x, y)
│   ├── camera.ts           # follow ease + clamp to map bounds
│   └── events.ts           # EncounterCandidateEvent type + helpers
├── data/
│   └── maps/
│       └── forest.ts       # tile grid + metadata (TILE_SIZE, spawn)
├── store/
│   └── exploreSlice.ts     # tile position, facing, event queue (no rolls)
└── types/
    └── map.ts              # TileId, Direction, MapDef, EncounterCandidateEvent
```

### Pattern 1: Discrete Tile Commit + Visual Lerp

**What:** Logical position is integer tiles. While moving, interpolate pixel offset over ~150–250ms; ignore new step intents until arrival (except turn-in-place when idle).  
**When to use:** Always for this phase (Emerald-like).  
**Example:**

```typescript
// game/movement.ts — pure; Source: project architecture Pattern 4
export type Direction = 'up' | 'down' | 'left' | 'right'

export function tryStep(
  state: { x: number; y: number; facing: Direction; moving: boolean },
  intent: Direction | null,
  map: MapDef,
): {
  next: typeof state
  events: EncounterCandidateEvent[]
  // pixel tween metadata for the view layer
  tween?: { from: Vec2; to: Vec2; durationMs: number }
} {
  if (!intent) return { next: state, events: [] }
  if (state.moving) return { next: state, events: [] } // queue handled by loop

  if (intent !== state.facing) {
    return { next: { ...state, facing: intent }, events: [] } // turn-in-place
  }

  const target = offset(state, intent)
  if (!isWalkable(map, target.x, target.y)) {
    return { next: { ...state, facing: intent }, events: [] }
  }

  const events: EncounterCandidateEvent[] = []
  if (isGrass(map, target.x, target.y)) {
    events.push({ type: 'encounter_candidate', biome: 'forest', x: target.x, y: target.y, at: 0 })
  }

  return {
    next: { x: target.x, y: target.y, facing: intent, moving: true },
    events,
    tween: { from: tileToPx(state), to: tileToPx(target), durationMs: 200 },
  }
}
```

### Pattern 2: Shared Input Path

**What:** Keyboard and D-pad write the same `heldDirections: Set<Direction>` (or priority stack); explore loop reads `primaryDirection(held)`.  
**When to use:** MAP-01 mandatory.  
**Example:**

```typescript
// hooks/usePlayerInput.ts — thin adapter
export function usePlayerInput(onChange: (dir: Direction | null) => void) {
  // keydown/keyup Arrow*/WASD → add/remove
  // DPad pointerdown/up/leave/cancel → add/remove
  // never call tryStep directly from both sites
}
```

### Pattern 3: Transient Visual Updates (Zustand + refs)

**What:** Commit integer tile coords to Zustand sparingly (on step complete). Drive camera/player pixels with refs + rAF / `store.subscribe` without React re-render.  
**When to use:** Camera smoothing and walk tween.  
**Example:**

```tsx
// Source: Context7 /pmndrs/zustand README — transient updates
useEffect(() => {
  const unsub = useExploreStore.subscribe((state) => {
    // optional: react only to coarse fields
    tileRef.current = state.tile
  })
  return unsub
}, [])

useEffect(() => {
  let id = 0
  const loop = (t: number) => {
    applyCameraTransform(worldEl, cameraRef.current) // mutate DOM
    id = requestAnimationFrame(loop)
  }
  id = requestAnimationFrame(loop)
  return () => cancelAnimationFrame(id)
}, [])
```

[CITED: Context7 /pmndrs/zustand transient updates]  
[CITED: Context7 /reactjs/react.dev — refs do not re-render; mutate in effects]

### Pattern 4: Encounter Seam Without Phase 4

**What:** `EncounterCandidateEvent` pushed to an in-memory queue (store or module bus). Phase 3 may `console.debug` or expose for tests; **must not** change `GamePhase` to capture UI.  
**When to use:** Every successful step onto grass.

### Anti-Patterns to Avoid

- **Per-frame `setPlayerPx` in React state:** Causes MAP-04 failure and mobile jank [CITED: PITFALLS Pitfall 5]
- **One React component per tile that re-renders on move:** Same failure mode
- **Calling PokéAPI or importing Phase 2 cache:** Out of scope; placeholders only
- **Rolling 45/25/20/8/2 in Phase 3:** That's MAP-03 / Phase 4
- **Separate keyboard vs D-pad movement functions:** Violates MAP-01 shared path
- **`touch-action: none` alone on iOS without `preventDefault`:** Risk of scroll/`pointercancel` [CITED: MDN touch-action; community iOS notes LOW]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pixel scaling | Custom bilinear filters | CSS `image-rendering: pixelated` / `crisp-edges` (already `.pixelated`) | Spec'd browser path [CITED: MDN image-rendering] |
| Canvas HiDPI sharpness | Guess CSS size only | Cap `dpr`, size backing store `css * dpr`, `imageSmoothingEnabled = false` | Official HiDPI pattern [CITED: web.dev/canvas-hidipi] [CITED: MDN imageSmoothingEnabled] |
| Full game engine | Phaser/Pixi/custom ECS | Discrete `game/` + small rAF bridge | Stack + scope [CITED: STACK.md What NOT to Use] |
| Event bus library | mitt/nanoevents for one event type | Typed array on store / return value | Zero deps; Phase 4 can formalize |
| Complex pathfinding | A* | 4-neighbor walkability grid | Emerald walk is adjacent tiles only |

**Key insight:** Complexity belongs in pure step rules and input hygiene, not in a general-purpose engine.

## Common Pitfalls

### Pitfall 1: React Re-render Storm While Walking

**What goes wrong:** Choppy movement on phones; profiler shows AppShell re-rendering every frame.  
**Why it happens:** Pixel position stored in React/Zustand and subscribed by wide trees.  
**How to avoid:** Refs + DOM transforms for pixels; Zustand only for tile integers / facing / events.  
**Warning signs:** React Profiler spikes while holding D-pad [CITED: PITFALLS Pitfall 5]

### Pitfall 2: Mobile Scroll / Zoom Steals D-pad

**What goes wrong:** Page rubber-bands; `pointercancel`; child can't walk.  
**Why it happens:** Browser owns pan/zoom by default.  
**How to avoid:** `touch-action: none` on map + D-pad; `user-select: none`; non-passive `touchmove`/`touchstart` with `preventDefault` on those surfaces; keep D-pad inset from screen edges (≥48px targets — existing `.touch-target`) [CITED: MDN touch-action] [CITED: PITFALLS Pitfall 7]  
**Warning signs:** Works on desktop keyboard only

### Pitfall 3: Blurry Tiles on Retina

**What goes wrong:** Muddy Emerald look.  
**Why it happens:** Default interpolation; non-integer CSS scale.  
**How to avoid:** Integer scale factors (2×/3×/4×); `.pixelated` on tile/player images; if Canvas, `imageSmoothingEnabled = false` + DPR setup [CITED: MDN]  
**Warning signs:** Soft edges on grass/trees

### Pitfall 4: Collision in the View Layer

**What goes wrong:** Desync between drawn position and walkability; untestable bugs.  
**Why it happens:** Checking DOM hit-boxes instead of map data.  
**How to avoid:** `isWalkable` only in `game/collision` against `data/maps/forest`  
**Warning signs:** Unit tests can't reproduce a stuck player

### Pitfall 5: Starting Encounter Flow Early

**What goes wrong:** Scope creep into Phase 4; blocked on missing data layer.  
**Why it happens:** Natural “grass should do something visible.”  
**How to avoid:** Emit `encounter_candidate` only; assert Phase stays explore; no flash UI  
**Warning signs:** Imports of encounter tables / capture screens

### Pitfall 6: Held-Direction Skipping Tiles

**What goes wrong:** Teleporting across map when FPS drops.  
**Why it happens:** Processing multiple steps per frame without movement lock.  
**How to avoid:** One active tween; on complete, if direction still held, start next `tryStep`  
**Warning signs:** Collision checks skipped between tiles

## Code Examples

### Pixelated CSS (already in repo)

```css
/* Source: pokemon-safari-app/src/index.css — keep using this class */
.pixelated {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

[VERIFIED: codebase]

### Camera Follow + Clamp (pure)

```typescript
// game/camera.ts
export function updateCamera(
  cam: { x: number; y: number },
  target: { x: number; y: number },
  mapPx: { w: number; h: number },
  view: { w: number; h: number },
  dtMs: number,
  stiffness = 12, // higher = snappier
): { x: number; y: number } {
  const follow = 1 - Math.exp((-stiffness * dtMs) / 1000)
  let x = cam.x + (target.x - cam.x) * follow
  let y = cam.y + (target.y - cam.y) * follow
  const halfW = view.w / 2
  const halfH = view.h / 2
  x = clamp(x, halfW, Math.max(halfW, mapPx.w - halfW))
  y = clamp(y, halfH, Math.max(halfH, mapPx.h - halfH))
  return { x, y }
}
```

[ASSUMED] exponential ease constants — tune in discretion

### Map Data Shape (recommended)

```typescript
// data/maps/forest.ts
export const TILE = 16 // source pixels
export const SCALE = 3 // CSS px per source px → 48px tiles (kid-friendly)
export const forestMap = {
  id: 'forest' as const,
  width: 20,
  height: 15,
  // layers: ground tiles + collision mask (or encode walkable in tile meta)
  tiles: [/* row-major TileId */],
  collision: [/* 0 walkable, 1 blocked */],
  grass: [/* 1 = encounter tile */],
  spawn: { x: 10, y: 7 },
}
```

[ASSUMED] 16×16 @ 3× and 20×15 — discretion defaults for planner

### Canvas Fallback Snippet (only if graduating)

```javascript
// Source: https://web.dev/articles/canvas-hidipi + MDN imageSmoothingEnabled
function setupCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.imageSmoothingEnabled = false
  return ctx
}
```

[CITED: web.dev/articles/canvas-hidipi] [CITED: MDN CanvasRenderingContext2D.imageSmoothingEnabled]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-tile React state | Imperative world layer + pure `game/` | Project research 2026-07-25 | Required for mobile MAP-04 |
| Always Canvas for “games” | CSS-first for discrete tile RPGs; Canvas optional | STATE + ARCHITECTURE Pattern 4 | Faster Phase 3 delivery |
| Touch `preventDefault` everywhere | Scoped `touch-action: none` + non-passive listeners on game surfaces | Pointer Events era | Avoids breaking page scroll outside game |

**Deprecated/outdated:**

- Driving exploration with Phaser for this stack — rejected in STACK.md
- Continuous physics for Safari exploration — wrong genre feel

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | CSS-transform world layer meets mid-tier phone FPS for ~20×15 Forest map | Standard Stack / Architecture | May need Canvas graduation mid-phase — keep renderer boundary |
| A2 | Tile 16px × scale 3 (48 CSS px) is right kid/Emerald balance | Map data | Too small/large touch feel — tune SCALE constant |
| A3 | ~200ms step duration feels right | Movement pattern | Too slow/fast — data constant |
| A4 | Exponential camera follow (stiffness ~12) is “smooth enough” | Camera | May look floaty/snappy — expose constant |
| A5 | Placeholder generated tiles sufficient (Kenney CC0 optional) | Assets | Art quality complaint — swap PNGs without logic change |
| A6 | Phase 3 can ship playable movement before Phase 2 data layer | Open Questions | ROADMAP lists Phase 2 dependency — orchestration order only |

## Open Questions (RESOLVED)

1. **Phase 2 dependency vs movement independence** — RESOLVED
   - What we know: ROADMAP lists Phase 3 depends on Phase 2; CONTEXT allows placeholders and forbids encounter UI; objective says movement must not require Pokémon data.
   - What's unclear: Whether boot gate must block Game screen until Gen 1 cache exists.
   - Recommendation: Implement exploration fully without PokéAPI; if Phase 2 incomplete, keep Game route playable with placeholders. Boot gate is Phase 2's job.
   - Resolution: Plans 03-01..03-04 implement exploration with no PokéAPI / Phase 2 cache dependency; Game stays playable with placeholder tiles/sprites. Boot gate remains Phase 2's responsibility.

2. **How visible should grass events be in Phase 3?** — RESOLVED
   - What we know: Must emit; must not open encounters.
   - What's unclear: Debug HUD vs silent queue.
   - Recommendation: Silent queue + unit tests asserting emission; optional `import.meta.env.DEV` log only.
   - Resolution: Plan 03-04 uses a silent `pendingEncounters` queue with unit/integration assertions; DEV-only `console.debug` in `useExploreLoop` (stripped from production). No grass HUD or encounter UI.

3. **Single collision layer vs multi-layer Tiled export** — RESOLVED
   - What we know: Need walkable + grass + visuals.
   - What's unclear: Authoring format long-term.
   - Recommendation: Start with typed TS arrays in `data/maps/forest.ts` (no Tiled dependency for MVP).
   - Resolution: Plan 03-01 authors `data/maps/forest.ts` as a typed `TileId[]` (`.`, `g`, `#` char map → ground/grass/obstacle). No Tiled dependency in Phase 3.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest / Vite | ✓ | v24.8.0 | — |
| npm | scripts | ✓ | 11.6.0 | — |
| Vitest (local) | Validation | ✓ | 4.1.10 | — |
| Modern browser (Chrome/Safari) | Manual UAT MAP-01/02 | ✓ (dev machine) | — | — |
| Phaser / Pixi | — | N/A | — | Do not use |
| PokéAPI / Phase 2 cache | Movement | ✗ not required | — | Placeholder sprites |

**Missing dependencies with no fallback:** none  

**Missing dependencies with fallback:** Phase 2 Pokémon sprites → local placeholder player/tiles

Step 2.6 note: External runtime deps beyond Node/npm/browser APIs — none blocking.

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` — section required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 |
| Config file | `pokemon-safari-app/vite.config.ts` (`test.environment: 'jsdom'`) |
| Quick run command | `cd pokemon-safari-app && npm test -- src/game` |
| Full suite command | `cd pokemon-safari-app && npm test` |

Per-file override available: `// @vitest-environment node` for pure logic if desired [CITED: Context7 /vitest-dev/vitest environment docs]. Default jsdom still runs pure `game/` tests fine.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MAP-04 | Blocked tiles reject step; walkable tiles update position | unit | `npm test -- src/game/collision.test.ts` | ❌ Wave 0 |
| MAP-04 | `tryStep` does not import React | unit (lint/architecture) | `npm test -- src/game/movement.test.ts` | ❌ Wave 0 |
| MAP-01 | Held direction + turn-in-place + move-lock | unit | `npm test -- src/game/movement.test.ts` | ❌ Wave 0 |
| MAP-02 | Camera eases toward player and clamps to map bounds | unit | `npm test -- src/game/camera.test.ts` | ❌ Wave 0 |
| MAP-01/seam | Stepping on grass pushes `encounter_candidate` without phase change | unit | `npm test -- src/game/events.test.ts` | ❌ Wave 0 |
| MAP-01 | D-pad + keyboard update shared intent | component | `npm test -- src/hooks/usePlayerInput.test.ts` | ❌ Wave 0 |
| MAP-02 | Manual: pixelated tiles on retina phone | manual | Device UAT checklist | N/A |

### Sampling Rate

- **Per task commit:** `cd pokemon-safari-app && npm test -- src/game`
- **Per wave merge:** `cd pokemon-safari-app && npm test`
- **Phase gate:** Full suite green + real-device D-pad walk before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/game/movement.test.ts` — covers MAP-01 movement rules / MAP-04 purity
- [ ] `src/game/collision.test.ts` — covers blocked vs walkable
- [ ] `src/game/camera.test.ts` — covers follow + clamp
- [ ] `src/game/events.test.ts` — covers grass → `encounter_candidate` only
- [ ] Optional: `src/components/controls/DPad.test.tsx` — large hit targets / pointer handlers
- [ ] Framework install: none — Vitest already present

## Security Domain

> `security_enforcement: true`, ASVS level 1

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Frontend-only; no accounts |
| V3 Session Management | no | No server sessions |
| V4 Access Control | no | Single-player local |
| V5 Input Validation | yes | Treat keyboard/pointer intents as enum-only; clamp map indices in `game/` |
| V6 Cryptography | no | N/A |

### Known Threat Patterns for React + static tile game

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unexpected key values / injection via input handlers | Tampering | Map `event.code` → `Direction` allowlist; ignore others |
| Out-of-bounds tile index crash | Denial of Service (local) | Clamp / bounds-check in `isWalkable` |
| XSS via external map JSON | Tampering | Keep maps as trusted TS modules in-repo; no remote map fetch in Phase 3 |
| Touch handler breaking parent page scroll globally | Elevation (UX) | Scope `preventDefault` to map/D-pad nodes only |

## Sources

### Primary (HIGH confidence)

- Codebase: `pokemon-safari-app/` scaffold, `index.css` `.pixelated` / `.touch-target`, Vitest config — verified 2026-07-25
- `.planning/phases/03-exploration/03-CONTEXT.md` — locked decisions
- `.planning/REQUIREMENTS.md` — MAP-01, MAP-02, MAP-04
- `.planning/research/ARCHITECTURE.md` — Pattern 4 discrete grid movement; folder layout
- `.planning/research/STACK.md` — Canvas vs CSS guidance; no Phaser
- `.planning/research/PITFALLS.md` — Pitfalls 5, 7, 12
- `.planning/STATE.md` — CSS transforms first behind `components/map`

### Secondary (MEDIUM confidence)

- Context7 `/reactjs/react.dev` — refs vs state; effects + animation loops
- Context7 `/pmndrs/zustand` — transient `subscribe` / `getState`
- Context7 `/vitest-dev/vitest` — environments / projects
- MDN `image-rendering` — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/image-rendering
- MDN `imageSmoothingEnabled` — https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled
- MDN `touch-action` — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action
- web.dev HiDPI canvas — https://web.dev/articles/canvas-hidipi
- Kenney asset pages — CC0 license on kenney.nl packs

### Tertiary (LOW confidence)

- Community reports that iOS Safari may `pointercancel` despite `touch-action: none` — mitigate with non-passive touch `preventDefault`; validate on real iPhone during UAT

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — locked packages installed; no new deps
- Architecture: HIGH — aligns CONTEXT + ARCHITECTURE + STATE + MAP-04
- Pitfalls: HIGH for React/map jank & touch; MEDIUM for iOS-specific pointercancel quirks

**Research date:** 2026-07-25  
**Valid until:** 2026-08-24 (30 days — stable browser APIs + locked stack)
