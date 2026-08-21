# Gen 2–5 Roster + Mega/Primal Dex Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Safari to National Dex 1–649 plus Mega/Primal synthetic slots after #649, with the same grass rarity bands and without wiping existing player saves.

**Architecture:** One unified `speciesId` space (`1–649` National, `650+` Mega/Primal catalog). Prefetch the full roster into poke-cache (version bump); dex/save stay on sparse string keys under `SAVE_KEY`. Encounter rare pool = curated National rares + every Mega/Primal id; legendaries stay a curated Gen 1–5 list.

**Tech Stack:** Vite, React 19, TypeScript, Zustand, Vitest, Testing Library, PokéAPI, existing Safari data/config patterns.

**Spec:** `docs/superpowers/specs/2026-08-21-gen2-5-mega-roster-design.md`

## Global Constraints

- National Dex ceiling: **649** (Genesect); Mega/Primal synthetic ids start at **650**
- Grass outcome **weights** in `rates.ts` unchanged
- Megas/Primals always roll in the **rare** band (never common/legendary)
- Prefetch **full** roster at boot (`TOTAL_ROSTER_COUNT`)
- **Never** clear or rewrite `SAVE_KEY` when bumping poke-cache
- PokéAPI Mega form numeric ids are **not** our dex ids — always remap via catalog
- Work from `pokemon-safari-app/`; run `npm test` (or targeted vitest paths)
- Commit after each task; `docs/` is gitignored — use `git add -f` only for docs if needed; prefer committing app code

## File map

| File | Responsibility |
| ---- | -------------- |
| `src/services/pokeapi/keys.ts` | `NATIONAL_DEX_COUNT`, `TOTAL_ROSTER_COUNT`, `CACHE_VERSION` bump |
| `src/data/megaCatalog.ts` | Synthetic Mega/Primal entries (id ≥650, slug, displayName, baseSpeciesId, kind) |
| `src/data/legendaryIds.ts` | Gen 1–5 legendary/mythical National ids |
| `src/data/nationalRareIds.ts` | National rare ids (Gen 1 list preserved + Gen 2–5 curated) |
| `src/data/encounterTables.ts` | Forest pools: common/rare/legendary using above + mega ids |
| `src/types/pokemon.ts` | `kind`, `baseSpeciesId` on `PokemonDto`; cache envelope version |
| `src/services/pokeapi/client.ts` | National + form fetch; DTO remap for megas |
| `src/services/pokeapi/cache.ts` | Completeness over full roster; never touch save |
| `src/hooks/usePokemonCache.ts` | Progress total = `TOTAL_ROSTER_COUNT` |
| `src/game/dexFilters.ts` | `mode: 'all' \| 'national' \| 'mega'` |
| `src/components/dex/DexHeader.tsx` | Mode chips + denominator from mode |
| `src/components/dex/DexDetailSheet.tsx` | Optional base-species line for megas |
| `src/data/config-surface.test.ts` + focused unit tests | Lock pools, filters, save isolation |

---

### Task 1: Roster constants + DTO shape

**Files:**

- Modify: `pokemon-safari-app/src/services/pokeapi/keys.ts`
- Modify: `pokemon-safari-app/src/types/pokemon.ts`
- Modify: `pokemon-safari-app/src/services/pokeapi/keys.test.ts`
- Test: `pokemon-safari-app/src/types/pokemon.ts` (via cache/client tests in later tasks; keys test here)

**Interfaces:**

- Produces:

```ts
/** National Dex Gen 1–5 inclusive. */
export const NATIONAL_DEX_COUNT = 649

/**
 * @deprecated Use NATIONAL_DEX_COUNT. Kept only if a one-PR rename is too noisy;
 * prefer deleting GEN1_COUNT and updating all imports in this task.
 */
// Remove GEN1_COUNT — replace every import with NATIONAL_DEX_COUNT or TOTAL_ROSTER_COUNT.

export const CACHE_VERSION = 4 // was 3

/** Set in Task 2 after megaCatalog exists; for Task 1 export a placeholder setter pattern:
 * TOTAL_ROSTER_COUNT is defined in keys.ts as NATIONAL_DEX_COUNT + MEGA_CATALOG_LENGTH
 * imported from megaCatalog — so Task 1 only lands NATIONAL_DEX_COUNT + CACHE_VERSION,
 * and Task 2 wires TOTAL_ROSTER_COUNT.
 */
```

```ts
export type PokemonKind = 'species' | 'mega' | 'primal'

export type PokemonDto = {
  id: number
  name: string
  types: string[]
  sprites: {
    front_default: string | null
    front_shiny: string | null
    official_artwork: string | null
  }
  flavorText: string | null
  genus: string | null
  height: number
  weight: number
  habitat: string | null
  kind: PokemonKind
  /** National id for mega/primal; null for species. */
  baseSpeciesId: number | null
}

export type CacheEnvelopeV4 = {
  version: 4
  fetchedAt: string
  pokemon: PokemonDto[]
}

export type CacheEnvelope = CacheEnvelopeV4
```

