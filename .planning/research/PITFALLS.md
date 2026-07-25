# Pitfalls Research

**Domain:** Kid-facing React tile exploration / PokéAPI capture games on GitHub Pages
**Researched:** 2026-07-25
**Confidence:** MEDIUM-HIGH (official Vite/PokéAPI/MDN docs + community deploy/game-loop patterns; kid UX extrapolated from kids-game design sources)

## Critical Pitfalls

### Pitfall 1: Wrong Vite `base` / Router `basename` on `/pokemon-safari/`

**What goes wrong:**
Deployed app shows a blank page; DevTools shows 404s for `/assets/*.js` (or assets requested from site root instead of `/pokemon-safari/`). Client routes throw “No routes matched” because React Router thinks the path is `/pokemon-safari/...` while routes are defined for `/`.

**Why it happens:**
Vite defaults to `base: '/'`. Multi-project user sites (`sitjohnny.github.io/food-crawl/`, `/pokemon-safari/`) require a subdirectory base. Teams set Vite `base` but forget `BrowserRouter basename` (or vice versa), or mismatch trailing slashes (`/pokemon-safari` vs `/pokemon-safari/`).

**How to avoid:**
- Lock `base: '/pokemon-safari/'` in Vite config and use the same string for React Router `basename`.
- Prefer `import.meta.env.BASE_URL` for asset/`NavLink` prefixes so one source of truth.
- Verify production build by opening `dist/index.html` asset hrefs and loading via a static server under the subpath (not only `vite preview` at wrong path).

**Warning signs:**
- Works on `localhost:5173/` but blank on GitHub Pages.
- Network tab: JS/CSS 404 at `/assets/...` instead of `/pokemon-safari/assets/...`.
- Router errors only after deploy.

**Phase to address:**
Phase 1 — App shell / GitHub Pages deploy (before any gameplay).

---

### Pitfall 2: Per-encounter PokéAPI fetches (fair-use + latency)

**What goes wrong:**
Every grass encounter hits `pokeapi.co`. Kids wait on spinners; first-session bursts look like scraping; IP can be permanently banned under PokéAPI fair use. Offline/poor mobile networks make the capture loop feel broken.

**Why it happens:**
PokéAPI docs removed hard rate limits after static hosting (2018) but still require local caching; wrappers and tutorials encourage “just fetch the Pokémon by id” during play. Gen 1 is only ~151 species — easy to prefetch, easy to forget.

**How to avoid:**
- Prefetch a trimmed Gen 1 dataset once on first load; store a **versioned** cache key (e.g. `poke-cache-v1`).
- Encounters resolve from in-memory/local cache only — zero network on grass rolls.
- Cache **metadata + sprite URLs**, not base64 image blobs (see Pitfall 3).
- Show a one-time “Preparing Safari…” progress UI; fail soft with retry if prefetch fails.

**Warning signs:**
- Network waterfall of `/api/v2/pokemon/{id}` during walks.
- Encounter latency correlates with network, not RNG.
- Console 429s or intermittent empty encounters.

**Phase to address:**
Phase 2 — Pokémon data layer / prefetch cache (before encounter gameplay).

---

### Pitfall 3: Stuffing sprites or full API JSON into `localStorage`

**What goes wrong:**
`QuotaExceededError` on first cache write; save game fails because cache and save share the same origin quota (~5–10 MiB Web Storage). Or main thread hitch when `JSON.stringify` of a huge cache runs synchronously. Kid loses progress or can’t finish first load.

**Why it happens:**
“Cache everything locally” is misread as “base64 every sprite into localStorage.” Food-crawl and Safari share `sitjohnny.github.io` origin — quotas are **per origin**, not per app path.

**How to avoid:**
- Persist only slim Pokémon records (id, name, types, sprite URL, rarity tags) + separate small save blob.
- Let the browser HTTP-cache remote sprites (raw.githubusercontent.com / PokéAPI CDN); optional Cache API / IndexedDB if offline sprites are required later.
- Catch `QuotaExceededError`; never wipe the **save** key when clearing a stale **cache** key.
- Namespace keys: `pokemon-safari:save:vN`, `pokemon-safari:poke-cache:vN` (and leave food-crawl keys alone).

