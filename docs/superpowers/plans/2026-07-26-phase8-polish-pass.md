# Phase 8 Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Phase 8 with a no-new-gameplay polish pass — shared press/motion, route+overlay transitions, multi-breakpoint layouts, kid-friendly error/cache/save recovery, measured performance wins, and structural refactors.

**Architecture:** CSS-first motion tokens + a shared `pressableClass` helper; thin `ScreenTransition` / overlay enter classes; `AppErrorBoundary` at the root; extend save load metadata + Boot offline copy without a service worker; profile then apply clear wins; finally split `useEncounterFlow` into focused modules while keeping the public API stable.

**Tech Stack:** React 19, React Router (HashRouter), Zustand, Tailwind v4, Vitest + Testing Library (`pokemon-safari-app`)

**Spec:** [docs/superpowers/specs/2026-07-26-phase8-polish-pass-design.md](../specs/2026-07-26-phase8-polish-pass-design.md)

## Global Constraints

- No new gameplay, rates, biomes, unlocks, inventory, audio, SFX, or mute UX
- No service worker / PWA / offline app-shell caching
- “Offline” means: after a valid Gen 1 poke-cache, gameplay makes zero PokéAPI calls
- All motion gated by `prefers-reduced-motion` (instant / no scale)
- Preserve Phase 7 save envelope v2 + `saveFlush` behavior; never wipe poke-cache on save recovery
- Work primarily under `pokemon-safari-app/`; Task 10 updates `.planning/ROADMAP.md` (+ STATE if present)
- Prefer TDD; keep existing Game / encounter / dex / save suites green

## File Map

| Path | Role |
| --- | --- |
| Modify `pokemon-safari-app/src/index.css` | Motion tokens, screen/overlay enter keyframes, reduced-motion overrides |
| Create `pokemon-safari-app/src/utils/pressable.ts` | Shared press class helper |
| Create `pokemon-safari-app/src/utils/pressable.test.ts` | Assert class string + reduced-motion-safe tokens present |
| Modify `pokemon-safari-app/src/components/PixelButton.tsx` | Use `pressableClass` |
| Modify `pokemon-safari-app/src/components/dex/DexTile.tsx` | Use `pressableClass` |
| Modify `pokemon-safari-app/src/components/controls/DPad.tsx` | Use `pressableClass` |
| Modify `pokemon-safari-app/src/components/CacheGateNotice.tsx` | Use `pressableClass` on Link |
| Create `pokemon-safari-app/src/components/AppErrorBoundary.tsx` | Fatal render recovery UI |
| Create `pokemon-safari-app/src/components/AppErrorBoundary.test.tsx` | Recovery actions |
| Modify `pokemon-safari-app/src/main.tsx` | Wrap `<App />` in boundary |
| Modify `pokemon-safari-app/src/services/save.ts` | `loadSaveWithMeta()` + recovered flag |
| Modify `pokemon-safari-app/src/services/save.test.ts` | Corrupt → recovered true |
| Modify `pokemon-safari-app/src/store/index.ts` | `saveRecovered` session flag |
| Modify `pokemon-safari-app/src/store/dexStore.ts` / `exploreStore.ts` | Hydrate via meta; set recovered |
| Modify `pokemon-safari-app/src/components/QuotaNote.tsx` | Clearer default save-progress copy |
| Modify `pokemon-safari-app/src/screens/BootScreen.tsx` | Offline-aware error body |
| Modify `pokemon-safari-app/src/components/AppShell.tsx` | Responsive shell widths + save-recovered notice |
| Create `pokemon-safari-app/src/components/ScreenTransition.tsx` | Route enter animation |
| Create `pokemon-safari-app/src/components/ScreenTransition.test.tsx` | Path-keyed enter class |
| Modify `pokemon-safari-app/src/components/encounter/EncounterOverlay.tsx` | Overlay enter class |
| Modify `pokemon-safari-app/src/components/dex/DexDetailSheet.tsx` | Overlay enter class |
| Modify `pokemon-safari-app/src/components/BottomNav.tsx` | Match shell max-width breakpoints |
| Modify `pokemon-safari-app/src/components/dex/DexGrid.tsx` | Responsive column counts |
| Modify `pokemon-safari-app/src/App.tsx` | Optional lazy Dex/Settings if Task 8 measures win |
| Create `pokemon-safari-app/src/hooks/encounterFlow/*.ts` | Split from `useEncounterFlow` |
| Modify `pokemon-safari-app/src/hooks/useEncounterFlow.ts` | Re-export public API |
| Modify `.planning/ROADMAP.md` | Phase 8 → polish-only |