- [ ] **Step 1: Write failing keys test**

In `keys.test.ts`, replace Gen-1 expectations:

```ts
it('exports National Dex ceiling 649 and cache v4', () => {
  expect(NATIONAL_DEX_COUNT).toBe(649)
  expect(CACHE_VERSION).toBe(4)
  expect(CACHE_KEY).toBe('pokemon-safari:poke-cache:v4')
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `cd pokemon-safari-app && npx vitest run src/services/pokeapi/keys.test.ts`

Expected: FAIL (missing export / still v3 / 151)

- [ ] **Step 3: Implement constants + DTO fields**

Update `keys.ts` and `pokemon.ts` as above. Grep-replace `GEN1_COUNT` → `NATIONAL_DEX_COUNT` in files that mean “National ceiling”, or leave compile errors for Task 2–4 if mega total is needed — **in this task**, update every `GEN1_COUNT` reference that meant 151 National to `NATIONAL_DEX_COUNT`, knowing completeness checks will temporarily expect 649 species-only until Task 2–4 add megas (prefer updating completeness in Task 4 only; for Task 1 stop at types + keys + fix keys.test; leave cache still on old constant until Task 4 to avoid a broken boot mid-PR — **exception:** keep exporting `GEN1_COUNT = 151` removed; Task 1 changes keys + types only, and updates `keys.test.ts`; do not yet change `cache.ts` completeness).

Minimal Task 1 touch set: `keys.ts`, `pokemon.ts`, `keys.test.ts` only. Other files still importing `GEN1_COUNT` will fail typecheck — update those imports to `NATIONAL_DEX_COUNT` **only where the file still means “151 semantics” temporarily** OR update all imports to `NATIONAL_DEX_COUNT` and leave cache length checks failing until Task 4.

**Preferred:** In Task 1, rename `GEN1_COUNT` → `NATIONAL_DEX_COUNT = 649` and fix all imports/compilations with temporary “still Gen1 behavior” left for later tasks **except** do not change encounter pool size yet. Cache `isValidEnvelope` still comparing to 151 will break — so Task 1+4 should be sequenced tightly: after Task 1 rename, immediately fix cache in Task 4 before considering the branch runnable.

For a green intermediate: Task 1 only adds `NATIONAL_DEX_COUNT = 649` **alongside** keeping `GEN1_COUNT = 151` deprecated, plus DTO fields with defaults in `toPokemonDto` later. Spec wants replacement — use:

```ts
export const NATIONAL_DEX_COUNT = 649
/** @deprecated alias — remove after Task 4 */
export const GEN1_COUNT = NATIONAL_DEX_COUNT
```

No — that breaks Gen1 cache length. Cleaner:

```ts
export const NATIONAL_DEX_COUNT = 649
export const CACHE_VERSION = 4
```

And Task 1 updates **only** keys + pokemon types + keys test. Leave `GEN1_COUNT` export as `151` until Task 4 deletes it, to keep main green:

```ts
export const NATIONAL_DEX_COUNT = 649
/** Remove in Task 4 when roster prefetch goes live. */
export const GEN1_COUNT = 151
export const CACHE_VERSION = 4
```

DTO: add `kind` and `baseSpeciesId` as required fields — update `toPokemonDto` / `fromStoredDto` / test helpers in Task 3–4. For Task 1, make them required on the type; fix compile breaks in test helpers with `kind: 'species', baseSpeciesId: null`.

- [ ] **Step 4: Fix test helper compile**

In `src/test/pokeapi-test-helpers.ts` `makePokemonDto`, add:

```ts
kind: 'species',
baseSpeciesId: null,
```

Fix any other literal `PokemonDto` constructions the compiler lists.

- [ ] **Step 5: Run keys test + tsc/vitest smoke**

Run: `cd pokemon-safari-app && npx vitest run src/services/pokeapi/keys.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add pokemon-safari-app/src/services/pokeapi/keys.ts \
  pokemon-safari-app/src/services/pokeapi/keys.test.ts \
  pokemon-safari-app/src/types/pokemon.ts \
  pokemon-safari-app/src/test/pokeapi-test-helpers.ts
# plus any fixture compile fixes
git commit -m "$(cat <<'EOF'
feat(safari): add National Dex constants and PokemonDto kind fields

Prepare roster expansion with cache v4 and species/mega/primal kind on DTOs.
EOF
)"
```

---

### Task 2: Mega/Primal catalog

**Files:**

- Create: `pokemon-safari-app/src/data/megaCatalog.ts`
- Create: `pokemon-safari-app/src/data/megaCatalog.test.ts`
- Modify: `pokemon-safari-app/src/services/pokeapi/keys.ts` (add `TOTAL_ROSTER_COUNT`)

**Interfaces:**

- Produces:

```ts
export type MegaCatalogEntry = {
  id: number // >= 650, contiguous
  pokeApiSlug: string
  displayName: string
  baseSpeciesId: number // 1..649
  kind: 'mega' | 'primal'
}