**Warning signs:**
- Quota errors after “successful” prefetch.
- Save stops updating after cache rewrite.
- Mobile Safari private mode: silent persistence failure.

**Phase to address:**
Phase 2 (cache design) + Phase 7 (save system) — decide storage split early.

---

### Pitfall 4: Unversioned save / Zustand persist without `migrate`

**What goes wrong:**
A balance tweak or new field renames `coins`→`balls`, adds biomes, or changes dex shape. Next deploy loads garbage or resets the child’s collection. Or persist writes ephemeral UI (modal open, encounter-in-progress) and rehydrates into a stuck mid-capture state.

**Why it happens:**
Zustand `persist` defaults `version: 0` and shallow-merges; teams ship v1 without `version`/`migrate`/`partialize`. Save shape is treated as private implementation, not a player-facing contract.

**How to avoid:**
- Envelope every save with `version`; ship `migrate` chain from day one (even if identity for v1→v1).
- `partialize` to persist only: position, biome, inventory, dex, daily, unlocks, stats, settings.
- On load: parse → migrate → validate → merge defaults; corrupt save → new game with “Couldn’t load Safari — starting fresh” (kid-friendly), optional export later.
- Gate play on rehydration (`persist.hasHydrated`) so map doesn’t spawn at defaults then snap.

**Warning signs:**
- Progress vanishes after “tiny” deploy.
- Player stuck in capture screen after refresh.
- Dex counts NaN / undefined silhouettes.

**Phase to address:**
Phase 7 — Persistence (design schema in Phase 1 types; implement migrations when save lands).

---

### Pitfall 5: Driving the tile map / camera with React `setState` at frame rate

**What goes wrong:**
Choppy movement on phones; battery drain; D-pad feels laggy; encounter prompts stutter. React reconciles the whole map grid every step.

**Why it happens:**
Natural React pattern: `setPlayerPos` on every key/touch. Tile games need 10–20 Hz step moves or 60 fps camera — neither belongs in React render for the world layer.

**How to avoid:**
- Keep pure movement, collision, camera, and encounter checks in `game/` (testable); call from keyboard/D-pad handlers or a light step loop.
- Render map via canvas **or** CSS transforms on a tile layer; update position through refs / store subscriptions scoped to the map view — not full-app re-renders.
- React owns screens (title, dex, capture modal), not every tile cell as a stateful component.
- Prefer discrete tile steps (Emerald-like) over continuous physics for kids and performance.

**Warning signs:**
- React Profiler spikes while walking.
- 40–50 fps on mid phones with small maps.
- Input buffering: held D-pad skips tiles irregularly.

**Phase to address:**
Phase 3 — Exploration / tile map + camera.

---

### Pitfall 6: Capture timing bar tuned for adults (kid-hostile precision)

**What goes wrong:**
Seven-year-olds fail the timing bar repeatedly, flee after 3 fails, and quit. Mobile touch latency + ~150–250 ms reaction time makes narrow/fast zones feel random. Game reads as “broken” rather than “hard.”

**Why it happens:**
Timing minigames are designed as skill tests (narrow green zones, high speed). Project goal is forgiving capture for commons; copy-paste arcade timing without kid playtests.

**How to avoid:**
- Wide success window for common Pokémon; tighten only for rare/legendary.
- Slow cursor for early biomes; optional “assist” magnetism toward center on near-miss for kids mode (default on).
- RPS remains readable (huge buttons, icons not text alone); timing comes **after** a success so kids aren’t punished twice.
- Retry without burning rare balls on commons; clear “Almost!” feedback, never shame copy.
- Playtest on real phones with a child-aged tester before locking rates.

**Warning signs:**
- Capture success rate << configured roll rates in analytics/manual tests.
- Rage-quits at first legendary or first Mountain encounter.
- Adults say “easy,” kids miss consistently.

**Phase to address:**
Phase 5 — Capture flow (RPS + timing + flee rules); tune with Phase 4 encounter config.

