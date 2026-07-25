---
phase: 01-app-shell-subpath-site-integration
plan: 02
subsystem: ui
tags: [react-router, hash-router, tailwind, emerald-theme, bottom-nav, placeholders]

requires:
  - phase: 01-app-shell-subpath-site-integration
    provides: "pokemon-safari-app Vite scaffold with base /pokemon-safari/ and Wave 0 failing tests"
provides:
  - "Emerald @theme tokens and pixel CSS utilities"
  - "createHashRouter AppShell with five placeholder screens"
  - "Icon-first BottomNav (Home/Game/Dex/Pack/Settings)"
  - "Green Wave 0 App + BottomNav UX tests"
affects:
  - 01-app-shell-subpath-site-integration
  - shell-ui
  - site-publish

tech-stack:
  added: []
  patterns:
    - "createHashRouter + basename /pokemon-safari with syncHashBasename bootstrap"
    - "Tailwind v4 @theme Emerald tokens + .pixelated/.pixel-border/.touch-target"
    - "Placeholder screens: ScreenTitle + EmptyState; Settings Reset Save UI stub only"

key-files:
  created:
    - pokemon-safari-app/src/components/AppShell.tsx
    - pokemon-safari-app/src/components/BottomNav.tsx
    - pokemon-safari-app/src/components/PixelButton.tsx
    - pokemon-safari-app/src/components/ScreenTitle.tsx
    - pokemon-safari-app/src/components/EmptyState.tsx
    - pokemon-safari-app/src/screens/HomeScreen.tsx
    - pokemon-safari-app/src/screens/GameScreen.tsx
    - pokemon-safari-app/src/screens/DexScreen.tsx
    - pokemon-safari-app/src/screens/PackScreen.tsx
    - pokemon-safari-app/src/screens/SettingsScreen.tsx
  modified:
    - pokemon-safari-app/src/index.css
    - pokemon-safari-app/index.html
    - pokemon-safari-app/src/App.tsx
    - pokemon-safari-app/src/App.test.tsx
    - pokemon-safari-app/src/components/BottomNav.test.tsx

key-decisions:
  - "HashRouter basename /pokemon-safari requires syncHashBasename so empty # matches routes"
  - "createAppRouter per App mount keeps Vitest isolation with fresh router state"
  - "Settings Reset Save is confirm-dialog UI only — no localStorage writes (T-01-06)"

patterns-established:
  - "Pattern: Hash deep links as /pokemon-safari/#/pokemon-safari/<route> under Vite base"
  - "Pattern: BottomNav NavLinks always icon + visible label with .touch-target"
  - "Pattern: Placeholder EmptyState copy locked to UI-SPEC heading + adventure body"

requirements-completed: [UX-01, BOOT-01, BOOT-03]

duration: 3min
completed: 2026-07-25
---

# Phase 01 Plan 02: HashRouter Shell & Emerald Theme Summary

**Emerald theme + createHashRouter AppShell with icon-first BottomNav and five placeholder screens; Wave 0 App/BottomNav tests green**

## Performance

- **Duration:** 3min
- **Started:** 2026-07-25T19:38:17Z
- **Completed:** 2026-07-25T19:41:10Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments

- Locked Emerald palette / Pixelify+Fredoka fonts and `.pixelated` / `.pixel-border` / `.touch-target` utilities
- Shipped `createHashRouter` shell (`basename: '/pokemon-safari'`) with Home brand CTA and Game/Dex/Pack/Settings placeholders
- Icon-first bottom chrome (5 routes) + Settings Reset Save confirmation stub without persist writes
- Wave 0 UX tests green (`npm test -- --run`) and production build green

## Task Commits

Each task was committed atomically:

1. **Task 1: Emerald theme and pixel-art CSS utilities** - `b57d368` (feat)
2. **Task 2: HashRouter AppShell, BottomNav, and five placeholder screens** - `e2f0739` (feat)

