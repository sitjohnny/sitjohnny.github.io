# Safari Identity, Encounter Juice & Forest Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship poke-cache v3 (artwork, genus, size, habitat), richer dex browse/detail, type-accented encounter cards with timing bonus clarity, and habitat-biased Forest grass pockets — without inventory, biomes, audio, or new education categories.

**Architecture:** Expand the slim PokéAPI DTO and cache once; pure `src/data` + `src/game` modules own type colors, size formatting, pocket noise, and weighted species picks; React components consume those via existing encounter/dex seams. Forest depth injects a `habitatOf` lookup into `resolveCandidate` so game logic stays free of cache imports.

**Tech Stack:** Vite, React 19, TypeScript, Zustand, Vitest, PokéAPI, Tailwind (existing pixel/GBA classes).

**Spec:** `docs/specs/2026-07-26-safari-identity-encounter-forest-depth-design.md`

## Global Constraints

- Multiplication remains the only education category
- No inventory, daily rewards, Lake/Mountain biomes, or audio
- Do not change `grassOutcomeWeights` common/rare/legendary mix
- Config knobs only in `src/data/`; pure resolvers in `src/game/`; no type leaks on uncaught dex stubs
- Prefer official artwork in encounter + caught dex detail; pixel sprites in the 151 grid
- Shiny display uses `front_shiny` only (never invent shiny official art)
- Never show full catch-chance % to the player
- Pocket bias must keep every rarity pool non-empty (non-zero miss weights + equal-weight fallback)
- Work from `pokemon-safari-app/`; run tests with `npm test` (or targeted vitest paths below)
- Commit after each task

## File map

| File                                                | Responsibility                                                 |
| --------------------------------------------------- | -------------------------------------------------------------- |
| `src/types/pokemon.ts`                              | v3 `PokemonDto` fields                                         |
| `src/services/pokeapi/keys.ts`                      | `CACHE_VERSION = 3`                                            |
| `src/services/pokeapi/client.ts`                    | Map artwork/height/weight; species meta (flavor+genus+habitat) |
| `src/services/pokeapi/cache.ts`                     | Persist/validate v3 DTOs; wire species meta in `ensureCache`   |
| `src/data/typeColors.ts`                            | Classic Gen type palette + accent helper                       |
| `src/data/pocketConfig.ts`                          | Pocket ids, noise scale/thresholds, habitat→weight rules       |
| `src/game/formatPokemon.ts`                         | `formatHeightM` / `formatWeightKg`                             |
| `src/game/dexFilters.ts`                            | Pure filter of species ids by status + type                    |
| `src/game/world/pocket.ts`                          | `pocketAt(seed, x, y)`                                         |
| `src/game/encounter.ts`                             | Weighted pick + `resolveCandidate` pocket bias                 |
| `src/components/TypeBadge.tsx`                      | Shared type chip                                               |
| `src/components/PokemonSprite.tsx`                  | `variant: 'pixel' \| 'artwork'`                                |
| `src/components/dex/*`, `src/screens/DexScreen.tsx` | Detail enrichment + filters                                    |
| `src/components/encounter/*`                        | Artwork, badges, accents, timing bonus line                    |
| `src/hooks/useEncounterFlow.ts`                     | Pass `habitatOf` into `resolveCandidate`                       |

---

### Task 1: PokemonDto v3 + PokéAPI mapping

**Files:**

- Modify: `pokemon-safari-app/src/types/pokemon.ts`
- Modify: `pokemon-safari-app/src/services/pokeapi/client.ts`
- Modify: `pokemon-safari-app/src/services/pokeapi/client.test.ts`
- Create: `pokemon-safari-app/src/services/pokeapi/speciesMeta.test.ts` (or extend `flavorText.test.ts`)

**Interfaces:**