---

### Task 1: Motion tokens + `pressableClass`

**Files:**

- Modify: `pokemon-safari-app/src/index.css`
- Create: `pokemon-safari-app/src/utils/pressable.ts`
- Create: `pokemon-safari-app/src/utils/pressable.test.ts`
- Modify: `pokemon-safari-app/src/components/PixelButton.tsx`

**Interfaces:**

- Produces:

```ts
/** Shared press feedback classes (80ms scale). Pair with motion-reduce utilities. */
export const PRESSABLE_CLASS =
  'touch-manipulation transition-transform duration-[80ms] ease-out active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100'

export function pressableClass(
  ...extra: Array<string | false | null | undefined>
): string
```

- CSS produces utility classes: `.screen-enter`, `.overlay-enter` (used in later tasks)

- [ ] **Step 1: Write failing `pressableClass` test**

Create `pokemon-safari-app/src/utils/pressable.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { PRESSABLE_CLASS, pressableClass } from '@/utils/pressable'

describe('pressableClass', () => {
  it('includes shared press + reduced-motion tokens', () => {
    expect(PRESSABLE_CLASS).toContain('active:scale-95')
    expect(PRESSABLE_CLASS).toContain('motion-reduce:active:scale-100')
    expect(PRESSABLE_CLASS).toContain('duration-[80ms]')
  })

  it('joins extras and drops falsy', () => {
    expect(pressableClass('pixel-border', false, undefined, 'bg-accent')).toBe(
      `${PRESSABLE_CLASS} pixel-border bg-accent`,
    )
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd pokemon-safari-app && npm test -- src/utils/pressable.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement helper + motion CSS**

Create `pokemon-safari-app/src/utils/pressable.ts`:

```ts
export const PRESSABLE_CLASS =
  'touch-manipulation transition-transform duration-[80ms] ease-out active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100'

export function pressableClass(
  ...extra: Array<string | false | null | undefined>
): string {
  return [PRESSABLE_CLASS, ...extra].filter(Boolean).join(' ')
}
```

In `pokemon-safari-app/src/index.css`, inside `@layer utilities`, add:

```css
  .screen-enter {
    animation: screen-fade-in 180ms ease-out both;
  }

  .overlay-enter {
    animation: overlay-rise-in 180ms ease-out both;
  }
```

Near other `@keyframes` blocks, add:

```css
@keyframes screen-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes overlay-rise-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Inside the existing `@media (prefers-reduced-motion: reduce)` block, add:

```css
  .screen-enter,
  .overlay-enter {
    animation: none !important;
  }
```

Update `PixelButton.tsx` to use the helper:

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { pressableClass } from '@/utils/pressable'

// ... VARIANT_CLASS unchanged ...

