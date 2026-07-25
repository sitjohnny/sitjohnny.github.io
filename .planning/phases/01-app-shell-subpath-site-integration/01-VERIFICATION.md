---
phase: 01-app-shell-subpath-site-integration
verified: 2026-07-25T19:46:39Z
status: human_needed
score: 7/7 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Run `npm run dev` in pokemon-safari-app and open the Vite URL; on a ~390px viewport confirm Home brand + Start Safari and tap all five bottom-nav destinations"
    expected: "Home shows Pokémon Safari + Start Safari; Game/Dex/Pack/Settings placeholders appear; chrome stays usable with large touch targets"
    why_human: "Viewport feel, tap targets, and visual chrome cannot be proven by unit tests alone"
  - test: "Confirm no gameplay map — placeholders only while navigating"
    expected: "Only EmptyState / Settings stub UI; no map movement, encounters, or capture"
    why_human: "Absence of gameplay is partially code-proven but visual confirmation closes the UX check"
  - test: "After deploy:copy (or using committed pokemon-safari/), serve repo root or vite preview; open /pokemon-safari/; refresh on a hash nested route (e.g. #/pokemon-safari/game)"
    expected: "App loads with no 404 assets; refresh keeps the shell on the nested hash route"
    why_human: "Static hosting + asset resolution needs a real browser against the published path"
  - test: "Open site root listing and /food-crawl/"
    expected: "Root lists Food Crawl and Pokémon Safari (no sole redirect); food-crawl still loads"
    why_human: "Live Pages / static-server browsing confirms discovery path end-to-end"
---

# Phase 1: App Shell, Subpath & Site Integration Verification Report

**Phase Goal:** As a visitor (child or parent), I want to open Pokémon Safari at `/pokemon-safari/` with a working mobile-first shell and find it listed on the site root, so that I can reach the game without broken assets or a food-crawl-only redirect.

**Verified:** 2026-07-25T19:46:39Z  
**Status:** human_needed  
**Re-verification:** No — initial verification  
**Mode:** mvp

## User Flow Coverage