- Produces:
  - `PokemonDto` with `sprites.official_artwork: string | null`, `genus: string | null`, `height: number`, `weight: number`, `habitat: string | null`
  - `toPokemonDto(raw)` sets height/weight/artwork; `flavorText`/`genus`/`habitat` still null until species merge
  - `selectGenus(genera: { genus?: unknown; language?: { name?: string } | null }[]): string | null`
  - `selectHabitat(habitat: { name?: string } | null | undefined): string | null`
  - `fetchSpeciesMeta(id): Promise<{ flavorText: string | null; genus: string | null; habitat: string | null }>`
  - Keep `fetchSpeciesFlavor` as a thin wrapper calling `fetchSpeciesMeta` then returning `.flavorText` **or** replace call sites and delete it in Task 2 — prefer replace in Task 2; in Task 1 add `fetchSpeciesMeta` + keep `fetchSpeciesFlavor` delegating

- [ ] **Step 1: Write failing `toPokemonDto` expectations**

In `client.test.ts`, extend the Charizard fixture and expected DTO:

```ts
sprites: {
  front_default: 'https://example.test/6.png',
  front_shiny: 'https://example.test/s6.png',
  other: {
    'official-artwork': { front_default: 'https://example.test/art6.png' },
  },
},
height: 17,
weight: 905,
// …
expect(dto).toEqual({
  id: 6,
  name: 'charizard',
  types: ['fire', 'flying'],
  sprites: {
    front_default: 'https://example.test/6.png',
    front_shiny: 'https://example.test/s6.png',
    official_artwork: 'https://example.test/art6.png',
  },
  flavorText: null,
  genus: null,
  height: 17,
  weight: 905,
  habitat: null,
})
```

Add a case: missing `other` / non-https artwork → `official_artwork: null`. Invalid/missing height/weight → throw (same strictness as id/name).

- [ ] **Step 2: Write failing genus/habitat selector tests**

```ts
import { selectGenus, selectHabitat } from "@/services/pokeapi/client";

it("selectGenus prefers English", () => {
  expect(
    selectGenus([
      { genus: "Pokémon Plante", language: { name: "fr" } },
      { genus: "Seed Pokémon", language: { name: "en" } },
    ]),
  ).toBe("Seed Pokémon");
});

it("selectGenus returns null when no English", () => {
  expect(selectGenus([{ genus: "X", language: { name: "fr" } }])).toBeNull();
});

it("selectHabitat reads name or null", () => {
  expect(selectHabitat({ name: "forest" })).toBe("forest");
  expect(selectHabitat(null)).toBeNull();
  expect(selectHabitat(undefined)).toBeNull();
});
```

- [ ] **Step 3: Run tests — expect FAIL**

Run: `cd pokemon-safari-app && npx vitest run src/services/pokeapi/client.test.ts src/services/pokeapi/flavorText.test.ts`

Expected: FAIL (missing fields / exports)

- [ ] **Step 4: Implement types + mapping**

`PokemonDto`:

```ts
export type PokemonDto = {
  id: number;
  name: string;
  types: string[];
  sprites: {
    front_default: string | null;
    front_shiny: string | null;
    official_artwork: string | null;
  };
  flavorText: string | null;
  genus: string | null;
  height: number;
  weight: number;
  habitat: string | null;
};
```

Extend `PokeApiPokemon` with `height`, `weight`, and nested `sprites.other`. In `toPokemonDto`, assert finite non-negative integers for height/weight (PokéAPI uses ints), sanitize artwork URL via `sanitizeSpriteUrl`.

Implement `selectGenus` / `selectHabitat`. Implement `fetchSpeciesMeta` using existing species fetch + `selectFlavorText` + new selectors. Make `fetchSpeciesFlavor` return `(await fetchSpeciesMeta(id)).flavorText`.

- [ ] **Step 5: Run tests — expect PASS**

Run: `cd pokemon-safari-app && npx vitest run src/services/pokeapi/client.test.ts src/services/pokeapi/flavorText.test.ts`

- [ ] **Step 6: Commit**

```bash
cd pokemon-safari-app && git add src/types/pokemon.ts src/services/pokeapi/client.ts src/services/pokeapi/client.test.ts src/services/pokeapi/flavorText.test.ts
git commit -m "$(cat <<'EOF'
feat(safari): map PokéAPI artwork, size, genus, and habitat

EOF
)"
```

(If repo root is the git root, `git add` paths from repo root: `pokemon-safari-app/src/...`.)

---

### Task 2: Cache v3 bump + ensureCache species meta

**Files:**