export const MEGA_CATALOG: readonly MegaCatalogEntry[]
export const MEGA_CATALOG_BY_ID: ReadonlyMap<number, MegaCatalogEntry>
export const MEGA_CATALOG_LENGTH: number
export function isMegaOrPrimalId(id: number): boolean
```

```ts
// keys.ts
import { MEGA_CATALOG_LENGTH } from '@/data/megaCatalog'
export const TOTAL_ROSTER_COUNT = NATIONAL_DEX_COUNT + MEGA_CATALOG_LENGTH
```

- [ ] **Step 1: Write failing catalog tests**

```ts
import { MEGA_CATALOG, MEGA_CATALOG_BY_ID, isMegaOrPrimalId } from './megaCatalog'
import { NATIONAL_DEX_COUNT } from '@/services/pokeapi/keys'

describe('megaCatalog', () => {
  it('starts at 650 and is contiguous with unique slugs', () => {
    expect(MEGA_CATALOG[0]?.id).toBe(NATIONAL_DEX_COUNT + 1)
    for (let i = 0; i < MEGA_CATALOG.length; i++) {
      expect(MEGA_CATALOG[i]!.id).toBe(NATIONAL_DEX_COUNT + 1 + i)
    }
    expect(new Set(MEGA_CATALOG.map((e) => e.pokeApiSlug)).size).toBe(MEGA_CATALOG.length)
  })

  it('only includes bases ≤649 and includes both primals + Charizard X/Y', () => {
    for (const e of MEGA_CATALOG) {
      expect(e.baseSpeciesId).toBeGreaterThanOrEqual(1)
      expect(e.baseSpeciesId).toBeLessThanOrEqual(NATIONAL_DEX_COUNT)
    }
    const slugs = new Set(MEGA_CATALOG.map((e) => e.pokeApiSlug))
    expect(slugs.has('charizard-mega-x')).toBe(true)
    expect(slugs.has('charizard-mega-y')).toBe(true)
    expect(slugs.has('kyogre-primal')).toBe(true)
    expect(slugs.has('groudon-primal')).toBe(true)
    expect(slugs.has('diancie-mega')).toBe(false)
  })

  it('BY_ID and isMegaOrPrimalId agree', () => {
    expect(isMegaOrPrimalId(25)).toBe(false)
    expect(isMegaOrPrimalId(MEGA_CATALOG[0]!.id)).toBe(true)
    expect(MEGA_CATALOG_BY_ID.get(MEGA_CATALOG[0]!.id)?.pokeApiSlug).toBe(
      MEGA_CATALOG[0]!.pokeApiSlug,
    )
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `cd pokemon-safari-app && npx vitest run src/data/megaCatalog.test.ts`

- [ ] **Step 3: Implement catalog**

Create `megaCatalog.ts` with this exact ordered list (ids assigned sequentially from 650):

| pokeApiSlug | displayName | baseSpeciesId | kind |
| --- | --- | --- | --- |
| venusaur-mega | Mega Venusaur | 3 | mega |
| charizard-mega-x | Mega Charizard X | 6 | mega |
| charizard-mega-y | Mega Charizard Y | 6 | mega |
| blastoise-mega | Mega Blastoise | 9 | mega |
| beedrill-mega | Mega Beedrill | 15 | mega |
| pidgeot-mega | Mega Pidgeot | 18 | mega |
| alakazam-mega | Mega Alakazam | 65 | mega |
| slowbro-mega | Mega Slowbro | 80 | mega |
| gengar-mega | Mega Gengar | 94 | mega |
| kangaskhan-mega | Mega Kangaskhan | 115 | mega |
| pinsir-mega | Mega Pinsir | 127 | mega |
| gyarados-mega | Mega Gyarados | 130 | mega |
| aerodactyl-mega | Mega Aerodactyl | 142 | mega |
| mewtwo-mega-x | Mega Mewtwo X | 150 | mega |
| mewtwo-mega-y | Mega Mewtwo Y | 150 | mega |
| ampharos-mega | Mega Ampharos | 181 | mega |
| steelix-mega | Mega Steelix | 208 | mega |
| scizor-mega | Mega Scizor | 212 | mega |
| heracross-mega | Mega Heracross | 214 | mega |
| houndoom-mega | Mega Houndoom | 229 | mega |
| tyranitar-mega | Mega Tyranitar | 248 | mega |
| blaziken-mega | Mega Blaziken | 257 | mega |
| gardevoir-mega | Mega Gardevoir | 282 | mega |
| mawile-mega | Mega Mawile | 303 | mega |
| aggron-mega | Mega Aggron | 306 | mega |
| medicham-mega | Mega Medicham | 308 | mega |
| manectric-mega | Mega Manectric | 310 | mega |
| sharpedo-mega | Mega Sharpedo | 319 | mega |
| camerupt-mega | Mega Camerupt | 323 | mega |
| altaria-mega | Mega Altaria | 334 | mega |
| banette-mega | Mega Banette | 354 | mega |
| absol-mega | Mega Absol | 359 | mega |
| glalie-mega | Mega Glalie | 362 | mega |
| salamence-mega | Mega Salamence | 373 | mega |
| metagross-mega | Mega Metagross | 376 | mega |
| latias-mega | Mega Latias | 380 | mega |
| latios-mega | Mega Latios | 381 | mega |
| rayquaza-mega | Mega Rayquaza | 384 | mega |
| kyogre-primal | Primal Kyogre | 382 | primal |
| groudon-primal | Primal Groudon | 383 | primal |
| lopunny-mega | Mega Lopunny | 428 | mega |
| garchomp-mega | Mega Garchomp | 445 | mega |
| lucario-mega | Mega Lucario | 448 | mega |
| abomasnow-mega | Mega Abomasnow | 460 | mega |
| gallade-mega | Mega Gallade | 475 | mega |
| audino-mega | Mega Audino | 531 | mega |

Implement:

```ts
export const MEGA_CATALOG: readonly MegaCatalogEntry[] = [ /* map table → objects with id: 650+i */ ]

export const MEGA_CATALOG_LENGTH = MEGA_CATALOG.length

export const MEGA_CATALOG_BY_ID: ReadonlyMap<number, MegaCatalogEntry> = new Map(
  MEGA_CATALOG.map((e) => [e.id, e]),
)

export function isMegaOrPrimalId(id: number): boolean {
  return MEGA_CATALOG_BY_ID.has(id)
}
```

Wire `TOTAL_ROSTER_COUNT` in `keys.ts`. Extend `keys.test.ts`:

```ts
expect(TOTAL_ROSTER_COUNT).toBe(NATIONAL_DEX_COUNT + MEGA_CATALOG_LENGTH)
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `cd pokemon-safari-app && npx vitest run src/data/megaCatalog.test.ts src/services/pokeapi/keys.test.ts`

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/data/megaCatalog.ts \
  pokemon-safari-app/src/data/megaCatalog.test.ts \
  pokemon-safari-app/src/services/pokeapi/keys.ts \
  pokemon-safari-app/src/services/pokeapi/keys.test.ts
git commit -m "$(cat <<'EOF'
feat(safari): add Mega/Primal catalog after National Dex 649

Checked-in synthetic ids 650+ for form fetch and dex slots.
EOF
)"
```

---

### Task 3: PokéAPI client — National + Mega fetch

**Files:**

- Modify: `pokemon-safari-app/src/services/pokeapi/client.ts`
- Modify: `pokemon-safari-app/src/services/pokeapi/client.test.ts`

**Interfaces:**

- Produces:

```ts
export type ToPokemonDtoOptions = {
  /** Override PokéAPI's form id with our synthetic/National id. */
  id?: number
  name?: string
  kind?: PokemonKind
  baseSpeciesId?: number | null
}

export function toPokemonDto(raw: PokeApiPokemon, options?: ToPokemonDtoOptions): PokemonDto

export function assertNationalId(id: unknown): asserts id is number
// 1..NATIONAL_DEX_COUNT

export function assertRosterId(id: unknown): asserts id is number
// 1..TOTAL_ROSTER_COUNT

export async function fetchPokemon(id: number): Promise<PokemonDto>
// national only

export async function fetchMegaPokemon(entry: MegaCatalogEntry): Promise<PokemonDto>
// GET /pokemon/{pokeApiSlug}, remap id/name/kind/baseSpeciesId; species meta from baseSpeciesId

export async function fetchRosterAll(options?: {
  concurrency?: number
  onProgress?: (done: number, total: number) => void
  nationalIds?: number[]
  megaIds?: number[]
}): Promise<PokemonDto[]>

// Keep fetchGen1All as deprecated wrapper calling fetchRosterAll with 1..151 OR delete and update tests to fetchRosterAll
```

- [ ] **Step 1: Write failing client tests**

```ts
it('toPokemonDto accepts national id 649 and sets kind species', () => {
  const dto = toPokemonDto({ ...base, id: 649, name: 'genesect' }, {})
  expect(dto.id).toBe(649)
  expect(dto.kind).toBe('species')
  expect(dto.baseSpeciesId).toBeNull()
})

it('toPokemonDto remaps mega form to synthetic id and display name', () => {
  const dto = toPokemonDto(
    { ...base, id: 10034, name: 'charizard-mega-x' },
    {
      id: 651,
      name: 'Mega Charizard X',
      kind: 'mega',
      baseSpeciesId: 6,
    },
  )
  expect(dto.id).toBe(651)
  expect(dto.name).toBe('Mega Charizard X')
  expect(dto.kind).toBe('mega')
  expect(dto.baseSpeciesId).toBe(6)
})

it('fetchMegaPokemon uses slug URL and remaps via catalog entry', async () => {
  // mock fetch for /pokemon/charizard-mega-x and /pokemon-species/6
  const entry = MEGA_CATALOG.find((e) => e.pokeApiSlug === 'charizard-mega-x')!
  const dto = await fetchMegaPokemon(entry)
  expect(dto.id).toBe(entry.id)
  expect(dto.name).toBe(entry.displayName)
  expect(dto.kind).toBe('mega')
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `cd pokemon-safari-app && npx vitest run src/services/pokeapi/client.test.ts`

- [ ] **Step 3: Implement client changes**

Replace `assertGen1Id` with `assertNationalId` / `assertRosterId`.

`toPokemonDto`: use `options.id ?? raw.id` after validating the **effective** id is a roster id when options provided; for plain national fetch validate national range; set `kind`/`baseSpeciesId` defaults to `'species'`/`null`.

`fetchMegaPokemon`:

```ts
export async function fetchMegaPokemon(entry: MegaCatalogEntry): Promise<PokemonDto> {
  const res = await fetch(`${POKEAPI_BASE}/${entry.pokeApiSlug}`)
  if (!res.ok) throw new Error(`PokéAPI failed for ${entry.pokeApiSlug}: ${res.status}`)
  const json = (await res.json()) as PokeApiPokemon
  const dto = toPokemonDto(json, {
    id: entry.id,
    name: entry.displayName,
    kind: entry.kind,
    baseSpeciesId: entry.baseSpeciesId,
  })
  const meta = await fetchSpeciesMeta(entry.baseSpeciesId)
  return { ...dto, ...meta }
}
```

Relax `fetchSpeciesMeta` / `fetchPokemon` to `assertNationalId`.

`fetchRosterAll`: mapPool over national ids then mega entries (or one combined list of work items), `onProgress` against `TOTAL_ROSTER_COUNT`.

Update/remove `fetchGen1All` tests accordingly.

- [ ] **Step 4: Run client tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(safari): fetch National Dex and Mega forms with id remap

Map PokéAPI form payloads onto synthetic dex ids from the mega catalog.
EOF
)"
```

---

### Task 4: Cache + boot progress + save preservation

**Files:**

- Modify: `pokemon-safari-app/src/services/pokeapi/cache.ts`
- Modify: `pokemon-safari-app/src/services/pokeapi/cache.test.ts`
- Modify: `pokemon-safari-app/src/hooks/usePokemonCache.ts`
- Modify: `pokemon-safari-app/src/screens/BootScreen.tsx` (if it hardcodes Gen1 total)

**Interfaces:**

- Completeness: memory/envelope must contain every id `1..NATIONAL_DEX_COUNT` **and** every `MEGA_CATALOG` id (`TOTAL_ROSTER_COUNT` entries).
- `ensureCache` / `hasValidCache` use `CACHE_VERSION === 4` and full roster.
- `fromStoredDto` accepts ids `1..TOTAL_ROSTER_COUNT` and requires `kind` + `baseSpeciesId`.
- **Invariant:** no function in `cache.ts` reads/writes `SAVE_KEY`.

- [ ] **Step 1: Write failing save-preservation + completeness tests**

```ts
it('ensureCache / write path never clears SAVE_KEY (Gen 1 progress survives)', async () => {
  const save = {
    version: 2,
    savedAt: '2026-01-01T00:00:00.000Z',
    data: {
      dex: {
        '25': {
          seen: true,
          firstEncounteredAt: '2026-01-01T00:00:00.000Z',
          firstCapturedAt: '2026-01-01T00:00:00.000Z',
          catchCount: 2,
          shinyOwned: true,
        },
      },
      explore: { x: 0, y: 0, facing: 'down' },
    },
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(save))
  // seed partial old cache or call ensureCache with mocks…
  // after cache operations:
  const raw = localStorage.getItem(SAVE_KEY)!
  expect(JSON.parse(raw).data.dex['25'].catchCount).toBe(2)
  expect(JSON.parse(raw).data.dex['25'].shinyOwned).toBe(true)
})

it('isCompleteRoster requires national + mega ids', () => {
  // build map with only 1..649 → false; add all megas → true
})
```

- [ ] **Step 2: Run tests — expect FAIL**

- [ ] **Step 3: Implement cache roster completeness**

Replace every `GEN1_COUNT` completeness check with:

```ts
function expectedRosterIds(): number[] {
  return [
    ...Array.from({ length: NATIONAL_DEX_COUNT }, (_, i) => i + 1),
    ...MEGA_CATALOG.map((e) => e.id),
  ]
}

function isCompleteRoster(map: Map<number, PokemonDto>): boolean {
  if (map.size !== TOTAL_ROSTER_COUNT) return false
  for (const id of expectedRosterIds()) {
    if (!map.has(id)) return false
  }
  return true
}
```

`ensureCache`: fetch missing national ids via `fetchPokemon`; missing megas via `fetchMegaPokemon`. Progress `(done, TOTAL_ROSTER_COUNT)`. Persist envelope `version: 4`.

Delete deprecated `GEN1_COUNT` from `keys.ts` once nothing imports it.

`usePokemonCache`: default progress total `TOTAL_ROSTER_COUNT`.

- [ ] **Step 4: Run cache + hook-related tests — expect PASS**

Run: `cd pokemon-safari-app && npx vitest run src/services/pokeapi/cache.test.ts src/services/pokeapi/keys.test.ts`

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(safari): prefetch full Gen1–5 + Mega roster in poke-cache v4

Keep SAVE_KEY untouched so existing dex progress survives the expand.
EOF
)"
```

---

### Task 5: Legendary + National rare pools + Mega rares

**Files:**

- Create: `pokemon-safari-app/src/data/legendaryIds.ts`
- Create: `pokemon-safari-app/src/data/nationalRareIds.ts`
- Modify: `pokemon-safari-app/src/data/encounterTables.ts`
- Modify: `pokemon-safari-app/src/data/config-surface.test.ts`
- Create: `pokemon-safari-app/src/data/encounterTables.test.ts` (optional if config-surface covers it)

**Interfaces:**

```ts
export const LEGENDARY_IDS: readonly number[]
// Gen 1–5 legendaries + mythicals only (National ids)

export const NATIONAL_RARE_IDS: readonly number[]
// Gen 1 FOREST_RARE_IDS preserved exactly + Gen 2–5 curated finals/standouts
// Disjoint from LEGENDARY_IDS; subset of 1..649

// encounterTables forest:
// legendary: LEGENDARY_IDS
// rare: [...NATIONAL_RARE_IDS, ...MEGA_CATALOG.map(e => e.id)]
// common: 1..649 minus national rare minus legendary
```

**Legendary list (exact):**

```ts
export const LEGENDARY_IDS = [
  // Gen 1
  144, 145, 146, 150, 151,
  // Gen 2
  243, 244, 245, 249, 250, 251,
  // Gen 3
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
  // Gen 4
  480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493,
  // Gen 5
  494, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649,
] as const
```

**National rares:**

- Keep Gen 1 `FOREST_RARE_IDS` **byte-identical** to today’s list.
- Add Gen 2–5 ids using the same rule of thumb: final evolutions + cool standouts; **exclude** anything in `LEGENDARY_IDS`.
- Put Gen 2–5 additions in `nationalRareIds.ts` as `GEN2_TO_5_RARE_IDS` (sorted). Combine:

```ts
export const NATIONAL_RARE_IDS = [
  ...FOREST_RARE_IDS,
  ...GEN2_TO_5_RARE_IDS,
] as const
```

Include at least (non-exhaustive starter set to expand in-file until partition tests pass — **the committed file must list every id**; grow the array until `common ∪ rareNational ∪ legendary` partitions `1..649`):

Heuristic while authoring `GEN2_TO_5_RARE_IDS`: multi-stage final evolutions + pseudo-legendaries + notable single-stages (e.g. 154,157,160,169,181,196,197,208,212,214,229,230,248,254,257,260,282,306,330,350,373,376,389,392,395,405,407,409,411,413,414,416,419,421,423,424,426,428,429,430,432,435,437,442,445,448,450,452,454,457,460,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,476,477,478,497,500,503,505,508,510,512,514,516,518,521,523,526,528,530,534,537,542,545,547,549,550,553,555,556,558,560,561,563,565,567,569,571,573,576,579,581,584,586,589,591,593,596,598,601,604,606,609,612,614,617,620,621,623,625,630,635,637). **Remove any that appear in LEGENDARY_IDS. Add remaining finals/standouts as needed so the forest still feels like Gen 1’s rare density — prefer finals over early-route single-stages (skip analogues of Raticate).**

After authoring, run the partition test and adjust until green.

- [ ] **Step 1: Write failing pool tests** (in `config-surface.test.ts`)

```ts
it('forest partitions National 1..649 with no gaps/dupes', () => {
  const { common, rare, legendary } = biomeEncounterTables.forest
  const nationalRare = rare.filter((id) => id <= NATIONAL_DEX_COUNT)
  const megaRare = rare.filter((id) => id > NATIONAL_DEX_COUNT)
  expect(megaRare.sort((a, b) => a - b)).toEqual(MEGA_CATALOG.map((e) => e.id))
  const national = [...common, ...nationalRare, ...legendary]
  expect(national).toHaveLength(NATIONAL_DEX_COUNT)
  expect(new Set(national).size).toBe(NATIONAL_DEX_COUNT)
  expect([...national].sort((a, b) => a - b)).toEqual(
    Array.from({ length: NATIONAL_DEX_COUNT }, (_, i) => i + 1),
  )
})

it('preserves Gen 1 rare list exactly', () => {
  expect(NATIONAL_RARE_IDS.filter((id) => id <= 151).sort((a, b) => a - b)).toEqual([
    /* paste current FOREST_RARE_IDS sorted — same as existing test */
  ])
})

it('legendary list is Gen 1–5 curated set', () => {
  expect([...biomeEncounterTables.forest.legendary].sort((a, b) => a - b)).toEqual(
    [...LEGENDARY_IDS].sort((a, b) => a - b),
  )
})
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement data files + rewire `encounterTables.ts`**

```ts
import { LEGENDARY_IDS } from './legendaryIds'
import { NATIONAL_RARE_IDS } from './nationalRareIds'
import { MEGA_CATALOG } from './megaCatalog'
import { NATIONAL_DEX_COUNT } from '@/services/pokeapi/keys'

const legendarySet = new Set<number>(LEGENDARY_IDS)
const rareNationalSet = new Set<number>(NATIONAL_RARE_IDS)

function forestCommonIds(): number[] {
  const out: number[] = []
  for (let id = 1; id <= NATIONAL_DEX_COUNT; id++) {
    if (legendarySet.has(id) || rareNationalSet.has(id)) continue
    out.push(id)
  }
  return out
}

export const biomeEncounterTables = {
  forest: {
    common: forestCommonIds(),
    rare: [...NATIONAL_RARE_IDS, ...MEGA_CATALOG.map((e) => e.id)] as const,
    legendary: LEGENDARY_IDS,
  },
}
```

Assert at module load (dev safety):

```ts
if (NATIONAL_RARE_IDS.some((id) => legendarySet.has(id))) {
  throw new Error('national rare overlaps legendary')
}
```

Re-export or delete old `GEN1_LEGENDARY_IDS` / `FOREST_RARE_IDS` names — keep aliases if tests import them:

```ts
export const FOREST_RARE_IDS = NATIONAL_RARE_IDS.filter((id) => id <= 151)
```

Better: update all imports to new names.

- [ ] **Step 4: Run config-surface + encounter tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(safari): expand forest encounter pools through Gen 5 + Megas

Keep Gen 1 rares intact; add Gen 2–5 rares/legendaries; Megas rare-only.
EOF
)"
```

---

### Task 6: Dex filters — All / National / Mega mode

**Files:**

- Modify: `pokemon-safari-app/src/game/dexFilters.ts`
- Modify: `pokemon-safari-app/src/game/dexFilters.test.ts`
- Modify: `pokemon-safari-app/src/data/dexFilterCopy.ts` (empty-state copy if mode-specific)

**Interfaces:**

```ts
export type DexModeFilter = 'all' | 'national' | 'mega'

export type DexFilterState = {
  status: DexStatusFilter
  type: string | null
  mode: DexModeFilter
}

export function rosterIdsForMode(mode: DexModeFilter): number[]
// all: 1..TOTAL_ROSTER_COUNT (national then megas in order)
// national: 1..649
// mega: MEGA_CATALOG ids in order

export function filterDexSpeciesIds(
  dex: DexData,
  filter: DexFilterState,
  typeOf: (speciesId: number) => string[],
): number[]

export function dexDenominator(mode: DexModeFilter): number
```

- [ ] **Step 1: Write failing filter tests**

```ts
it('mode national excludes mega ids', () => {
  const ids = filterDexSpeciesIds({}, { status: 'all', type: null, mode: 'national' }, () => [])
  expect(ids[0]).toBe(1)
  expect(ids.at(-1)).toBe(649)
  expect(ids).toHaveLength(649)
})

it('mode mega returns only catalog ids', () => {
  const ids = filterDexSpeciesIds({}, { status: 'all', type: null, mode: 'mega' }, () => [])
  expect(ids).toEqual(MEGA_CATALOG.map((e) => e.id))
})

it('mode all is national then megas', () => {
  const ids = filterDexSpeciesIds({}, { status: 'all', type: null, mode: 'all' }, () => [])
  expect(ids).toHaveLength(TOTAL_ROSTER_COUNT)
  expect(ids[648]).toBe(649)
  expect(ids[649]).toBe(MEGA_CATALOG[0]!.id)
})
```

Update existing tests to pass `mode: 'all'` (or `'national'` where they assumed 151 — change expectations to 649 for national-all).

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement**

```ts
export function rosterIdsForMode(mode: DexModeFilter): number[] {
  if (mode === 'national') {
    return Array.from({ length: NATIONAL_DEX_COUNT }, (_, i) => i + 1)
  }
  if (mode === 'mega') {
    return MEGA_CATALOG.map((e) => e.id)
  }
  return [
    ...Array.from({ length: NATIONAL_DEX_COUNT }, (_, i) => i + 1),
    ...MEGA_CATALOG.map((e) => e.id),
  ]
}

export function filterDexSpeciesIds(...): number[] {
  const out: number[] = []
  for (const id of rosterIdsForMode(filter.mode)) {
    if (!matchesStatus(dex, id, filter.status)) continue
    if (!matchesType(dex, typeOf, id, filter.type)) continue
    out.push(id)
  }
  return out
}

export function dexDenominator(mode: DexModeFilter): number {
  return rosterIdsForMode(mode).length
}
```

- [ ] **Step 4: Run dexFilters tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(safari): add Pokédex All/National/Mega mode filter

Browse synthetic Mega slots separately without losing National order.
EOF
)"
```

---

### Task 7: Dex UI — mode chips, progress denominator, base line

**Files:**

- Modify: `pokemon-safari-app/src/components/dex/DexHeader.tsx`
- Modify: `pokemon-safari-app/src/screens/DexScreen.tsx`
- Modify: `pokemon-safari-app/src/components/dex/DexDetailSheet.tsx`
- Modify: matching `*.test.tsx` files

**Interfaces:**

- `DexHeader` takes `denominator: number` (or `mode` + uses `dexDenominator`) and `onModeChange`.
- Default filter state includes `mode: 'all'`.
- Detail sheet when `pokemon.kind !== 'species'`: show `Base: {baseName} #{pad(baseSpeciesId)}` using `getPokemon(baseSpeciesId).name` when cached.

- [ ] **Step 1: Write failing UI tests**

```ts
it('shows Seen/Caught over mega denominator in mega mode', () => {
  render(<DexHeader seen={1} caught={0} filter={{... mode:'mega'}} denominator={MEGA_CATALOG_LENGTH} ... />)
  expect(screen.getByText(new RegExp(`Seen 1/${MEGA_CATALOG_LENGTH}`))).toBeTruthy()
})

it('renders Mega mode chip', () => {
  // assert aria-label group + Mega chip
})
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement header + screen wiring + detail base line**

Replace hardcoded `GEN1_COUNT` in header with `denominator` prop from `dexDenominator(filter.mode)`.

Pad dex numbers with `String(id).padStart(id > 999 ? 4 : 3, '0')` (catalog stays 3 digits at ~697).

- [ ] **Step 4: Run Dex screen/header/detail tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(safari): wire Mega mode into Pokédex header and detail

Progress counts follow All/National/Mega; megas show base species.
EOF
)"
```

---

### Task 8: Integration sweep + full test suite

**Files:**

- Modify any remaining `GEN1_COUNT` / `fetchGen1All` / `1..151` assumptions in hooks, boot, encounter tests, `config-surface.test.ts`
- Grep audit

- [ ] **Step 1: Grep for stale Gen1 assumptions**

Run:

```bash
cd pokemon-safari-app && rg -n 'GEN1_COUNT|fetchGen1All|assertGen1Id|length: 151|/ 151|<= 151' src
```

Fix every hit that should be National or Total roster.

- [ ] **Step 2: Run full unit suite**

Run: `cd pokemon-safari-app && npm test`

Expected: all PASS

- [ ] **Step 3: Manual smoke (local)**

1. Clear poke-cache only (`localStorage` remove `pokemon-safari:poke-cache:v3` / `v4`); leave save intact with a known catch.
2. Boot — progress goes to `TOTAL_ROSTER_COUNT` (long wait).
3. Dex still shows prior catch; National order 001…649 then Megas.
4. Rare grass can yield a Mega; dex entry uses synthetic id.
5. Mega filter shows only megas.

- [ ] **Step 4: Commit any leftover fixes**

```bash
git commit -m "$(cat <<'EOF'
fix(safari): finish Gen1→Gen5 roster rename sweep

Align boot, tests, and config surface with TOTAL_ROSTER_COUNT.
EOF
)"
```

---

## Spec coverage self-review

| Spec requirement | Task |
| ---------------- | ---- |
| National 1–649 order | 1, 4, 6 |
| Rare rule per gen + legendaries | 5 |
| Mega/Primal slots after 649 | 2, 5, 6 |
| Mega filter toggle | 6, 7 |
| Megas in rare band | 5 |
| Full prefetch at boot | 4, 8 |
| Save preservation | 4 (hard test) |
| DTO kind / baseSpeciesId | 1, 3 |
| Form id remap | 3 |
| Out of scope biomes / mega grass weight | not planned |

## Placeholder scan

No TBD steps; Gen 2–5 rare **authoring** is explicit heuristic with partition tests as the acceptance gate — the committed `GEN2_TO_5_RARE_IDS` array must be complete in Task 5 (not left empty).

## Type consistency

- `PokemonDto.kind` / `baseSpeciesId` used in client, cache, detail sheet
- `DexFilterState.mode` used in filters, header, DexScreen
- `TOTAL_ROSTER_COUNT` = `NATIONAL_DEX_COUNT + MEGA_CATALOG_LENGTH`
- Synthetic ids == `MEGA_CATALOG[].id` everywhere (encounters, dex, cache)
