---
phase: 6
slug: pok-dex
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-26
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                |
| ---------------------- | ---------------------------------------------------- |
| **Framework**          | vitest                                               |
| **Config file**        | `pokemon-safari-app/vitest.config.ts` (from Phase 1) |
| **Quick run command**  | `cd pokemon-safari-app && npx vitest run`            |
| **Full suite command** | `cd pokemon-safari-app && npx vitest run`            |
| **Estimated runtime**  | ~15 seconds                                          |

---

## Sampling Rate

- **After every task commit:** Run `cd pokemon-safari-app && npx vitest run`
- **After every plan wave:** Run `cd pokemon-safari-app && npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID   | Plan | Wave | Requirement  | Threat Ref | Secure Behavior                                                         | Test Type   | Automated Command                                                                 | File Exists | Status     |
| --------- | ---- | ---- | ------------ | ---------- | ----------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------- | ----------- | ---------- |
| 06-01-T1  | 01   | 1    | DEX-01/02/03 | T-06-01    | Wave 0 RED: dex reducers, save sanitize, flavor, relativeDay, config    | unit        | `cd pokemon-safari-app && npx vitest run src/game/dex.test.ts src/services/save.test.ts src/utils/relativeDay.test.ts src/services/pokeapi/flavorText.test.ts src/data/config-surface.test.ts` | ❌ W0       | ⬜ pending |
| 06-01-T2  | 01   | 1    | DEX-01/03    | T-06-02    | Wave 0 RED: dexStore debounce, DexScreen grid/stub, DexTile a11y        | unit+component | `cd pokemon-safari-app && npx vitest run src/store/dexStore.test.ts src/screens/DexScreen.test.tsx src/components/dex/DexTile.test.tsx` | ❌ W0       | ⬜ pending |
| 06-02-T1  | 02   | 2    | DEX-01/02    | T-06-03    | save round-trip + sanitize; pure markSeen/recordCatch/dexTileState      | unit        | `cd pokemon-safari-app && npx vitest run src/game/dex.test.ts src/services/save.test.ts` | ❌ W0       | ⬜ pending |
| 06-02-T2  | 02   | 2    | DEX-02       | T-06-05    | debounced SAVE_KEY flush, quota soft-fail, config knobs                 | unit        | `cd pokemon-safari-app && npx vitest run src/store/dexStore.test.ts src/data/config-surface.test.ts src/game/dex.test.ts src/services/save.test.ts` | ❌ W0       | ⬜ pending |
| 06-05-T1  | 05   | 2    | DEX-03       | T-06-13    | Emerald-first flavor selection + D-17 sanitizer                         | unit        | `cd pokemon-safari-app && npx vitest run src/services/pokeapi/flavorText.test.ts` | ❌ W0       | ⬜ pending |
| 06-05-T2  | 05   | 2    | DEX-03       | T-06-09    | CACHE_VERSION 2 envelope validation + v2 helper seeds stay warm         | unit+component | `cd pokemon-safari-app && npx vitest run src/services/pokeapi src/screens/BootScreen.test.tsx src/App.test.tsx` | ✅ extend   | ⬜ pending |
| 06-03-T1  | 03   | 3    | DEX-01       | T-06-02    | silhouette sprite + tile states, no name leak on unknown tiles          | component   | `cd pokemon-safari-app && npx vitest run src/components/dex/DexTile.test.tsx src/components/PokemonSprite.test.tsx` | ❌ W0       | ⬜ pending |
| 06-03-T2  | 03   | 3    | DEX-01/03    | T-06-04    | 151-tile grid, sticky Seen/Caught header, leak-free stub sheet          | component   | `cd pokemon-safari-app && npx vitest run src/screens/DexScreen.test.tsx src/components/dex/DexTile.test.tsx src/game/dex.test.ts` | ❌ W0       | ⬜ pending |
| 06-04-T1  | 04   | 4    | DEX-02       | T-06-12    | EncounterSession.shiny threaded to encounter sprites                    | component   | `cd pokemon-safari-app && npx vitest run src/components/encounter`                | ✅ extend   | ⬜ pending |
| 06-04-T2  | 04   | 4    | DEX-01/02    | T-06-06    | seen-on-appear + recordCatch on Gotcha via seeded Rng; Dex reflects      | unit+component | `cd pokemon-safari-app && npx vitest run src/hooks/useEncounterFlow.test.ts src/screens/DexScreen.test.tsx src/store/dexStore.test.ts` | ✅ extend   | ⬜ pending |
| 06-06-T1  | 06   | 5    | DEX-01/03    | T-06-08    | formatRelativeDay boundaries + caught lore UI (no HTML injection path)  | unit+component | `cd pokemon-safari-app && npx vitest run src/utils/relativeDay.test.ts src/components/dex/DexTile.test.tsx` | ❌ W0       | ⬜ pending |
| 06-06-T2  | 06   | 5    | DEX-01/02/03 | T-06-05    | Dex quota note copy + phase gate; full suite green                      | component   | `cd pokemon-safari-app && npm test`                                               | ✅ extend   | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [x] Failing unit tests for the dex reducer/service (seen/caught transitions) — DEX-02/DEX-03 — `src/game/dex.test.ts`
- [x] Failing unit tests for flavor-text selection + sanitizer — DEX-03 — `src/services/pokeapi/flavorText.test.ts`
- [x] Failing unit tests for SaveEnvelope dex-slice read/write round-trip + QuotaExceededError fallback — `src/services/save.test.ts`
- [x] Failing unit tests for relative-date formatter — `src/utils/relativeDay.test.ts`
- [x] Failing UI/store tests — `src/store/dexStore.test.ts`, `src/screens/DexScreen.test.tsx`, `src/components/dex/DexTile.test.tsx`
- [x] Existing vitest infrastructure (from Phase 1) covers framework — no install needed

_Wave 0 RED suites authored in plan 06-01; Status stays pending/red and `nyquist_compliant` false until 06-06 phase gate._

---

## Manual-Only Verifications

| Behavior                                         | Requirement | Why Manual                                              | Test Instructions                                                                                                  |
| ------------------------------------------------ | ----------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Silhouette → reveal visual on first catch        | DEX-02      | Visual/CSS-filter appearance not asserted by unit tests | Catch a species, confirm its grid tile flips from silhouette to sprite and detail sheet reveals name/sprite/flavor |
| Sticky header stays visible while scrolling grid | DEX-01      | Scroll/layout behavior                                  | Scroll the 151-entry grid; confirm Seen/Caught header remains pinned                                               |
| Modal/sheet detail overlay opens over grid       | DEX-01      | Overlay interaction                                     | Tap a tile; confirm detail opens as overlay (no route change) and closes back to grid                              |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending — planner populated verification map for plans 06-01 … 06-06; executor sets `nyquist_compliant: true` after the 06-06 full suite is green