- Modify: `pokemon-safari-app/src/services/pokeapi/keys.ts`
- Modify: `pokemon-safari-app/src/services/pokeapi/keys.test.ts`
- Modify: `pokemon-safari-app/src/services/pokeapi/cache.ts`
- Modify: `pokemon-safari-app/src/services/pokeapi/cache.test.ts`

**Interfaces:**

- Consumes: `fetchSpeciesMeta`, v3 `PokemonDto`
- Produces: `CACHE_VERSION === 3`; `fromStoredDto` requires new fields; `ensureCache` merges species meta into each DTO

- [ ] **Step 1: Write failing version + storage tests**

Update `keys.test.ts` to expect `CACHE_VERSION` `3` and key `pokemon-safari:poke-cache:v3`.

In `cache.test.ts`, add: a v2 envelope in localStorage → `hasValidCache()` false after hydrate; after `ensureCache`, stored pokemon entries include `official_artwork`, `genus`, `height`, `weight`, `habitat`.

Stub fetch to return pokemon JSON with height/weight/artwork and species JSON with genera + habitat (reuse/extend `stubPokeApiFetch` if needed).

- [ ] **Step 2: Run — expect FAIL**

Run: `cd pokemon-safari-app && npx vitest run src/services/pokeapi/keys.test.ts src/services/pokeapi/cache.test.ts`

- [ ] **Step 3: Implement**

Set `CACHE_VERSION = 3`. Update `fromStoredDto` to validate:

- `official_artwork` via `sanitizeSpriteUrl` (null allowed)
- `genus`: `string | null`
- `height` / `weight`: finite numbers (integers preferred; accept number)
- `habitat`: `string | null`

In `ensureCache` worker, replace `fetchSpeciesFlavor` with:

```ts
const meta = await fetchSpeciesMeta(id);
const full = { ...dto, ...meta };
```

(`dto` already has height/weight/artwork from `toPokemonDto`.)

- [ ] **Step 4: Run — expect PASS**

Run: `cd pokemon-safari-app && npx vitest run src/services/pokeapi/keys.test.ts src/services/pokeapi/cache.test.ts`

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/services/pokeapi/keys.ts pokemon-safari-app/src/services/pokeapi/keys.test.ts pokemon-safari-app/src/services/pokeapi/cache.ts pokemon-safari-app/src/services/pokeapi/cache.test.ts
git commit -m "$(cat <<'EOF'
feat(safari): bump poke-cache to v3 with species meta

EOF
)"
```

---

### Task 3: Type colors + TypeBadge + size formatters

**Files:**

- Create: `pokemon-safari-app/src/data/typeColors.ts`
- Create: `pokemon-safari-app/src/components/TypeBadge.tsx`
- Create: `pokemon-safari-app/src/components/TypeBadge.test.tsx`
- Create: `pokemon-safari-app/src/game/formatPokemon.ts`
- Create: `pokemon-safari-app/src/game/formatPokemon.test.ts`
- Modify: `pokemon-safari-app/src/data/config-surface.test.ts` (import `typeColors` so DATA-03 surface stays honest)

**Interfaces:**

- Produces:
  - `typeColors: Record<string, string>` (CSS color values for Gen 1 types)
  - `primaryTypeColor(types: string[]): string` → `typeColors[types[0]]` or a muted fallback `#787878`
  - `TypeBadge({ type: string })`
  - `formatHeightM(heightDm: number): string` → e.g. `"1.7 m"`
  - `formatWeightKg(weightHg: number): string` → e.g. `"90.5 kg"`

- [ ] **Step 1: Failing formatter tests**

```ts
expect(formatHeightM(17)).toBe("1.7 m");
expect(formatWeightKg(905)).toBe("90.5 kg");
expect(formatHeightM(7)).toBe("0.7 m");
```

- [ ] **Step 2: Failing TypeBadge test**

Render `<TypeBadge type="fire" />`, expect text `/fire/i` and inline style or class reflecting `typeColors.fire`.

- [ ] **Step 3: Run — FAIL**

Run: `cd pokemon-safari-app && npx vitest run src/game/formatPokemon.test.ts src/components/TypeBadge.test.tsx`

- [ ] **Step 4: Implement**

