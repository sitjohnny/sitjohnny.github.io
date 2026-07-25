# Roadmap: Pokémon Safari

## Overview

Pokémon Safari ships as eight vertical phases that follow the forced dependency chain: deploy-correct app shell → Gen 1 data cache → walkable tile map → config-driven encounters → the signature RPS + timing-bar capture loop → the Pokédex reward surface → persistence, biome unlocks, items, and daily rewards → audio and kid-facing polish. From Phase 3 onward every phase ends with something playable; the game is a complete, endless explore → encounter → capture loop by Phase 7, and Phase 8 makes it feel rewarding for a 7-year-old.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: App Shell, Subpath & Site Integration** - Vite/React/TS scaffold deployed correctly at `/pokemon-safari/` with root site listing both projects (completed 2026-07-25)
- [ ] **Phase 2: Pokémon Data Layer** - Gen 1 prefetch, versioned localStorage cache, boot progress screen, crisp sprite rendering
- [ ] **Phase 3: Exploration** - Walkable Forest tile map with D-pad + keyboard input and camera follow
- [ ] **Phase 4: Encounters** - Config-driven grass rolls (45/25/20/8/2) with per-biome encounter tables
- [ ] **Phase 5: Capture Flow** - RPS → timing bar → capture roll with retry, flee, and kid-friendly odds
- [ ] **Phase 6: Pokédex** - 151-entry dex with silhouettes, seen/caught states, counts, and shiny flags
- [ ] **Phase 7: Persistence, Unlocks, Items & Daily** - Versioned auto-save, biome unlocks at 10/30 catches, inventory, daily reward
- [ ] **Phase 8: Audio, Feedback & Polish** - SFX with gesture unlock and mute, celebration moments, real-device kid playtest

## Phase Details

### Phase 1: App Shell, Subpath & Site Integration

**Goal:** As a visitor (child or parent), I want to open Pokémon Safari at `/pokemon-safari/` with a working mobile-first shell and find it listed on the site root, so that I can reach the game without broken assets or a food-crawl-only redirect.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: BOOT-01, BOOT-02, BOOT-03, UX-01
**Success Criteria** (what must be TRUE):

  1. Player can open `https://sitjohnny.github.io/pokemon-safari/` and the app loads with no 404'd assets, and refreshing on a nested route still works
  2. Visiting the root `sitjohnny.github.io` shows a project listing with links to both Food Crawl and Pokémon Safari (no sole auto-redirect)
  3. Player can navigate between Home, Game, Dex, Pack, and Settings through icon-first chrome that is usable on a phone and responsive on desktop
  4. Project compiles under strict TypeScript with the preferred `src/{assets,components,screens,hooks,services,game,data,store,types,utils}/` layout, versioned save envelope types in place, and Vitest wired

**Plans:** 3/3 plans complete
Plans:

- [x] 01-01-PLAN.md — Scaffold Vite/React/TS app, tooling, folders, Zustand stub, SaveEnvelope types, Wave 0 Vitest
- [x] 01-02-PLAN.md — Emerald theme, HashRouter AppShell, five placeholders, icon-first BottomNav (UX-01)
- [x] 01-03-PLAN.md — Root listing + README + deploy:copy published `pokemon-safari/`

**UI hint**: yes

### Phase 2: Pokémon Data Layer

**Goal**: Gen 1 Pokémon data is prefetched once into a versioned cache so gameplay never touches the network
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: BOOT-04, DATA-01, DATA-02, DATA-04
**Success Criteria** (what must be TRUE):

  1. On first load, player sees a boot screen with Gen 1 load progress, and exploration unlocks only when the cache is ready
  2. If the fetch fails, player sees a friendly retry option and can recover without reloading the page
  3. On repeat visits the game boots from cache, and walking/encountering produces zero PokéAPI network calls
  4. Pokémon sprites (including shiny variants) render crisp with nearest-neighbor scaling
  5. The PokéAPI cache and the player save live under separate namespaced localStorage keys, so clearing one never corrupts the other

**Plans**: TBD
**UI hint**: yes

### Phase 3: Exploration

**Goal**: Player can walk a tile map that feels responsive on a phone
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: MAP-01, MAP-02, MAP-04
**Success Criteria** (what must be TRUE):

  1. Player can walk the Forest tile map using a large on-screen D-pad (touch) or arrow keys/WASD, through one shared input path
  2. Camera follows the player smoothly and tiles render pixelated in the Emerald-inspired style
  3. Player cannot walk through obstacles, and movement stays smooth on a mid-tier phone (no per-frame React re-renders; collision resolved in pure `game/` logic)

