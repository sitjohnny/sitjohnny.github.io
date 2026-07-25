# Pokémon Safari

## What This Is

Pokémon Safari is a polished, frontend-only browser game hosted on GitHub Pages at `/pokemon-safari/`. A child explores biomes on a tile map, encounters Pokémon via grass rolls, plays Rock-Paper-Scissors and a timing-bar mini-game to capture them, fills a Pokédex, and unlocks new biomes in an endless loop. No ending — progress and collection are the reward.

## Core Value

A forgiving, rewarding explore → encounter → capture loop that a ~7-year-old can succeed at on phone or desktop, with progress that persists across sessions.

## Requirements

### Validated

- ✓ GitHub Pages multi-project hosting for sitjohnny.github.io — existing (`/food-crawl/`, root redirect)
- ✓ Static frontend delivery with no backend — existing site pattern

### Active

- [ ] Vite + React + TypeScript app at `/pokemon-safari/` with correct GH Pages base path
- [ ] Gen 1 Pokémon prefetch + versioned localStorage cache (no per-encounter API calls)
- [ ] Tile-map exploration with D-pad (touch + keyboard) and camera follow
- [ ] Grass encounter rolls: 45% Pokémon / 25% nothing / 20% item / 8% rare / 2% legendary
- [ ] Capture flow: RPS → timing bar → capture roll (retry; flee after 3 fails)
- [ ] Pokédex with silhouettes, first encounter/capture, catch count, shiny flag
- [ ] Items: Poké Ball, Great Ball, Berry; unlimited inventory
- [ ] Three biomes (Forest, Lake, Mountain) with unlocks at 10 and 30 catches
- [ ] Persist save data in localStorage (position, biome, inventory, dex, daily, unlocks, stats, settings)
- [ ] Simple daily reward (once per day: free balls and/or berries)
- [ ] Lightweight SFX only; PokéAPI sprites + simple CSS/canvas tiles; nearest-neighbor scaling
- [ ] Config/data-driven gameplay; UI separated from `game/` logic

### Out of Scope

- Backend, authentication, databases, SSR — GitHub Pages frontend-only constraint
- Background music — SFX only for lightweight feel
- Custom hand-drawn pixel art packs — PokéAPI sprites + simple tiles for v1
- Non–Gen 1 species — Gen 1 cache first; expand later via config if desired
- Trading, multiplayer, HP-based battles — keep capture loop simple for kids
- Ending / credits / story campaign — designed as endless loop

## Context

- Lives in the existing `sitjohnny.github.io` repo alongside Roosevelt Ave Food Crawl (`/food-crawl/`).
- Root `index.html` currently auto-redirects to food-crawl; should become a project listing that includes Pokémon Safari.
- Target player: ~7-year-old child — simple, rewarding, forgiving, visually engaging.
- Style: Pokémon Emerald–inspired pixel art aesthetic; mobile-first, desktop-compatible; minimal animations.
- Long-term maintainability: gameplay driven by `data/` config files, not hardcoded values in React components.
- Build process is milestone-by-milestone: plan → implement → compile → stop and wait.
- Preferred folder layout: `src/{assets,components,screens,hooks,services,game,data,store,types,utils}/`.

## Constraints

- **Tech stack**: React, TypeScript, Vite, Tailwind CSS, Zustand, React Router, localStorage, PokéAPI — locked by product owner
- **Hosting**: GitHub Pages only — no server endpoints; `base` path must be `/pokemon-safari/`
- **Audience**: Kid-friendly UX — forgiving capture odds for common Pokémon; legendaries stay hard
- **Performance**: Prefetch and cache Pokémon data on first load; instant encounters from cache
- **Code quality**: Strict TypeScript; testable game logic in `game/`; no Pokémon data hardcoded in UI components
- **Art**: PokéAPI Gen 1 sprites + simple CSS/canvas tiles; nearest-neighbor scaling
- **Audio**: Lightweight sound effects only; no music

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Greenfield app at `/pokemon-safari/` (skip codebase map of food-crawl) | Unrelated static site; Safari is a new Vite SPA | — Pending |
| v1 = full game shell (all biomes, unlocks, items, save, dex, daily) | Child should get the complete loop, not a stub | — Pending |
| PokéAPI sprites + simple tiles | Ship playable visuals fast without custom art pipeline | — Pending |
| Simple daily reward (balls/berries once per day) | Light retention without complex economy | — Pending |
| Prefetch Gen 1 + versioned localStorage cache | Avoid latency/rate limits during play | — Pending |
| Config/data-driven rates and biomes | Maintainability; tune for kids without code changes | — Pending |
| Milestone-by-milestone delivery | Avoid boiling the ocean; compile gate each slice | — Pending |
| Vertical MVP phases | Each phase ends with something playable | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-25 after initialization*
