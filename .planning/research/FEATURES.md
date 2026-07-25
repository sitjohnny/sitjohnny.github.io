# Feature Research

**Domain:** Kid-friendly browser catch-'em / safari exploration game (Pokémon Safari)
**Researched:** 2026-07-25
**Confidence:** MEDIUM (cross-verified web sources: canonical Safari Zone mechanics via Bulbapedia + Dragonfly Cave, PokeClicker feature docs, multiple independent kid-UX design guides; no single authoritative "browser kid-game" spec exists)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete. For a 7-year-old, "users leave" means the loop stops being fun within one session.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Tile-map exploration with grid-snapped movement | Genre-defining. Every Pokémon-like (PokeClicker Safari, fan clones) uses a grid the player walks around | MEDIUM | 2D array map + tween between tiles; camera follow. Standard pattern in Phaser/Canvas tutorials — well-trodden |
| Touch D-pad + keyboard controls | Mobile-first is locked; kids play on phones. Browser games conventionally map touch overlay to same input path as arrows/WASD | MEDIUM | Device-agnostic input layer (one intent source consumed by movement logic). Big buttons ≥60px for small hands |
| Grass/zone-based random encounters | The "rustle → surprise" moment IS the genre hook. Encounter zones tied to tile type is the universal pattern | LOW | Roll on step into grass tile per config table (45/25/20/8/2 already locked). Keep encounter check in `game/`, not UI |
| Capture mini-game with clear win/fail feedback | An encounter with no interaction is a slot machine; kids this age want cause-and-effect agency | MEDIUM | RPS + timing bar (locked). Every action needs instant multisensory response (sound + animation) — kids distrust silent UIs |
| Forgiving failure — retry, no punishment | Strongest consensus in kid-UX research: ages 6–8 need "gentle reset," never "you lose." Flee after 3 fails is a soft exit, not a penalty | LOW | Design constraint, not code. No harsh buzzers/red X; "It got away! Keep exploring!" framing. Never lose items or progress on failure |
| Pokédex with silhouettes and caught states | Collection tracking is the retention engine; "trophy room" visual proof of progress is the #1 motivator for 6–8s per UX research | MEDIUM | Silhouette (CSS filter on sprite) → revealed on catch. Show counts, shiny flag. Grid of 151 entries with clear caught/seen/unknown states |
| Persistent save with auto-save | A child cannot be asked to "remember to save." Losing a session's catches = tears + churn | LOW | Zustand persist → localStorage. Save on every meaningful mutation, versioned schema for migrations |
| Icon-first UI, minimal reading | 7-year-olds are early readers; text walls end sessions. Icons + short labels ("Ball," "Berry") is the standard | LOW | Design constraint across all screens. Show-don't-tell tutorialization (arrows, sparkle on grass) |
| Instant, exaggerated feedback everywhere | Kid-UX consensus: every tap needs response within ~300–500ms — button squash, pop SFX, sparkles. Silence reads as "broken" | LOW–MEDIUM | Lightweight SFX (locked) + CSS animations. Cheap individually, but must be applied consistently — budget it per screen |
| Progression unlocks (biomes at milestones) | 6–8s are motivated by "order and accumulation" — visible locked content with a clear number to hit ("10 catches!") | LOW | Config-driven thresholds (10/30 locked). Show locked biomes on a map/selector with progress toward unlock |
| Item inventory (balls/berries) | Ball choice is expected Pokémon vocabulary; gives a decision point without complexity | LOW | Unlimited inventory (locked) removes scarcity anxiety — correct call for the audience |

### Differentiators (Competitive Advantage)

