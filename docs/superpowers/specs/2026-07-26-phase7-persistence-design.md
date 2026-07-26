# Phase 7 Persistence Design

**Date:** 2026-07-26
**Status:** Approved

## Goal

Persist player progress across sessions with a versioned auto-save. Closing and reopening the game resumes the Pokédex and the player's map tile and facing. No manual save.

This is a **slimmed Phase 7**: data persistence only. Lake/Mountain unlocks and daily rewards are out of this phase.

## Scope

**In scope**

- Extend the save envelope from v1 → v2 with an `explore` slice (`tile` x/y + `facing`)
- Migrate existing v1 saves without wiping dex progress
- Hydrate `exploreStore` from save on load
- Shared debounced persist + flush on tab hide / page unload (same cadence as today's dex save)
- Update roadmap/STATE so Phase 7 success criteria match persistence-only

**Out of scope**

- Lake / Mountain biome unlocks and travel UI
- Daily reward claim
- Settings / mute persistence (Phase 8+)
- Audio, polish pass, screen transitions, particles
- New gameplay features
- Persisting world seed (`WORLD_SEED` stays config-only)
- Persisting education adaptive stats (keeps its own namespaced key)
- Persisting mid-encounter / encounter queue / move lock / immunity

## Architecture

| Piece | Role |
| ----- | ---- |
| `types/save.ts` | `ExploreSave`, `SaveEnvelopeV2`; `SaveEnvelope = SaveEnvelopeV2` |
| `services/save.ts` | Parse, sanitize, migrate v1→v2, load/persist full envelope |
| `services/saveFlush.ts` (or equivalent) | Single debounce + `visibilitychange` / `pagehide` flush coordinator |
| `store/dexStore.ts` | Hydrate dex from shared load; schedule flush via coordinator |
| `store/exploreStore.ts` | Hydrate tile/facing from shared load; schedule flush on position/facing changes |
| Game / camera | First paint uses hydrated tile (not hard-coded spawn when a save exists) |

**LocalStorage key:** keep `SAVE_KEY` (`pokemon-safari:save:v1`). The schema version lives in the envelope `version` field, not the key name.

## Envelope

### v1 (existing)

```ts
{
  version: 1,
  savedAt: string,
  data: { dex: DexData }
}
```

### v2 (target)

```ts
{
  version: 2,
  savedAt: string,
  data: {
    dex: DexData,
    explore: {
      x: number, // integer tile
      y: number,
      facing: 'up' | 'down' | 'left' | 'right'
    }
  }
}
```

## Data flow

### Load

1. Read `SAVE_KEY`
2. If missing / corrupt / unknown version → empty dex + explore at `WORLD_SPAWN` facing `'down'`
3. If `version === 1` with valid dex → migrate in memory to v2: keep dex, set explore to spawn + `'down'`
4. If `version === 2` → sanitize dex (drop invalid entries as today) and explore (non-finite / non-integer coords or invalid facing → spawn defaults)
5. Dex and explore stores initialize from the loaded slices

### Write

1. Dex mutation (`markSeen` / `recordCatch`) or explore tile/facing change after a completed step → schedule shared debounce (`dexSaveDebounceMs` or a renamed shared constant in `data/rates.ts`)
2. Flush reads current dex + explore from both stores and calls `persistSave({ dex, explore })` writing a full v2 envelope
3. On `document.visibilityState === 'hidden'` and on `pagehide`, call `flushNow()` once (listeners live on the coordinator, not duplicated per store)

**Invariant:** every persist writes the full envelope. Dex-only or explore-only writes are forbidden (they would clobber the other slice).

### Mid-encounter

Encounter overlay state, pending encounter queue, `moving`, and pokemon immunity are session-only. Hydration never reopens an encounter. Reload drops the encounter and lands on the saved map tile/facing.

## Error handling

- Quota exceeded → same soft-fail path as today (`saveSoftFail` + existing `QuotaNote` UX). No new kid-facing save UI.
- Non-quota `localStorage` errors still throw.
- Never wipe poke-cache or edu-stats keys when save parse fails.

## Testing

Vitest, extending existing save/dex patterns:

| Case | Expectation |
| ---- | ----------- |
| v1 on disk → load | Same dex; explore = spawn + `'down'`; next persist is v2 |
| Round-trip explore | Persist tile/facing → reload store → same values |
| No clobber | Dex flush after an explore move keeps both slices |
| Corrupt explore field | Spawn defaults; dex preserved |
| Envelope shape | Persisted JSON has no encounter / overlay keys |
| Quota | Soft-fail still surfaces; existing tests updated for new `persistSave` signature |

## Success criteria

1. Walk away from spawn, reload → resume the same tile and facing
2. Existing dex progress survives v1 → v2 migration
3. Close mid-encounter → reopen on the map with no overlay
4. No Lake/Mountain unlock or daily-reward UI/logic is added in this phase

## Roadmap note

Phase 7 goal and success criteria should be rewritten to persistence-only. Unlocks and daily rewards are deferred (not part of this design); they may return as a later phase or milestone if needed.
