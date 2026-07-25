# Phase 3: Exploration - Pattern Map

**Mapped:** 2026-07-25
**Files analyzed:** 22
**Analogs found:** 16 / 22

> Scaffold note: `src/game/`, `src/hooks/`, `src/data/`, `src/services/`, and `src/utils/` exist as empty folders (`.gitkeep` only). Pure movement/camera/collision modules have **no in-repo code analog** — copy typed-module style from `types/save.ts` + store shape from `store/index.ts`, and implement algorithms from `03-RESEARCH.md`. UI/chrome analogs are strong (BottomNav, PixelButton, GameScreen, index.css).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/types/map.ts` | model | transform | `src/types/save.ts` | exact |
| `src/data/maps/forest.ts` | config | file-I/O (static) | `src/types/save.ts` | partial |
| `src/game/collision.ts` | utility | transform | `src/types/save.ts` | partial |
| `src/game/movement.ts` | utility | event-driven | `src/types/save.ts` | partial |
| `src/game/camera.ts` | utility | transform | `src/types/save.ts` | partial |
| `src/game/events.ts` | utility | event-driven | `src/types/save.ts` | partial |
| `src/store/exploreStore.ts` (or extend `store/index.ts`) | store | request-response | `src/store/index.ts` | exact |
| `src/hooks/usePlayerInput.ts` | hook | event-driven | `src/components/BottomNav.tsx` | role-match |
| `src/hooks/useExploreLoop.ts` | hook | event-driven | `src/store/index.ts` | partial |
| `src/hooks/useMapCamera.ts` | hook | event-driven | `src/store/index.ts` | partial |
| `src/components/controls/DPad.tsx` | component | event-driven | `src/components/BottomNav.tsx` + `PixelButton.tsx` | role-match |
| `src/components/map/MapViewport.tsx` | component | request-response | `src/components/AppShell.tsx` | role-match |
| `src/components/map/TileWorld.tsx` | component | transform | `src/index.css` (`.pixelated`) + `EmptyState.tsx` | partial |
| `src/components/map/PlayerSprite.tsx` | component | event-driven | `src/components/BottomNav.tsx` (inline SVG / visual) | partial |
| `src/screens/GameScreen.tsx` | component | request-response | `src/screens/GameScreen.tsx` (self) + `HomeScreen.tsx` | exact |
| `src/assets/tiles/*` + `src/assets/player/*` | config | file-I/O | `src/assets/hero.png` | role-match |
| `src/index.css` (`.dpad-target`) | config | — | `src/index.css` | exact |
| `src/game/movement.test.ts` | test | transform | `src/components/BottomNav.test.tsx` | role-match |
| `src/game/collision.test.ts` | test | transform | `src/components/BottomNav.test.tsx` | role-match |
| `src/game/camera.test.ts` | test | transform | `src/components/BottomNav.test.tsx` | role-match |
| `src/game/events.test.ts` | test | event-driven | `src/components/BottomNav.test.tsx` | role-match |
| `src/hooks/usePlayerInput.test.ts` / `DPad.test.tsx` (optional) | test | event-driven | `src/App.test.tsx` + `BottomNav.test.tsx` | exact |
| `src/App.test.tsx` | test | request-response | `src/App.test.tsx` (update) | exact |

## Pattern Assignments

### `src/types/map.ts` (model, transform)

**Analog:** `src/types/save.ts`

**Imports / typed-export pattern** (lines 1-9):
```typescript
/** Versioned save envelope types — persist wiring lands in Phase 7. */

export type SaveEnvelopeV1 = {
  version: 1
  savedAt: string
  data: Record<string, never>
}

