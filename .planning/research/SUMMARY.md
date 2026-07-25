# Project Research Summary

**Project:** Pokémon Safari
**Domain:** Kid-facing (age ~7) frontend-only tile exploration + capture game, React SPA on GitHub Pages subpath
**Researched:** 2026-07-25
**Confidence:** MEDIUM-HIGH

## Executive Summary

Pokémon Safari is a **config-driven single-page game**, not an engine project. Every source converges on the same shape: a four-layer stack where React owns screens and chrome, Zustand owns session truth plus a versioned persisted save, pure TypeScript modules under `game/` own all probability and progression math, and `data/` + `services/` supply tunable config and one-time I/O. The genre precedent (canonical Safari Zone, PokeClicker's Safari) plus kid-UX research (ages 6–8) agree that the differentiator here is **agency and forgiveness**: the locked RPS → timing-bar capture replaces the canonical hidden bait/rock RNG math, unlimited balls replace scarcity, and rarity (shiny/legendary chase) rather than resource pressure supplies the long-tail pull. There is no ending; the Pokédex is the retention engine.

The recommended approach is verified-current tooling on the locked stack — React 19.2.8, TypeScript 7.0.2, Vite 8.1.5 with `@vitejs/plugin-react` 6.0.4, Tailwind CSS 4.3.3 via the official `@tailwindcss/vite` plugin (no PostCSS/config file), Zustand 5.0.14 with `persist`, and `react-router-dom` 7.18.1 (explicitly **not** the standalone `react-router@8` line yet). Howler 2.2.4 for SFX sprites, Vitest 4.1.10 + Testing Library for tests, and a hand-rolled typed `services/pokeapi.ts` rather than a wrapper library, because Gen 1's 151 species is small and the cache schema needs to be ours. Deployment stays consistent with the existing multi-project site: `base: '/pokemon-safari/'`, build, and copy `dist/` into `pokemon-safari/` alongside `food-crawl/`.

The risks cluster into three areas, and all three are cheap to prevent and expensive to retrofit. **(1) Subpath correctness** — `base`, router `basename`, `BASE_URL`-prefixed asset paths, and the shared-root 404 strategy must be settled in Phase 1 or every later phase debugs the same blank page. **(2) Storage discipline** — the PokéAPI cache and the player save must be separate, individually versioned keys with `partialize` and a `migrate` chain from the first write; the two apps share one origin quota, so `localStorage.clear()` and base64 sprites are both forbidden. **(3) Kid calibration** — the timing bar tuned by an adult will read as broken to a 7-year-old, so success windows live in `data/` and must be validated on a real phone with the real player. One genuine tension between research files: STACK.md prescribes Canvas 2D for the map layer, while ARCHITECTURE.md argues discrete event-driven tile steps make CSS transforms sufficient and Zustand-owned position safe. Both agree on the invariant that matters — **no React re-render per frame, and all movement/collision logic pure in `game/`** — so start with CSS transforms behind a `components/map` boundary and graduate to canvas only if profiling on a mid-tier phone demands it.

## Key Findings

### Recommended Stack

The stack was locked by the product owner; research resolved *versions and usage patterns*, and produced explicit anti-choices. All core versions were verified against the npm registry on 2026-07-25 (HIGH confidence). Node must be 20.19+ or 22.12+ for Vite 8. Tailwind v4's install path is the Vite plugin plus `@import "tailwindcss"` — the v3 PostCSS + `tailwind.config.js` path is obsolete and should not be scaffolded. Supporting-library confidence is lower (MEDIUM) for the audio and canvas choices, which rest on community consensus rather than a single authority.

**Core technologies:**
- **React 19.2.8 + react-dom**: screens, HUD, capture mini-games — declarative UI while the world layer stays out of React's render path
- **TypeScript 7.0.2 (strict)**: typed encounter tables, save schema, PokéAPI DTOs — pin back to 5.9.3 only if a tooling plugin lags
- **Vite 8.1.5 + @vitejs/plugin-react 6.0.4**: dev server and static build — `base` is the GitHub Pages subpath mechanism; plugin 6 requires Vite 8 (don't mix)
- **Tailwind CSS 4.3.3 + @tailwindcss/vite**: layout, HUD, mobile D-pad chrome — official v4 install, no PostCSS
- **Zustand 5.0.14 + `persist`**: session state and save — `version` / `migrate` / `partialize` at the root store, not per slice
- **react-router-dom 7.18.1**: screen routing with `basename: '/pokemon-safari'` — avoid `react-router@8` until `react-router-dom` and the SPA docs align
- **PokéAPI v2**: Gen 1 species metadata and sprite URLs — boot-time prefetch into a versioned cache, never a per-encounter fetch
- **Howler 2.2.4 (+ @types/howler)**: short SFX sprites, unlocked on first gesture — no BGM (out of scope and autoplay-hostile)
- **Vitest 4.1.10 + jsdom + Testing Library**: unit tests for `game/`, component tests for D-pad / dex / settings — not for the render loop

**Explicit anti-choices:** Next.js or any SSR, Redux/MobX/Jotai, Phaser/Pixi/Three, Tailwind v3 PostCSS path, `pokeapi-js-wrapper`, bundling 151 sprite PNGs into the JS graph, a `gh-pages` orphan-branch deploy, a v1 service worker, and canvas for the RPS/timing UI (React keeps those accessible and testable).

### Expected Features

Feature research found no authoritative "kid browser game" spec, but three independent source families (canonical Safari Zone mechanics, PokeClicker's Safari system, and ages-6–8 UX guidance) agree strongly on both the table stakes and — more usefully — on which canonical genre features are **actively harmful** here. The locked PROJECT.md scope already matches best practice on the two easiest things to get wrong (unlimited balls instead of scarcity; cumulative daily reward instead of streaks).

**Must have (table stakes):**
- Tile-map exploration with grid-snapped movement and camera follow — genre-defining
- Touch D-pad **and** keyboard through one shared input intent path — mobile-first is locked; targets ≥60px
- Grass/zone random encounters at config rates (45/25/20/8/2) — the "rustle → surprise" hook
- Capture mini-game with unmistakable win/fail feedback — an encounter without interaction is a slot machine
- Forgiving failure: retry, flee after 3 fails as a soft exit, never lose items or progress
- Pokédex with silhouettes, caught/seen states, catch counts, shiny flag — the retention engine
- Persistent auto-save on every meaningful mutation — a child cannot be asked to remember to save
- Icon-first UI with minimal reading, and show-don't-tell onboarding (sparkling grass, bouncing D-pad hint)
- Instant exaggerated feedback (~300–500ms) on every interaction — silence reads as "broken"
- Biome unlocks at visible catch milestones (10/30) and unlimited ball/berry inventory

**Should have (competitive):**
- **Two-stage skill capture (RPS → timing bar)** — the signature mechanic; converts "I got lucky" into "I caught it"
- Rarity tiers with a loud legendary/shiny chase — the roll is trivial code; the *celebration* is the feature
- Shiny variants in the dex — a free second collection layer via PokéAPI shiny sprites
- Kind daily reward, cumulative with no streak — streak resets amplify the attendance gap ~2.6× and punish a kid on a parent's schedule
- Biome-specific encounter tables — turns the dex into a treasure map and makes each unlock meaningful
- Celebration moments for firsts (new dex entry, first shiny, biome unlock) — cheap to build, disproportionate perceived polish
- Berry as a pure-upside item — one-directional effects only, unlike canonical bait

**Defer (v2+):**
- Full-screen celebration fanfare upgrades, personal stats screen, dex biome hints, settings expansion (all v1.x, trigger-driven)
- Additional generations via config, more biomes, quiet/reduced-stimulation mode, save export/import

**Do not build (anti-features, despite genre precedent):** limited Safari Balls / step limits / entry tickets, rock-and-bait risk tradeoffs, HP battles and type charts, streak dailies, timers/energy/FOMO, trading/multiplayer/leaderboards, a story ending, background music, text tutorial dialogue boxes, and per-encounter API calls.

### Architecture Approach

Four layers, one-way data flow: **UI → action → pure resolve → set state → UI**. Screens and components dispatch store actions and read selectors; the Zustand store holds session truth (a `GamePhase` FSM, player/map position, inventory, dex, daily, settings) and persists a partialized slice; `game/` modules are framework-free pure resolvers of the form `(state, input, config) → result`; `data/` holds every rate, biome, map, item, and threshold; `services/` owns the impure edges (PokéAPI prefetch and cache, audio, save migration). The folder layout matches PROJECT.md's preferred structure exactly. React never computes encounter math, Zustand never embeds a rate literal, and `game/` never imports React — those three rules are what make the odds unit-testable and tunable without touching UI.

**Major components:**
1. **Phase FSM (`game/phase.ts` + store)** — explicit `boot → explore → encounter_flash → capture_rps → capture_timing → capture_result → explore/flee` with a pure transition guard table, so illegal input (D-pad during RPS) is impossible and screens are predictable
2. **Zustand slices + root `persist`** — phase / player / inventory / dex / daily / settings composed into one bound store; `partialize` persists save fields only, avoiding per-slice storage races
3. **Config-driven resolvers (`game/` + `data/`)** — `rollGrass`, `pickSpecies`, `resolveRps`, `rollCatch`, `unlocks`, `daily`, all seeded-RNG testable against fixtures
4. **Boot prefetch + versioned cache (`services/pokeapi`)** — `ensureCache()` gates explore; thereafter `getPokemon(id)` is a synchronous lookup and encounters make zero network calls
5. **Map + input layer (`components/map`, `hooks/usePlayerInput`)** — discrete event-driven tile steps with camera follow; thin hooks that only adapt input to store actions

**Module build order (dependencies bottom-up):** types + data manifests → rng/coords utils → pokeapi service + cache → `game/` rules → store slices + persist → hooks → map/controls/Explore screen (**playable: walk**) → capture components (**playable: full loop**) → dex → remaining biomes/unlocks/items/daily → audio and pixel polish. Ship these as *vertical slices*, but land the modules in this order so each slice has its dependencies ready.

### Critical Pitfalls

1. **Wrong Vite `base` / router `basename` on the subpath** — blank page on Pages with `/assets/*` 404s and "No routes matched." Lock `base: '/pokemon-safari/'`, use the same string for `basename`, prefix every asset with `import.meta.env.BASE_URL`, and verify on the real Pages URL, not just local root. *Phase 1.*
2. **Per-encounter PokéAPI fetches** — spinners mid-grass, fair-use violation risk, broken feel on weak mobile networks. Prefetch trimmed Gen 1 once with staged concurrency (~8 at a time) and a progress/retry UI; encounters read cache only. Verification is literal: walking grass produces **zero** API calls in the Network tab. *Phase 2.*
3. **Sprites or full API JSON in `localStorage`** — `QuotaExceededError`, and because `sitjohnny.github.io` is **one origin shared with food-crawl**, quota and key collisions are cross-app. Store slim records plus sprite **URLs**; namespace keys (`pokemon-safari:save:vN`, `pokemon-safari:poke-cache:vN`); catch quota errors; never `localStorage.clear()`; never let a cache purge touch the save key. *Phase 2 + 7.*
4. **Unversioned save / `persist` without `migrate` or `partialize`** — the first balance tweak wipes a child's collection, or a persisted mid-capture phase rehydrates into a stuck screen. Envelope with `version`, ship an identity `migrate` chain from the first write, `partialize` to save fields only, force a safe phase on hydrate, and gate play on `persist.hasHydrated`. *Phase 7, schema designed in Phase 1 types.*
5. **Driving the map with React `setState` at frame rate** — jank, heat, laggy D-pad, dropped tiles on mid-tier phones. Keep movement/collision/camera pure in `game/`; render the world via CSS transforms or canvas updated through refs / scoped subscriptions; never make each tile a stateful component. *Phase 3.*
6. **A timing bar tuned for adults** — with ~150–250ms child reaction time plus touch latency, narrow fast windows feel random, the kid flees three times and quits. Wide windows for commons, narrower only for rare/legendary, optional near-miss assist on by default, and a real playtest with the actual 7-year-old before locking rates. *Phase 5.*

Also load-bearing and easy to miss: **tiny or edge-hugging touch targets** (needs `touch-action: none`, inset placement, safe-area awareness), **AudioContext never unlocked** (unlock on the Start gesture; iOS Safari is silent otherwise), **root-redirect / shared-404 collisions** with food-crawl, **daily reward double-claim under Strict Mode plus UTC-vs-local date bugs** (store `YYYY-MM-DD` local, idempotent check-then-set), and **blurry sprites** (`image-rendering: pixelated`, integer scale factors, `imageSmoothingEnabled = false`).

## Implications for Roadmap

Research supports **eight vertical phases**. The numbering below is the one PITFALLS.md already maps its prevention and verification steps to — keeping it stable means every phase inherits a ready-made "looks done but isn't" checklist. PROJECT.md requires each phase to end in something compiling and, from Phase 3 on, something playable.

### Phase 1: App Shell, Subpath, and Site Integration
**Rationale:** Every subsequent phase is debugged through the deployed subpath, so `base`/`basename`/`BASE_URL` correctness and the shared-root 404 strategy must be settled first. The folder layout and save/cache *types* also land here, because retrofitting the `game/` vs UI boundary and a versioned save envelope later is the single most expensive mistake in this project.
**Delivers:** Vite 8 + React 19 + TS 7 strict + Tailwind v4 scaffold; `base: '/pokemon-safari/'` with matching router `basename`; route skeleton (boot / explore / dex / settings); `src/{assets,components,screens,hooks,services,game,data,store,types,utils}/` layout; `types/save.ts` with a versioned envelope; deployed to `/pokemon-safari/` with the root `index.html` converted to a project listing including both apps; Vitest wired.
**Addresses:** Icon-first shell chrome; nothing gameplay-facing yet.
**Avoids:** Pitfalls 1 (base/basename), 9 (root redirect / multi-app 404), and pre-empts 10 (hardcoded rates) by establishing `data/` before any rate exists.

### Phase 2: Pokémon Data Layer — Prefetch, Versioned Cache, Sprite Rendering
**Rationale:** Nothing downstream is testable without species metadata and sprites in cache; the architecture's synchronous-encounter guarantee is a property of this layer. Storage split (cache key vs save key) must be decided here, before the save exists.
**Delivers:** `services/pokeapi/{client,cache,sprites}.ts` — Gen 1 list + throttled detail fetch (~8 concurrent) with backoff, slim DTOs (id, name, types, sprite + shiny URLs) into a namespaced versioned localStorage key; `BootScreen` with progress and fail-soft retry; a nearest-neighbor sprite component; `getPokemon(id)` synchronous read.
**Uses:** PokéAPI v2, custom typed service (no wrapper), `image-rendering: pixelated`.
**Implements:** Architecture Pattern 5 (boot prefetch → synchronous encounters).
**Avoids:** Pitfalls 2 (per-encounter fetch), 3 (quota / base64 sprites), 12 (blurry sprites), and the prefetch-storm performance trap.

### Phase 3: Exploration — Tile Map, Movement, Camera, D-pad
**Rationale:** First playable slice, and the phase where the React-vs-world-layer boundary is either established correctly or becomes a rewrite. Depends only on `data/maps` and pure movement logic, so it can land before encounters exist.
**Delivers:** One biome tile map from `data/maps`; `game/movement.ts` + `game/camera.ts` (pure, unit-tested collision and camera); CSS-transform tile layer behind a `components/map` boundary; large inset touch D-pad plus keyboard through one shared input path; `touch-action: none`. **Playable: walk the map.**
**Avoids:** Pitfalls 5 (setState per frame), 7 (tiny/edge-hugging touch targets), and the tile-grid re-render and off-screen-drawing performance traps.

### Phase 4: Encounters — Config-Driven Grass Rolls
**Rationale:** Small, pure, and gates capture. Deliberately separate from Phase 3 so the odds tables land as tested config rather than as a handler side effect.
**Delivers:** `data/rates.ts` (45/25/20/8/2) and `data/encounterTables.ts` per biome; `game/encounter.ts` (`rollGrass`, `pickSpecies`) with seeded-RNG tests; `game/phase.ts` FSM transition table; encounter flash on stepping into grass.
**Avoids:** Pitfall 10 (rates in components) and Anti-Pattern 1 (encounter math in React).

### Phase 5: Capture Flow — RPS → Timing Bar → Roll → Flee
**Rationale:** The signature mechanic and the phase most likely to need tuning iterations, so it should be playable early enough to test with the actual child. Depends on Phase 4 for the encounter and Phase 2 for the sprite.
**Delivers:** React RPS buttons and timing bar (not canvas — a11y and Testing Library); `game/capture.ts` (`resolveRps`, timing window evaluation, `rollCatch` by ball/berry/rarity, flee after 3 fails); generous commons windows and optional near-miss assist, all from `data/`; kind failure copy. **Playable: full explore → encounter → capture loop.**
**Avoids:** Pitfalls 6 (adult-tuned timing) and 7 (small capture targets); the anti-features of hidden risk tradeoffs and punishing failure.

### Phase 6: Pokédex and Collection UI
**Rationale:** The reward surface — and the retention engine for this audience. Needs capture events (Phase 5) and the metadata cache (Phase 2) to render anything real.
**Delivers:** 151-entry grid with seen/caught/unknown states, silhouettes via CSS filter on the nearest-neighbor pipeline, catch counts, shiny flags, detail view.
**Avoids:** Pitfall 12 (unreadable silhouettes on retina) and the text-heavy-menu UX pitfall.

### Phase 7: Persistence, Biome Unlocks, Items, and Daily Reward
**Rationale:** All four consume the same capture event and the same save blob, so they belong together — and the save schema should be exercised only once the full set of fields it must hold actually exists. A single "Pokémon captured" event in `game/` fans out to dex, stats, and unlock checks.
**Delivers:** Root-level `persist` with `version`, `migrate` chain, and `partialize` (position, biome, inventory, dex, daily, unlocks, stats, settings); hydration gate and safe-phase reset; corrupt-save recovery with kid-friendly copy; `game/unlocks.ts` thresholds at 10/30 with all three biomes; Poké Ball / Great Ball / Berry with unlimited inventory; `game/daily.ts` idempotent once-per-local-day claim.
**Avoids:** Pitfalls 3 (save/cache key collision), 4 (unversioned persist, persisted ephemeral phase), 11 (daily double-claim and timezone), and Anti-Pattern 4.

### Phase 8: Audio, Feedback, and Kid-Facing Polish
**Rationale:** Perceived quality lives here, but the audio *unlock* must be hooked into the Phase 1 start gesture, so plan the hook early even though the SFX land late. Everything in this phase is a cross-cutting enhancer with no reverse dependency.
**Delivers:** `services/audio.ts` with Howler SFX sprites loaded from `BASE_URL` paths, gesture unlock, persisted mute toggle; a shared "juice" helper (play SFX + trigger animation) applied consistently; celebration moments for firsts; safe-area/notch handling; real-device pass on a phone with the target player.
**Avoids:** Pitfall 8 (silent AudioContext, 404'd SFX paths), the unbounded-VFX performance trap, and the sudden-SFX-with-no-mute UX pitfall.

### Phase Ordering Rationale

- **The dependency chain is forced, not chosen:** cache → map/movement → encounters → capture → dex, with save/unlocks/daily downstream of capture. FEATURES.md and ARCHITECTURE.md derived this independently and agree.
- **Deploy correctness precedes gameplay** because the subpath is how every later phase is verified; discovering a `base` mismatch in Phase 6 means re-testing everything.
- **Config and pure-logic modules land in the phase that first needs them,** never inside a component — this is what keeps `game/` unit-testable and makes kid-balance tuning a `data/` edit rather than a code change.
- **Save consolidates in Phase 7 but its *types* are designed in Phase 1,** because the versioned envelope is a player-facing contract and the recovery cost for unversioned saves already in a child's browser is HIGH.
- **Feedback/SFX is a late phase but an early hook:** the gesture unlock lives on the Phase 1 start screen; only the sound files and animation polish wait.
- **Each phase from 3 onward ends playable,** satisfying PROJECT.md's vertical-MVP and compile-gate requirements.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Exploration):** the one unresolved cross-file tension — STACK.md prescribes Canvas 2D while ARCHITECTURE.md argues CSS transforms suffice for discrete event-driven steps. Both agree only on the invariant (no per-frame React render). Needs a planning-time decision with a mobile-performance criterion and a `components/map` boundary that permits swapping.
- **Phase 5 (Capture):** timing-window calibration for a 7-year-old has no authoritative source — the numbers come from reaction-time reasoning, not measurement. Plan an empirical tuning loop on a real phone, and keep every window in `data/`.
- **Phase 1 (Site integration):** the multi-app GitHub Pages 404 strategy is genuinely risky — a root `404.html` must allowlist path segments or it can break food-crawl. Research the HashRouter fallback (`createHashRouter`, keeping Vite `base`) as an explicitly acceptable v1 tradeoff before committing to BrowserRouter deep links.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Data layer):** PokéAPI caching and slim-DTO patterns are well documented and the fair-use rule is explicit in official docs.
- **Phase 4 (Encounters):** weighted-pick with seeded RNG against config tables is textbook; rates are already locked.
- **Phase 6 (Pokédex):** grid + silhouette filter + caught-state rendering is a solved UI problem.
- **Phase 7 (Persistence):** Zustand `persist` with `version`/`migrate`/`partialize` is documented directly by the library, and the daily-date pattern is a two-line rule.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core versions verified against the npm registry on 2026-07-25; Tailwind v4 and Vite `base` confirmed in official docs. MEDIUM only for the supporting Canvas-hybrid, Howler, and cache-shaping choices, which rest on community consensus. |
| Features | MEDIUM | No authoritative "kid browser game" spec exists. Strength comes from convergence: canonical Safari Zone mechanics (three agreeing sources), PokeClicker's documented Safari system, and multiple independent ages-6–8 UX guides. The daily-reward streak-tax figure is a single quantified source. |
| Architecture | HIGH | Layer separation, slices + root `partialize`, and config-driven resolvers are directly supported by Zustand and React docs; the phase-FSM pattern is transferred from battle/orchestrator architectures rather than copied, which is the softest part. |
| Pitfalls | MEDIUM-HIGH | The high-severity items (Vite `base`, PokéAPI fair-use caching, Web Storage quotas, Zustand `migrate`, audio autoplay unlock) are grounded in official Vite/PokéAPI/MDN/Zustand docs. Kid-UX calibration and the exact timing-window numbers are extrapolated. |

**Overall confidence:** MEDIUM-HIGH — the technical path is well grounded; the child-facing tuning is reasoned rather than measured and must be validated by playtest.

### Gaps to Address

- **Canvas 2D vs CSS transforms for the map layer:** the only direct disagreement between research files. Resolve during Phase 3 planning. Start with CSS transforms behind a `components/map` boundary, define a concrete graduation trigger (sustained FPS drop or input lag on a mid-tier phone), and keep all movement/camera math in `game/` so the swap is a render-layer change only.
- **Timing-bar and catch-rate numbers for a 7-year-old:** unmeasured. Keep every window, cursor speed, and assist magnitude in `data/`; plan an explicit tuning session with the target player before Phase 5 is called done. Expect to widen, not narrow.
- **Biome encounter-table curation:** research notes habitat data is groupable from PokéAPI *or* hand-curated, without resolving which. Decide in Phase 4 planning; hand-curation for three biomes is likely faster and better tuned than deriving from API habitat fields.
- **GitHub Pages deep-link 404 strategy:** BrowserRouter with an allowlisted root `404.html` versus `createHashRouter` is unresolved, and the wrong choice can break food-crawl. Pick in Phase 1 with an explicit test of refresh on a nested route for **both** apps.
- **localStorage headroom for the Gen 1 cache:** flagged as probably fine but not measured, and quota is shared with food-crawl. Measure the serialized cache size in Phase 2; the documented escape hatch is slimming DTOs, then chunked keys, then IndexedDB (`idb-keyval`) for the cache while the save stays in localStorage.
- **TypeScript 7 ecosystem maturity:** `7.0.2` is `latest` but plugin support is unverified for this toolchain. If ESLint or a Vite plugin breaks, pin `typescript@5.9.3` and keep `strict` on — a Phase 1 discovery, not a blocker.

## Sources

### Primary (HIGH confidence)
- npm registry, queried 2026-07-25 — verified React 19.2.8, react-dom 19.2.8, TypeScript 7.0.2, Vite 8.1.5, @vitejs/plugin-react 6.0.4, Tailwind 4.3.3, Zustand 5.0.14, react-router-dom 7.18.1, Vitest 4.1.10, Howler 2.2.4, jsdom 29.1.1
- https://tailwindcss.com/docs/installation/using-vite — Tailwind v4 install via `@tailwindcss/vite` + `@import "tailwindcss"`; confirms no PostCSS/config file
- https://pokeapi.co/docs/v2 — fair-use requirement to cache locally; no hard rate limit; `pokemon` and `sprites` response shape
- https://vite.dev/guide/static-deploy + https://vite.dev/config/shared-options — `base` for GitHub Pages subdirectories
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices and .../Games/Techniques/Audio_for_Web_Games — autoplay policy, gesture unlock
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria — per-origin Web Storage quotas (the shared-origin constraint with food-crawl)
- Project constraints: `.planning/PROJECT.md` — locked stack, audience, scope, folder layout

### Secondary (MEDIUM confidence)
- Zustand docs — slices pattern and `persist` (`version`, `migrate`, `partialize`, hydration): root-level persist avoids per-slice storage races
- Context7 `/remix-run/react-router` — `createBrowserRouter` `basename`; `react-router@8` peer/packaging skew
- Context7 `/vitest-dev/vitest` — jsdom environment and Testing Library dependency set
- https://react.dev/learn/thinking-in-react — separation of concerns for the UI/logic boundary
- PokeClicker Safari Zone system docs (DeepWiki: pokeclicker/pokeclicker) — closest browser analog's feature set, cross-checked against the game
- The Cave of Dragonflies "R/B/Y Safari Zone Mechanics" + Bulbapedia "Kanto Safari Zone" + Calculatrex safari calculator — canonical bait/rock/flee math and documented player confusion (three independent agreeing sources)
- Kid-UX guidance set: Summer Engine "How to Make a Game for Kids" (2026), Gapsy "UX Design for Kids," Aufait UX child-interface guidelines, M. Stephens "Designing for Kids: Ethical Framework" — ages 6–8 consensus on gentle failure, instant multisensory feedback, icon-first UI, collection motivation, no dark patterns
- Pokémon TCG Pocket and Pokémon GO engagement deconstructions (GFR Fund, UX Collective) — collection-loop retention patterns and which are dark patterns
- Deploy and game-loop community patterns: gallaghern.com Vite + GH Pages basename, thisdot.co multi-app GH Pages 404 allowlisting, dev.to "React vs the Game Loop," danielmackay/pacman React+Zustand boundary, bugnet.io game-save versioning
- Phaser RPG tutorial (generalistprogrammer, 2026) and open-source Pokémon clones (boxerbomb/PokemonClone, xnt/wild-adventure) — standard grid movement, encounter counters, touch controls

### Tertiary (LOW confidence)
- Pavel Ignatov, "Designing Daily Rewards That Don't Punish Your Players" — the 2.6× streak-tax figure; single quantified source, consistent with the industry shift away from streaks. Directionally trusted; the exact number is not load-bearing.
- gamedev.StackExchange threads and 2026 web-audio roundups — Canvas-for-map and Howler-for-SFX recommendations; the basis of the unresolved Phase 3 rendering question
- PokéAPI fair-use / scraping discussion (github.com/PokeAPI/pokeapi issue #263) — community interpretation of ban risk
- canyougames.com timing-bar design notes — anticipation vs reaction framing; applied conservatively and not used to set kid-facing numbers

---
*Research completed: 2026-07-25*
*Ready for roadmap: yes*
