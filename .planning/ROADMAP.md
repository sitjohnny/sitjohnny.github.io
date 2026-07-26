# Roadmap: Pokémon Safari

## Overview

Pokémon Safari ships as eight vertical phases that follow the forced dependency chain: deploy-correct app shell → Gen 1 data cache → walkable tile map → config-driven encounters → the signature timing-bar capture loop → the Pokédex reward surface → persistence, biome unlocks, and daily rewards → audio and kid-facing polish. From Phase 3 onward every phase ends with something playable; the game is a complete, endless explore → encounter → capture loop by Phase 7, and Phase 8 makes it feel rewarding for a 7-year-old.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: App Shell, Subpath & Site Integration** - Vite/React/TS scaffold deployed correctly at `/pokemon-safari/` with root site listing both projects (completed 2026-07-25)
- [x] **Phase 2: Pokémon Data Layer** - Gen 1 prefetch, versioned localStorage cache, boot progress screen, crisp sprite rendering (completed 2026-07-25)
- [ ] **Phase 3: Exploration** - Walkable Forest tile map with D-pad + keyboard input and camera follow (plans 6/6 executed — UAT pending)
- [x] **Phase 4: Encounters** - Config-driven grass rolls (45/45/8/2) with per-biome encounter tables (completed 2026-07-26)
- [x] **Phase 5: Capture Flow** - Timing bar → capture roll with retry, flee, and kid-friendly odds (completed 2026-07-26)
- [x] **Phase 6: Pokédex** - 151-entry dex with silhouettes, seen/caught states, counts, and shiny flags (completed 2026-07-26)
- [ ] **Phase 7: Persistence, Unlocks & Daily** - Versioned auto-save, biome unlocks at 10/30 catches, daily reward
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

**Goal:** As a player, I want to prefetch Gen 1 Pokémon data once into a versioned local cache behind a Boot screen, so that gameplay never touches the network.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: BOOT-04, DATA-01, DATA-02, DATA-04
**Success Criteria** (what must be TRUE):

1. On first load, player sees a boot screen with Gen 1 load progress, and exploration unlocks only when the cache is ready
2. If the fetch fails, player sees a friendly retry option and can recover without reloading the page
3. On repeat visits the game boots from cache, and walking/encountering produces zero PokéAPI network calls
4. Pokémon sprites (including shiny variants) render crisp with nearest-neighbor scaling
5. The PokéAPI cache and the player save live under separate namespaced localStorage keys, so clearing one never corrupts the other

**Plans:** 4/4 plans complete
**Wave 1**

- [x] 02-01-PLAN.md — Wave 0 failing tests for cache, Boot, Game gate, and PokemonSprite

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 02-02-PLAN.md — Cache + Boot progress happy path (DATA-01/02/04 + D-01/D-04)

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 02-03-PLAN.md — Retry, Game gate, skip-Boot on warm cache (BOOT-04 + D-02/D-03/D-05/D-10)

**Wave 4** _(blocked on Wave 3 completion)_

- [x] 02-04-PLAN.md — PokemonSprite, QuotaNote, Game sync sample (D-06..D-09)

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

**Plans:** 6/6 plans executed
**Wave 1**

- [x] 03-01-PLAN.md — Map contracts, Forest map data, and pure `game/` movement + collision + grass event emission

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 03-02-PLAN.md — Playable walking on `/game`: shared keyboard + D-pad input path, explore store, rAF loop, pixelated tile render

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 03-03-PLAN.md — Motion feel: 200ms step tween, eased map-clamped camera, walk animation, reduced-motion snap

**Wave 4** _(blocked on Wave 3 completion)_

- [x] 03-04-PLAN.md — Bounded `encounter_candidate` seam for Phase 4, map-load error recovery, Phase 4/5 boundary gates

**Wave 5** _(blocked on Wave 4 completion)_

- [x] 03-05-PLAN.md — Gen 1–3 terrain PNGs + image-based TileWorld (UI-SPEC D10 visual refactor)

**Wave 6** _(blocked on Wave 5 completion)_

- [x] 03-06-PLAN.md — Character Red walk frames + PlayerSprite; drop CSS placeholder legs (UI-SPEC D10)

**UI hint**: yes

### Phase 4: Encounters

**Goal**: Stepping on grass rolls surprise outcomes from config-driven tables
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: MAP-03, DATA-03, CATCH-01
**Success Criteria** (what must be TRUE):

1. Stepping on grass triggers outcomes at 45% Pokémon / 45% nothing / 8% rare / 2% legendary, with a visible encounter flash when a Pokémon appears
2. All encounter rates, biome tables, capture modifiers, unlock thresholds, and daily amounts live in `data/` config files — changing a rate requires no component edits
3. Encounter outcome distribution is verified by seeded-RNG unit tests against the config tables

**Plans:** 6/6 plans complete
**Wave 1**

- [x] 04-01-PLAN.md — Seeded RNG, `data/` config surface, pure grass resolver, CATCH-01 rewrite (MAP-03 / DATA-03)

**Wave 2** _(04-02 and 04-03 run in parallel after Wave 1)_

- [x] 04-02-PLAN.md — Encounter stage machine, drain-one flow, appear flash + handoff stub + item toast
- [x] 04-03-PLAN.md — Adaptive education module, digit validator, namespaced edu-stats storage (CATCH-01)

**Wave 3** _(blocked on Wave 2)_

- [x] 04-04-PLAN.md — Full-screen multiplication question sequenced after appear; capture bonus on session

**Wave 4** _(blocked on Wave 3)_

- [x] 04-05-PLAN.md — Wrong-answer recap, inert BottomNav, focus restore, phase gate

