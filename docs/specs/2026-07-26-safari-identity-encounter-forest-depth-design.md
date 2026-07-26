# Safari identity, encounter juice & Forest depth

**Date:** 2026-07-26  
**Status:** Approved for planning  
**App:** `pokemon-safari-app` (Gen 1 Safari on sitjohnny.github.io)

## Problem

The Safari loop is solid (explore → appear → multiplication → timing throw → dex/shiny), but the game underuses PokéAPI data and feels samey once the novelty of catching wears off. Players already have types in cache and Seen/Caught progress in the dex header, yet encounters and dex sheets still feel thin, and every grass tile draws from the same equal-weight Forest pools.

## Goals

Make Safari feel more like Pokémon and more worth returning to by shipping three sequenced workstreams:

1. **Identity & dex** — official artwork, type badges, richer dex fields, browse filters  
2. **Encounter juice** — type-colored accents + bonus clarity in the catch loop  
3. **Forest depth** — within Forest only, grass pockets that bias encounter pools by habitat  

## Non-goals

- Inventory, daily rewards, ball/berry selection UI  
- Lake / Mountain biomes or unlock progression  
- Audio (cries, SFX, music)  
- New education categories (multiplication remains the only question type)  
- Base-stat training UI, abilities browser, animated sprites  
- Changing global common/rare/legendary grass outcome weights  

## Delivery order

Ship in workstream order. Workstream 1 expands the PokéAPI cache once; 2 and 3 consume that data. Do not start Forest depth until the v3 DTO includes `habitat`.

---

## Workstream 1 — Data layer (poke-cache v3)

Bump `CACHE_VERSION` from **2 → 3**. Existing players fail `hasValidCache` and re-prefetch via Boot (existing version-mismatch path). No player-save migration.

### Extended `PokemonDto`

| Field | Source | Notes |
|--------|--------|--------|
| `sprites.front_default` | pokemon sprites | Unchanged; dex grid + silhouette |
| `sprites.front_shiny` | pokemon sprites | Unchanged; shiny display |
| `sprites.official_artwork` | `sprites.other['official-artwork'].front_default` | https-sanitized or `null` |
| `types` | pokemon types by slot | Unchanged |
| `flavorText` | species flavor (existing priority) | Unchanged |
| `genus` | species `genera` English entry | e.g. `"Seed Pokémon"`, or `null` |
| `height` | pokemon `height` | Decimeters (number) |
| `weight` | pokemon `weight` | Hectograms (number) |
| `habitat` | species `habitat.name` | e.g. `"forest"`, or `null` if missing |

### Fetch shape

Keep one pokemon + one species request per id during `ensureCache`. Expand the species fetch into a single meta helper that returns `{ flavorText, genus, habitat }` from one species response (no extra round-trips vs today).

### Type colors

Not stored in cache. Static map in `src/data/` (classic type palette) keyed by type name strings already on the DTO.

### Sprite policy

| Surface | Sprite |
|---------|--------|
| Dex grid / silhouette | Pixel `front_default` (or shiny when owned and showing shiny) |
| Encounter stages + caught dex detail | Prefer `official_artwork`; fall back to `front_default` |
| Shiny | Use `front_shiny` (no official shiny art from PokéAPI); keep “Shiny!” label when toggled |

---

## Workstream 1 — Dex + identity UI

### Shared `TypeBadge`

Label + background from `typeColors`. Used on caught dex detail and encounter cards. **Never** on uncaught `???` stubs (no type leak).

### Dex detail (caught)

- Hero: official artwork (allow larger than 96 if layout needs it), fallback to pixel  
- Name, `#nnn`, genus line when present  
- Type badges  
- Flavor text (existing)  
- Height / weight displayed as meters / kilograms (`height/10` m, `weight/10` kg)  
- Existing catch meta + shiny toggle unchanged  

### Dex grid

Keep pixel sprites for performance and silhouette behavior. No per-tile type dots (too noisy at 151).

### Filters

Under the existing Seen/Caught header. Session-only (not persisted).

- Chips: **All · Caught · Missing · Shiny**  
- Type filter: horizontal chip scroll or compact control listing Gen 1 types; combines with the status chip (AND)  
- Empty result → empty-state copy (e.g. “No shiny catches yet”)  

### `PokemonSprite`

Add `variant?: 'pixel' | 'artwork'` (default `'pixel'`). Artwork path prefers `official_artwork`, falls back to pixel. Shiny + artwork: prefer pixel shiny URL when shiny is requested (no invented shiny art).

