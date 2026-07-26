# Phase 6: Pokédex - Research

**Researched:** 2026-07-26
**Domain:** Collection UI (grid + detail sheet) over cached PokéAPI data + first slice of the versioned localStorage save envelope
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Locked from brief (pre-discussion)**

- **D-01:** Pokédex covers **Generation 1 only** (151 entries).
- **D-02:** Unknown Pokémon appear as **silhouettes**.
- **D-03:** Discovered (caught) entries reveal: **sprite, name, flavor text** (behavior/habitat/anatomy lore), **number caught**, **shiny owned**, **first encountered**, **first captured**.
- **D-04:** Show **completion percentage** (see D-12 for Seen + Caught).
- **D-05:** Persist dex progress in **Local Storage**.

**Seen vs caught reveal**

- **D-06:** Silhouette lifts on **first catch only** — not on first encounter. "Seen" is still recorded in data.
- **D-07:** Seen-but-not-caught looks **identical** to never-seen on the grid (no visual hint until catch).
- **D-08:** Tapping an uncaught entry opens a **stub detail sheet**: "???" / "Not caught yet" — no name, sprite, or flavor.
- **D-09:** Shiny ownership: **sparkle badge on the grid tile** + **shiny sprite toggle in detail**.

**Browse & detail layout**

- **D-10:** Browse as a **numbered grid** of classic dex tiles (sprite or silhouette + #); tap opens detail.
- **D-11:** **Sticky header** on the Dex screen stays visible while scrolling (completion always on screen).
- **D-12:** Sticky header shows **Seen/151 and Caught/151** (and derived percentages as appropriate).
- **D-13:** Detail opens as a **modal/sheet overlay** over the grid (not a `/dex/:id` route).

**Flavor text source**

- **D-14:** Expand the **PokéAPI cache** with species flavor text — bump cache version and re-prefetch once on mismatch (Phase 2 version-bump pattern).
- **D-15:** Prefer **Emerald English** flavor text (nearest Gen 3 vibe).
- **D-16:** Fallback chain: Emerald → Ruby/Sapphire/FireRed (nearest Gen 3 English) → any English entry; kid-friendly placeholder only if all fail.
- **D-17:** **Clean formatting only** — collapse whitespace/control characters; preserve official wording and capitalization (no kid rewrite).

**Dex Local Storage shape**

- **D-18:** Persist dex **inside `pokemon-safari:save:v1`** now (start SaveEnvelope early); Phase 7 fills remaining envelope fields. Do not invent a separate dex-only key.
- **D-19:** **Debounced batch writes** — queue seen/catch updates, flush after a short idle (not every event synchronously).
- **D-20:** Store **ISO timestamps** for first encountered / first captured; display as **kid-friendly relative** ("Today", "Yesterday", "3 days ago").
- **D-21:** On `QuotaExceededError`: keep playing from **in-memory** dex state, show a **gentle note**, retry on next write; never crash; never call `localStorage.clear()` or wipe poke-cache / edu-stats.

### Claude's Discretion

- Exact sticky-header copy and % formatting (e.g. "Seen 12/151 · Caught 8/151" vs dual bars)
- Exact stub-detail copy for uncaught entries
- Exact sparkle-badge visual treatment and shiny toggle control
- Debounce interval for save flushes
- Relative-date cutoff rules (when to switch from "N days ago" to a calendar date)
- Exact Emerald → Gen 3 → any-en fallback priority list and flavor-text sanitization helper
- Per-species dex entry schema shape within SaveEnvelope (must include seen, firstEncounteredAt, firstCapturedAt, catchCount, shinyOwned)
- Whether shiny toggle defaults to shiny sprite when `shinyOwned` is true
- How encounter "appear" marks seen and how Gotcha increments catch / first capture / shiny — pure store/service seams preferred

### Deferred Ideas (OUT OF SCOPE)

- Full auto-save of position, biome, inventory, unlocks, daily, settings — Phase 7
- Inventory / ball-berry selection during capture — Phase 7
- Audio and celebration polish on new dex reveals — Phase 8
- Non–Gen 1 species — out of scope for v1

None extra from discussion — stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEX-01 | Undiscovered species show as silhouettes; discovered/caught states are visually distinct | Silhouette via CSS `filter: brightness(0)` on the real cached sprite URL (Pattern 4); grid tile states + sparkle badge (Pattern 5); D-06/D-07 reveal rules encoded in a pure `dexTileState()` selector |
| DEX-02 | Dex stores first encounter time/flag, first capture, number caught, and shiny status per species | `DexEntry` schema inside `SaveEnvelopeV1.data.dex` (Pattern 2); pure reducers `markSeen`/`recordCatch` (Pattern 3); **shiny gap:** nothing rolls shiny today — this phase must add a config-driven roll (Open Question 1 + Pitfall 6) |
| DEX-03 | Player can open the Pokédex from the game shell and browse Gen 1 entries | `/dex` route + BottomNav tab already wired (App.tsx, BottomNav.tsx); replace `DexScreen` placeholder with grid + sticky header + detail sheet (Pattern 5); hydrate from poke-cache metadata + save dex slice |
</phase_requirements>

## Summary

Phase 6 is almost entirely in-house composition — **zero new npm packages are needed**. Every hard problem already has a solved analog in the codebase: the versioned-envelope + quota-safe localStorage pattern (`adaptiveStore.ts`, `cache.ts`), the cache-version-mismatch re-prefetch (`ensureCache` drops stale versions and refetches), the modal dialog pattern (`EncounterOverlay`), and the crisp-pixel sprite primitive (`PokemonSprite`). The work is: (1) bump `CACHE_VERSION` to 2 and fetch `pokemon-species/{id}` alongside `pokemon/{id}` during prefetch, storing a single pre-selected, pre-sanitized `flavorText` string per DTO; (2) create a `services/save.ts` + `store/dexStore.ts` pair with pure reducers in `game/dex.ts` and a debounced flush; (3) bind seen/caught events at two precise, already-identified seams in the encounter flow; (4) build the Dex grid/header/sheet UI from existing primitives.

The PokéAPI side is fully verified against the live API: `flavor_text_entries` is an array of `{ flavor_text, language: { name }, version: { name } }`; Emerald English entries exist for all spot-checked Gen 1 species (1, 25, 94, 130, 144, 150, 151) and contain only `\n` (and older versions `\f`) as control characters, so the D-17 sanitizer is a two-step regex. The version-name keys are exactly `"emerald"`, `"ruby"`, `"sapphire"`, `"firered"`.

One genuine gap surfaced: **shiny is never determined anywhere in the code**. `CaughtCard` accepts a `shiny` prop but `EncounterOverlay` never passes it, and `EncounterSession` has no shiny field. DEX-02's `shinyOwned` is unreachable unless this phase adds a config-driven shiny roll at encounter open. This is flagged as the top open question with a concrete recommendation.

**Primary recommendation:** Mirror `adaptiveStore.ts` for the save service, mirror the Phase 2 version-bump for flavor text, keep all dex mutations as pure reducers in `game/dex.ts`, and add a small config-driven shiny roll at session open so `shinyOwned` is reachable.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Flavor text fetch + selection + sanitize | `services/pokeapi/` (client/cache) | — | Services own PokéAPI + poke-cache localStorage; selection/sanitize are pure helpers testable in isolation |
| Cache version bump / re-prefetch | `services/pokeapi/cache.ts` | `hooks/usePokemonCache` (progress UI) | `ensureCache` already owns version-mismatch handling |
| Dex state mutations (seen/catch/shiny) | `game/dex.ts` (pure reducers) | `store/dexStore.ts` (Zustand wrapper) | Project rule: testable game logic in `game/`; store is a thin reactive shell |
| Save envelope read/write + quota | `services/save.ts` (new) | — | Services own localStorage; mirrors `adaptiveStore.ts` exactly |
| Debounced flush scheduling | `store/dexStore.ts` | `services/save.ts` (persist call) | Debounce is stateful session concern; the write itself stays in the service |
| Seen/caught event binding | `hooks/useEncounterFlow.ts` (module fns) | `store/dexStore.ts` actions | Flow hook is the single owner of encounter progression side effects (adaptive stats persist already lives here) |
| Dex grid / sticky header / detail sheet | `screens/DexScreen.tsx` + `components/dex/` | `components/PokemonSprite.tsx` (extend) | React UI tier; reads dexStore + poke-cache, never fetches |
| Relative-date formatting | `utils/` (pure) | — | Pure function with injected `now` for tests |

## Standard Stack

### Core

No new libraries. Phase 6 uses only what is installed:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | ^5.0.14 (installed) | `dexStore` — in-memory dex state + debounce scheduling | Existing store pattern (`encounterStore`, `exploreStore`) [VERIFIED: package.json] |
| react / react-dom | ^19.2.8 (installed) | Dex screen, grid, sheet | Existing [VERIFIED: package.json] |
| vitest + @testing-library/react | ^4.1.10 / ^16.3.2 (installed) | Reducer, selector, formatter, debounce, and screen tests | Existing; jsdom env + `./src/test/setup.ts` configured in `vite.config.ts` [VERIFIED: vite.config.ts] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| PokéAPI `pokemon-species/{id}` | v2 | Flavor text source | Prefetch only (Boot), never during gameplay [CITED: pokeapi.co/docs/v2#pokemon-species] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled relative-date util | `Intl.RelativeTimeFormat` | Intl gives "yesterday"/"3 days ago" with `numeric:'auto'`, but D-20 needs local-calendar-day boundaries, capitalized kid copy, and a calendar-date cutoff — custom ~20-line pure util is simpler and fully testable with injected `now` |
| Hand-rolled debounce in dexStore | lodash.debounce | Adding a dependency for ~10 lines violates the project's zero-new-packages track record (Phases 3–5 added none) |
| Plain CSS grid (151 tiles) | react-window / virtualization | 151 `<img loading="lazy">` tiles is trivially cheap; virtualization breaks `position: sticky` flow and adds a package for nothing |

**Installation:** none — no packages to install.

## Package Legitimacy Audit

No new packages are installed in this phase. The Package Legitimacy Gate is satisfied vacuously.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
                 Boot (once, on cache-version mismatch)
                 ┌────────────────────────────────────────────┐
 PokéAPI ───────►│ client.ts: fetchPokemon(id)                │
 /pokemon/{id}   │           + fetchSpecies(id)  ── NEW       │
 /pokemon-       │  selectFlavorText(entries) → sanitize      │
  species/{id}   │  → PokemonDto { …, flavorText }            │
                 └───────────────┬────────────────────────────┘
                                 ▼
                 cache.ts memory Map + CACHE_KEY v2 (localStorage)
                                 │ getPokemon(id)  (sync, gameplay)
        ┌────────────────────────┼──────────────────────────────┐
        ▼                        ▼                              │
 Encounter flow           DexScreen (grid)                      │
 useEncounterFlow.ts        │  reads name/sprites/flavorText    │
   open() → markSeen ──┐    │  reads dex slice ◄────────────┐   │
   Gotcha  → recordCatch─┐  ▼                               │   │
                        ││ Tile tap → DexDetailSheet        │   │
                        ▼▼   (modal overlay, not a route)   │   │
                 store/dexStore.ts  (in-memory dex, Zustand)│   │
                   pure reducers from game/dex.ts ──────────┘   │
                   debounced flush (idle ~800ms)                │
                                 │                              │
                                 ▼                              │
                 services/save.ts  ──►  SAVE_KEY                │
                   SaveEnvelopeV1{data:{dex}}  (localStorage)   │
                   quota → 'quota' result, memory keeps playing─┘
```

Primary trace: grass step → encounter `open()` → `markSeen(speciesId)` → dexStore (debounce) → `save.ts` → `pokemon-safari:save:v1`. On Gotcha (`onShakeComplete` with `lastCaught`) → `recordCatch({speciesId, shiny})` → same path. DexScreen hydrates from dexStore (which loads the envelope once at store creation) + `getPokemon()` metadata.

### Recommended Project Structure

```
src/
├── components/dex/          # NEW: DexGrid, DexTile, DexHeader, DexDetailSheet
├── game/dex.ts              # NEW: pure reducers + tile-state selector (+ dex.test.ts)
├── services/save.ts         # NEW: SaveEnvelope read/sanitize/persist (mirror adaptiveStore)
├── services/pokeapi/
│   ├── client.ts            # EXTEND: fetchSpecies + selectFlavorText + sanitizeFlavorText
│   ├── cache.ts             # EXTEND: v2 envelope validation incl. flavorText
│   └── keys.ts              # EXTEND: CACHE_VERSION = 2
├── store/dexStore.ts        # NEW: Zustand dex state + debounced flush + quota flag
├── screens/DexScreen.tsx    # REPLACE placeholder
├── types/pokemon.ts         # EXTEND: PokemonDto.flavorText; CacheEnvelopeV2
├── types/save.ts            # EXTEND: DexEntry + SaveEnvelopeV1.data.dex
├── data/rates.ts (or new)   # EXTEND: shinyRate + dexSaveDebounceMs config
└── utils/relativeDay.ts     # NEW: kid-friendly relative date (+ test)
```

### Pattern 1: Species flavor text — verified API shape, selection, sanitization

`GET https://pokeapi.co/api/v2/pokemon-species/{id}` returns (among much else):

```typescript
// Source: live PokéAPI response, verified 2026-07-26 [VERIFIED: pokeapi.co/api/v2/pokemon-species/1]
type PokeApiSpecies = {
  id: number
  name: string
  flavor_text_entries: {
    flavor_text: string                      // raw, contains \n and (older gens) \f
    language: { name: string; url: string }  // language.name === 'en' for English
    version: { name: string; url: string }   // e.g. 'emerald', 'ruby', 'sapphire', 'firered'
  }[]
}
```

Verified facts (live API, species 1, 25, 94, 130, 144, 150, 151):
- Version-name keys are exactly `"emerald"`, `"ruby"`, `"sapphire"`, `"firered"` (also present: `"red"`, `"blue"`, `"yellow"`, `"leafgreen"`, …, `"sword"`, `"shield"`). [VERIFIED: live API]
- **All spot-checked Gen 1 species have an Emerald English entry** (Emerald exposes the National Dex, so full 151 coverage is expected; the fallback chain is a safety net, not a common path). [VERIFIED: live API spot-check; full-151 coverage ASSUMED]
- Control characters observed: `\n` (LF, code 10) in all versions; `\f` (form feed, code 12) in red/ruby/sapphire. No soft hyphens (`\u00ad`) in Gen 3 Gen-1 entries (they appear in some newer-game entries, so keep the strip step anyway). [VERIFIED: live API]
- Bulbasaur count: 102 total entries, 28 English. Entries are per (version × language). [VERIFIED: live API]

```typescript
// Source: verified against live API output 2026-07-26
const FLAVOR_VERSION_PRIORITY = ['emerald', 'ruby', 'sapphire', 'firered'] as const

/** D-15/D-16: Emerald → Ruby/Sapphire/FireRed → any English → null. Pure, unit-testable. */
export function selectFlavorText(entries: PokeApiSpecies['flavor_text_entries']): string | null {
  const english = entries.filter((e) => e.language?.name === 'en' && typeof e.flavor_text === 'string')
  for (const version of FLAVOR_VERSION_PRIORITY) {
    const hit = english.find((e) => e.version?.name === version)
    if (hit) return sanitizeFlavorText(hit.flavor_text)
  }
  const any = english[0]
  return any ? sanitizeFlavorText(any.flavor_text) : null
}

/** D-17: collapse control chars/whitespace, preserve official wording + capitalization. */
export function sanitizeFlavorText(raw: string): string {
  return raw
    .replace(/\u00ad\n/g, '')   // soft-hyphen line breaks (newer games) → rejoin word
    .replace(/[\s\u00a0]+/g, ' ') // \s matches \n, \f, \t; also NBSP
    .trim()
}
// Verified output for Bulbasaur/Emerald:
// "BULBASAUR can be seen napping in bright sunlight. There is a seed on its back.
//  By soaking up the sun's rays, the seed grows progressively larger."
```

Do selection **at fetch time** and store only the final string on the slim DTO (`flavorText: string | null`). Never store raw `flavor_text_entries` (102 entries × 151 species would bloat localStorage; ~150 chars × 151 ≈ 25 KB is fine). The D-16 "kid-friendly placeholder if all fail" belongs in the **UI layer** (detail sheet renders placeholder copy when `flavorText === null`), not in the cache.

### Pattern 2: Cache version bump (D-14) — the exact existing mechanism

Current mechanism, verified in code:

- `keys.ts`: `CACHE_VERSION = 1`; `CACHE_KEY` interpolates it → `pokemon-safari:poke-cache:v1`. Bumping the version **changes the key itself**, so the old `v1` entry is orphaned, plus `ensureCache` explicitly removes a same-key stale version:

```172:185:pokemon-safari-app/src/services/pokeapi/cache.ts
export async function ensureCache(
  options: EnsureCacheOptions = {},
): Promise<'ok' | 'quota'> {
  const { concurrency = DEFAULT_CONCURRENCY, onProgress, resume = false } = options

  // Drop stale storage version before refetch (D-10) — CACHE_KEY only.
  const stored = parseEnvelope(localStorage.getItem(CACHE_KEY))
  if (stored && stored.version !== CACHE_VERSION) {
    localStorage.removeItem(CACHE_KEY)
    if (!resume) {
      memory = new Map()
    }
  }
```

- Warm-boot skip: `hasValidCache()`/`isValidEnvelope()` require `envelope.version === CACHE_VERSION && pokemon.length === GEN1_COUNT`; the App cold-open path and Boot gate rely on this. A v1 envelope under the new v2 key never exists, and `hydrateFromStorage()` on the v2 key returns empty → Boot runs → one-time re-prefetch. **The mismatch → re-prefetch behavior is automatic once `CACHE_VERSION = 2`.**

Changes required (all mechanical, but each is a known trap — see Pitfalls):
1. `keys.ts`: `CACHE_VERSION = 2` (old `…:v1` key becomes orphaned — acceptable; it is ≤ ~100 KB and lives under the app's own namespace. Optionally remove the literal old key on boot; **never** loop/clear storage).
2. `types/pokemon.ts`: `PokemonDto` gains `flavorText: string | null`; envelope type becomes `version: 2`.
3. `cache.ts` has **two hardcoded `version: 1` literals** (envelope construction at ~line 190 and ~line 230) — switch to `CACHE_VERSION`.
4. `cache.ts` `fromStoredDto()` must validate the new field (`flavorText === null || typeof flavorText === 'string'`) so a hand-corrupted v2 envelope re-fetches instead of crashing.
5. `src/test/pokeapi-test-helpers.ts`: `TEST_CACHE_KEY` is an intentional literal `'pokemon-safari:poke-cache:v1'` (documented Phase 2 decision) — must be updated to `v2`, and `makePokemonDto` must emit `flavorText`.

Prefetch cost doubles: 151 × `/pokemon/{id}` + 151 × `/pokemon-species/{id}`. Keep one worker per id that does both fetches sequentially, committing the DTO to memory only after both succeed — `onProgress(memory.size, GEN1_COUNT)` and the D-05 resume path (`ids.filter(id => !memory.has(id))`) then keep working unchanged.

### Pattern 3: SaveEnvelope dex slice + save service (D-18–D-21)

Current stub (entire file):

```1:9:pokemon-safari-app/src/types/save.ts
/** Versioned save envelope types — persist wiring lands in Phase 7. */

export type SaveEnvelopeV1 = {
  version: 1
  savedAt: string
  data: Record<string, never>
}

export type SaveEnvelope = SaveEnvelopeV1
```

Recommended Phase 6 shape (Claude's-discretion schema, satisfies the five mandated fields):

```typescript
// types/save.ts — Phase 6
export type DexEntry = {
  seen: boolean                    // explicit flag (D-06: seen recorded silently)
  firstEncounteredAt: string | null // ISO 8601 (D-20)
  firstCapturedAt: string | null    // ISO 8601; null ⇒ not caught ⇒ silhouette
  catchCount: number               // total successful captures
  shinyOwned: boolean              // ever caught a shiny of this species
}

/** Keyed by species id as string (JSON object keys are strings). Sparse: absent ⇒ never seen. */
export type DexData = Record<string, DexEntry>

export type SaveEnvelopeV1 = {
  version: 1
  savedAt: string
  data: {
    dex: DexData
    // Phase 7 adds: position, biome, inventory, unlocks, daily, settings, stats
  }
}
```

Phase 7 room: keep `version: 1` and grow `data` **additively** (Phase 7's loader treats missing fields as defaults). A version bump + `migrate` is only needed if a field's *shape* changes — that is Phase 7's SAVE-02 problem; starting sparse and additive now is what leaves the room.

`services/save.ts` mirrors `adaptiveStore.ts` one-for-one (same function shapes, verified in code): `isQuotaError` (DOMException + name/code 22/1014 check), `parseEnvelope` (version check → sanitize → null on any failure), `loadSave(): DexData` returning `{}` on missing/corrupt, `persistSave(dex): 'ok' | 'quota'`, `resetSaveForTests()` removing only `SAVE_KEY`. Sanitizer per entry: booleans checked with `typeof`, `catchCount` via finite-non-negative-integer check, timestamps `string | null`; drop invalid entries, keep valid ones (adaptiveStore's per-key `continue` pattern). It may touch **only** `SAVE_KEY` — the header comment convention in `adaptiveStore.ts` ("the only module allowed to touch…") should be replicated.

### Pattern 4: Encounter/capture → dex binding — exact seams

Verified: nothing in the encounter flow mutates any long-lived state today except `persistAdaptiveStats` (edu-stats). The two binding points:

**Seen (D-06/D-07, "appear"):** the single place a pokemon encounter opens is the drain effect in `useEncounterFlow.ts`:

```282:293:pokemon-safari-app/src/hooks/useEncounterFlow.ts
    try {
      getPokemon(resolution.speciesId)
      useEncounterStore.getState().open({
        speciesId: resolution.speciesId,
        rarity: resolution.rarity,
        biome: candidate.biome,
        education: null,
        captureBonus: 0,
      })
    } catch {
      useEncounterStore.getState().fail()
    }
```

Call `useDexStore.getState().markSeen(resolution.speciesId)` immediately after `open(...)` succeeds. This keeps `encounterStore` ephemeral (its file header says so explicitly) and matches the existing precedent of the flow hook owning persistence side effects.

**Caught (Gotcha):** the single deterministic Gotcha moment is `onShakeComplete()`:

```187:195:pokemon-safari-app/src/hooks/useEncounterFlow.ts
export function onShakeComplete(): void {
  const state = useEncounterStore.getState()
  if (state.stage !== 'shake') return
  const session = state.session
  if (!session) return
  if (session.lastCaught) {
    useEncounterStore.getState().toResult()
    return
  }
```

Call `useDexStore.getState().recordCatch({ speciesId: session.speciesId, shiny: session.shiny })` in the `lastCaught` branch before `toResult()`. `onShakeComplete` is a module-level export already tested via `createElement` harnesses in `useEncounterFlow.test.ts` — the dex assertion slots into that same harness style.

Reducers stay pure in `game/dex.ts` (mirror `recordAttempt` in `adaptiveStore.ts` — non-mutating spread):

```typescript
// game/dex.ts — pure, injectable clock for tests
export function markSeen(dex: DexData, speciesId: number, nowIso: string): DexData {
  const key = String(speciesId)
  const prev = dex[key]
  if (prev?.seen) return dex            // idempotent: no new object ⇒ no store update ⇒ no write
  return { ...dex, [key]: { seen: true, firstEncounteredAt: prev?.firstEncounteredAt ?? nowIso,
    firstCapturedAt: prev?.firstCapturedAt ?? null, catchCount: prev?.catchCount ?? 0,
    shinyOwned: prev?.shinyOwned ?? false } }
}

export function recordCatch(dex: DexData, args: { speciesId: number; shiny: boolean }, nowIso: string): DexData {
  const key = String(args.speciesId)
  const prev = dex[key] ?? emptyEntry()
  return { ...dex, [key]: { seen: true,
    firstEncounteredAt: prev.firstEncounteredAt ?? nowIso,   // catch implies seen
    firstCapturedAt: prev.firstCapturedAt ?? nowIso,
    catchCount: prev.catchCount + 1,
    shinyOwned: prev.shinyOwned || args.shiny } }
}
```

**Debounced flush (D-19):** hold the canonical dex in `store/dexStore.ts`; each mutation `set`s state and schedules `setTimeout(flush, DEX_SAVE_DEBOUNCE_MS)` (clear-and-reset on each call; interval is Claude's discretion — ~800 ms fits between the game's existing ~720–1800 ms beats; put it in `data/` config per DATA-03). `flush()` calls `persistSave`; on `'quota'` set a `quotaSoftFail`-style flag (Phase 2 precedent in the ui store) and leave the timer armed for the next mutation (D-21 retry-on-next-write). Also flush eagerly on `document.visibilitychange → hidden` / `pagehide` so a kid closing the tab right after a catch doesn't lose it — `beforeunload` is unreliable on mobile Safari [ASSUMED: standard web guidance].

### Pattern 5: Dex UI — silhouette, grid, sticky header, sheet

**Silhouette on the real sprite URL (D-02/D-06/D-07):** CSS filter over the cached sprite `<img>` keeps the alpha shape and hides all color: `filter: brightness(0)` (optionally `+ opacity(0.85)` to soften toward the theme). Add a `silhouette?: boolean` prop to `PokemonSprite` (it already handles shiny URL + broken-sprite fallback box `bg-text/20`). Two spoiler traps: the `alt` must not leak the name for unrevealed tiles (use `Pokémon #025`-style labels), and the broken-sprite fallback box is already effectively a silhouette so behavior degrades safely offline-with-broken-CDN. Grid tiles should pass `loading="lazy"` (add optional prop) — 151 hotlinked images.

**Grid (D-10):** plain CSS grid inside the existing scroll context. The app scrolls the document body (AppShell is `min-h-dvh` flex column; `main` has bottom padding for the fixed BottomNav) — so `position: sticky; top: 0` on the header works against viewport scroll with **no new scroll container**. Tailwind: `grid grid-cols-4 gap-2` (~480 px max shell width → 4–5 cols); each tile is a `<button>` with `touch-target` (existing utility class) + `#NNN` number label (`String(id).padStart(3, '0')`).

**Sticky header (D-11/D-12):** `sticky top-0 z-10 bg-dominant` + `pt-[env(safe-area-inset-top)]`. Counts derive from the dex map in one pass: `seen = entries.filter(e => e.seen).length`, `caught = entries.filter(e => e.firstCapturedAt !== null).length` — expose as a pure selector in `game/dex.ts` for unit tests. Copy/format is Claude's discretion.

**Detail sheet (D-13, D-08, D-09):** modal overlay, not a route — `EncounterOverlay` is the in-repo reference: `role="dialog" aria-modal="true"`, `tabIndex={-1}`, focus-on-open + restore-previous-focus-on-close refs, scrim div, `aria-labelledby`. Reuse that exact recipe in a `DexDetailSheet` (plus Escape-to-close and scrim-tap-to-close, which the encounter overlay deliberately lacks but a browse UI wants). Caught view: sprite (with shiny toggle when `shinyOwned` — a `PixelButton`-style toggle; defaulting to shiny is discretion), name, flavor text (or kid-friendly placeholder when `null`), `catchCount`, relative dates. Uncaught view: "???" stub (D-08) — no name/sprite/flavor.

**Relative dates (D-20):** pure `formatRelativeDay(iso: string, now: Date): string` comparing **local calendar days** (not 24 h windows): same day → "Today", 1 → "Yesterday", 2–6 → "N days ago", ≥7 (discretion cutoff) → `toLocaleDateString(undefined, { month: 'short', day: 'numeric' })`. Guard invalid dates (`Number.isNaN(Date.parse(iso))`) → fallback copy. Fully unit-testable with fixed `now`.

### Anti-Patterns to Avoid

- **Marking seen inside `encounterStore.open()`:** the store is documented ephemeral; long-lived state belongs to the save-owned dexStore. Bind in the flow hook.
- **Storing raw `flavor_text_entries` in the cache:** 102 entries/species explodes localStorage; select + sanitize at fetch time, store one string.
- **Synchronous `persistSave` per event:** violates D-19; also `JSON.stringify` of the whole envelope per grass step is wasteful.
- **A second localStorage key for dex:** D-18 explicitly forbids it — dex lives inside `pokemon-safari:save:v1`.
- **`localStorage.clear()` anywhere, including tests:** repo-wide invariant (D-21, DATA-04); tests remove specific keys only (`clearPokeCacheKey` precedent). Also avoid the literal `localStorage.clear(` substring even in comments — Phase 4 learned acceptance greps hit comments.
- **Deriving "seen" only from `firstEncounteredAt`:** keep the explicit `seen` boolean (mandated field); derivation invites drift when Phase 7 migrates.
- **`/dex/:id` route for detail:** D-13 locks modal/sheet overlay.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Quota-safe versioned localStorage envelope | New persistence abstraction | Copy `adaptiveStore.ts` shape (parse → version check → sanitize → null; `isQuotaError`) | Battle-tested in-repo twice (cache.ts, adaptiveStore.ts); reviewers can diff-verify |
| Modal focus management | Custom focus-trap lib or hand-rolled trap | `EncounterOverlay`'s ref-based focus/restore recipe | Already passes the project's a11y tests; consistent behavior |
| Sprite rendering (pixelated, shiny, broken) | New dex-tile image component | Extend `PokemonSprite` with `silhouette` + `loading` props | Single sprite primitive keeps D-07–D-09 handling in one place |
| Flavor-text language/version tables | Version-group heuristics or the `version_group` URL graph | Literal priority list `['emerald','ruby','sapphire','firered']` + `language.name === 'en'` | Version names verified against live API; anything fancier is YAGNI for Gen 1 |
| Concurrency for the doubled prefetch | New pool/queue | Existing `mapPool` with one worker doing both fetches per id | Preserves progress + resume semantics for free |

**Key insight:** this codebase already contains a vetted instance of every infrastructure pattern Phase 6 needs; the phase's risk is in *wiring and version-bump mechanics*, not in novel engineering.

## Common Pitfalls

### Pitfall 1: Version bump misses the hardcoded `version: 1` literals
**What goes wrong:** `keys.ts` gets `CACHE_VERSION = 2` but `ensureCache` writes envelopes with literal `version: 1` (two construction sites in `cache.ts`), so every boot sees a mismatch and re-prefetches 302 requests — an infinite cold-boot loop.
**Why it happens:** the literals type-check today because `CacheEnvelopeV1.version` is the literal type `1`.
**How to avoid:** change the envelope type's `version` to `2` (or `typeof CACHE_VERSION`) first — the compiler then flags both construction sites and `isValidEnvelope`.
**Warning signs:** Boot progress bar on every reload; PokéAPI traffic during a supposedly warm boot.

### Pitfall 2: Test helpers silently keep seeding v1
**What goes wrong:** `TEST_CACHE_KEY` in `pokeapi-test-helpers.ts` is an intentional literal `'pokemon-safari:poke-cache:v1'` (Phase 2 decision), and `makePokemonDto` lacks `flavorText`. App smoke tests that "seed warm poke-cache so Home path remains stable" (Phase 2 decision) start exercising the cold path, failing confusingly far from the cause.
**How to avoid:** update helper literal + DTO factory in the same commit as the key bump; run the full suite immediately after.
**Warning signs:** previously-green App/Boot/GameScreen tests failing with cache-gate copy assertions.

### Pitfall 3: Species fetch breaks progress/resume semantics
**What goes wrong:** fetching species as a second independent 151-item pass makes `onProgress(done, total)` exceed `GEN1_COUNT` or double-count, and the D-05 resume filter (`!memory.has(id)`) can't tell "pokemon fetched but species missing."
**How to avoid:** one worker per id does `fetchPokemon` then `fetchSpecies`, merges into a single DTO, and only then commits to `memory` — progress and resume stay id-granular unchanged.
**Warning signs:** Boot bar hitting 100% early or jumping; resume refetching already-complete ids.

### Pitfall 4: Debounce + jsdom timers flake
**What goes wrong:** dex flush tests using real timers race; or fake timers leak into unrelated tests and stall the encounter feedback holds.
**How to avoid:** follow the repo's established fake-timer usage (`useEncounterFlow.test.ts`, `EncounterOverlay.test.tsx` use `vi.useFakeTimers`): enable per-test, `vi.advanceTimersByTime(DEBOUNCE_MS)`, restore real timers in `afterEach`. Read the debounce interval from config so tests advance an exact known value.
**Warning signs:** intermittent "expected localStorage write" failures; unrelated encounter tests timing out after dex tests run.

### Pitfall 5: Dex writes wipe or race the poke-cache / edu-stats keys
**What goes wrong:** a save service that clears storage on corruption (or tests that `localStorage.clear()`) destroys the 100 KB poke-cache and the kid's math history — the exact D-21/DATA-04 disaster.
**How to avoid:** save service touches only `SAVE_KEY`; corrupt envelope → return `{}` and let the next flush overwrite; tests use `localStorage.removeItem(SAVE_KEY)` helpers only.
**Warning signs:** Boot re-prefetching after dex tests; acceptance grep for `localStorage.clear(` failing.

### Pitfall 6: `shinyOwned` is unreachable (no shiny roll exists)
**What goes wrong:** the dex faithfully persists `shinyOwned: false` forever because nothing in the game ever decides an encounter is shiny — `CaughtCard` has a `shiny` prop that `EncounterOverlay` never passes, and `EncounterSession` has no shiny field. DEX-02 and D-09 silently become dead UI.
**How to avoid:** plan an explicit task: add `shiny: boolean` to `EncounterSession`, roll once at session open in the drain effect using the injected `Rng` (never `Math.random` — repo-banned) with a config-driven `shinyRate` in `data/` (DATA-03), thread it to `AppearFlash`/`TimingBar`/`CaughtCard` sprite rendering and to `recordCatch`.
**Warning signs:** sparkle badge and shiny toggle never appearing in playtests.

### Pitfall 7: Silhouette leaks the answer
**What goes wrong:** silhouette tile still exposes the species via `alt`/`aria-label` text, the detail sheet heading, or the shiny sprite URL (species id is in the URL — fine, but names are not). A curious kid (or screen reader) reads the name of an "unknown" Pokémon.
**How to avoid:** tile-state selector returns display fields (label, spriteMode) so unrevealed tiles get `Pokémon #NNN` labels and the stub sheet gets "???" copy; test the a11y tree, not just pixels.
**Warning signs:** Testing Library queries finding species names on unrevealed tiles.

### Pitfall 8: ISO timestamps compared as UTC days
**What goes wrong:** "Today/Yesterday" computed from `Date.parse` diffs ÷ 86 400 000 flips at UTC midnight, not the kid's local midnight — "Today" becomes "Yesterday" at 7 pm EST.
**How to avoid:** compare local calendar days (year/month/date triples) in `formatRelativeDay`; unit-test with `now` fixed at edges (23:59 local, day boundaries, DST shift).
**Warning signs:** relative-date tests passing only in UTC CI but failing locally (or vice versa).

## Code Examples

### Species fetch merged into the existing prefetch worker

```typescript
// services/pokeapi/client.ts — extend, preserving DTO guards (T-02-02/T-02-04 style)
const POKEAPI_SPECIES_BASE = 'https://pokeapi.co/api/v2/pokemon-species'

export async function fetchSpeciesFlavor(id: number): Promise<string | null> {
  assertGen1Id(id)
  const res = await fetch(`${POKEAPI_SPECIES_BASE}/${id}`)
  if (!res.ok) throw new Error(`PokéAPI species failed for id ${id}: ${res.status}`)
  const json = (await res.json()) as { flavor_text_entries?: unknown }
  return selectFlavorText(Array.isArray(json.flavor_text_entries) ? json.flavor_text_entries : [])
}

// cache.ts ensureCache worker (replaces the fetchPokemon-only worker):
async (id) => {
  const dto = await fetchPokemon(id)
  const flavorText = await fetchSpeciesFlavor(id)
  const full = { ...dto, flavorText }
  memory.set(full.id, full)
  return full
}
```

### Debounced flush in dexStore (config-driven interval, quota-soft-fail)

```typescript
// store/dexStore.ts — timer ref module-scoped like feedbackTimerRef in useEncounterFlow.ts
let flushTimer: ReturnType<typeof setTimeout> | null = null

function scheduleFlush() {
  if (flushTimer !== null) clearTimeout(flushTimer)
  flushTimer = setTimeout(() => {
    flushTimer = null
    const { dex } = useDexStore.getState()
    const result = persistSave(dex)           // services/save.ts, touches SAVE_KEY only
    useDexStore.setState({ saveSoftFail: result === 'quota' })  // D-21: memory keeps playing
  }, dexSaveDebounceMs)                        // data/ config (DATA-03)
}
```

### Dex tile state selector (pure — encodes D-06/D-07/D-09 in one testable place)

```typescript
// game/dex.ts
export type DexTileState =
  | { kind: 'unknown'; label: string }                              // never-seen OR seen-not-caught (D-07)
  | { kind: 'caught'; label: string; shinyOwned: boolean }          // silhouette lifted (D-06)

export function dexTileState(entry: DexEntry | undefined, speciesId: number, name: string): DexTileState {
  const num = `#${String(speciesId).padStart(3, '0')}`
  if (entry?.firstCapturedAt) return { kind: 'caught', label: `${num} ${name}`, shinyOwned: entry.shinyOwned }
  return { kind: 'unknown', label: `${num} Pokémon` }               // no name leak (Pitfall 7)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SaveEnvelope as empty `Record<string, never>` stub | `data.dex` slice, additive growth for Phase 7 | This phase (D-18) | Save key `pokemon-safari:save:v1` is written for the first time |
| `CACHE_VERSION = 1`, DTO without lore | `CACHE_VERSION = 2`, `flavorText` on DTO | This phase (D-14) | One-time 302-request re-prefetch on first boot after deploy |
| Encounter flow mutates nothing long-lived (except edu-stats) | Flow hook also drives dexStore (seen/caught) | This phase | `useEncounterFlow.test.ts` harness gains dex assertions |
| `CaughtCard shiny` prop dead (never passed) | Session-level shiny roll threads shiny through overlay + dex | This phase (gap fix) | `shinyOwned` becomes reachable (DEX-02) |

**Deprecated/outdated:** nothing removed; `DexScreen` placeholder (`EmptyState`) is replaced.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | All 151 Gen 1 species have an Emerald English `flavor_text_entries` entry (verified for 7 species; Emerald exposes the National Dex) | Pattern 1 | Low — D-16 fallback chain covers any gap by design |
| A2 | Recommended shiny rate ~1/64–1/100 (config-driven) is appropriate for a 7-year-old (classic 1/8192 is hopeless) | Open Questions | Tuning-only; value lives in `data/` config so retune is trivial |
| A3 | `visibilitychange`/`pagehide` eager flush is needed because `beforeunload` is unreliable on mobile Safari | Pattern 3 | Worst case: last few seconds of dex progress lost on abrupt close |
| A4 | Orphaned `pokemon-safari:poke-cache:v1` entry (~100 KB) can be left in place or removed with a targeted `removeItem` of the literal old key | Pattern 2 | Minor quota headroom loss if kept |
| A5 | 151 lazy-loaded `<img>` tiles need no virtualization at 480 px shell width | Standard Stack alternatives | If mobile profiling disagrees, add lazy-render by scroll — no API change |

## Open Questions

1. **Where exactly does shiny get decided, and at what rate?**
   - What we know: nothing rolls shiny today (verified: `EncounterOverlay` renders `<CaughtCard pokemon={pokemon} onContinue={…} />` with no `shiny`; `EncounterSession` has no shiny field). CONTEXT lists "how Gotcha … sets shiny" as Claude's discretion, presupposing a shiny source. `Math.random` is repo-banned; the flow already injects `Rng`.
   - What's unclear: whether the shiny appearance during the encounter itself (AppearFlash/TimingBar showing the shiny sprite) is in Phase 6 scope or only the dex-side record.
   - Recommendation: roll once at session open in the drain effect (`shiny: rng.next() < shinyRate`), add `shinyRate` to `data/rates.ts` (~1/75 [ASSUMED], kid-tunable), store on the session, render shiny sprite throughout the encounter (free — `PokemonSprite` already takes `shiny`), pass to `recordCatch`. This is the smallest coherent slice that makes DEX-02/D-09 real.
2. **Flee/leave-before-catch and the "seen" mark**
   - What we know: D-06 marks seen on appear; the drain-effect binding fires before the kid answers anything, so fled encounters still count as seen — which matches the CONTEXT "kids still get progress from encounters that flee" note.
   - What's unclear: nothing material; noted so the planner doesn't re-litigate.
   - Recommendation: bind at `open()` as specified; no special flee handling.
3. **Old `v1` cache key cleanup**
   - What we know: bumping `CACHE_VERSION` changes the key, orphaning `…:v1` (~100 KB).
   - Recommendation: one targeted `localStorage.removeItem('pokemon-safari:poke-cache:v1')` during boot migration (literal key, never a loop/clear). Low priority; skippable.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PokéAPI `pokemon-species/{id}` | Flavor-text prefetch (Boot only) | ✓ (verified live 2026-07-26) | v2 | Boot retry UI already exists (BOOT-04); `flavorText: null` → UI placeholder (D-16) |
| Node / npm / Vitest toolchain | Build + tests | ✓ (project already builds/tests) | per package.json | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.10, jsdom ^29.1.1, Testing Library (react 16.3.2 / jest-dom 7.0.0 / user-event 14.6.1) |
| Config file | `pokemon-safari-app/vite.config.ts` (`test: { environment: 'jsdom', setupFiles: './src/test/setup.ts' }`) |
| Quick run command | `cd pokemon-safari-app && npx vitest run <file>` |
| Full suite command | `cd pokemon-safari-app && npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEX-01 | Silhouette vs caught tile states (D-06/D-07), sparkle badge, no name leak | unit + component | `npx vitest run src/game/dex.test.ts src/components/dex/DexTile.test.tsx` | ❌ Wave 0 |
| DEX-02 | `markSeen`/`recordCatch` reducers; save round-trip; sanitize corrupt envelope; quota soft-fail; debounce flush | unit | `npx vitest run src/game/dex.test.ts src/services/save.test.ts src/store/dexStore.test.ts` | ❌ Wave 0 |
| DEX-02 | Encounter open → seen; Gotcha → catchCount/firstCapturedAt/shinyOwned | unit (hook harness) | `npx vitest run src/hooks/useEncounterFlow.test.ts` (extend existing) | ✅ (extend) |
| DEX-03 | Grid renders 151 tiles, sticky header counts, detail sheet open/close/stub | component | `npx vitest run src/screens/DexScreen.test.tsx` | ❌ Wave 0 |
| D-15/D-16/D-17 | `selectFlavorText` priority + fallback + sanitizer | unit | `npx vitest run src/services/pokeapi/client.test.ts` (extend or new flavor.test.ts) | ❌ Wave 0 |
| D-14 | v2 envelope validation; version-mismatch → re-prefetch; helper v2 seed | unit | `npx vitest run src/services/pokeapi/cache.test.ts` (extend existing) | ✅ (extend) |
| D-20 | `formatRelativeDay` local-calendar boundaries | unit | `npx vitest run src/utils/relativeDay.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** targeted `npx vitest run <touched test files>`
- **Per wave merge:** `npm test` (full suite — cache-helper bump makes cross-file breakage likely; see Pitfall 2)
- **Phase gate:** full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/game/dex.test.ts` — covers DEX-01 (tile-state selector) + DEX-02 (reducers)
- [ ] `src/services/save.test.ts` — envelope round-trip, sanitize, quota (DEX-02, D-21); seed/clear helpers touching `SAVE_KEY` only (mirror `pokeapi-test-helpers.ts`)
- [ ] `src/store/dexStore.test.ts` — debounce flush with `vi.useFakeTimers` (D-19)
- [ ] Flavor selection/sanitize tests (D-15–D-17) with fixture entries incl. `\n`/`\f`
- [ ] `src/utils/relativeDay.test.ts` — fixed-`now` boundary cases (D-20)
- [ ] `src/screens/DexScreen.test.tsx` — grid/header/sheet (DEX-03)
- Framework install: none needed

**Existing patterns to reuse:** seeded `Rng` injection (`utils/rng.ts`, `useEncounterFlow` options), `createElement` JSX-free hook harnesses (`useEncounterFlow.test.ts`), fake timers (`EncounterOverlay.test.tsx`), key-scoped storage helpers (`pokeapi-test-helpers.ts`), config-surface assertions (`data/config-surface.test.ts` — add shinyRate/debounce there).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (no auth; static GH Pages) |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | Sanitize everything read from localStorage (save envelope per-entry validation, mirror `sanitizeFacts`) and from PokéAPI (flavor text is untrusted string → React text nodes only, never `dangerouslySetInnerHTML`; strip control chars per D-17) |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious/corrupt localStorage payload (kid or extension edits) | Tampering | `parseEnvelope` + per-entry sanitize → `{}` fallback; never trust `catchCount`/timestamps without finite/type checks (existing `fromStoredDto` precedent) |
| Sprite URL injection via tampered cache | Tampering | Existing `sanitizeSpriteUrl` https-only guard re-applied on hydrate (keep for v2 DTO) |
| Flavor text as XSS vector | Tampering | Render via JSX text interpolation only; sanitizer strips control chars; no HTML rendering path |
| Storage quota exhaustion | DoS | D-21: quota-safe writes return `'quota'`, memory play continues, gentle note (QuotaNote pattern); never clear other keys |
| Acceptance-grep evasion via comments | — | Repo convention: avoid literal `Math.random` / `localStorage.clear(` substrings even in comments (Phase 4 lesson) |

## Project Constraints (from .cursor/rules/)

From `.cursor/rules/gsd.md` (verified):

- **Locked stack:** React, TypeScript (strict), Vite, Tailwind v4, Zustand, React Router, localStorage, PokéAPI — no additions without cause; this phase adds none.
- **No Pokémon data hardcoded in UI components**; testable game logic in `game/`; config (rates, thresholds, timings) in `src/data/*.ts` — shinyRate and debounce interval must live in `data/`.
- **Per-encounter PokéAPI fetches banned** — flavor text must come from the prefetch cache (D-14 complies).
- **Kid-friendly UX**: forgiving framing, large touch targets (`touch-target` class), icon-first.
- **GH Pages hosting**: no server; `base: '/pokemon-safari/'`; deploy copies `dist` → `pokemon-safari/`.
- **GSD workflow enforcement**: file changes go through GSD commands (`/gsd-execute-phase` for this work).
- Established repo invariants (STATE.md decisions): never `Math.random` (injected `Rng` only), never `localStorage.clear()`, namespaced keys only, Vitest example-test hosts use `https://example.test` URLs.

## Sources

### Primary (HIGH confidence)
- Live PokéAPI `GET /api/v2/pokemon-species/{1,25,94,130,144,150,151}` (2026-07-26) — `flavor_text_entries` shape, version-name keys, English coverage, control characters, sanitizer output verified by execution
- Codebase reads (2026-07-26): `keys.ts`, `cache.ts`, `client.ts`, `adaptiveStore.ts`, `useEncounterFlow.ts`, `encounterStore.ts`, `EncounterOverlay.tsx`, `CaughtCard.tsx`, `PokemonSprite.tsx`, `DexScreen.tsx`, `AppShell.tsx`, `QuotaNote.tsx`, `EmptyState.tsx`, `types/{pokemon,save,encounter}.ts`, `data/rates.ts`, `vite.config.ts`, `package.json`, `src/test/pokeapi-test-helpers.ts`
- `.planning/phases/06-pok-dex/06-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.cursor/rules/gsd.md`

### Secondary (MEDIUM confidence)
- https://pokeapi.co/docs/v2#pokemon-species — endpoint documentation (cross-checked against live responses)

### Tertiary (LOW confidence)
- Kid-appropriate shiny rate heuristic; mobile-Safari `beforeunload` unreliability — tagged [ASSUMED] in Assumptions Log

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages; everything verified installed
- Architecture: HIGH — every pattern has a verified in-repo analog; binding seams read directly from source
- Flavor-text API: HIGH — verified by live execution, including sanitizer output
- Pitfalls: HIGH for code-derived ones (1–7); MEDIUM for timezone edge (8, reasoning-based)

**Research date:** 2026-07-26
**Valid until:** 2026-08-26 (stable domain; PokéAPI v2 shape is long-frozen)