**Plans**: TBD
**UI hint**: yes

### Phase 4: Encounters

**Goal**: Stepping on grass rolls surprise outcomes from config-driven tables
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: MAP-03, DATA-03
**Success Criteria** (what must be TRUE):

  1. Stepping on grass triggers outcomes at 45% Pokémon / 25% nothing / 20% item / 8% rare / 2% legendary, with a visible encounter flash when a Pokémon appears
  2. All encounter rates, biome tables, capture modifiers, unlock thresholds, and daily amounts live in `data/` config files — changing a rate requires no component edits
  3. Encounter outcome distribution is verified by seeded-RNG unit tests against the config tables

**Plans**: TBD

### Phase 5: Capture Flow

**Goal**: Player captures Pokémon through the RPS → timing-bar → roll loop that is forgiving for commons and challenging for legendaries
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: CATCH-01, CATCH-02, CATCH-03, CATCH-04, CATCH-05
**Success Criteria** (what must be TRUE):

  1. On an encounter, player plays Rock-Paper-Scissors and sees that winning improves their capture chance
  2. Player plays the timing-bar mini-game with generous windows for commons and tighter ones for legendaries, and accuracy visibly affects the result
  3. Capture roll accounts for ball type, berry use, RPS result, timing accuracy, and rarity — all from config
  4. Player can retry a failed capture, and after three fails the Pokémon flees with kind, non-punishing feedback
  5. A child can reliably catch common Pokémon while legendaries remain a genuine chase

**Plans**: TBD
**UI hint**: yes

### Phase 6: Pokédex

**Goal**: The Pokédex becomes the visible collection reward that drives the endless loop
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: DEX-01, DEX-02, DEX-03
**Success Criteria** (what must be TRUE):

  1. Player can open the Pokédex from the game shell and browse all 151 Gen 1 entries
  2. Undiscovered species show as silhouettes, and seen vs. caught states are visually distinct at a glance
  3. Each entry records first encounter, first capture, number caught, and shiny status

**Plans**: TBD
**UI hint**: yes

### Phase 7: Persistence, Unlocks, Items & Daily

**Goal**: Progress persists safely across sessions and the full progression economy (biomes, items, daily reward) is live
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: SAVE-01, SAVE-02, SAVE-03, DAILY-01, PROG-01, PROG-02, PROG-03, PROG-04
**Success Criteria** (what must be TRUE):

  1. Closing and reopening the game resumes the player at their saved position and biome with inventory, dex, unlocks, stats, and settings intact — no manual save ever needed
  2. The save schema is versioned with a migration chain, so an app update never wipes a child's collection
  3. Lake unlocks at 10 total catches and Mountain at 30; locked biomes show clear progress toward unlock, and player can travel freely between unlocked biomes
  4. Poké Balls, Great Balls, and Berries accumulate from grass item rolls and daily claims (unlimited capacity) and can be selected during capture
  5. Once per local calendar day, player can claim free balls/berries with no streak penalty, and the claim cannot be double-triggered

**Plans**: TBD
**UI hint**: yes

### Phase 8: Audio, Feedback & Polish

**Goal**: The game feels alive and rewarding for a 7-year-old, with sound and celebration on every meaningful moment
**Mode:** mvp
**Depends on**: Phase 7
**Requirements**: AUDIO-01, AUDIO-02, UX-02
**Success Criteria** (what must be TRUE):

  1. Lightweight sound effects play for movement, encounters, and capture success/fail — with no background music
  2. Audio unlocks on the first user gesture (works on iOS Safari), and a mute toggle in settings persists across sessions
  3. Captures, biome unlocks, and new dex entries trigger clear celebration moments, and failure feedback is never harsh
  4. The full loop is verified on a real phone with the target player, and timing/rate tuning adjustments are made via `data/` config only

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. App Shell, Subpath & Site Integration | 3/3 | Complete   | 2026-07-25 |
| 2. Pokémon Data Layer | 0/TBD | Not started | - |
| 3. Exploration | 0/TBD | Not started | - |
| 4. Encounters | 0/TBD | Not started | - |
| 5. Capture Flow | 0/TBD | Not started | - |
| 6. Pokédex | 0/TBD | Not started | - |
| 7. Persistence, Unlocks, Items & Daily | 0/TBD | Not started | - |
| 8. Audio, Feedback & Polish | 0/TBD | Not started | - |

---
*Roadmap created: 2026-07-25*
