# Walking Skeleton — Pokémon Safari

**Phase:** 1
**Generated:** 2026-07-25

## Capability Proven End-to-End

A visitor can discover Pokémon Safari from the site root listing, load the Vite-built SPA at `/pokemon-safari/`, and navigate between Home / Game / Dex / Pack / Settings via icon-first chrome (Start Safari → Game) with assets resolving under the GitHub Pages subpath.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Vite 8 + React 19 + TypeScript strict SPA | Locked stack; static GH Pages; no SSR |
| Data layer | None in Phase 1 — SaveEnvelope *types* only; localStorage persist deferred to Phase 7 | Frontend-only hosting; no DB/auth |
| Auth | None | GH Pages toy game; no accounts |
| Routing | `createHashRouter` + Vite `base: '/pokemon-safari/'` + router `basename: '/pokemon-safari'` | Nested routes without origin-root 404 that could break `/food-crawl/` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` + `@theme` tokens from UI-SPEC | Official v4 path; Emerald kid-friendly shell |
| State | Zustand stub store (no `persist` yet) | Locked stack; persist/migrate in Phase 7 |
| Deployment target | GitHub Pages user site: build → copy `dist/` → repo `pokemon-safari/` (committed like `food-crawl/`) | Multi-folder site pattern; no gh-pages orphan branch |
| Directory layout | Source `pokemon-safari-app/`; publish `pokemon-safari/`; `src/{assets,components,screens,hooks,services,game,data,store,types,utils}/` | Separates source from Pages artifacts; matches PROJECT.md |

## Stack Touched in Phase 1

- [x] Project scaffold (framework, build, lint, test runner)
- [x] Routing — five real placeholder routes behind AppShell
- [ ] Database — N/A (frontend-only; intentionally skipped)
- [x] UI — BottomNav + Start Safari CTA wired to client routes (no API)
- [x] Deployment — `deploy:copy` + committed `pokemon-safari/` (or documented `vite preview` / static root serve)

## Out of Scope (Deferred to Later Slices)

- PokéAPI Gen 1 prefetch, boot progress, cache keys (Phase 2)
- Tile map, D-pad, camera, collision (Phase 3)
- Grass encounter rolls / config rates (Phase 4)
- RPS + timing-bar capture (Phase 5)
- Real Pokédex data binding (Phase 6)
- Persist middleware, biome unlocks, inventory mechanics, daily reward (Phase 7)
- SFX / celebrations (Phase 8)
- BrowserRouter + allowlisted root `404.html` (optional later upgrade)
- Gameplay of any kind in Phase 1

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Prefetch Gen 1 into versioned cache with boot progress/retry
- Phase 3: Walk Forest tile map with D-pad + keyboard
- Phase 4: Config-driven grass encounter rolls
- Phase 5: RPS → timing bar → capture loop
- Phase 6: Pokédex collection UI
- Phase 7: Versioned save, unlocks, items, daily
- Phase 8: SFX, celebration polish, kid playtest