export type SaveEnvelope = SaveEnvelopeV1
```

**Copy for Phase 3:** Same style — JSDoc header, exported union/literal types (`Direction`, `TileId`, `MapDef`, `EncounterCandidateEvent`), no React imports. Prefer `as const` biomes (`'forest'`) matching RESEARCH map shape.

---

### `src/data/maps/forest.ts` (config, static)

**Analog:** `src/types/save.ts` (typed module) + RESEARCH map shape

**Core pattern to implement** (from RESEARCH — no codebase data files yet):
```typescript
// data/maps/forest.ts — trusted in-repo TS module (no remote JSON)
export const TILE = 16
export const SCALE = 3
export const forestMap = {
  id: 'forest' as const,
  width: 20,
  height: 15,
  tiles: [/* row-major TileId */],
  collision: [/* 0 walkable, 1 blocked */],
  grass: [/* 1 = encounter tile */],
  spawn: { x: 10, y: 7 },
}
```

**Conventions:** Import via `@/data/maps/forest`; keep UI thin — screens import map, do not hardcode tile arrays in components.

---

### `src/game/collision.ts` / `movement.ts` / `camera.ts` / `events.ts` (utility, transform | event-driven)

**Analog:** None in `src/game/` (empty). Structural analog: pure typed modules like `types/save.ts`. Algorithm analog: `03-RESEARCH.md` Patterns 1–4.

**Purity rule (MAP-04):** These files must not import React, Zustand, or DOM APIs. Only `types/map` + map data.

**Core movement pattern** (RESEARCH Pattern 1 — copy into `movement.ts`):
```typescript
export function tryStep(
  state: { x: number; y: number; facing: Direction; moving: boolean },
  intent: Direction | null,
  map: MapDef,
): {
  next: typeof state
  events: EncounterCandidateEvent[]
  tween?: { from: Vec2; to: Vec2; durationMs: number }
} {
  if (!intent) return { next: state, events: [] }
  if (state.moving) return { next: state, events: [] }
  if (intent !== state.facing) {
    return { next: { ...state, facing: intent }, events: [] }
  }
  // collision via isWalkable; grass → encounter_candidate; set moving + tween
}
```

**Camera pattern** (RESEARCH — `camera.ts`):
```typescript
export function updateCamera(
  cam: { x: number; y: number },
  target: { x: number; y: number },
  mapPx: { w: number; h: number },
  view: { w: number; h: number },
  dtMs: number,
  stiffness = 12,
): { x: number; y: number }
```

**Events pattern:** Return `{ type: 'encounter_candidate', biome: 'forest', x, y, at }` from `tryStep`; helpers in `events.ts` only — **do not** change `GamePhase` or open capture UI.

---

### `src/store/exploreStore.ts` (store, request-response)

**Analog:** `src/store/index.ts`

**Imports + create pattern** (lines 1-20):
```typescript
import { create } from 'zustand'

type UiState = {
  lastRoute: string
  setLastRoute: (route: string) => void
  settings: {
    mute: boolean
  }
  setMute: (mute: boolean) => void
}

/** Session UI stub — no persist middleware (Phase 7). */
export const useUiStore = create<UiState>((set) => ({
  lastRoute: '/',
  setLastRoute: (route) => set({ lastRoute: route }),
  settings: {
    mute: false,
  },
  setMute: (mute) => set((state) => ({ settings: { ...state.settings, mute } })),
}))
```

**Copy for explore store:**
- Same `create` + inline type + `set` / `set((state) => …)` style
- **No** `persist` middleware (Phase 7 owns saves)
- Coarse fields only: tile `{x,y}`, `facing`, `pendingEvents[]` — **not** per-frame pixel offsets
- Prefer a dedicated `useExploreStore` export (either new file or sibling export in `store/index.ts`) so HUD components can avoid subscribing to explore pixels
- Transient paint: use `useExploreStore.getState()` / `.subscribe()` from hooks (RESEARCH Pattern 3), not React re-renders

**Selector usage already in app** (`BottomNav.tsx` line 13, `HomeScreen.tsx` line 5):
```typescript
const setLastRoute = useUiStore((s) => s.setLastRoute)
```

---

### `src/hooks/usePlayerInput.ts` (hook, event-driven)

**Analog:** No hooks exist. Closest interaction/chrome: `BottomNav.tsx` (keyboard-adjacent a11y + touch targets) + RESEARCH Pattern 2.

**Shared input contract** (RESEARCH):
```typescript
// hooks/usePlayerInput.ts — thin adapter
export function usePlayerInput(onChange: (dir: Direction | null) => void) {
  // keydown/keyup Arrow*/WASD → add/remove from held Set
  // DPad pointerdown/up/leave/cancel → same Set
  // never call tryStep from both sites
}
```

**Security/validation (from RESEARCH):** Map `event.code` → `Direction` allowlist; ignore others.

**Path alias:** `@/hooks/usePlayerInput` (same `@/` convention as screens/components).

---

### `src/hooks/useExploreLoop.ts` / `useMapCamera.ts` (hook, event-driven)

**Analog:** None. Copy rAF + ref pattern from RESEARCH Pattern 3; store access from `store/index.ts`.

**Transient loop pattern:**
```tsx
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