`typeColors.ts` — include all Gen 1 types: `normal, fire, water, electric, grass, ice, fighting, poison, ground, flying, psychic, bug, rock, ghost, dragon` (Gen 1 has no steel/dark/fairy in species types historically; still add `steel`/`dark`/`fairy` keys if you want forward-safe map — **only Gen 1 names are required**: normal through dragon).

`TypeBadge`: capitalize label for display (`Fire`), `font-[family-name:var(--font-label)]`, compact padding, `style={{ backgroundColor: typeColors[type] ?? '#787878' }}`, readable text (white or dark depending on contrast — use white for simplicity on classic dark type chips).

Formatters: `(n / 10).toFixed(1)` + unit suffix.

- [ ] **Step 5: Run — PASS + commit**

```bash
git add pokemon-safari-app/src/data/typeColors.ts pokemon-safari-app/src/components/TypeBadge.tsx pokemon-safari-app/src/components/TypeBadge.test.tsx pokemon-safari-app/src/game/formatPokemon.ts pokemon-safari-app/src/game/formatPokemon.test.ts pokemon-safari-app/src/data/config-surface.test.ts
git commit -m "$(cat <<'EOF'
feat(safari): add type badges and metric size formatters

EOF
)"
```

---

### Task 4: PokemonSprite artwork variant

**Files:**

- Modify: `pokemon-safari-app/src/components/PokemonSprite.tsx`
- Modify: `pokemon-safari-app/src/components/PokemonSprite.test.tsx`

**Interfaces:**

- Consumes: v3 `sprites.official_artwork`
- Produces: `variant?: 'pixel' | 'artwork'` (default `'pixel'`); `size?: 64 | 96 | 128`

Resolution order:

1. If `shiny` → `front_shiny` ?? `front_default` (ignore artwork)
2. Else if `variant === 'artwork'` → `official_artwork` ?? `front_default`
3. Else → `front_default`

- [ ] **Step 1: Failing tests**

Build a minimal `PokemonDto` fixture with all v3 fields. Assert:

- default variant uses pixel URL
- `variant="artwork"` uses official artwork URL
- `shiny` + `variant="artwork"` still uses shiny pixel URL
- artwork null falls back to pixel
- `size={128}` sets width/height 128

- [ ] **Step 2: Run — FAIL; implement; PASS; commit**

```bash
git commit -m "$(cat <<'EOF'
feat(safari): support official-artwork PokemonSprite variant

EOF
)"
```

---

### Task 5: Dex detail enrichment

**Files:**

- Modify: `pokemon-safari-app/src/components/dex/DexDetailSheet.tsx`
- Modify: `pokemon-safari-app/src/screens/DexScreen.test.tsx` (and/or a focused `DexDetailSheet.test.tsx` if easier)

**Interfaces:**

- Consumes: `TypeBadge`, `formatHeightM`/`formatWeightKg`, `PokemonSprite` artwork variant

- [ ] **Step 1: Failing tests**

For a caught entry with mocked `getPokemon` returning genus/types/height/weight/artwork:

- expect genus text, type badge(s), height/weight strings
- expect artwork `img` src = official artwork when not shiny toggle
- stub/`???` branch: queryByText type names → null; no genus

- [ ] **Step 2: Implement caught branch UI**

Under name/`#nnn`: genus (if non-null), row of `TypeBadge`s, artwork sprite (`variant="artwork"` `size={128}`), then flavor, then height/weight `<dl>` rows, then existing catch meta.

Uncaught branch unchanged (no types/genus/size).

- [ ] **Step 3: PASS + commit**

```bash
git commit -m "$(cat <<'EOF'
feat(safari): enrich caught dex detail with art, types, and size

EOF
)"
```

---

### Task 6: Dex status + type filters

**Files:**

- Create: `pokemon-safari-app/src/game/dexFilters.ts`
- Create: `pokemon-safari-app/src/game/dexFilters.test.ts`
- Create: `pokemon-safari-app/src/data/dexFilterCopy.ts` (empty-state strings — keep copy out of components)
- Modify: `pokemon-safari-app/src/components/dex/DexHeader.tsx`
- Modify: `pokemon-safari-app/src/components/dex/DexGrid.tsx`
- Modify: `pokemon-safari-app/src/screens/DexScreen.tsx`
- Modify: `pokemon-safari-app/src/screens/DexScreen.test.tsx`

