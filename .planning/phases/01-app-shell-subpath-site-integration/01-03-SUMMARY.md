---
phase: 01-app-shell-subpath-site-integration
plan: 03
subsystem: infra
tags: [github-pages, deploy, index-listing, vite-base, hash-router]

requires:
  - phase: 01-app-shell-subpath-site-integration
    provides: Vite app with base /pokemon-safari/, HashRouter shell, assert-build-base
provides:
  - Dual-project root listing (Food Crawl + Pokémon Safari)
  - deploy:copy script publishing dist → pokemon-safari/
  - Committed Pages artifacts under pokemon-safari/
affects:
  - site root discovery
  - GitHub Pages publish path
  - later phases consuming published /pokemon-safari/

tech-stack:
  added: []
  patterns:
    - "Root index.html static dual listing (no meta-refresh, no origin 404.html)"
    - "deploy:copy rm/recreate ../pokemon-safari from dist only"

key-files:
  created:
    - pokemon-safari-app/scripts/assert-root-listing.mjs
    - pokemon-safari/index.html
    - pokemon-safari/assets/index-CvWNHIR9.js
    - pokemon-safari/assets/index-BO99qoUT.css
  modified:
    - index.html
    - README.md
    - pokemon-safari-app/package.json
    - pokemon-safari-app/README.md

key-decisions:
  - "Root listing uses hardcoded /food-crawl/ and /pokemon-safari/ hrefs only (T-01-07)"
  - "deploy:copy targets ../pokemon-safari only — food-crawl untouched (T-01-09)"
  - "No origin-root 404.html; HashRouter keeps SPA refresh safe (T-01-08 / D-14)"

patterns-established:
  - "Pattern: npm run build && npm run deploy:copy to refresh committed pokemon-safari/"
  - "Pattern: assert-root-listing.mjs + test:root for BOOT-02 regression"

requirements-completed: [BOOT-01, BOOT-02]

duration: 2min
completed: 2026-07-25
---

# Phase 01 Plan 03: Site Integration & Deploy Copy Summary

**Root dual-project listing plus `deploy:copy` publishing Vite `dist/` into committed `pokemon-safari/` with `/pokemon-safari/assets/` prefixes**

## Performance

- **Duration:** 2 min
- **Started:** 2026-07-25T19:42:36Z
- **Completed:** 2026-07-25T19:44:21Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Replaced sole food-crawl meta-refresh with sitjohnny projects listing (Food Crawl + Pokémon Safari + Safari blurb)
- Documented `/pokemon-safari/` in root README Projects table
- Added `assert-root-listing.mjs` + `test:root` (TDD RED→GREEN) for BOOT-02
- Added `deploy:copy` and committed production build under `pokemon-safari/` (BOOT-01); food-crawl unmodified; no root `404.html`

## Task Commits

Each task was committed atomically:

1. **Task 1: Root project listing and README (BOOT-02)** — TDD
   - `061b3ed` — `test(01-03): add failing assert for root dual-project listing`
   - `6362c83` — `feat(01-03): dual-project root listing for Food Crawl and Safari`
2. **Task 2: Deploy copy published pokemon-safari/ artifacts (BOOT-01)** — `26ec6cf` — `feat(01-03): deploy:copy published pokemon-safari build artifacts`

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `index.html` — Dual-project listing; Safari link color `#2F7A4B`; no meta-refresh
- `README.md` — Projects table includes Pokémon Safari
- `pokemon-safari-app/scripts/assert-root-listing.mjs` — BOOT-02 automated assert
- `pokemon-safari-app/package.json` — `test:root`, `deploy:copy`
- `pokemon-safari-app/README.md` — Deploy / local full-site check docs
- `pokemon-safari/*` — Published static SPA (index + assets + icons)

## Decisions Made

- Hardcoded listing paths only — no open redirect query params (T-01-07)
- Publish via folder copy into `pokemon-safari/`, not gh-pages orphan branch (D-05 / Pattern 4)
- Skip optional in-folder `404.html`; HashRouter makes it unnecessary; never add origin-root `404.html` (D-14)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 01 walking skeleton complete: scaffold → navigate → deployable publish folder
- Ready for phase verification (`/gsd-verify-work`) and next roadmap phase (cache / data prefetch)
- Human preview deferred to end-of-phase (`human_verify_mode: end-of-phase`): root listing, Safari hash routes, food-crawl regression

## Self-Check: PASSED

- FOUND: index.html, README.md, assert-root-listing.mjs, package.json, pokemon-safari/index.html
- FOUND commits: 061b3ed, 6362c83, 26ec6cf
- assert-root-listing OK; `/pokemon-safari/assets/` present; no root 404.html; food-crawl clean

---
*Phase: 01-app-shell-subpath-site-integration*
*Completed: 2026-07-25*