**Lifecycle:** Cancel rAF and clear held input on Game route unmount (UI-SPEC: BottomNav during walk allowed; pause on unmount).

---

### `src/components/controls/DPad.tsx` (component, event-driven)

**Analog:** `src/components/BottomNav.tsx` (aria group, inline SVG, touch-target) + `src/components/PixelButton.tsx` (press scale / reduced motion)

**Aria + inline SVG pattern** (`BottomNav.tsx` lines 16-18, 57-72):
```tsx
<nav
  aria-label="Main"
  className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-[480px] bg-secondary …"
>
```
```tsx
function HomeIcon() {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  )
}
```

**Press / reduced-motion pattern** (`PixelButton.tsx` lines 24-33):
```tsx
<button
  type={type}
  className={[
    'touch-target pixel-border inline-flex items-center justify-center px-4 py-3 …',
    'touch-manipulation transition-transform duration-[80ms] ease-out active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100',
    VARIANT_CLASS[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ')}
  {...rest}
>
```

**DPad-specific (UI-SPEC — copy these contracts):**
- `role="group"` `aria-label="Walk controls"`
- Each arm: `<button type="button">` with `aria-label` Move up/down/left/right
- Hit targets **64×64** via new `.dpad-target` (not `.touch-target` 48px)
- Fills: default `bg-secondary`, pressed `bg-accent`; hard pixel shadow `2px 2px 0 #1A3324`
- `touch-action: none` + non-passive `preventDefault` scoped to D-pad root
- Emits into shared `usePlayerInput` held set — does **not** call `tryStep`

---

### `src/components/map/MapViewport.tsx` (component, request-response)

**Analog:** `src/components/AppShell.tsx` (clip/layout shell)

**Layout shell pattern** (lines 4-12):
```tsx
export function AppShell() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-dominant text-text">
      <main className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
```

**Copy for MapViewport:** Outer clip host with `flex-1`, `overflow-hidden`, `bg-dominant` (`#E3F2C9`), `touch-action: none`; hosts world layer ref for transforms. D-pad bottom offset must clear nav: `calc(4.5rem + env(safe-area-inset-bottom) + 16px)` (same safe-area language as AppShell padding).

---

### `src/components/map/TileWorld.tsx` / `PlayerSprite.tsx` (component, transform | event-driven)

**Analog:** CSS utilities in `index.css`; presentation tokens from EmptyState/ScreenTitle fonts (biome label only)

**Pixelated utility** (`index.css` lines 36-39):
```css
.pixelated {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

**Copy:** Apply `.pixelated` to every tile `<img>` / player sprite; scale **integer 3× only**. Prefer CSS `transform: translate3d(...)` on world layer (STATE/RESEARCH); keep Canvas behind the same `components/map` boundary if graduating later. Player walk frames via **refs**, not React state per frame.

---

### `src/screens/GameScreen.tsx` (component, request-response) — MODIFY

**Analog:** Current `GameScreen.tsx` + composition style from `HomeScreen.tsx` / error copy from `EmptyState` + `SettingsScreen` dialog + `PixelButton`

**Current placeholder** (replace EmptyState composition):
```tsx
import { EmptyState } from '@/components/EmptyState'
import { ScreenTitle } from '@/components/ScreenTitle'