export function PixelButton({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...rest
}: PixelButtonProps) {
  return (
    <button
      type={type}
      className={pressableClass(
        'touch-target pixel-border inline-flex items-center justify-center px-4 py-3 font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5]',
        VARIANT_CLASS[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd pokemon-safari-app && npm test -- src/utils/pressable.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/utils/pressable.ts pokemon-safari-app/src/utils/pressable.test.ts pokemon-safari-app/src/index.css pokemon-safari-app/src/components/PixelButton.tsx
git commit -m "$(cat <<'EOF'
feat(08): add motion tokens and shared pressable helper

EOF
)"
```

---

### Task 2: Migrate remaining press call sites

**Files:**

- Modify: `pokemon-safari-app/src/components/dex/DexTile.tsx`
- Modify: `pokemon-safari-app/src/components/controls/DPad.tsx`
- Modify: `pokemon-safari-app/src/components/CacheGateNotice.tsx`
- Modify: `pokemon-safari-app/src/components/dex/DexTile.test.tsx` (only if class assertions break)

**Interfaces:**

- Consumes: `pressableClass` from Task 1
- Produces: no duplicated inline `active:scale-95` strings on these controls

- [ ] **Step 1: Replace DexTile press classes**

In `DexTile.tsx`:

```tsx
import { pressableClass } from '@/utils/pressable'

// button className:
className={pressableClass(
  'touch-target pixel-border relative flex flex-col items-center justify-center gap-1 bg-dominant p-1',
  !isUnknown && 'dex-tile-caught',
)}
```

- [ ] **Step 2: Replace DPad arm press classes**

In `DPad.tsx`, replace the duplicated transition/active/motion-reduce fragment with:

```tsx
import { pressableClass } from '@/utils/pressable'

className={pressableClass(
  'dpad-target pixel-border flex items-center justify-center rounded-[4px]',
  'shadow-[2px_2px_0_#1A3324]',
  ARM_CELL[dir],
  pressed ? 'bg-accent text-text' : 'bg-secondary text-on-secondary',
)}
```

- [ ] **Step 3: Replace CacheGateNotice Link classes**

```tsx
import { pressableClass } from '@/utils/pressable'

<Link
  to="/boot"
  className={pressableClass(
    'touch-target pixel-border inline-flex items-center justify-center bg-accent px-4 py-3 font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text',
  )}
>
  See progress
</Link>
```

- [ ] **Step 4: Grep for leftover duplicates + run tests**

```bash
cd pokemon-safari-app && rg "active:scale-95" src && npm test -- src/components/dex/DexTile.test.tsx src/components/PixelButton.tsx src/components/CacheGateNotice.tsx src/components/controls/DPad.tsx
```

Expected: `active:scale-95` only inside `utils/pressable.ts` (and possibly CSS). Tests PASS (run any existing DPad/CacheGate tests if present; otherwise DexTile + full suite slice is fine).

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/components/dex/DexTile.tsx pokemon-safari-app/src/components/controls/DPad.tsx pokemon-safari-app/src/components/CacheGateNotice.tsx
git commit -m "$(cat <<'EOF'
refactor(08): route press feedback through pressableClass

EOF
)"
```

---

### Task 3: App error boundary

**Files:**

- Create: `pokemon-safari-app/src/components/AppErrorBoundary.tsx`
- Create: `pokemon-safari-app/src/components/AppErrorBoundary.test.tsx`
- Modify: `pokemon-safari-app/src/main.tsx`

**Interfaces:**

- Produces:

```tsx
export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
>
```

- Kid-facing copy only — no stack traces
- Actions: **Reload** (`window.location.reload()`) and **Go to Game** (set `location.hash` to `#/pokemon-safari/game` then reload, or hash navigate without full wipe of poke-cache)

- [ ] **Step 1: Write failing boundary test**

Create `pokemon-safari-app/src/components/AppErrorBoundary.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'

function Boom(): React.ReactElement {
  throw new Error('boom')
}

describe('AppErrorBoundary', () => {
  it('shows friendly recovery UI when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    )
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go to game/i })).toBeInTheDocument()
    expect(screen.queryByText(/boom/i)).not.toBeInTheDocument()
    spy.mockRestore()
  })

  it('reloads when Reload is pressed', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    )
    await userEvent.click(screen.getByRole('button', { name: /reload/i }))
    expect(reload).toHaveBeenCalled()
    spy.mockRestore()
    vi.unstubAllGlobals()
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd pokemon-safari-app && npm test -- src/components/AppErrorBoundary.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement boundary + wire main**

Create `pokemon-safari-app/src/components/AppErrorBoundary.tsx`:

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { PixelButton } from '@/components/PixelButton'

type Props = { children: ReactNode }
type State = { hasError: boolean }

function goToGame() {
  window.location.hash = '#/pokemon-safari/game'
  window.location.reload()
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Intentionally no kid-facing stack; optional console for parents/devs.
    if (import.meta.env.DEV) {
      console.error(_error, _info)
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col items-center justify-center gap-6 bg-dominant px-4 py-8 text-text">
        <EmptyState
          heading="Something went wrong"
          body="Tap Reload to try again, or Go to Game to keep exploring."
        />
        <div className="flex w-full max-w-[320px] flex-col gap-3">
          <PixelButton variant="primary" onClick={() => window.location.reload()}>
            Reload
          </PixelButton>
          <PixelButton variant="secondary" onClick={goToGame}>
            Go to Game
          </PixelButton>
        </div>
      </div>
    )
  }
}
```

Update `main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AppErrorBoundary } from '@/components/AppErrorBoundary'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd pokemon-safari-app && npm test -- src/components/AppErrorBoundary.test.tsx
```

Expected: PASS. If `vi.stubGlobal('location')` is flaky in jsdom, simplify the second test to only assert the Reload button exists and call `onClick` via a small injectable prop — keep kid copy assertions.

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/components/AppErrorBoundary.tsx pokemon-safari-app/src/components/AppErrorBoundary.test.tsx pokemon-safari-app/src/main.tsx
git commit -m "$(cat <<'EOF'
feat(08): add AppErrorBoundary with kid-friendly recovery

EOF
)"
```

---

### Task 4: Cache + save failure hardening

**Files:**

- Modify: `pokemon-safari-app/src/services/save.ts`
- Modify: `pokemon-safari-app/src/services/save.test.ts`
- Modify: `pokemon-safari-app/src/store/index.ts`
- Modify: `pokemon-safari-app/src/store/dexStore.ts`
- Modify: `pokemon-safari-app/src/store/exploreStore.ts`
- Modify: `pokemon-safari-app/src/components/QuotaNote.tsx`
- Modify: `pokemon-safari-app/src/screens/BootScreen.tsx`
- Modify: `pokemon-safari-app/src/screens/BootScreen.test.tsx`
- Modify: `pokemon-safari-app/src/components/AppShell.tsx`
- Modify: `pokemon-safari-app/src/screens/DexScreen.tsx` (quota message clarity)

**Interfaces:**

- Produces:

```ts
export type LoadSaveResult = {
  data: LoadedSave
  /** True when missing/corrupt/unknown version forced defaults for any slice. */
  recovered: boolean
}

export function loadSaveWithMeta(): LoadSaveResult
/** Back-compat: returns `.data` only. */
export function loadSave(): LoadedSave
```

- `useUiStore`: `saveRecovered: boolean`, `dismissSaveRecovered: () => void`
- Boot error body when `navigator.onLine === false`:  
  `"You're offline. Connect to the internet, then tap Try again."`  
  Online keeps existing connection copy.
- Quota default message becomes progress-aware (still playable; progress may not stick)

- [ ] **Step 1: Extend save tests for recovery meta**

Add to `save.test.ts`:

```ts
import { loadSaveWithMeta } from '@/services/save'

it('marks recovered when JSON is corrupt', () => {
  localStorage.setItem(SAVE_KEY, '{not-json')
  const result = loadSaveWithMeta()
  expect(result.recovered).toBe(true)
  expect(result.data).toEqual({ dex: {}, explore: defaultExploreSave() })
})

it('marks recovered false on clean v2 round-trip', () => {
  persistSave({ dex: SAMPLE_DEX, explore: SAMPLE_EXPLORE })
  expect(loadSaveWithMeta().recovered).toBe(false)
})
```

Also assert `loadSave()` still returns `LoadedSave` shape for existing tests.

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd pokemon-safari-app && npm test -- src/services/save.test.ts
```

Expected: FAIL — `loadSaveWithMeta` missing / recovered not tracked.

- [ ] **Step 3: Implement `loadSaveWithMeta`**

In `save.ts`, refactor `parseToLoaded` into something that returns `{ data, recovered }`:

- `recovered = true` when: raw null/empty, JSON throw, non-object envelope, missing/invalid `data`, `sanitizeDex` null, unknown version
- `recovered = false` when v1 or v2 parses successfully (v1 explore defaulting to spawn is **migration**, not corruption — set `recovered: false` for valid v1)
- Invalid explore inside v2 already sanitized via `sanitizeExplore` — if dex OK but explore was garbage, still treat as recovered **true** (player position was reset). Implement by having `sanitizeExplore` return `{ value, recovered }` or compare before/after.

Keep `loadSave()` as:

```ts
export function loadSave(): LoadedSave {
  return loadSaveWithMeta().data
}
```

Ensure `resetSaveForTests` clears any module-level cache if you add one so both stores don't double-flag incorrectly. Prefer **no** module cache: both stores call `loadSaveWithMeta()` once each is OK if you set the ui flag from a single bootstrap call in App/AppShell instead.

**Hydration approach (required):**

1. In `App.tsx` `createAppRouter` path or a tiny `bootstrapSaveUi()` called from `steerColdOpenToBoot` / `createAppRouter` after hydrate:

```ts
import { loadSaveWithMeta } from '@/services/save'
import { useUiStore } from '@/store'

export function bootstrapSaveUi(): void {
  const { recovered } = loadSaveWithMeta()
  if (recovered) useUiStore.getState().setSaveRecovered(true)
}
```

2. Keep `dexStore` / `exploreStore` using `loadSave()` for data (unchanged shape).

- [ ] **Step 4: Ui flag + notices + Boot offline copy**

`store/index.ts` additions:

```ts
saveRecovered: boolean
setSaveRecovered: (v: boolean) => void
dismissSaveRecovered: () => void
// initial saveRecovered: false
```

`QuotaNote` default message:

```ts
const DEFAULT_MESSAGE =
  "Couldn't save your progress on this device. You can still play this visit — new catches may not stick."
```

`DexScreen` `DEX_QUOTA_MESSAGE` — same idea for Pokédex wording.

`BootScreen` error branch:

```tsx
const offline = typeof navigator !== 'undefined' && navigator.onLine === false
const errorBody = offline
  ? "You're offline. Connect to the internet, then tap Try again. We'll keep what we already caught."
  : 'Check your connection, then tap Try again. We'll keep what we already caught.'
```

`AppShell`: when `saveRecovered`, show a top `QuotaNote`-style notice (reuse `QuotaNote` with custom message):

```tsx
message="We couldn't read a saved game, so some progress may have reset. Your Pokémon data cache is fine."
onDismiss={() => dismissSaveRecovered()}
```

Call `bootstrapSaveUi()` once from `createAppRouter()` alongside existing hydrate.

- [ ] **Step 5: Tests for Boot offline + save meta — expect PASS**

```bash
cd pokemon-safari-app && npm test -- src/services/save.test.ts src/screens/BootScreen.test.tsx src/store/dexStore.test.ts src/store/exploreStore.test.ts
```

Add Boot test with `vi.stubGlobal('navigator', { onLine: false })` and assert offline body.

- [ ] **Step 6: Commit**

```bash
git add pokemon-safari-app/src/services/save.ts pokemon-safari-app/src/services/save.test.ts pokemon-safari-app/src/store pokemon-safari-app/src/components/QuotaNote.tsx pokemon-safari-app/src/components/AppShell.tsx pokemon-safari-app/src/screens/BootScreen.tsx pokemon-safari-app/src/screens/BootScreen.test.tsx pokemon-safari-app/src/screens/DexScreen.tsx pokemon-safari-app/src/App.tsx
git commit -m "$(cat <<'EOF'
feat(08): harden save recovery and offline boot copy

EOF
)"
```

---

### Task 5: Route `ScreenTransition`

**Files:**

- Create: `pokemon-safari-app/src/components/ScreenTransition.tsx`
- Create: `pokemon-safari-app/src/components/ScreenTransition.test.tsx`
- Modify: `pokemon-safari-app/src/components/AppShell.tsx`

**Interfaces:**

- Produces:

```tsx
export function ScreenTransition({ children }: { children: React.ReactNode }): JSX.Element
```

- Uses `useLocation().pathname` as React `key` so remount triggers `.screen-enter`
- Wraps `<Outlet />` inside `AppShell` `<main>`

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ScreenTransition } from '@/components/ScreenTransition'

function Probe() {
  const { pathname } = useLocation()
  return <div>at:{pathname}</div>
}

describe('ScreenTransition', () => {
  it('applies screen-enter class keyed by pathname', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/game']}>
        <Routes>
          <Route
            path="/game"
            element={
              <ScreenTransition>
                <Probe />
              </ScreenTransition>
            }
          />
        </Routes>
      </MemoryRouter>,
    )
    expect(container.querySelector('.screen-enter')).not.toBeNull()
    expect(screen.getByText('at:/game')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd pokemon-safari-app && npm test -- src/components/ScreenTransition.test.tsx
```

- [ ] **Step 3: Implement + wire AppShell**

```tsx
import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

export function ScreenTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="screen-enter flex min-h-0 flex-1 flex-col">
      {children}
    </div>
  )
}
```

`AppShell.tsx`:

```tsx
import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { ScreenTransition } from './ScreenTransition'
import { QuotaNote } from './QuotaNote'
import { useUiStore } from '@/store'

export function AppShell() {
  const saveRecovered = useUiStore((s) => s.saveRecovered)
  const dismissSaveRecovered = useUiStore((s) => s.dismissSaveRecovered)

  return (
    <div className="shell-frame mx-auto flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-dominant text-text">
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        {saveRecovered ? (
          <div className="absolute left-1/2 top-10 z-30 -translate-x-1/2 px-4">
            <QuotaNote
              message="We couldn't read a saved game, so some progress may have reset. Your Pokémon data cache is fine."
              onDismiss={dismissSaveRecovered}
            />
          </div>
        ) : null}
        <ScreenTransition>
          <Outlet />
        </ScreenTransition>
      </main>
      <BottomNav />
    </div>
  )
}
```

Note: `.shell-frame` max-width lands in Task 7; for this task you may keep `max-w-[480px]` temporarily if Task 7 not yet done — do not leave the shell uncapped on desktop until Task 7.

- [ ] **Step 4: Run App + ScreenTransition tests**

```bash
cd pokemon-safari-app && npm test -- src/components/ScreenTransition.test.tsx src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/components/ScreenTransition.tsx pokemon-safari-app/src/components/ScreenTransition.test.tsx pokemon-safari-app/src/components/AppShell.tsx
git commit -m "$(cat <<'EOF'
feat(08): animate route changes with ScreenTransition

EOF
)"
```

---

### Task 6: Overlay enter animations

**Files:**

- Modify: `pokemon-safari-app/src/components/encounter/EncounterOverlay.tsx`
- Modify: `pokemon-safari-app/src/components/dex/DexDetailSheet.tsx`
- Modify: `pokemon-safari-app/src/components/encounter/EncounterOverlay.test.tsx` (assert class if useful)
- Modify: `pokemon-safari-app/src/screens/DexScreen.test.tsx` (optional class assert)

**Interfaces:**

- Consumes: `.overlay-enter` from Task 1 CSS
- When stage leaves `idle`, scrim root includes `overlay-enter`
- Dex detail dialog root includes `overlay-enter`

- [ ] **Step 1: Add overlay class assertions (fail if missing)**

In `EncounterOverlay.test.tsx`, when overlay is open:

```ts
expect(document.querySelector('.overlay-enter')).not.toBeNull()
```

In a Dex detail open test (or new one):

```ts
expect(document.querySelector('.overlay-enter')).not.toBeNull()
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd pokemon-safari-app && npm test -- src/components/encounter/EncounterOverlay.test.tsx src/screens/DexScreen.test.tsx
```

- [ ] **Step 3: Add classes**

`EncounterOverlay` root `className`:

```tsx
className="encounter-scrim overlay-enter absolute inset-0 z-20 flex flex-col items-center justify-center px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]"
```

`DexDetailSheet` root `className`:

```tsx
className="encounter-scrim overlay-enter absolute inset-0 z-20 flex flex-col items-center justify-center px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]"
```

Do not change focus trap / Escape / stage logic.

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd pokemon-safari-app && npm test -- src/components/encounter/EncounterOverlay.test.tsx src/screens/DexScreen.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/components/encounter/EncounterOverlay.tsx pokemon-safari-app/src/components/dex/DexDetailSheet.tsx pokemon-safari-app/src/components/encounter/EncounterOverlay.test.tsx pokemon-safari-app/src/screens/DexScreen.test.tsx
git commit -m "$(cat <<'EOF'
feat(08): add overlay enter motion for encounter and dex sheet

EOF
)"
```

---

### Task 7: Multi-breakpoint responsive shell

**Files:**

- Modify: `pokemon-safari-app/src/index.css` (`.shell-frame` widths)
- Modify: `pokemon-safari-app/src/components/AppShell.tsx`
- Modify: `pokemon-safari-app/src/components/BottomNav.tsx`
- Modify: `pokemon-safari-app/src/components/dex/DexGrid.tsx`
- Modify: `pokemon-safari-app/src/components/AppErrorBoundary.tsx` (match shell width tokens)
- Modify: `pokemon-safari-app/src/screens/SettingsScreen.tsx` (content max width if cramped)

**Interfaces:**

- CSS:

```css
.shell-frame {
  width: 100%;
  max-width: 480px;
}
@media (min-width: 640px) {
  .shell-frame {
    max-width: 720px;
  }
}
@media (min-width: 1024px) {
  .shell-frame {
    max-width: 900px;
  }
}
```

- Dex grid: `grid-cols-4 sm:grid-cols-6 lg:grid-cols-8` (Tailwind v4 breakpoints)
- BottomNav: replace `max-w-[480px]` with `shell-frame` (same centered column as shell)
- Phone landscape: ensure `main` / map still `min-h-0` + `overflow-hidden` (already); add `min-h-0` safeguards only if a test or manual check shows clipping
- Do **not** introduce multi-pane dashboards or card grids

- [ ] **Step 1: Write DexGrid class test (or extend existing)**

If no DexGrid test file exists, create `pokemon-safari-app/src/components/dex/DexGrid.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DexGrid } from '@/components/dex/DexGrid'

vi.mock('@/components/dex/DexTile', () => ({
  DexTile: () => <div data-testid="tile" />,
}))

describe('DexGrid', () => {
  it('uses responsive column classes', () => {
    const { container } = render(<DexGrid dex={{}} onSelect={() => {}} />)
    const grid = container.firstElementChild
    expect(grid?.className).toContain('grid-cols-4')
    expect(grid?.className).toContain('sm:grid-cols-6')
    expect(grid?.className).toContain('lg:grid-cols-8')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd pokemon-safari-app && npm test -- src/components/dex/DexGrid.test.tsx
```

- [ ] **Step 3: Implement widths**

Update DexGrid:

```tsx
<div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
```

AppShell outer div: `className="shell-frame mx-auto flex h-dvh ..."`.

BottomNav fixed bar: use `shell-frame` instead of `max-w-[480px]` (keep `fixed inset-x-0 bottom-0 ... mx-auto`).

Align error boundary max width with `shell-frame` class.

- [ ] **Step 4: Run nav + dex + app tests**

```bash
cd pokemon-safari-app && npm test -- src/components/dex/DexGrid.test.tsx src/components/BottomNav.test.tsx src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/index.css pokemon-safari-app/src/components/AppShell.tsx pokemon-safari-app/src/components/BottomNav.tsx pokemon-safari-app/src/components/dex/DexGrid.tsx pokemon-safari-app/src/components/dex/DexGrid.test.tsx pokemon-safari-app/src/components/AppErrorBoundary.tsx pokemon-safari-app/src/screens/SettingsScreen.tsx
git commit -m "$(cat <<'EOF'
feat(08): widen shell and dex grid across breakpoints

EOF
)"
```

---

### Task 8: Profile-guided performance (clear wins only)

**Files (candidates — only modify what measurement justifies):**

- Possibly: `pokemon-safari-app/src/App.tsx` (lazy `DexScreen` / `SettingsScreen`)
- Possibly: `pokemon-safari-app/src/components/dex/DexTile.tsx` / `DexGrid.tsx` (`content-visibility` / fewer work per tile)
- Possibly: `pokemon-safari-app/src/hooks/useExploreLoop.ts` (avoid redundant work)
- Create: `pokemon-safari-app/docs` is **not** required — record findings in the commit message

**Interfaces:**

- If lazy routes:

```tsx
const DexScreen = lazy(() =>
  import('@/screens/DexScreen').then((m) => ({ default: m.DexScreen })),
)
```

Wrap with `<Suspense fallback={null}>` inside the route element or shell.

**Rules:** No gameplay changes. No speculative rewrite of the map. Skip virtualization unless scroll is clearly janky after lazy sprites.

- [ ] **Step 1: Measure baseline**

```bash
cd pokemon-safari-app && npm run build
```

Note dist chunk sizes. In `npm run dev`, manually:

1. Cold Boot timing (watch progress complete)
2. Walk for ~10s on phone emulator / narrow viewport
3. Open Dex and fling-scroll the grid

Write three bullets in the commit message: what was slow, what you changed, what improved.

- [ ] **Step 2: Apply only clear wins**

Minimum acceptable clear win if Boot JS is heavy: lazy-load Dex + Settings routes in `App.tsx` so Game cold path stays leaner.

Example:

```tsx
import { lazy, Suspense, useState } from 'react'
// keep BootScreen + GameScreen eager

const DexScreen = lazy(() =>
  import('@/screens/DexScreen').then((m) => ({ default: m.DexScreen })),
)
const SettingsScreen = lazy(() =>
  import('@/screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen })),
)

// routes:
{ path: 'dex', element: (
  <Suspense fallback={null}>
    <DexScreen />
  </Suspense>
)},
{ path: 'settings', element: (
  <Suspense fallback={null}>
    <SettingsScreen />
  </Suspense>
)},
```

Update `App.test.tsx` if it asserts Dex immediately without waiting — use `findBy*` / `await`.

Second optional win: on DexGrid container add `style={{ contentVisibility: 'auto', containIntrinsicSize: '1000px' }}` only if scroll profiling shows main-thread cost from offscreen tiles.

- [ ] **Step 3: Run full regression slice**

```bash
cd pokemon-safari-app && npm test -- src/App.test.tsx src/screens/DexScreen.test.tsx src/screens/GameScreen.test.tsx
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -u pokemon-safari-app/src
git commit -m "$(cat <<'EOF'
perf(08): <one-line summary of the measured win>

EOF
)"
```

If measurement shows no clear win, commit a no-op docs note is **not** required — instead add a short paragraph to the Phase 8 roadmap success note in Task 10 that profiling found no mandatory change. Still complete this task by recording that outcome in the Task 10 roadmap text (do not invent fake perf commits).

---

### Task 9: Split `useEncounterFlow`

**Files:**

- Create: `pokemon-safari-app/src/hooks/encounterFlow/timers.ts`
- Create: `pokemon-safari-app/src/hooks/encounterFlow/actions.ts`
- Modify: `pokemon-safari-app/src/hooks/useEncounterFlow.ts` (thin re-export + hook)
- Keep: `pokemon-safari-app/src/hooks/useEncounterFlow.test.ts` green without behavior changes

**Interfaces:**

- Public API **unchanged** (re-exported from `useEncounterFlow.ts`):

```ts
export function advanceFromAppear(): void
export function submitAnswer(raw: string): void
export function capture(position: number): void
export function continueFromResult(): void
export function continueFromFlee(): void
export function dismissRecap(): void
export function onShakeComplete(): void
export const resolveAfterShake: typeof onShakeComplete
export function useEncounterFlow(options?: { rng?: Rng }): EncounterFlowApi
```

- `timers.ts` owns timer refs + `clearEncounterTimers`
- `actions.ts` owns `doAdvanceFromAppear`, `doSubmitAnswer`, `doCapture`, continue/dismiss/shake helpers and uses timers

- [ ] **Step 1: Run existing tests as baseline**

```bash
cd pokemon-safari-app && npm test -- src/hooks/useEncounterFlow.test.ts src/screens/GameScreen.test.tsx
```

Expected: PASS (before edits).

- [ ] **Step 2: Extract `timers.ts` without behavior change**

Move `feedbackTimerRef`, `failBeatTimerRef`, `clearFeedbackTimer`, `clearFailBeatTimer`, `clearEncounterTimers` into `hooks/encounterFlow/timers.ts` and import them from `useEncounterFlow.ts`.

- [ ] **Step 3: Re-run tests — expect PASS**

```bash
cd pokemon-safari-app && npm test -- src/hooks/useEncounterFlow.test.ts
```

- [ ] **Step 4: Extract `actions.ts`**

Move pure/module-level action functions + `flowRngRef` into `hooks/encounterFlow/actions.ts`. `useEncounterFlow.ts` keeps the React hook (`useEffect` queue consumer) and re-exports actions for overlay imports.

- [ ] **Step 5: Full encounter regression — expect PASS**

```bash
cd pokemon-safari-app && npm test -- src/hooks/useEncounterFlow.test.ts src/components/encounter/EncounterOverlay.test.tsx src/screens/GameScreen.test.tsx
```

Expected: PASS with **no** intentional gameplay diffs.

- [ ] **Step 6: Commit**

```bash
git add pokemon-safari-app/src/hooks/encounterFlow pokemon-safari-app/src/hooks/useEncounterFlow.ts
git commit -m "$(cat <<'EOF'
refactor(08): split useEncounterFlow into timers and actions

EOF
)"
```

---

### Task 10: Roadmap Phase 8 rewrite + verification

**Files:**

- Modify: `.planning/ROADMAP.md`
- Modify: `.planning/STATE.md` (point focus at Phase 8 polish when Phase 7 is done; if Phase 7 still in progress, note polish plan is ready)
- Optional: split oversized test files **only** if Task 9 left an obvious extract (e.g. move shared encounter harness) — skip if no clear win

**Interfaces:**

- Phase 8 title → **Polish: Motion, Responsive, Errors & Perf**
- Goal/success criteria match the design spec (no AUDIO-01/02, no biome unlocks)
- Plans pointer → `docs/superpowers/plans/2026-07-26-phase8-polish-pass.md`

- [ ] **Step 1: Rewrite Phase 8 section in ROADMAP**

Replace Phase 8 block with polish-only goal, requirements note (`UX-polish`, save/cache recovery — drop audio), and the seven success criteria from the design doc. Update overview sentence that still promises “audio and kid-facing polish.”

- [ ] **Step 2: Update STATE focus**

Set current focus toward Phase 8 polish plan when appropriate; do not mark Phase 7 complete unless it already is.

- [ ] **Step 3: Full test + build gate**

```bash
cd pokemon-safari-app && npm test && npm run build
```

Expected: all tests PASS; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add .planning/ROADMAP.md .planning/STATE.md
git commit -m "$(cat <<'EOF'
docs: redefine Phase 8 as polish pass without audio

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task(s) |
| --- | --- |
| Shared button/press animations + reduced motion | 1, 2 |
| Route transitions | 5 |
| Overlay transitions (encounter + dex sheet) | 6 |
| Multi-breakpoint responsive layouts | 7 |
| App error boundary | 3 |
| Boot/cache offline-aware recovery | 4 |
| Save quota + corrupt save notices | 4 |
| Harden localStorage cache path (no SW) | 4 (Boot/cache copy); existing cache pipeline retained |
| Profile-guided performance | 8 |
| Broader refactor / split `useEncounterFlow` | 9 |
| Roadmap Phase 8 replacement | 10 |
| No audio / biomes / new gameplay | Global Constraints (all tasks) |
