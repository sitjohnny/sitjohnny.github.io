# Requirements: Pokémon Safari

**Defined:** 2026-07-25
**Core Value:** A forgiving, rewarding explore → encounter → capture loop that a ~7-year-old can succeed at on phone or desktop, with progress that persists across sessions.

## v1 Requirements

Requirements for initial release (full game shell). Each maps to roadmap phases.

### Boot & Hosting

- [ ] **BOOT-01**: Player can open the game at `/pokemon-safari/` on GitHub Pages with assets and routes resolving correctly (Vite `base` + router `basename`)
- [ ] **BOOT-02**: Root site lists both Food Crawl and Pokémon Safari (no sole auto-redirect that hides Safari)
- [ ] **BOOT-03**: App scaffold uses React + TypeScript (strict) + Vite + Tailwind + Zustand + React Router with the preferred `src/` folder layout
- [ ] **BOOT-04**: Boot screen shows Gen 1 data load progress and allows retry on failure before explore unlocks

### Data & Cache

- [ ] **DATA-01**: On first load, app fetches Gen 1 Pokémon metadata needed for play (names, IDs, types, sprite URLs including shiny) and stores a versioned localStorage cache
- [ ] **DATA-02**: During gameplay, encounters and UI read cached Pokémon data only (zero PokéAPI network calls while exploring/capturing)
- [ ] **DATA-03**: Encounter rates, biome tables, capture modifiers, unlock thresholds, and daily reward amounts live in `data/` config — not hardcoded in React components
- [ ] **DATA-04**: PokéAPI cache and player save use separate namespaced localStorage keys so neither wipe corrupts the other

### Exploration

- [ ] **MAP-01**: Player can walk a tile map in Forest using a large on-screen D-pad (touch) and keyboard arrows/WASD through one shared input path
- [ ] **MAP-02**: Camera follows the player; map uses nearest-neighbor / pixelated scaling suitable for Emerald-inspired tiles
- [ ] **MAP-03**: Stepping on grass rolls outcomes at 45% Pokémon / 25% nothing / 20% item / 8% rare Pokémon / 2% legendary (config-driven)
- [ ] **MAP-04**: Movement and collision resolve in pure `game/` logic (not per-frame React setState of every tile)

### Capture

- [ ] **CATCH-01**: On a Pokémon encounter, player plays Rock-Paper-Scissors; winning improves capture chance
- [ ] **CATCH-02**: Player plays a timing-bar mini-game; accuracy further improves capture chance (generous windows for commons; harder for legendaries)
- [ ] **CATCH-03**: Capture roll uses ball type, berry (if used), RPS result, timing accuracy, and rarity from config
- [ ] **CATCH-04**: Player can retry a failed capture; after three failed attempts the Pokémon flees with kind, non-punishing feedback
- [ ] **CATCH-05**: Common Pokémon are easy to catch; legendary Pokémon remain difficult

### Pokédex

- [ ] **DEX-01**: Undiscovered species show as silhouettes; discovered/caught states are visually distinct
- [ ] **DEX-02**: Dex stores first encounter time/flag, first capture, number caught, and shiny status per species
- [ ] **DEX-03**: Player can open the Pokédex from the game shell and browse Gen 1 entries

### Progression & Items

- [ ] **PROG-01**: Forest is available at start; Lake unlocks after 10 total catches; Mountain unlocks after 30 total catches
- [ ] **PROG-02**: Player can travel between unlocked biomes; locked biomes show clear progress toward unlock
- [ ] **PROG-03**: Inventory includes Poké Ball, Great Ball, and Berry with unlimited capacity
- [ ] **PROG-04**: Item grass rolls and daily claims add to inventory; balls/berries can be selected during capture

### Save & Daily

- [ ] **SAVE-01**: Game auto-saves to localStorage: player position, current biome, inventory, Pokédex, daily reward state, unlocked biomes, statistics, settings
- [ ] **SAVE-02**: Save schema is versioned with migration support so updates do not wipe a child's progress
- [ ] **SAVE-03**: On load, player resumes from last saved position/biome with hydrated state before input is accepted
- [ ] **DAILY-01**: Once per local calendar day, player can claim a simple reward of free Poké Balls and/or berries (amounts from config); no streak penalty

### Audio & UX

- [ ] **AUDIO-01**: Lightweight sound effects play for key actions (move/encounter/capture success-fail); no background music
- [ ] **AUDIO-02**: Audio unlocks on first user gesture; mute toggle available in settings
- [ ] **UX-01**: UI is icon-first, mobile-first, responsive on desktop; touch targets are large enough for a child
- [ ] **UX-02**: Feedback on capture/unlock/new dex entry is clear and rewarding without harsh failure framing

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content

- **CONT-01**: Additional generations beyond Gen 1 via config expansion
- **CONT-02**: More biomes beyond Forest / Lake / Mountain
- **CONT-03**: Dex biome hints ("found near water")

### Quality of life

- **QOL-01**: Save export/import
- **QOL-02**: Quiet / reduced-stimulation mode
- **QOL-03**: Personal stats "trophy" screen beyond basic statistics

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Backend, auth, databases, SSR | GitHub Pages frontend-only constraint |
| Background music | Locked SFX-only; autoplay-hostile |
| Custom hand-drawn art packs | PokéAPI sprites + simple tiles for v1 |
| Limited balls / step limits / entry tickets | Punishing scarcity for kids |
| Rock/bait risk tradeoffs | Opaque double-edged math |
| HP battles / type charts | Complexity wall; out of product vision |
| Streak-based dailies | Punish irregular kid play schedules |
| Trading / multiplayer / leaderboards | Needs backend; social comparison harm |
| Story ending / campaign credits | Endless loop by design |
| Per-encounter PokéAPI calls | Latency and reliability |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BOOT-01 | TBD | Pending |
| BOOT-02 | TBD | Pending |
| BOOT-03 | TBD | Pending |
| BOOT-04 | TBD | Pending |
| DATA-01 | TBD | Pending |
| DATA-02 | TBD | Pending |
| DATA-03 | TBD | Pending |
| DATA-04 | TBD | Pending |
| MAP-01 | TBD | Pending |
| MAP-02 | TBD | Pending |
| MAP-03 | TBD | Pending |
| MAP-04 | TBD | Pending |
| CATCH-01 | TBD | Pending |
| CATCH-02 | TBD | Pending |
| CATCH-03 | TBD | Pending |
| CATCH-04 | TBD | Pending |
| CATCH-05 | TBD | Pending |
| DEX-01 | TBD | Pending |
| DEX-02 | TBD | Pending |
| DEX-03 | TBD | Pending |
| PROG-01 | TBD | Pending |
| PROG-02 | TBD | Pending |
| PROG-03 | TBD | Pending |
| PROG-04 | TBD | Pending |
| SAVE-01 | TBD | Pending |
| SAVE-02 | TBD | Pending |
| SAVE-03 | TBD | Pending |
| DAILY-01 | TBD | Pending |
| AUDIO-01 | TBD | Pending |
| AUDIO-02 | TBD | Pending |
| UX-01 | TBD | Pending |
| UX-02 | TBD | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 0
- Unmapped: 32 (filled by roadmapper)

---
*Requirements defined: 2026-07-25*
*Last updated: 2026-07-25 after initialization*