Features that set the product apart. Aligned with Core Value: a forgiving, rewarding loop a 7-year-old can succeed at.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Two-stage skill capture (RPS → timing bar) | Canonical Safari Zone is pure RNG + risk management (bait/rock) — frustrating and opaque for kids. Replacing it with two readable skill moments gives agency: "I caught it" vs "I got lucky" | MEDIUM | This is the signature mechanic. RPS is winnable by chance (kid-fair), timing bar is practicable skill. Tune generous hit windows for commons; narrower for legendaries |
| Rarity tiers with legendary/shiny chase | Variable-ratio rare encounters are the proven long-tail retention hook in every collection game (shiny odds, 2% legendary roll). Gives the endless loop its "one more grass patch" pull | LOW–MEDIUM | Rates already locked in config. Make rare encounters LOUD — special sparkle intro, distinct SFX. The celebration is the feature, the roll is trivial |
| Shiny variants in the Pokédex | Renewable endgame after dex completion: same 151 species, second collection layer. PokéAPI ships shiny sprites free — near-zero art cost | LOW | Shiny flag per species (locked). Low odds but visible flag in dex creates the chase |
| Kind daily reward (cumulative, no streak) | Daily login rewards drive habit, but streak resets punish casual players 2.6× (documented "streak tax") — poison for a child who plays irregularly. Once-per-day free balls/berries with no streak = pure delight, zero loss aversion | LOW | Locked scope matches best practice already. Check `lastClaimDate !== today`; celebratory claim animation |
| Biome-specific encounter tables | Makes each unlock meaningful ("Lake has water Pokémon!") and teaches the child where to hunt for missing dex entries — turns the dex into a treasure map | LOW | Pure config: species pools per biome. Habitat data groupable from PokéAPI or hand-curated per biome |
| Celebration moments (new dex entry, first shiny, biome unlock) | Kid-UX research: rewards must feel like genuine milestones. Big fanfare for firsts converts progress into pride — this is where "polished" is perceived | MEDIUM | Full-screen "New Pokémon registered!" card with sprite + SFX. Cheap to build, disproportionate perceived quality |
| Berry as pure-upside item | Canonical bait halves catch rate (hidden tradeoff kids can't reason about). A berry that only helps (calms Pokémon / stops flee counter) is legible: "berry = good" | LOW | Deliberate simplification of safari mechanics — one-directional item effects only |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good (or are canonical to the genre) but would hurt this product.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Limited Safari Balls / session step limits / entry tickets | Canonical Safari Zone (Gen 1 gives 30 balls, 500 steps; PokeClicker uses tickets) | Scarcity + timers create stress and hard "session over" moments — exactly what kid-UX research says to avoid for 6–8s | Unlimited basic balls (already locked); rarity gates the chase instead of scarcity |
| Rock/bait risk tradeoff (rock = easier catch but more flee) | Canonical safari depth; adults enjoy the risk management | Hidden double-edged math is opaque even to adult players (documented community confusion); a 7-year-old experiences it as random betrayal | RPS + timing bar for agency; berry with only positive effects |
| HP-based battles, type effectiveness charts | "It's Pokémon, where are the battles?" | 18-type chart is a reading/memory wall; battles add balance surface, HP math, and failure states. Explicitly out of scope | Capture-only loop (PokeClicker's Safari proves catch-focused encounters stand alone) |
| Streak-based daily rewards ("Day 5 of 7!") | Standard F2P retention pattern | Streak reset after a missed day = loss aversion + disappointment; punishes kids who play on parents' schedule | Cumulative once-per-day gift, no memory of missed days (locked scope is already correct) |
| Timers/energy systems/FOMO events | Proven engagement levers in mobile collection games | Dark patterns; manufactured scarcity and FOMO are explicitly flagged as unethical for children's products | Content gating by achievement (catch counts) only |
| Trading/multiplayer/leaderboards | Core to Pokémon brand nostalgia | Requires backend (hard constraint: GitHub Pages only); social comparison features are net-negative for young solo players | Personal stats page ("Your best day: 12 catches!") — self-comparison only |
| Story campaign/ending | "Games need a goal" | Endless collection IS the goal for this audience; endings terminate the loop. Explicitly out of scope | Dex completion %, biome unlocks, shiny hunt as open-ended goals |
| Background music | Feels like polish | Locked out (SFX only); also browser autoplay policies make music unreliable before first interaction, and kid-UX guidance favors audio-off defaults | Rich, short SFX; optional mute toggle in settings |
| Text tutorials/dialogue boxes | Standard genre onboarding | Reading walls lose early readers immediately | Show-don't-tell: sparkling grass, bouncing D-pad hint, animated demonstration on first encounter |
| Per-encounter API calls to PokéAPI | Simplest implementation path | Latency kills the encounter moment; rate limits risk mid-play failures | Prefetch Gen 1 + versioned localStorage cache (already locked) |

## Feature Dependencies

```
Sprite/data cache (PokéAPI prefetch)
    └──required by──> Encounters ──required by──> Capture flow (RPS → timing → roll)
                                                        └──feeds──> Pokédex entries
                                                        └──feeds──> Catch count ──gates──> Biome unlocks
Tile map + movement
    └──required by──> Grass encounter rolls
                          └──yields──> Items (20% roll) ──enhances──> Capture flow (ball tiers, berry)

Save system (localStorage)
    └──required by──> Pokédex, Inventory, Unlocks, Daily reward, Position/biome, Settings

Daily reward ──requires──> Items + Save
Shiny flag ──requires──> Pokédex + Capture flow
Celebrations ──enhance──> Capture, Pokédex, Unlocks (bolt-on, no reverse dependency)
SFX/feedback layer ──enhances──> everything (cross-cutting; build the audio hook early)
```

### Dependency Notes

- **Capture requires encounters requires map + cache:** The vertical slice order is forced: cache → map/movement → encounters → capture. Nothing downstream is testable without sprites in cache.
- **Pokédex and unlocks both consume capture events:** A single "Pokémon captured" event in `game/` should fan out to dex, stats, and unlock checks — argues for an event/store boundary, not UI-driven writes.
- **Daily reward requires items + save:** Trivial once both exist; schedule it late.
- **Save touches everything:** Schema (position, biome, inventory, dex, daily, unlocks, stats, settings) should be versioned from day one — retrofitting migrations after a child has a beloved save is the painful path.
- **Celebrations/SFX are cross-cutting enhancers:** No hard dependency, but perceived polish lives here. A cheap global "juice" utility (play SFX + trigger animation) early prevents inconsistent feedback later.

## MVP Definition

### Launch With (v1) — matches locked PROJECT.md scope

- [ ] Gen 1 prefetch + versioned cache — everything depends on it
- [ ] Tile map, D-pad (touch + keyboard), camera follow — the explore verb
- [ ] Grass rolls at locked rates (45/25/20/8/2) — the encounter verb
- [ ] RPS → timing bar → capture roll, flee after 3 fails — the capture verb + signature mechanic
- [ ] Pokédex (silhouettes, catch count, shiny flag) — the reward surface
- [ ] Items: Poké/Great Ball, Berry, unlimited inventory — the only economy needed
- [ ] Three biomes with unlocks at 10/30 catches — progression spine
- [ ] localStorage save (auto-save on mutation) — non-negotiable for kids
- [ ] Daily reward (cumulative, once per day) — light retention, already best-practice shape
- [ ] SFX + feedback on every interaction — perceived quality lives here; treat as v1, not polish

### Add After Validation (v1.x)

- [ ] Capture/dex celebration upgrades (full-screen fanfare cards) — trigger: core loop works, child plays but reward moments feel flat
- [ ] Personal stats screen (total catches, shinies found, best day) — trigger: child asks "how many have I caught?"
- [ ] Encounter hint system (dex shows which biome a missing species lives in) — trigger: dex completion stalls
- [ ] Settings expansion (SFX volume, D-pad size/position) — trigger: real-device feedback from the target player

### Future Consideration (v2+)

- [ ] Additional generations via config — defer: Gen 1's 151 is months of content for a 7-year-old; cache size grows linearly
- [ ] More biomes/rare weather-style events — defer: validate 3-biome pacing first
- [ ] Quiet/reduced-stimulation mode — defer: worthwhile accessibility addition, not launch-blocking
- [ ] Export/import save (share between devices) — defer: file-based, no backend needed, but adds UX surface

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Prefetch + cache | HIGH (enables all) | MEDIUM | P1 |
| Map + movement + touch D-pad | HIGH | MEDIUM | P1 |
| Encounter rolls | HIGH | LOW | P1 |
| RPS + timing capture | HIGH | MEDIUM | P1 |
| Pokédex | HIGH | MEDIUM | P1 |
| Save/persistence | HIGH | LOW | P1 |
| SFX/feedback layer | HIGH | LOW–MEDIUM | P1 |
| Biome unlocks | MEDIUM | LOW | P1 |
| Items + berry | MEDIUM | LOW | P1 |
| Daily reward | MEDIUM | LOW | P1 (small, ship in v1 per locked scope) |
| Celebration fanfares | HIGH | MEDIUM | P2 |
| Stats screen | MEDIUM | LOW | P2 |
| Dex biome hints | MEDIUM | LOW | P2 |
| More generations | LOW (for now) | MEDIUM | P3 |

## Competitor Feature Analysis

| Feature | Canonical Safari Zone (Gen 1/3) | PokeClicker Safari | Our Approach |
|---------|--------------------------------|--------------------|--------------|
| Capture interaction | Pure RNG: ball/bait/rock turn choice; hidden catch/flee math | Turn-based ball/bait/rock, limited Safari Balls, tickets gate entry | Two-stage skill mini-game (RPS + timing bar) — visible, winnable, no hidden tradeoffs |
| Scarcity | 30 balls, 500 steps per session | Safari Tickets, limited balls | Unlimited balls; rarity (not scarcity) creates the chase |
| Exploration | Fixed areas with zone-specific rares | Procedural grid, items spawn on map | Hand-tuned tile maps per biome, item drops via grass rolls |
| Progression | None within safari | Safari level improves catch rate/spawns | Catch-count milestones unlock biomes; dex % as long-term goal |
| Flee mechanic | Flee check every turn, rage/eating states | Escape factor per species | Flee only after 3 failed attempts — predictable, never feels random |
| Collection UI | Dex with seen/caught | Full dex + shiny tracking + achievements | Dex with silhouettes, catch counts, shiny flags; celebrations on firsts |
| Retention | None (single-player campaign) | Achievements, idle loops | Kind daily reward (no streak), shiny/legendary variable-ratio chase |

## Sources

- PokeClicker Safari Zone system docs (DeepWiki: pokeclicker/pokeclicker, Safari Zone + Battle Systems pages) — feature set of the closest browser analog — MEDIUM (cross-checked against game)
- The Cave of Dragonflies, "R/B/Y Safari Zone Mechanics" + Bulbapedia "Kanto Safari Zone" + Calculatrex safari catch calculator — canonical bait/rock/flee math and why it frustrates — MEDIUM (three independent sources agree)
- Summer Engine "How to Make a Game for Kids" (2026), Gapsy "UX Design for Kids," Aufait UX child-interface guidelines, M. Stephens "Designing for Kids: Ethical Framework" — ages 6–8 design consensus: gentle failure, instant multisensory feedback, icon-first UI, collection/trophy motivation, no dark patterns — MEDIUM (strong cross-source agreement)
- Pavel Ignatov, "Designing Daily Rewards That Don't Punish Your Players" — streak vs cumulative daily reward data (2.6× attendance-gap amplification) — LOW–MEDIUM (single source, but quantified and consistent with Genshin-style industry shift)
- Pokémon TCG Pocket case studies (GFR Fund, UX Collective) + Pokémon GO engagement deconstructions — collection-loop retention patterns and which are dark patterns to avoid — MEDIUM
- Phaser RPG tutorial (generalistprogrammer, 2026), tile-based RPG guides, open-source Pokémon clones (boxerbomb/PokemonClone, xnt/wild-adventure) — standard implementations for grid movement, encounter counters, touch controls — MEDIUM

---
*Feature research for: kid-friendly browser Pokémon catch exploration game*
*Researched: 2026-07-25*