User story: *As a visitor (child or parent), I want to open Pokémon Safari at `/pokemon-safari/` with a working mobile-first shell and find it listed on the site root, so that I can reach the game without broken assets or a food-crawl-only redirect.*

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| Open site root | Dual project listing (Food Crawl + Pokémon Safari), no sole food-crawl meta-refresh | `index.html` lists both `href="/food-crawl/"` and `href="/pokemon-safari/"`; no `http-equiv=refresh`; `assert-root-listing.mjs` OK | ✓ |
| Open `/pokemon-safari/` | SPA entry loads with assets under `/pokemon-safari/assets/` | `pokemon-safari/index.html` references hashed JS/CSS under `/pokemon-safari/assets/`; both asset files exist on disk; `assert-build-base.mjs` OK | ✓ |
| Use mobile-first shell | Icon+label bottom chrome; Home brand + Start Safari; five routes | `BottomNav.tsx` (5 NavLinks + icons + `.touch-target`); `HomeScreen.tsx`; `createHashRouter` routes in `App.tsx`; Vitest 5/5 green | ✓ |
| Outcome | Reach game without broken assets / food-crawl-only redirect | Vite `base: '/pokemon-safari/'` + HashRouter `basename`; published `pokemon-safari/`; root listing replaces sole redirect | ✓ |

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | Player can open `pokemon-safari/` and the app loads with no 404'd assets, and refreshing on a nested route still works | ✓ VERIFIED | `vite.config.ts` `base: '/pokemon-safari/'`; published `pokemon-safari/index.html` → existing `/pokemon-safari/assets/*`; `createHashRouter` + `basename: '/pokemon-safari'` + `syncHashBasename` so deep links stay in hash (no static nested-path request) |
| 2 | Visiting the root shows a project listing with links to both Food Crawl and Pokémon Safari (no sole auto-redirect) | ✓ VERIFIED | Root `index.html` dual links; no meta-refresh; `node scripts/assert-root-listing.mjs` exit 0; README Projects table includes Pokémon Safari |
| 3 | Player can navigate between Home, Game, Dex, Pack, and Settings through icon-first chrome | ✓ VERIFIED | `BottomNav.tsx` NavLinks Home/Game/Dex/Pack/Settings with inline SVG + labels; wired via `AppShell` → `Outlet`; `App.test.tsx` + `BottomNav.test.tsx` pass |
| 4 | Project compiles under strict TypeScript with preferred folder layout, versioned save envelope types, and Vitest wired | ✓ VERIFIED | `npm run build` (`tsc -b && vite build`) exit 0; `strict: true` in `tsconfig.app.json`; all 10 preferred `src/` dirs present; `SaveEnvelope`/`SaveEnvelopeV1` in `types/save.ts`; Vitest jsdom + 5 tests pass |
| 5 | Home shows brand Pokémon Safari, supporting sentence, and Start Safari CTA to Game | ✓ VERIFIED | `HomeScreen.tsx` h1, body copy, `Link to="/game"` labeled Start Safari |
| 6 | Placeholder screens show EmptyState copy; no map/encounter/capture gameplay | ✓ VERIFIED | `EmptyState` default heading/body; Game/Dex/Pack/Settings use EmptyState; `src/game|services|data` are `.gitkeep` only; Settings Reset Save closes dialog with no `localStorage` write |
| 7 | `food-crawl/` is untouched by Safari deploy/copy | ✓ VERIFIED | `git status --short food-crawl/` empty; deploy script only `rm`/`cp` into `../pokemon-safari` |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `pokemon-safari-app/vite.config.ts` | base `/pokemon-safari/`, React+Tailwind, `@` alias, Vitest | ✓ VERIFIED | Exists; substantive; used by build/test |
| `pokemon-safari-app/src/types/save.ts` | SaveEnvelope / SaveEnvelopeV1 | ✓ VERIFIED | Exports both; versioned stub |
| `pokemon-safari-app/src/store/index.ts` | Zustand UI stub (no persist) | ✓ VERIFIED | `create` store; used by BottomNav/Home |
| `pokemon-safari-app/src/App.test.tsx` | Route/nav smoke tests | ✓ VERIFIED | 3 tests pass |
| `pokemon-safari-app/src/components/BottomNav.tsx` | 5-route icon-first chrome + touch-target | ✓ VERIFIED | 146 lines; wired in AppShell |
| `pokemon-safari-app/src/components/AppShell.tsx` | Outlet + BottomNav | ✓ VERIFIED | Wired as router layout |
| `pokemon-safari-app/src/screens/HomeScreen.tsx` | Brand hero + CTA | ✓ VERIFIED | Wired as index route |
| `pokemon-safari-app/src/index.css` | Emerald `@theme` + pixel/touch utilities | ✓ VERIFIED | `--color-dominant`, `.pixelated`, `.pixel-border`, `.touch-target` (48×48) |
| `index.html` | Dual project listing | ✓ VERIFIED | Both links; no refresh |
| `README.md` | Projects table includes Pokémon Safari | ✓ VERIFIED | Table row present |
| `pokemon-safari/index.html` | Published SPA entry with `/pokemon-safari/assets/` | ✓ VERIFIED | Assets on disk match HTML refs |
| `pokemon-safari-app/scripts/assert-root-listing.mjs` | BOOT-02 assert | ✓ VERIFIED | Exit 0 |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `vite.config.ts` | `tsconfig.app.json` | `@` alias mirrored in `paths` | ✓ WIRED | Manual: vite `alias '@'→./src`; tsconfig `"@/*": ["./src/*"]` (gsd-tools false-negative: pattern search on wrong file) |
| `package.json` | `vite.config.ts` | `tsc -b && vite build` | ✓ WIRED | build script present; build succeeded |
| `App.tsx` | `createHashRouter` | basename + child routes | ✓ WIRED | Routes `/`, `game`, `dex`, `pack`, `settings` under AppShell |
| `HomeScreen.tsx` | `/game` | Start Safari | ✓ WIRED | `Link to="/game"` + label |
| `BottomNav.tsx` | NavLink routes | Home…Settings labels | ✓ WIRED | All five labels present |
| `package.json` | `pokemon-safari/` | `deploy:copy` | ✓ WIRED | Script copies `dist/` → `../pokemon-safari` |
| `index.html` | `/pokemon-safari/` | listing href | ✓ WIRED | `href="/pokemon-safari/"` present |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `BottomNav.tsx` | `setLastRoute` / `lastRoute` | Zustand `useUiStore` | Session stub state (intentional; no persist) | ✓ FLOWING |
| `HomeScreen.tsx` | CTA / brand | Static JSX + Link | Static by design (Phase 1 shell) | ✓ FLOWING (static content) |
| Placeholder screens | EmptyState copy | Component defaults | Real UI-SPEC strings; not hollow props | ✓ FLOWING |
| Published assets | JS/CSS hrefs | Vite build output | Hashed files exist under `pokemon-safari/assets/` | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Vitest suite | `cd pokemon-safari-app && npm test -- --run` | 2 files, 5 tests passed | ✓ PASS |
| Build + base assets | `npm run build` + `node scripts/assert-build-base.mjs` | build OK; assert OK | ✓ PASS |
| Root listing assert | `node scripts/assert-root-listing.mjs` | dual listing OK | ✓ PASS |
| Published asset files exist | node check of HTML asset refs | JS+CSS EXISTS | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No `scripts/*/tests/probe-*.sh` and none declared in PLAN/SUMMARY | SKIPPED |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| BOOT-01 | 01-01, 01-02, 01-03 | Open `/pokemon-safari/` with assets + routes (Vite base + router basename) | ✓ SATISFIED | `base: '/pokemon-safari/'`, HashRouter basename, published assets under `/pokemon-safari/assets/` |
| BOOT-02 | 01-03 | Root lists Food Crawl + Pokémon Safari; no sole auto-redirect | ✓ SATISFIED | Root `index.html` dual links; assert-root-listing OK; no meta-refresh |
| BOOT-03 | 01-01, 01-02 | React+TS strict+Vite+Tailwind+Zustand+Router + preferred folders | ✓ SATISFIED | Stack in `package.json`; strict TS; folders; store stub; HashRouter |
| UX-01 | 01-02 | Icon-first, mobile-first, responsive desktop; large touch targets | ✓ SATISFIED (code) / needs human | Icon+label nav, `max-w-[480px]`, `.touch-target` 48×48; visual feel deferred to human checks |

