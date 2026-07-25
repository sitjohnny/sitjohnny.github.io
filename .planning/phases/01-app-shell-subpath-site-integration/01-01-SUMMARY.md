---
phase: 01-app-shell-subpath-site-integration
plan: 01
subsystem: infra
tags: [vite, react, typescript, tailwind, zustand, vitest, github-pages]

requires: []
provides:
  - "pokemon-safari-app Vite scaffold with base /pokemon-safari/"
  - "Strict TypeScript + Tailwind v4 + Vitest jsdom harness"
  - "Preferred src/ folder layout with Zustand stub and SaveEnvelope types"
  - "Wave 0 App/BottomNav failing tests for plan 01-02"
affects:
  - 01-app-shell-subpath-site-integration
  - shell-ui
  - site-publish

tech-stack:
  added:
    - react@19.2.8
    - react-dom@19.2.8
    - react-router-dom@7.18.1
    - zustand@5.0.14
    - vite@8.1.5
    - @vitejs/plugin-react@6.0.4
    - typescript@5.9.3
    - tailwindcss@4.3.3
    - @tailwindcss/vite@4.3.3
    - vitest@4.1.10
    - eslint@10.8.0
    - typescript-eslint@8.65.0
    - prettier@3.9.6
  patterns:
    - "Source app in pokemon-safari-app/; publish folder deferred to plan 01-03"
    - "Vite base /pokemon-safari/ + @/ path alias mirrored in tsconfig"
    - "Wave 0 UX tests intentionally fail until HashRouter shell (01-02)"

key-files:
  created:
    - pokemon-safari-app/package.json
    - pokemon-safari-app/vite.config.ts
    - pokemon-safari-app/src/App.tsx
    - pokemon-safari-app/src/App.test.tsx
    - pokemon-safari-app/src/components/BottomNav.test.tsx
    - pokemon-safari-app/src/store/index.ts
    - pokemon-safari-app/src/types/save.ts
    - pokemon-safari-app/scripts/assert-build-base.mjs
    - pokemon-safari-app/eslint.config.js
  modified:
    - pokemon-safari-app/tsconfig.app.json
    - pokemon-safari-app/src/index.css

key-decisions:
  - "Pinned typescript@5.9.3 because typescript-eslint@8.65 peers typescript <6.1 (A5 fallback)"
  - "Excluded *.test.tsx from tsc -b so missing BottomNav does not block BOOT-03 build"
  - "Zustand ui stub uses lastRoute + settings.mute with no persist middleware"

patterns-established:
  - "Pattern: Wave 0 failing tests document UX contracts before shell implementation"
  - "Pattern: assert-build-base.mjs gates BOOT-01 asset prefix after vite build"

requirements-completed: [BOOT-03, BOOT-01]

duration: 4min
completed: 2026-07-25
---

# Phase 01 Plan 01: App Scaffold & Wave 0 Tests Summary

**Vite + React + TypeScript app under `pokemon-safari-app/` with `base: '/pokemon-safari/'`, Tailwind v4, Vitest Wave 0 failing shell tests, Zustand stub, and SaveEnvelope types**

## Performance

- **Duration:** 4min
- **Started:** 2026-07-25T19:32:51Z
- **Completed:** 2026-07-25T19:36:30Z
- **Tasks:** 2
- **Files modified:** 30+

## Accomplishments

- Scaffolded locked stack (Vite 8, React 19, Tailwind 4, Zustand, react-router-dom, Vitest) with strict TS and `@/` aliases
- Locked BOOT-01 asset prefix via `base: '/pokemon-safari/'` and `scripts/assert-build-base.mjs` (build green)
- Landed preferred `src/` folders, ESLint + Prettier, session Zustand stub (no persist), and `SaveEnvelopeV1` types
- Wave 0 `App.test.tsx` / `BottomNav.test.tsx` fail until plan 01-02 shell greens UX asserts

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Wave 0 failing tests** - `e36e11f` (test)
2. **Task 1 (GREEN): Vite scaffold with pokemon-safari base** - `a1e8b53` (feat)
3. **Task 2: Folders, lint/format, Zustand stub, save types** - `083feef` (feat)