---

### Pitfall 7: Tiny / edge-hugging D-pad and touch targets

**What goes wrong:**
Thumbs miss buttons; browser chrome / gesture back-swipe eats input; map scrolls the page; capture buttons too small. Desktop keyboard works; phone is unplayable — primary audience fails.

**Why it happens:**
Desktop-first layout; D-pad drawn at visual size without ≥44–48 px hit slop; `touch-action` / `preventDefault` omitted; fixed HUD overlaps safe areas (notch, home indicator).

**How to avoid:**
- Mobile-first: large on-screen D-pad with expanded hit areas; keep away from screen edges used for system gestures.
- `touch-action: none` on the game surface; prevent pull-to-refresh while exploring.
- Capture/RPS buttons full-width or large circular targets; high contrast.
- Keyboard still works on desktop; don’t require hover.

**Warning signs:**
- Testers say “buttons don’t work” on iPhone.
- Accidental browser back during play.
- Page rubber-bands while walking.

**Phase to address:**
Phase 3 (D-pad) + Phase 5 (capture UI) + Phase 8 polish (safe areas).

---

### Pitfall 8: Silent SFX / AudioContext never unlocked

**What goes wrong:**
Capture “feels empty” — no feedback. Console: AudioContext suspended until user gesture. Especially common on iOS Safari and first visit.

**Why it happens:**
SFX wired to encounter events at module load; no resume on Start/tap. Autoplay policy blocks Web Audio / media without gesture.

**How to avoid:**
- “Tap to start Safari” (or first D-pad press) calls `audioContext.resume()` / unlocks `HTMLAudioElement`.
- Mute toggle in settings (persisted); never rely on autoplay music (out of scope anyway).
- Load SFX via paths under `import.meta.env.BASE_URL` so GH Pages subpath doesn’t 404 sounds.

**Warning signs:**
- Works after refresh only if user clicked elsewhere first.
- Safari silent; Chrome desktop fine.
- 404 on `/sfx/...` instead of `/pokemon-safari/sfx/...`.

**Phase to address:**
Phase 8 — Audio / feedback polish (hook unlock into Phase 1 start screen).

---

### Pitfall 9: Root redirect / multi-app 404 collisions

**What goes wrong:**
Root `index.html` still auto-redirects only to food-crawl — Safari is undiscoverable. Or a spa-github-pages `404.html` at repo root rewrites `/pokemon-safari/dex` incorrectly and breaks one or both apps.

**Why it happens:**
User-site repos share one Pages publish root. SPA 404 hacks must live at **site** root and must whitelist path segments (`food-crawl`, `pokemon-safari`). Copying `404.html` only inside `/pokemon-safari/dist` does nothing for GH Pages custom 404 resolution at site level.

**How to avoid:**
- Replace root redirect with a project listing linking both apps.
- Prefer HashRouter **or** flat routes under `/pokemon-safari/` that don’t need deep server fallback for v1 (e.g. query/hash for dex) if 404 strategy is risky.
- If using BrowserRouter deep links: root `404.html` with allowlist + restore script; test refresh on `/pokemon-safari/` and a nested route.

**Warning signs:**
- `/` never mentions Safari.
- Refresh on an in-app route → GitHub 404 page.
- Fixing Safari 404 breaks food-crawl routes.

**Phase to address:**
Phase 1 — Hosting / site integration.

---

### Pitfall 10: Hardcoded rates and biome logic inside React components

**What goes wrong:**
Tuning kid-friendly odds (45/25/20/8/2) requires hunting JSX; balance drifts between Forest/Lake/Mountain; tests can’t import pure RNG tables. “Quick fix” in a component diverges from `data/` configs.

**Why it happens:**
Greenfield speed: paste probabilities next to `onStepGrass`. Project explicitly wants config-driven gameplay.

**How to avoid:**
- All encounter weights, capture modifiers, unlock thresholds, daily grants live under `src/data/`.
- UI only displays outcomes from `game/` functions.
- Snapshot tests on weighted rolls with seeded RNG.

