# Remove Items and Pack Design

**Date:** 2026-07-26  
**Status:** Approved

## Goal

Remove the item / inventory fantasy from Pokémon Safari. Grass never reports a found item, and the shell no longer exposes a Pack surface that implies a bag.

## Scope

**In scope**

- Drop the `item` grass outcome and fold its weight into `nothing`
- Delete item toast UI and store/flow/timing wiring
- Remove Pack route, screen, and bottom-nav entry
- Update tests and Phase 7 roadmap wording so they no longer promise inventory

**Out of scope**

- Implementing Phase 7 (save migrations, biome unlocks, daily rewards)
- Ball types, inventory save fields, or ball selection during capture
- Changing Pokémon / rare / legendary encounter rates (except by removing `item`)

## Grass outcomes

New weights still sum to 100:

| Outcome   | Before | After     |
|-----------|--------|-----------|
| pokemon   | 45     | 45        |
| nothing   | 25     | **45**    |
| item      | 20     | **removed** |
| rare      | 8      | 8         |
| legendary | 2      | 2         |

Remove `'item'` from `GrassOutcome` and from the encounter resolution union. The resolver must not keep a dead `item` key that silently maps to `nothing`.

## Encounter flow

- Delete `ItemToast` and all `itemToastVisible` / `showItemToast` / `hideItemToast` wiring
- Delete `encounterTimingMs.itemToast`
- Remove the `resolution.kind === 'item'` branch in `useEncounterFlow`
- `nothing` remains a quiet miss (no overlay, no toast), now more common
- Post-encounter Pokémon immunity still arms only after Pokémon-band encounters, not after `nothing`

## Navigation

Bottom nav becomes four tabs: **Home**, **Game**, **Dex**, **Settings**.

Delete:

- `/pack` route in `App`
- `PackScreen`
- Pack nav entry and `PackIcon` in `BottomNav`

Keep boot copy that says “packing…” — that is load progress, not inventory. Drop comments that list Pack as a reachable destination where they are only documenting chrome.

## Planning docs

Update Phase 7 roadmap language:

- Rename away from “Items”
- Remove success criteria that require inventory, grass item rolls, or ball/berry selection
- Keep save, biome unlocks, and (if retained) a non-inventory daily reward as future Phase 7 work — do not implement them here

Daily reward must not be described as granting balls/berries while items do not exist. Exact daily redesign is deferred to Phase 7 planning.

## Testing

Update or remove tests that assume:

- `item` in `grassOutcomeWeights` / outcome lists
- `itemToastVisible` or ItemToast UI
- Five BottomNav links including Pack
- App navigation to Pack

Config-surface, encounter resolver, encounter-flow, BottomNav, and App tests must match the four-tab / no-item model.

## Error handling

No new failure modes. Removing Pack leaves no orphan inventory state in the live save schema today. Hash links to `#/pack` may 404 or fall through to the existing router miss behavior; no special redirect is required for this cut.