---

## Workstream 2 — Encounter juice

No new cache fields. Reuse workstream 1 data.

### Artwork in the loop

Appear, Education, Timing, Caught, and Flee use `variant="artwork"`. Recap stays text-first.

### Type identity

- Type badges under the sprite on Appear and Caught (Flee may use the same pattern)  
- Soft dialog accent (left border or top rule) from **primary** type (slot 1)  
- Appear flash: brief primary-type wash/tint; skipped when `prefers-reduced-motion` (badges still show)  

### Bonus clarity (TimingBar)

Compact readout before/at throw:

- Math line from education outcome: e.g. `Math +15%` or `Math +0%`  
- After capture / during grade flash: timing line from `captureModifiers.timing` labels, e.g. `Timing Perfect +25%`  

Do **not** show a full catch-chance percentage (preserves mystery for rare/legendary difficulty).

### Caught card

Artwork + type badges + existing Gotcha copy; optional genus one-liner under the name.

### Out of this workstream

Ball/berry UI, shake SFX, changes to catch math formulas.

---

## Workstream 3 — Forest depth

Still one biome (`forest`). Same grass tiles and existing Forest rarity tables. Global `grassOutcomeWeights` unchanged.

### Pockets

Secondary deterministic noise at `(seed, x, y)` maps each grass tile to a pocket id. Thresholds live in `src/data/` (same pattern as `worldConfig`).

| Pocket | Habitat bias (from cached `habitat`) |
|--------|--------------------------------------|
| `woodland` | `forest`, `grassland` |
| `meadow` | `grassland`, plus light mix for `null`/urban |
| `wetland` | `waters-edge` |
| `canopy` | `forest`, `rare` |

No new tile art in v1. No pocket HUD in v1 (discover by play). No appear flavor line naming the pocket in v1.

### Encounter resolve

`EncounterCandidateEvent` already includes `x` and `y`. After rarity is chosen from Forest pools:

1. Reweight species in that pool: matching pocket habitats get higher weight; others stay lower but **non-zero**  
2. Weighted pick via injected `Rng`  
3. On any failure / empty effective pool → fall back to today’s equal-weight `pickSpecies`  

Never softlock or empty a rarity band because of pocket filtering.

### Out of this workstream

Lake/Mountain biomes, unlock thresholds, inventory, changing rarity outcome mix.

---

## Error handling

| Case | Behavior |
|------|----------|
| v2 cache on disk | Invalid for v3 → Boot re-fetch |
| Missing artwork / genus / habitat | Store `null`; UI omits or falls back |
| Cache quota soft-fail | Keep in-memory DTOs for the session (existing behavior) |
| Pocket bias edge case | Equal-weight Forest fallback |
| Uncaught dex stub | No name, sprite, types, genus, or habitat |

---

## Testing

Follow existing Vitest patterns.

- DTO mapping: artwork URL sanitize, English genus, height/weight passthrough, habitat null-safe  
- Cache v3 validity and version bump  
- Filter selectors: All / Caught / Missing / Shiny and type AND behavior  
- `PokemonSprite` artwork vs pixel vs shiny fallback  
- TimingBar bonus copy from education + timing grade  
- Pure `pocketAt(seed, x, y)` + weighted species pick: determinism and fallback  
- Regression: silhouette / `???` never leaks identity  

**Manual smoke:** cold Boot → catch one → dex detail shows art / types / genus / size → filter Shiny / Missing / type → walk grass in different areas and notice pool flavor over ~20 encounters.

---

## Architecture notes

- Keep config knobs in `src/data/`; pure resolvers in `src/game/`; React only in components/hooks/screens  
- Prefer small shared UI primitives (`TypeBadge`, sprite variant) over copy-pasted badge markup  
- Forest depth is a pure function on top of existing encounter resolution — unit-testable without DOM  
- Education provider seam unchanged; multiplication only  

## Success criteria

- After Boot, every Gen 1 species in memory has v3 fields (nullable where source missing)  
- Caught dex entry shows artwork (or pixel fallback), types, genus when available, and metric size  
- Dex filters correctly narrow the 151 grid without route changes  
- Encounter cards show artwork + type accent/badges and math/timing bonus lines without revealing total catch %  
- Two grass tiles in different pockets, same rarity roll setup, produce different species weight distributions in tests  
- No inventory, biomes, audio, or new quiz categories introduced  