**Warning signs:**
- Magic numbers in components.
- Changing Forest rates doesn’t affect Lake copy-paste.
- Can’t unit-test flee-after-3 without mounting React.

**Phase to address:**
Phase 4 — Encounters + config (enforce from Phase 1 folder layout).

---

### Pitfall 11: Daily reward timezone / “once per day” bugs

**What goes wrong:**
Kids get infinite dailies by changing device clock, or never get a daily because UTC vs local date disagrees. Or reward grants twice on double-mount Strict Mode.

**Why it happens:**
`Date.now()` comparisons without a stored calendar date key; effect runs twice in React 18 Strict Mode without idempotent claim.

**How to avoid:**
- Store `lastDailyLocalDate` as `YYYY-MM-DD` in the player’s local timezone; claim only if date ≠ today.
- Idempotent `claimDaily()` in the store (check-then-set in one action).
- Accept clock-skew abuse for a kid game — don’t overbuild anti-cheat; do prevent accidental double grant.

**Warning signs:**
- Daily fires twice in dev.
- “Come back tomorrow” stuck after midnight locally.
- Inventory jumps by 2× expected balls.

**Phase to address:**
Phase 7 — Daily reward + persistence.

---

### Pitfall 12: Blurry sprites / wrong pixel scaling

**What goes wrong:**
PokéAPI Gen 1 sprites look muddy; Emerald aesthetic fails; silhouettes unreadable on retina.

**Why it happens:**
Default CSS image interpolation + non-integer scale factors; drawing sprites into a scaled canvas without `imageSmoothingEnabled = false`.

**How to avoid:**
- `image-rendering: pixelated` (and `crisp-edges` fallback) on sprite `<img>` / canvas.
- Scale by integers (2×, 3×); center in fixed frames.
- Dex silhouettes: CSS filter/mask on same nearest-neighbor pipeline.

**Warning signs:**
- Soft edges on 96×96 display of 40×40 art.
- “Looks like AI upscale” feedback.

