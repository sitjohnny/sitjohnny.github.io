# Phase 1: App Shell, Subpath & Site Integration - Context

**Gathered:** 2026-07-25
**Status:** Ready for planning
**Source:** PRD Express Path (inline phase specification from `/gsd-plan-phase 1`)

<domain>
## Phase Boundary

Create the initial Pokémon Safari project scaffold only. Configure tooling, folder structure, GitHub Pages deployment, global theme / pixel-art CSS utilities, Zustand + React Router wiring, and placeholder screens. The application must compile successfully. **Do not implement gameplay** (no map movement, encounters, capture, PokéAPI prefetch, save persistence logic, or inventory mechanics). Stop after project setup.

</domain>

<decisions>
## Implementation Decisions

### Scaffold & Tooling
- **D-01**: Configure React + TypeScript + Vite for the app under a `/pokemon-safari/` deploy path
- **D-02**: Install and configure Tailwind CSS (prefer Tailwind v4 via `@tailwindcss/vite` per project research)
- **D-03**: Configure Zustand (store skeleton / empty slices OK — no gameplay state required yet)
- **D-04**: Configure React Router with `basename` matching Vite `base: '/pokemon-safari/'`
- **D-05**: Configure GitHub Pages deployment so built output lands at `/pokemon-safari/`
- **D-06**: Configure ESLint + Prettier
- **D-07**: Configure path aliases (e.g. `@/` → `src/`)
- **D-08**: Preferred folder layout: `src/{assets,components,screens,hooks,services,game,data,store,types,utils}/`

### Theme & Visual Foundations
- **D-09**: Create a global theme (CSS variables / Tailwind theme tokens) — Emerald-inspired, kid-friendly, mobile-first
- **D-10**: Create pixel-art CSS utilities
- **D-11**: Configure nearest-neighbor image rendering (`image-rendering: pixelated` / crisp edges)

### Placeholder Screens (routing only — no gameplay)
- **D-12**: Placeholder screens — Home, Game, Pokédex, Inventory, Settings

### Site Integration
- **D-13**: Root `index.html` / README should list both Food Crawl and Pokémon Safari (no sole redirect that hides Safari)
- **D-14**: Deep-link / SPA fallback strategy must not break existing `/food-crawl/` (Phase 1: `createHashRouter`)

### Hard Stops
- **D-15**: Application must compile successfully (`tsc` / Vite build); no gameplay; stop after project setup

### Claude's Discretion
- Exact package versions within the locked stack
- Whether map/world chrome uses a thin CSS-transform shell vs empty Game placeholder
- ESLint flat-config vs legacy; Prettier integration details
- Exact icon-first chrome component naming
- Vitest wiring if it fits naturally in scaffold without expanding scope

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Requirements
- `.planning/PROJECT.md` — product vision, constraints, folder layout, stack locks
- `.planning/REQUIREMENTS.md` — BOOT-01, BOOT-02, BOOT-03, UX-01 for this phase
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, Mode: mvp
- `.planning/STATE.md` — current position and carried research flags

### Research
- `.planning/research/SUMMARY.md` — stack versions, subpath pitfalls, architecture layers
- `.planning/research/STACK.md` — Vite 8 / React 19 / Tailwind 4 / Zustand / react-router-dom versions
- `.planning/research/ARCHITECTURE.md` — folder layout and UI vs game/ boundaries
- `.planning/research/PITFALLS.md` — base/basename, multi-app 404, root redirect

### Existing Site
- `index.html` — current root redirect to food-crawl (must become listing)
- `README.md` — project table
- `food-crawl/` — sibling static app; must keep working

</canonical_refs>

<specifics>
## Specific Ideas

- Screens named by user: Home, Game, Pokédex, Inventory, Settings (Inventory is an addition vs earlier boot/explore/dex/settings wording — treat Inventory as a first-class placeholder route)
- Save envelope *types* may be stubbed under `src/types/` (research flag) but persist wiring is Phase 7
- Walking Skeleton (MVP Phase 1): thinnest end-to-end slice = scaffold + routing + one real UI interaction (e.g. navigate between placeholders) + deployable build — **no DB** (frontend-only)

</specifics>

<deferred>
## Deferred Ideas

- Gameplay (map, encounters, capture, items) — Phases 3–7
- PokéAPI prefetch / cache — Phase 2
- SFX / celebrations — Phase 8
- Real inventory / dex data binding — later phases

</deferred>

---

*Phase: 01-app-shell-subpath-site-integration*
*Context gathered: 2026-07-25 via PRD Express Path (inline)*