**Interfaces:**

- Produces:

```ts
export type DexStatusFilter = "all" | "caught" | "missing" | "shiny";
export type DexFilterState = { status: DexStatusFilter; type: string | null };

export function filterDexSpeciesIds(
  dex: DexData,
  filter: DexFilterState,
  typeOf: (speciesId: number) => string[],
): number[];
```

Rules:

- `caught`: `firstCapturedAt != null`
- `missing`: not caught
- `shiny`: `shinyOwned === true`
- `type`: species types include filter type (AND with status). If `typeOf` throws/missing, treat as `[]` (exclude when type filter set)
- Preserve ascending id order

UI: session state in `DexScreen` (`useState`). Header gains status chips + horizontally scrollable type chips (`All types` clears type). Grid maps `filterDexSpeciesIds(...)` instead of always 1..151. When result empty, render `EmptyState` with copy from `dexFilterCopy` (e.g. shiny → “No shiny catches yet.”).

- [ ] **Step 1: Pure filter unit tests** (caught/missing/shiny/type AND/order)

- [ ] **Step 2: Screen tests** — click Missing → fewer tiles; empty shiny → empty state heading

- [ ] **Step 3: Implement; PASS; commit**

```bash
git commit -m "$(cat <<'EOF'
feat(safari): add dex status and type filters

EOF
)"
```

---

### Task 7: Encounter artwork + type accents

**Files:**

- Create: `pokemon-safari-app/src/components/encounter/TypeAccentDialog.tsx` (optional thin wrapper) **or** inline accent style helper in `src/game/formatPokemon.ts` / `src/data/typeColors.ts`: `primaryTypeAccentStyle(types: string[]): CSSProperties`
- Modify: `AppearFlash.tsx`, `EducationQuestion.tsx`, `TimingBar.tsx`, `CaughtCard.tsx`, `FleeCard.tsx`
- Modify corresponding `*.test.tsx` files

**Interfaces:**

- Consumes: `TypeBadge`, `primaryTypeColor`, `PokemonSprite` artwork variant
- Appear/Caught/Flee: badges under sprite; left border `4px solid ${primaryTypeColor(types)}`
- AppearFlash: when `!prefersReducedMotion()`, overlay wash uses primary color at low alpha instead of pure white **or** keep white flash and add a second tint layer — prefer replace white flash background with `color-mix` / `${color}33` tint; reduced-motion: no wash, badges remain
- All five stages: `variant="artwork"` (shiny still handled by sprite rules)

- [ ] **Step 1: Update AppearFlash + CaughtCard tests** for artwork src + type text + accent (e.g. `style` border or `data-primary-type="fire"`)

- [ ] **Step 2: Implement across encounter cards**

- [ ] **Step 3: Run encounter component tests; commit**

```bash
git commit -m "$(cat <<'EOF'
feat(safari): add encounter artwork and type accents

EOF
)"
```

---

### Task 8: Timing grade bonus line

**Files:**

- Modify: `pokemon-safari-app/src/data/educationConfig.ts` (`captureCopy`)
- Modify: `pokemon-safari-app/src/components/encounter/GradeFlash.tsx`
- Modify: `pokemon-safari-app/src/components/encounter/EncounterOverlay.tsx` (pass modifiers if needed)
- Modify: tests for GradeFlash / EncounterOverlay
- Modify: `pokemon-safari-app/src/data/config-surface.test.ts` if it asserts copy shape

**Interfaces:**

- Math boost line already exists on TimingBar via `captureCopy.mathBoost` — keep it (do not show total catch %)
- Add:

```ts
timingBoost: 'Timing {grade} {signed}%',
// or separate maps:
timingBoostByGrade: { perfect: 'Timing Perfect +25%', … }
```

Prefer deriving from `captureModifiers.timing` in a tiny pure helper so percentages stay single-sourced:

```ts
// src/game/timingBoostCopy.ts
export function timingBoostLabel(grade: TimingGrade): string {
  const delta = captureModifiers.timing[grade];
  const pct = Math.round(delta * 100);
  const signed = pct >= 0 ? `+${pct}` : `${pct}`;
  const title = grade.charAt(0).toUpperCase() + grade.slice(1);
  return `Timing ${title} ${signed}%`;
}
```