**Phase to address:**
Phase 2 (sprite display components) + Phase 6 Pokédex.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Fetch Pokémon live during encounters | Ships encounter UI faster | Latency, fair-use risk, flaky play | Never for production Safari |
| Persist entire Zustand store | One-liner save | Stuck UI state, bloat, migrate hell | Never — always `partialize` |
| `setState` per tile step | Simple movement | Mobile jank, hard-to-test logic | Only throwaway prototype |
| Base64 sprites in localStorage | Offline images | Quota blowups sharing origin with save | Never |
| Hardcode rates in JSX | Fast tweak | Untestable balance, biome drift | Never past Phase 4 |
| Skip save `version` until “later” | Less code | First real update wipes kids’ dex | Never — version from first save write |
| HashRouter instead of BrowserRouter | Avoids GH Pages 404 hack | Slightly uglier URLs | Acceptable for v1 if deep links aren’t needed |
| Single global RNG without seed | Less code | Untestable encounter/capture odds | Dev-only; inject seed in tests |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| PokéAPI | N+1 detail fetches per encounter; ignoring fair-use cache rule | Prefetch Gen 1 once; versioned local cache; play offline from cache |
| PokéAPI sprites | Downloading/storing all sprite binaries in Web Storage | Store URLs; rely on HTTP cache / optional Cache API |
| Vite + GitHub Pages | `base: '/'` on user site subdirectory app | `base: '/pokemon-safari/'` + matching router basename |
| React Router | Deep link refresh → GH 404 | Flat routes, HashRouter, or allowlisted root `404.html` |
| Zustand persist | No `migrate` / persist actions & ephemeral flags | `version` + `migrate` + `partialize` + hydration gate |
| Web Audio / `<audio>` | Play SFX on load | Unlock on Start gesture; paths under `BASE_URL` |
| Shared GH Pages origin | Cache clear wipes food-crawl or Safari save | Prefixed keys; never `localStorage.clear()` |
| Root `index.html` | Auto-redirect only to food-crawl | Project listing including Pokémon Safari |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| React re-render entire tile grid each step | Jank, heat, missed inputs | Imperative/canvas/transform map; `game/` logic outside React | Immediately on mid-tier phones |
| Synchronous mega-`localStorage` write | Frame hitch on save/prefetch | Slim JSON; debounce saves; don’t store images | ~100KB+ payloads on low-end devices |
| Drawing off-screen tiles every frame | FPS drop as map grows | Viewport culling | Large biomes / multi-screen maps |
| Unbounded shiny/VFX DOM nodes | Capture overlay lag | Cap particles; CSS sparingly | Low-end Android during capture |
| Prefetch storm (151 parallel unbounded) | Browser connection limits, UI freeze | Staged concurrency (e.g. 8 at a time) + progress | First-load on slow networks |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting client save / dex for “achievements” online | N/A for v1 (no backend) — still don’t expose write APIs later | Keep frontend-only; no secrets in repo |
| `localStorage.clear()` in “reset cache” | Wipes sibling apps on same origin | Delete only `pokemon-safari:*` keys |
| Loading scripts from random CDNs for “Pokémon helpers” | Supply-chain / XSS on a kid site | Vendored deps; PokéAPI HTTPS GETs only |
| Reflecting raw API names into HTML without text nodes | Low XSS if API compromised | React text escaping; sanitize any future HTML dex entries |
| Collecting analytics/PII “for kids metrics” | Privacy / COPPA-shaped concern | No accounts, no tracking in v1 (aligns with out-of-scope backend) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Harsh fail / flee without clear next action | Child quits after 3 fails | Soft copy, refill path, common catches stay easy |
| Text-heavy menus | Pre-/early readers stuck | Icons, sprites, short labels, color cues |
| Precision timing as skill gate | Feels unfair on mobile | Wide windows, assist, rarity-scaled difficulty |
| Tiny D-pad / edge placement | Missed moves, system gesture fights | Large targets, inset from edges, `touch-action` |
| No mute / sudden SFX | Parents kill the tab | Start gesture + persistent mute |
| Progress lost (save bug) | Trust destroyed for kid + parent | Versioned save, visible “Saved,” optional export |
| Endless grind with no early wins | Boredom before biome 2 | Forgiving commons, early dex fills, unlock at 10 catches feels close |
| Blocking prefetch with no skip/retry | Bounce on bad Wi‑Fi | Progress UI, retry, cached replay |

## "Looks Done But Isn't" Checklist