No orphaned Phase 1 requirements: REQUIREMENTS.md maps BOOT-01, BOOT-02, BOOT-03, UX-01 only to Phase 1; all appear in PLAN frontmatter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `SettingsScreen.tsx` | 43 | Intentional Reset Save stub (no localStorage) | ℹ️ Info | Matches Phase 1 hard stop / CONTEXT (persist = Phase 7) |
| — | — | No `TBD`/`FIXME`/`XXX` in phase source | — | Debt-marker gate clear |

### Human Verification Required

### 1. Dev shell + five-tab chrome (from 01-02 PLAN)

**Test:** Run `npm run dev` in `pokemon-safari-app`, open the Vite URL; on ~390px viewport confirm Home brand + Start Safari; tap through all five bottom-nav destinations.  
**Expected:** Brand + CTA visible; Home/Game/Dex/Pack/Settings reachable; touch chrome usable.  
**Why human:** Visual/touch UX not fully covered by jsdom tests.

### 2. Placeholders only (from 01-02 PLAN)

**Test:** Confirm no gameplay map while navigating.  
**Expected:** EmptyState / Settings stub only.  
**Why human:** Confirms absence of unintended gameplay UI.

### 3. Published path + hash refresh (from 01-03 PLAN)

**Test:** Serve repo root or use `vite preview`; open `/pokemon-safari/`; refresh on nested hash route.  
**Expected:** Shell loads; assets 200; refresh keeps route.  
**Why human:** Real static hosting behavior.

### 4. Root + food-crawl intact (from 01-03 PLAN)

**Test:** Open site root and `/food-crawl/`.  
**Expected:** Dual listing; food-crawl still works.  
**Why human:** End-to-end discovery on static host / Pages.

### Gaps Summary

No automated gaps. All roadmap success criteria and merged plan must-haves are evidenced in the codebase. Status is `human_needed` solely because PLAN `<human-check>` items and live visual/hosting checks remain for the developer.

**Disconfirmation notes (non-blocking):** App tests assert navigation but not EmptyState copy strings; desktop “responsive” is implemented as a centered 480px column (per UI-SPEC) — confirm visually; live GitHub Pages 404/asset behavior is not exercised in this verification pass.

---

_Verified: 2026-07-25T19:46:39Z_  
_Verifier: Claude (gsd-verifier)_