`GradeFlash` shows existing grade shout + the boost label beneath.

Wire `EncounterOverlay` so `GradeFlash` receives `grade` (already does).

- [ ] **Step 1: Unit test `timingBoostLabel` for perfect (+25) and miss (-5)**

- [ ] **Step 2: Component test GradeFlash shows both Perfect! and Timing Perfect +25%**

- [ ] **Step 3: Implement; PASS; commit**

```bash
git commit -m "$(cat <<'EOF'
feat(safari): show timing boost on grade flash

EOF
)"
```

---

### Task 9: Forest pocket field

**Files:**

- Create: `pokemon-safari-app/src/data/pocketConfig.ts`
- Create: `pokemon-safari-app/src/game/world/pocket.ts`
- Create: `pokemon-safari-app/src/game/world/pocket.test.ts`
- Modify: `pokemon-safari-app/src/data/config-surface.test.ts` (export smoke)

**Interfaces:**

```ts
// pocketConfig.ts
export type PocketId = "woodland" | "meadow" | "wetland" | "canopy";

export const POCKET_NOISE_SCALE = 14;
/** Thresholds on noise in [0,1) — contiguous bands. */
export const pocketThresholds = {
  wetland: 0.22,
  meadow: 0.45,
  woodland: 0.72,
  // else canopy
} as const;

/** Relative weights when scoring a species for a pocket. */
export const pocketHabitatWeights = {
  match: 5,
  miss: 1,
  meadowNull: 2,
  meadowUrban: 2,
} as const;

export const pocketHabitats: Record<PocketId, readonly string[]> = {
  woodland: ["forest", "grassland"],
  meadow: ["grassland"],
  wetland: ["waters-edge"],
  canopy: ["forest", "rare"],
};
```

```ts
// pocket.ts
export function pocketAt(seed: number, x: number, y: number): PocketId {
  const n = noise2D(seed, x / POCKET_NOISE_SCALE, y / POCKET_NOISE_SCALE);
  if (n < pocketThresholds.wetland) return "wetland";
  if (n < pocketThresholds.meadow) return "meadow";
  if (n < pocketThresholds.woodland) return "woodland";
  return "canopy";
}
```

Use a **different effective seed** than terrain if needed to decorrelate: `noise2D(seed ^ 0x5f3759df, …)` so pockets are not identical to grass blobs — document in comment.

- [ ] **Step 1: Tests** — `pocketAt` deterministic; same inputs → same pocket; scan a small grid and assert ≥2 distinct pocket ids appear for `WORLD_SEED`

- [ ] **Step 2: Implement; PASS; commit**

```bash
git commit -m "$(cat <<'EOF'
feat(safari): add deterministic Forest encounter pockets

EOF
)"
```

---

### Task 10: Habitat-weighted species pick + wire explore flow

**Files:**

- Modify: `pokemon-safari-app/src/game/encounter.ts`
- Modify: `pokemon-safari-app/src/game/encounter.test.ts`
- Modify: `pokemon-safari-app/src/hooks/useEncounterFlow.ts`
- Modify: `pokemon-safari-app/src/hooks/useEncounterFlow.test.ts` if resolve path is covered

**Interfaces:**

```ts
export type HabitatLookup = (speciesId: number) => string | null;

export function speciesWeightForPocket(
  habitat: string | null,
  pocket: PocketId,
): number {
  const preferred = pocketHabitats[pocket];
  if (habitat && preferred.includes(habitat)) return pocketHabitatWeights.match;
  if (pocket === "meadow" && habitat === null)
    return pocketHabitatWeights.meadowNull;
  if (pocket === "meadow" && habitat === "urban")
    return pocketHabitatWeights.meadowUrban;
  return pocketHabitatWeights.miss;
}

export function pickSpeciesWeighted(
  rng: Rng,
  pool: readonly number[],
  pocket: PocketId,
  habitatOf: HabitatLookup,
): number {
  if (pool.length === 0) throw new Error("Empty encounter pool");
  const entries = pool.map((id) => ({
    id: String(id),
    weight: speciesWeightForPocket(habitatOf(id), pocket),
  }));
  // weightedPick requires string ids — map back:
  const picked = weightedPick(rng, entries);
  return Number(picked);
}

export type ResolveCandidateOptions = {
  suppressPokemon?: boolean;
  habitatOf?: HabitatLookup;
  worldSeed?: number;
};
```