**Plan metadata:** `8b1ed34` (docs: complete plan); `3d00861` / `3790a9b` (state/roadmap)

_Note: TDD Task 1 used test → feat commits; UX tests remain red by design until 01-02._

## Files Created/Modified

- `pokemon-safari-app/vite.config.ts` - base, React + Tailwind plugins, `@` alias, Vitest jsdom
- `pokemon-safari-app/package.json` - locked deps and scripts (`build` = `tsc -b && vite build`)
- `pokemon-safari-app/src/App.tsx` - temporary stub (no brand/nav yet)
- `pokemon-safari-app/src/App.test.tsx` / `src/components/BottomNav.test.tsx` - Wave 0 UX contracts
- `pokemon-safari-app/src/store/index.ts` - Zustand ui stub without persist
- `pokemon-safari-app/src/types/save.ts` - `SaveEnvelopeV1` / `SaveEnvelope`
- `pokemon-safari-app/scripts/assert-build-base.mjs` - BOOT-01 dist assert
- `pokemon-safari-app/eslint.config.js` / `.prettierrc` - lint/format (D-06)

## Decisions Made

- TypeScript pinned to **5.9.3** (plan A5) after `typescript@7.0.2` failed `typescript-eslint@8.65` peer range
- Excluded test files from `tsconfig.app.json` so Wave 0 missing `BottomNav` does not fail `tsc -b`
- Kept create-vite default asset images; App stub does not import them

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] TypeScript 7 incompatible with typescript-eslint peers**
- **Found during:** Task 1 (dependency install)
- **Issue:** `typescript@7.0.2` conflicts with `typescript-eslint@8.65.0` peer `typescript@>=4.8.4 <6.1.0`
- **Fix:** Pinned `typescript@5.9.3` per plan Assumption A5
- **Files modified:** `pokemon-safari-app/package.json`, lockfile
- **Verification:** Install succeeded; `npm run build` green
- **Committed in:** `a1e8b53`

**2. [Rule 3 - Blocking] Wave 0 BottomNav import broke `tsc -b`**
- **Found during:** Task 2 (build verification)
- **Issue:** `BottomNav.test.tsx` imports missing `./BottomNav`, included in app project compile
- **Fix:** Exclude `*.test.ts(x)` and `src/test/**` from `tsconfig.app.json`
- **Files modified:** `pokemon-safari-app/tsconfig.app.json`
- **Verification:** `npm run build` + `assert-build-base.mjs` pass
- **Committed in:** `083feef`

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Required for install/build correctness; no scope creep. Wave 0 UX tests still intentionally fail.

## Issues Encountered

- create-vite 9 template shipped oxlint + TS ~6; replaced with plan ESLint stack and A5 TypeScript pin

## Known Stubs

| File | Stub | Reason |
|------|------|--------|
| `src/App.tsx` | Temporary "App scaffold ready" markup | HashRouter shell + brand/nav land in plan 01-02 |
| `src/store/index.ts` | In-memory ui only | Persist deferred to Phase 7 (D-03) |
| `src/types/save.ts` | Empty `data: {}` envelope | Types only in Phase 1; wiring Phase 7 |
| `src/components/BottomNav` | Missing (test imports it) | Implemented in plan 01-02 |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for plan **01-02** (HashRouter shell, BottomNav, Emerald theme) to green Wave 0 UX tests
- Build/assert gate ready for plan **01-03** publish copy to `pokemon-safari/`

## Self-Check: PASSED

- FOUND: pokemon-safari-app/vite.config.ts
- FOUND: pokemon-safari-app/src/types/save.ts
- FOUND: pokemon-safari-app/src/store/index.ts
- FOUND: pokemon-safari-app/src/App.test.tsx
- FOUND: pokemon-safari-app/src/components/BottomNav.test.tsx
- FOUND: pokemon-safari-app/scripts/assert-build-base.mjs
- FOUND: e36e11f, a1e8b53, 083feef

---
*Phase: 01-app-shell-subpath-site-integration*
*Completed: 2026-07-25*