export function GameScreen() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
      <ScreenTitle>Game</ScreenTitle>
      <EmptyState />
    </section>
  )
}
```

**Target composition (UI-SPEC):**
```tsx
// biome label (Label 14px) — not ScreenTitle "Game"
// MapViewport (flex-1) + DPad overlay bottom-left
// Remove EmptyState from happy path
```

**Error recovery pattern** — reuse `EmptyState` props + `PixelButton` like Settings:
```tsx
// EmptyState accepts heading/body overrides (EmptyState.tsx lines 1-12)
<EmptyState
  heading="Map didn’t load"
  body="Something went wrong showing the Forest. Tap Try Again. If it keeps failing, go back Home."
/>
<PixelButton variant="primary" onClick={retry}>Try Again</PixelButton>
```

**Home CTA unchanged** (`HomeScreen.tsx` lines 23-29) — still navigates to `/game`; Game must be playable without Phase 2 PokéAPI.

---

### `src/assets/tiles/*` + `src/assets/player/*` (config, static)

**Analog:** `src/assets/hero.png` (static asset folder convention)

**Copy:** Place placeholder PNGs under `src/assets/tiles/` and `src/assets/player/`; import as Vite URL modules. Forest tile palette from UI-SPEC (ground `#C8E6A0`, grass `#3D8B4F` + stipple, obstacle canopy/trunk). No PokéAPI sprites required.

---

### `src/index.css` — add `.dpad-target` (config)

**Analog:** Existing utilities block (`index.css` lines 35-51)

```css
@layer utilities {
  .pixelated { … }
  .pixel-border { … }
  .touch-target {
    min-width: 48px;
    min-height: 48px;
  }
}
```

**Add (UI-SPEC):**
```css
.dpad-target {
  min-width: 64px;
  min-height: 64px;
  touch-action: none;
  user-select: none;
}
```

Reuse existing `@media (prefers-reduced-motion: reduce)` block (lines 70-83) — Game hooks must also snap camera/tween when reduced motion is preferred (UI-SPEC Accessibility table).

---

### Test files (`src/game/*.test.ts`, optional hook/DPad tests)

**Analog:** `src/components/BottomNav.test.tsx` + `src/App.test.tsx` + `src/test/setup.ts`

**Test imports / cleanup** (`BottomNav.test.tsx` lines 1-16):
```typescript
import { MemoryRouter } from 'react-router-dom'
import { cleanup, render, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BottomNav } from './BottomNav'

afterEach(() => {
  cleanup()
})
```

**Vitest setup** (`test/setup.ts`):
```typescript
import '@testing-library/jest-dom/vitest'
```

**Config** (`vite.config.ts` lines 18-21): `environment: 'jsdom'`, `setupFiles: './src/test/setup.ts'`. Pure `game/` tests can use default jsdom or `// @vitest-environment node`.

**Pure logic test style (preferred for MAP-04):**
```typescript
import { describe, expect, it } from 'vitest'
import { tryStep } from './movement'
import { forestMap } from '@/data/maps/forest'

describe('tryStep', () => {
  it('rejects blocked tiles', () => { /* … */ })
  it('emits encounter_candidate on grass without phase change', () => { /* … */ })
})
```

**App smoke update required:** `App.test.tsx` currently asserts Game heading (`/^game$/i` line 27). After GameScreen drops `ScreenTitle` "Game", update assertion to biome label **"Forest"** and/or D-pad `Walk controls` group — do not leave a false-red smoke test.

**Component test pattern for D-pad** (mirror BottomNav a11y asserts):
```typescript
expect(view.getByRole('button', { name: 'Move up' })).toBeInTheDocument()
expect(arm.className).toMatch(/dpad-target/)
```

---

## Shared Patterns

### Path aliases (`@/`)
**Source:** `vite.config.ts` lines 13-16; `tsconfig.app.json` paths; all Phase 1 screens/components  
**Apply to:** All new Phase 3 modules  
```typescript
import { EmptyState } from '@/components/EmptyState'
import { useUiStore } from '@/store'
```

### Zustand store shape (no persist)
**Source:** `src/store/index.ts`  
**Apply to:** `useExploreStore` / explore slice  
```typescript
export const useUiStore = create<UiState>((set) => ({
  // fields + setters; nested update via set((state) => ({ … }))
}))
```
**Constraint:** Commit tile integers / facing / event queue only — never per-frame pixels via React subscriptions (MAP-04).

### Touch / press chrome
**Source:** `PixelButton.tsx` + `BottomNav.tsx` + `index.css` `.touch-target`  
**Apply to:** `DPad.tsx` (scale up to `.dpad-target` 64px), map viewport  
- `touch-manipulation`, 80ms press scale, `motion-reduce:*` overrides  
- Accent focus ring already global (`:focus-visible` in `index.css` lines 29-32)

### Inline SVG icons (no icon library)
**Source:** `BottomNav.tsx` icon helpers  
**Apply to:** D-pad chevrons — `aria-hidden="true"`, 24×24, square stroke caps

### Screen composition + EmptyState overrides
**Source:** `GameScreen.tsx`, `EmptyState.tsx`, `SettingsScreen.tsx`  
**Apply to:** Game happy path (map) vs map-load error (EmptyState heading/body + PixelButton Try Again)

### Pixel art rendering
**Source:** `index.css` `.pixelated`  
**Apply to:** TileWorld images, PlayerSprite — integer scale only

### Test hygiene
**Source:** `BottomNav.test.tsx`, `App.test.tsx`, `test/setup.ts`  
**Apply to:** All new tests — `afterEach(cleanup)`, vitest `describe/it/expect`, `@/` imports OK for data/game modules

### Reduced motion
**Source:** `index.css` global reduce block + PixelButton `motion-reduce:` classes  
**Apply to:** Camera snap, 0ms step lerp, freeze walk frames, skip D-pad scale (UI-SPEC) — implement in explore hooks, not only CSS

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/game/movement.ts` | utility | event-driven | `game/` folder empty — use RESEARCH Pattern 1 |
| `src/game/collision.ts` | utility | transform | No walkability helpers yet — RESEARCH + typed map |
| `src/game/camera.ts` | utility | transform | No camera math yet — RESEARCH exponential ease |
| `src/game/events.ts` | utility | event-driven | No event queue helpers yet — RESEARCH Pattern 4 |
| `src/hooks/useExploreLoop.ts` | hook | event-driven | `hooks/` empty — RESEARCH rAF + refs Pattern 3 |
| `src/hooks/useMapCamera.ts` | hook | event-driven | `hooks/` empty — RESEARCH Pattern 3 |

Planner should treat RESEARCH.md code examples as the primary implementation template for these six files, while matching project conventions (strict TS, `@/` imports, Vitest, no React in `game/`).

## Metadata

**Analog search scope:** `pokemon-safari-app/src/**` (components, screens, store, types, test, index.css, vite.config); empty dirs `game/`, `hooks/`, `data/`, `services/`, `utils/` confirmed  
**Files scanned:** 19 source/test files under `src/` (+ config)  
**Pattern extraction date:** 2026-07-25  
**Strongest reusable analogs:** `store/index.ts`, `BottomNav.tsx`, `PixelButton.tsx`, `GameScreen.tsx`/`EmptyState.tsx`, `index.css`, `BottomNav.test.tsx`/`App.test.tsx`