In `resolveCandidate`, after rarity is known:

```ts
const tables = /* default biomeEncounterTables */
const pool = tables[event.biome][rarity]
let speciesId: number
if (options.habitatOf) {
  try {
    const pocket = pocketAt(options.worldSeed ?? WORLD_SEED, event.x, event.y)
    speciesId = pickSpeciesWeighted(rng, pool, pocket, options.habitatOf)
  } catch {
    speciesId = pickSpecies(rng, event.biome, rarity)
  }
} else {
  speciesId = pickSpecies(rng, event.biome, rarity)
}
```

`useEncounterFlow`:

```ts
const resolution = resolveCandidate(rng, candidate, {
  suppressPokemon,
  worldSeed: WORLD_SEED,
  habitatOf: (id) => {
    try {
      return getPokemon(id).habitat;
    } catch {
      return null;
    }
  },
});
```

- [ ] **Step 1: Unit tests**

- `speciesWeightForPocket('waters-edge', 'wetland') > speciesWeightForPocket('forest', 'wetland')`
- Fixed rng + tiny fake pool: wetland pocket prefers waters-edge id over forest id across many rolls (frequency assertion)
- Empty-safe: all miss weights still pick something
- `resolveCandidate` without `habitatOf` preserves old equal-weight behavior (existing tests still pass)
- Two candidates same rarity stubs, different `(x,y)` mapped to different pockets, with habitatOf fixture → different weight skew (document expected pockets via `pocketAt` in the test)

- [ ] **Step 2: Implement; run full encounter + flow tests**

Run: `cd pokemon-safari-app && npx vitest run src/game/encounter.test.ts src/hooks/useEncounterFlow.test.ts src/game/world/pocket.test.ts`

- [ ] **Step 3: Full suite smoke**

Run: `cd pokemon-safari-app && npm test`

Fix any DTO fixture breakages in tests that construct partial `PokemonDto` (add v3 fields).

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(safari): bias Forest encounters by grass pocket habitat

EOF
)"
```

---

### Task 11: Manual verification checklist (no code)

- [ ] **Step 1: Dev server**

Run: `cd pokemon-safari-app && npm run dev`

- [ ] **Step 2: Cold cache**

Clear `localStorage` key `pokemon-safari:poke-cache:v2` / ensure Boot runs for v3. Complete Boot.

- [ ] **Step 3: Catch one species**

Confirm appear/education/timing/caught use artwork + type badges; grade flash shows timing ±%.

- [ ] **Step 4: Dex**

Detail shows genus/types/size; filters All/Caught/Missing/Shiny/type work; uncaught `???` leaks nothing.

- [ ] **Step 5: Forest feel**

Walk grass in different regions (~20 encounters); note variety (no HUD required).

- [ ] **Step 6: Final commit only if checklist found follow-up fixes; otherwise done**

---

## Self-review (plan vs spec)

| Spec requirement                             | Task                          |
| -------------------------------------------- | ----------------------------- |
| Cache v3 DTO fields + Boot re-fetch          | 1–2                           |
| Type colors static map + badges              | 3, 5, 7                       |
| Official artwork policy + shiny pixel        | 4, 5, 7                       |
| Dex genus/height/weight                      | 3, 5                          |
| Dex filters status + type AND                | 6                             |
| Encounter artwork + accents + reduced motion | 7                             |
| Math/timing bonus lines, no total %          | 8 (math already on TimingBar) |
| Pockets + habitat reweight + fallback        | 9–10                          |
| No inventory/biomes/audio/new quizzes        | Global constraints            |
| Silhouette / ??? no leaks                    | 5–6 tests                     |

No TBD placeholders. Interfaces use consistent names: `fetchSpeciesMeta`, `pocketAt`, `pickSpeciesWeighted`, `habitatOf`, `DexFilterState`.