- [ ] **GH Pages base:** Production asset URLs include `/pokemon-safari/` — verify on real Pages URL, not only local root.
- [ ] **Router basename:** Deep navigation and refresh behavior tested under subpath.
- [ ] **PokéAPI cache:** Walking grass produces **zero** Pokémon API calls (devtools Network filter).
- [ ] **Cache versioning:** Bumping poke-cache version refetches once without deleting save.
- [ ] **Save versioning:** Artificial field rename + `migrate` keeps dex counts.
- [ ] **Hydration:** Hard refresh mid-map restores position without flash-reset.
- [ ] **Capture forgiveness:** Common catch rate on phone with kid-sized timing window validated.
- [ ] **Touch:** D-pad and RPS playable one-handed on a real phone; no page scroll.
- [ ] **Audio unlock:** First SFX after Start works on iOS Safari.
- [ ] **Daily claim:** Idempotent under React Strict Mode; local date boundary correct.
- [ ] **Pixel art:** Sprites use nearest-neighbor; silhouettes readable.
- [ ] **Root listing:** `/` links to Safari; food-crawl still works.
- [ ] **Quota safety:** Prefetch failure does not wipe save keys.
- [ ] **Config-driven rates:** Changing `data/` encounter table changes live rolls without component edits.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong `base`/basename | LOW | Fix config, rebuild, redeploy; purge CDN/browser cache |
| Fair-use / API burst | MEDIUM | Stop live fetches; ship prefetch cache; wait out ban if any; use cached/baked JSON |
| Quota / corrupt save | MEDIUM | Namespace purge of cache only; migrate or reset save with kid-friendly message; add export |
| React map jank | MEDIUM–HIGH | Extract `game/` + imperative render; avoid full rewrite if boundaries exist |
| Timing too hard | LOW | Widen windows / slow bar via `data/` config; ship without code restructuring |
| Audio silent | LOW | Add Start unlock + BASE_URL asset paths |
| Root/404 collision | MEDIUM | Project listing + allowlisted 404 or HashRouter |
| Unversioned saves in wild | HIGH | One-time best-effort heuristic migrate; accept some resets; never repeat |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Wrong Vite base / router basename | Phase 1 — App shell & GH Pages | Live `/pokemon-safari/` loads JS/CSS; no root asset 404s |
| Root redirect / multi-app 404 | Phase 1 — Site integration | `/` lists both apps; refresh rules documented & tested |
| Hardcoded rates in UI | Phase 1 layout + Phase 4 encounters | Rates only in `src/data/`; unit tests on tables |
| Per-encounter PokéAPI | Phase 2 — Data prefetch | Network quiet during exploration |
| Sprite/cache quota blowup | Phase 2 — Cache design | Slim cache; sprites by URL; quota error handled |
| Blurry sprites | Phase 2 / Phase 6 | Pixelated rendering checklist on retina |
| React setState map loop | Phase 3 — Exploration | Stable FPS walking; logic in `game/` |
| Tiny D-pad / touch | Phase 3 + Phase 5 | Real-device touch test |
| Kid-hostile timing bar | Phase 5 — Capture | Commons catch reliably on phone |
| Unversioned / over-broad persist | Phase 7 — Save | Migrate test + partialize audit |
| Daily double-claim / TZ | Phase 7 — Daily | Strict Mode + midnight boundary test |
| AudioContext / SFX path | Phase 8 — Audio polish | iOS Safari SFX after Start |

## Sources

- [Vite static deploy / GitHub Pages `base`](https://vite.dev/guide/static-deploy) — Context7 `/websites/vite_dev` (MEDIUM)
- [Vite `base` shared option](https://vite.dev/config/shared-options) — Context7 (MEDIUM)
- [PokéAPI docs — fair use “Locally cache resources”](https://pokeapi.co/docs/v2) — official (MEDIUM, verified via fetch)
- [PokéAPI fair use / scrape discussion](https://github.com/PokeAPI/pokeapi/issues/263) — community (LOW–MEDIUM)
- [Zustand persist `version` / `migrate` / `partialize`](https://github.com/pmndrs/zustand/blob/main/docs/reference/integrations/persisting-store-data.md) — Context7 `/pmndrs/zustand` (MEDIUM)
- [MDN Web Audio autoplay best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — official (MEDIUM)
- [MDN Audio for Web games](https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games) — official (MEDIUM)
- [MDN Storage quotas / Web Storage limits](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — official (MEDIUM)
- [Game save versioning practices](https://bugnet.io/blog/game-save-best-practices-web) — community (MEDIUM, cross-checked with Zustand docs)
- [React vs game loop / rAF patterns](https://dev.to/tomerl1/building-an-atomic-bomberman-clone-part-4-react-vs-the-game-loop-2fg8) — community (MEDIUM)
- [GH Pages subdirectory + React Router basename](https://www.gallaghern.com/blog/deploy-vite-github-pages.html) — community (MEDIUM)
- [Multi-app GH Pages 404 allowlisting](https://www.thisdot.co/blog/deploying-multiple-apps-from-a-monorepo-to-github-pages) — community (MEDIUM)
- [Kids game UX — large targets, forgiving fails](https://nipsapp.com/develop-a-kids-educational-game/) — industry blog (MEDIUM)
- [Timing-bar anticipation vs reaction](https://canyougames.com/game/stop-bar) — design explanation (MEDIUM for physics of timing; apply conservatively to kids)
- Project constraints: `.planning/PROJECT.md` (audience ~7, GH Pages, Gen 1 prefetch, capture loop)

---
*Pitfalls research for: React tile / PokéAPI / GitHub Pages kid capture games*
*Researched: 2026-07-25*
