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
| 06-02-T1  | 02   | 2    | DEX-02       | T-06-03    | save round-trip + quota soft-fail; pure markSeen/recordCatch            | unit        | `cd pokemon-safari-app && npx vitest run src/game/dex.test.ts src/services/save.test.ts src/store/dexStore.test.ts` | ❌ W0       | ⬜ pending |
| 06-02-T2  | 02   | 2    | DEX-01/03    | T-06-04    | 151 silhouette grid, sticky header, stub sheet, no name leak            | component   | `cd pokemon-safari-app && npx vitest run src/screens/DexScreen.test.tsx src/components/dex/DexTile.test.tsx src/components/PokemonSprite.test.tsx` | ❌ W0       | ⬜ pending |
| 06-03-T1  | 03   | 3    | DEX-02       | T-06-SC    | seen-on-appear + recordCatch on Gotcha + shinyRate via Rng              | unit        | `cd pokemon-safari-app && npx vitest run src/hooks/useEncounterFlow.test.ts src/data/config-surface.test.ts` | ✅ extend   | ⬜ pending |
| 06-03-T2  | 03   | 3    | DEX-01/02    | T-06-05    | debounced SAVE_KEY flush + caught tile/count update                     | unit+component | `cd pokemon-safari-app && npx vitest run src/store/dexStore.test.ts src/screens/DexScreen.test.tsx src/hooks/useEncounterFlow.test.ts` | ❌ W0       | ⬜ pending |
| 06-04-T1  | 04   | 4    | DEX-03       | T-06-09    | flavor select/sanitize + CACHE_VERSION 2 + formatRelativeDay            | unit        | `cd pokemon-safari-app && npx vitest run src/services/pokeapi/flavorText.test.ts src/utils/relativeDay.test.ts src/services/pokeapi/keys.test.ts src/services/pokeapi/cache.test.ts` | ❌ W0       | ⬜ pending |
| 06-04-T2  | 04   | 4    | DEX-01/02/03 | T-06-08    | caught detail lore + QuotaNote dex copy; full suite green               | component   | `cd pokemon-safari-app && npm test`                                               | ❌ W0       | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] Failing unit tests for the dex reducer/service (seen/caught transitions) — DEX-02/DEX-03 — `src/game/dex.test.ts`
- [ ] Failing unit tests for flavor-text selection + sanitizer — DEX-03 — `src/services/pokeapi/flavorText.test.ts`
- [ ] Failing unit tests for SaveEnvelope dex-slice read/write round-trip + QuotaExceededError fallback — `src/services/save.test.ts`
- [ ] Failing unit tests for relative-date formatter — `src/utils/relativeDay.test.ts`
- [ ] Failing UI/store tests — `src/store/dexStore.test.ts`, `src/screens/DexScreen.test.tsx`, `src/components/dex/DexTile.test.tsx`
- [ ] Existing vitest infrastructure (from Phase 1) covers framework — no install needed

_Existing infrastructure covers the framework; Wave 0 adds the failing test stubs above (plan 06-01)._

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

**Approval:** pending — planner populated verification map; executor sets `nyquist_compliant: true` after 06-04 full suite green