**Wave 5** _(gap closure — CR-01 sticky inert)_

- [x] 04-06-PLAN.md — Unmount closes encounter session; Main nav inert cleared after leaving /game mid-encounter

**UI hint**: yes

### Phase 5: Capture Flow

**Goal**: Player captures Pokémon through the timing-bar → roll loop using the capture bonus carried from Phase 4's education step; odds stay forgiving for commons and challenging for legendaries
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: CATCH-02, CATCH-03, CATCH-04, CATCH-05
**Success Criteria** (what must be TRUE):

1. The capture flow consumes the education capture bonus already carried on the encounter session from Phase 4 and shows the player that it improved their chance
2. Player plays the timing-bar mini-game with generous windows for commons and tighter ones for legendaries, and accuracy visibly affects the result
3. Capture roll accounts for ball type, berry use, education capture bonus, timing accuracy, and rarity — all from config
4. Player can retry a failed capture, and after three fails the Pokémon flees with kind, non-punishing feedback
5. A child can reliably catch common Pokémon while legendaries remain a genuine chase

**Plans:** 5/5 plans complete
Plans:
**Wave 1**

- [x] 05-01-PLAN.md — Wave 0 tests + pure capture/timing math + config (CATCH-02/03/05)

**Wave 2** _(blocked on Wave 1 completion)_

- [x] 05-02-PLAN.md — Happy-path catch: timing → roll → shake → Gotcha (CATCH-02/03)

**Wave 3** _(blocked on Wave 2 completion)_

- [x] 05-03-PLAN.md — Timing-bar ping-pong, rarity bands, Capture lock (CATCH-02)

**Wave 4** _(blocked on Wave 3 completion)_

- [x] 05-04-PLAN.md — Retry, flee after 3 fails, recap routing (CATCH-04/05)

**Wave 5** _(gap closure — VERIFICATION D-14 blocker)_

- [x] 05-05-PLAN.md — Fix GradeFlash→BallShake order across repeated throws via keyed ShakeSequence; registerThrow stage guard (CATCH-02/04)

**UI hint**: yes

### Phase 6: Pokédex

**Goal:** As a child catching Pokémon on Safari, I want to open a Gen 1 Pokédex where unknowns stay silhouettes until I catch them and my Seen/Caught progress is visible, so that the endless loop has a collection reward that drives me back into the grass.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: DEX-01, DEX-02, DEX-03
**Success Criteria** (what must be TRUE):

1. Player can open the Pokédex from the game shell and browse all 151 Gen 1 entries
2. Undiscovered species show as silhouettes, and seen vs. caught states are visually distinct at a glance
3. Each entry records first encounter, first capture, number caught, and shiny status

**Plans:** 6/6 plans complete
Plans:
**Wave 1**

- [x] 06-01-PLAN.md — Wave 0 failing tests for dex reducers, save, flavor, relativeDay, DexScreen

**Wave 2** _(blocked on Wave 1)_

- [x] 06-02-PLAN.md — Dex data plane: SaveEnvelope dex slice, pure reducers, quota-safe save, debounced dexStore (DEX-01/02)
- [x] 06-05-PLAN.md — Poke-cache v2 with Emerald flavor text prefetch + helper bump (DEX-03)

**Wave 3** _(blocked on Wave 2)_

- [x] 06-03-PLAN.md — Browse slice: silhouette grid, sticky Seen/Caught header, stub detail sheet (DEX-01/03)

**Wave 4** _(blocked on Wave 3)_

- [x] 06-04-PLAN.md — Catch→dex binding, shiny roll at open, Dex reflects catches (DEX-01/02)

**Wave 5** _(blocked on Waves 2 and 4)_

- [x] 06-06-PLAN.md — Caught detail lore, relative dates, shiny toggle, Dex quota note, phase gate (DEX-01/02/03)

**UI hint**: yes

### Phase 7: Persistence, Unlocks & Daily

**Goal**: Progress persists safely across sessions; biome unlocks and a non-inventory daily reward are live (exact daily reward contents TBD in Phase 7 planning)
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: SAVE-01, SAVE-02, SAVE-03, DAILY-01, PROG-01, PROG-02, PROG-03, PROG-04
**Success Criteria** (what must be TRUE):

1. Closing and reopening the game resumes the player at their saved position and biome with dex, unlocks, stats, and settings intact — no manual save ever needed
2. The save schema is versioned with a migration chain, so an app update never wipes a child's collection
3. Lake unlocks at 10 total catches and Mountain at 30; locked biomes show clear progress toward unlock, and player can travel freely between unlocked biomes
4. Once per local calendar day, player can claim a daily reward with no streak penalty, and the claim cannot be double-triggered (reward contents TBD in Phase 7 planning)

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

| Phase                                    | Plans Complete | Status      | Completed  |
| ---------------------------------------- | -------------- | ----------- | ---------- |
| 1. App Shell, Subpath & Site Integration | 3/3            | Complete    | 2026-07-25 |
| 2. Pokémon Data Layer                    | 4/4            | Complete    | 2026-07-25 |
| 3. Exploration                           | 6/6            | UAT pending | -          |
| 4. Encounters                            | 6/6            | Complete    | 2026-07-26 |
| 5. Capture Flow                          | 5/5 | Complete   | 2026-07-26 |
| 6. Pokédex                               | 6/6 | Complete   | 2026-07-26 |
| 7. Persistence, Unlocks & Daily          | 0/TBD          | Not started | -          |
| 8. Audio, Feedback & Polish              | 0/TBD          | Not started | -          |

---

_Roadmap created: 2026-07-25_