**Plan metadata:** _(pending docs commit)_

_Note: Wave 0 RED tests were authored in plan 01-01; this plan greened them (TDD GREEN)._

## Files Created/Modified

- `pokemon-safari-app/src/index.css` - `@theme` Emerald tokens, pixel utilities, meadow/brand motion, reduced-motion
- `pokemon-safari-app/index.html` - Google Fonts (Pixelify Sans + Fredoka, display=swap)
- `pokemon-safari-app/src/App.tsx` - `createHashRouter` + `syncHashBasename` + `RouterProvider`
- `pokemon-safari-app/src/components/AppShell.tsx` - Outlet column + BottomNav
- `pokemon-safari-app/src/components/BottomNav.tsx` - five icon+label NavLinks
- `pokemon-safari-app/src/components/{PixelButton,ScreenTitle,EmptyState}.tsx` - shell primitives
- `pokemon-safari-app/src/screens/*.tsx` - Home + four placeholders (+ Settings stub dialog)
- `pokemon-safari-app/src/App.test.tsx` / `BottomNav.test.tsx` - router wrappers + Dex/Pack/Settings coverage

## Decisions Made

- Bootstrapped hash to `#/pokemon-safari/` when empty so basename matching works (HashRouter + Vite subdirectory)
- Instantiated router via `useState(() => createAppRouter())` so each test mount is isolated
- Kept Reset Save as UI-only confirmation (Keep Progress / Erase Progress) with explicit no-`localStorage` comment

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] HashRouter basename left empty `#` unmatched**
- **Found during:** Task 2 (tests)
- **Issue:** `createHashRouter(..., { basename: '/pokemon-safari' })` does not render when hash path is `/`
- **Fix:** Added `syncHashBasename()` before router creation; URLs become `/pokemon-safari/#/pokemon-safari/...`
- **Files modified:** `pokemon-safari-app/src/App.tsx`, `App.test.tsx`
- **Verification:** `npm test -- --run` green
- **Committed in:** `e2f0739`

**2. [Rule 1 - Bug] Wave 0 `/game/i` text matcher collided with BottomNav**
- **Found during:** Task 2 (GREEN)
- **Issue:** After Start Safari, both heading and nav label matched `/game/i`
- **Fix:** Assert `getByRole('heading', { name: /^game$/i })`; wrap BottomNav tests in `MemoryRouter`
- **Files modified:** `App.test.tsx`, `BottomNav.test.tsx`
- **Verification:** All five tests pass
- **Committed in:** `e2f0739`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Required for HashRouter+basename correctness and unambiguous assertions; no gameplay scope creep.

## Issues Encountered

- Module-scoped singleton router leaked navigation state across Vitest cases — fixed by per-mount `createAppRouter()`

## Known Stubs

| File | Stub | Reason |
|------|------|--------|
| `src/screens/GameScreen.tsx` (etc.) | EmptyState placeholders only | Gameplay deferred (D-15 / later phases) |
| `src/screens/SettingsScreen.tsx` | Reset Save dialog closes without persist | Phase 7 persist; T-01-06 |
| `src/store/index.ts` | In-memory ui only | Unchanged; persist Phase 7 |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for plan **01-03** (publish `dist` → `pokemon-safari/`, root listing, README)
- Shell navigation + theme locked for Phase 2+ gameplay screens

## Self-Check: PASSED

- FOUND: pokemon-safari-app/src/components/BottomNav.tsx
- FOUND: pokemon-safari-app/src/components/AppShell.tsx
- FOUND: pokemon-safari-app/src/screens/HomeScreen.tsx
- FOUND: pokemon-safari-app/src/index.css (--color-dominant)
- FOUND: b57d368, e2f0739
- FOUND: createHashRouter in App.tsx; Pack label in BottomNav

---
*Phase: 01-app-shell-subpath-site-integration*
*Completed: 2026-07-25*
