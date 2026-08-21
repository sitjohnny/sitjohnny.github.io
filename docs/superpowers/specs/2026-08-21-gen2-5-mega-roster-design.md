# Gen 2–5 roster + Mega/Primal dex slots

**Date:** 2026-08-21  
**Status:** Approved for planning  
**App:** `pokemon-safari-app`

## Problem

Safari is Gen 1 only (`1–151`). Players want National Dex Gen 1–5 (`1–649`) in correct order, the same common/rare/legendary encounter logic scaled to new gens, and Mega Evolutions (plus Primals) as first-class dex entries — without wiping existing Seen/Caught progress.

## Goals

1. Expand the roster to National Dex **1–649** (Gen 1–5), always ordered by National number.
2. Keep grass outcome **weights** unchanged; extend **pools** with the same rare rule (finals + curated standouts) and Gen 1–5 legendaries/mythicals.
3. Add Mega Evolutions + Primals as **separate dex slots after #649** with synthetic ids, Mega filter/toggle, and rare-band encounters.
4. Prefetch the **full** roster at boot (same completeness gate as today, larger total).
5. **Preserve player save state** across the expansion (dex + explore).

## Non-goals

- Gen 6+ National species (except Mega/Primal forms whose base is ≤649)
- Separate Mega grass outcome weight
- Composite save keys (`speciesId` + `formId`)
- Lake/Mountain biomes, inventory, audio
- Changing education mix / capture math beyond existing rarity bands
- Wiping or re-keying existing dex entries

## Approach

**Unified internal ID space:** `1–649` = National Dex; `650+` = checked-in Mega/Primal catalog. One `speciesId` continues to key dex, save, encounters, and cache.

---

## Save preservation (hard requirement)

Player progress and poke-cache are already separate (`SAVE_KEY` vs `CACHE_KEY`). This feature must keep that separation strict.

| Concern | Rule |
| -------- | ---- |
| Save key | Keep `SAVE_KEY` as today. Do **not** clear it when bumping poke-cache version. |
| Save envelope | No required version bump. Dex remains a sparse `Record<string, DexEntry>` keyed by species id string. |
| Existing entries | Keys `"1"`…`"151"` (and any others already present) stay valid. Seen/Caught/shiny/catchCount unchanged. |
| New species | Ids `152–649` and Mega/Primal synthetic ids simply have no entry until seen/caught (same as any uncaught Gen 1). |
| Cache bump | Bump `CACHE_VERSION` so incomplete Gen-1-only caches refetch. Cache invalidation must never call `clearSave` or overwrite `SAVE_KEY`. |
| Id collision | Synthetic Mega/Primal ids start at **650**, after Genesect (649). Never reuse 1–649 for forms. |

### Regression tests (required)

- Expanding roster / bumping cache does not remove or alter existing `dex` keys under `SAVE_KEY`.
- Existing tests that assert cache writes leave `SAVE_KEY` alone remain green; add an explicit “Gen 1 progress survives roster expand” case if missing.

---

## Identity & data model

### Constants

- `NATIONAL_DEX_COUNT = 649` (replaces Gen-1-only `GEN1_COUNT` as the National ceiling).
- `TOTAL_ROSTER_COUNT = NATIONAL_DEX_COUNT + megaCatalog.length`.
- Boot progress and cache completeness use `TOTAL_ROSTER_COUNT`.

### Mega/Primal catalog

Checked-in module (e.g. `src/data/megaCatalog.ts`):

| Field | Purpose |
| ----- | ------- |
| `id` | Synthetic dex number (≥650), catalog order = dex order |
| `pokeApiSlug` | PokéAPI pokemon form key (`charizard-mega-x`, `kyogre-primal`, …) |
| `displayName` | UI name |
| `baseSpeciesId` | National id of the base form |
| `kind` | `'mega'` \| `'primal'` |

**Scope:** All official Mega Evolutions (X/Y as separate slots) whose **base species** is ≤649, plus Primal Kyogre and Primal Groudon.

### `PokemonDto` extensions

- `kind: 'species' | 'mega' | 'primal'`
- `baseSpeciesId: number | null` — set for mega/primal; `null` for National species

Sprites, types, height/weight from the form endpoint; flavor/genus may fall back to base species when the form payload lacks them.

### Cache

Bump poke-cache version. Envelope still holds a flat `pokemon: PokemonDto[]` covering National + Mega/Primal entries, keyed in memory by `id`.

---

## Encounters & rarity

Grass weights in `rates.ts` stay as-is (`pokemon` / `nothing` / `rare` / `legendary`).

### Legendary band

Curated Gen 1–5 legendaries + mythicals (extend today’s Gen 1 list with Johto–Unova equivalents). No Mega/Primal ids.

### Rare band

- Per-gen **final evolutions + curated standouts** for National ids (keep Gen 1 list; add Gen 2–5 with the same rule of thumb).
- **Plus every** Mega/Primal synthetic id.
- Equal-weight pick within the pool (unchanged resolver).

### Common band

National ids in `1–649` not in rare or legendary. Megas/Primals are never common.

### Partition

- National pools partition `1–649` with no gaps or duplicates.
- Mega/Primal ids are **extra rare-only** entries outside that partition.

---

## Dex UI

### Order

Default grid: `#001`…`#649`, then Mega/Primal slots in catalog order.

### Mode filter

Alongside status/type:

- **All** — full roster  
- **National** — `1–649`  
- **Mega** — synthetic Mega/Primal slots only  

Status and type filters stack on top.

### Progress header

Denominators follow active mode (All → `TOTAL_ROSTER_COUNT`; National → 649; Mega → catalog length).

### Detail

Mega/Primal tiles use form art and display names. Detail may show “Base: {name} #{nnn}” via `baseSpeciesId`.

---

## Fetch & boot

1. Prefetch `1–649` via existing pokemon + species flow (remove Gen-1-only asserts).
2. Prefetch each catalog entry by `pokeApiSlug`.
3. Boot blocks on full `TOTAL_ROSTER_COUNT` completeness (same product model as today; longer first load).
4. Incomplete or wrong-version cache → refetch missing ids; never touch `SAVE_KEY`.

### Errors

- Mid-encounter missing cache entry → existing recovery UI.
- Individual form fetch failures retry that id; boot fails only if roster still incomplete after retries (same gate, larger total).

---

## Testing

- National partition `1–649` complete; Mega/Primal ⊆ rare only.
- Dex filters: All / National / Mega × status/type.
- Client accepts ids > 151 and form-based Mega DTOs.
- Config surface: Gen 1–5 legendaries; rares include finals/standouts + megas.
- Progress counts switch with Mega mode.
- **Save preservation** cases above.

---

## Out of scope (reminders)

New biomes; Gen 6+ National species; Mega as its own grass weight; composite identity; save wipe or dex re-key.
