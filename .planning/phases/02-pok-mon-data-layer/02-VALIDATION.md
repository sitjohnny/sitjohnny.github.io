---
phase: 2
slug: pok-mon-data-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-25
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                       |
| ---------------------- | ----------------------------------------------------------- |
| **Framework**          | Vitest 4.x + @testing-library/react + jsdom                 |
| **Config file**        | `pokemon-safari-app/vite.config.ts`                         |
| **Quick run command**  | `cd pokemon-safari-app && npm test -- src/services/pokeapi` |
| **Full suite command** | `cd pokemon-safari-app && npm test`                         |
| **Estimated runtime**  | ~15 seconds                                                 |

---

## Sampling Rate

- **After every task commit:** Run `cd pokemon-safari-app && npm test -- src/services/pokeapi`
- **After every plan wave:** Run `cd pokemon-safari-app && npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior          | Test Type | Automated Command                                   | File Exists | Status     |
| ------- | ---- | ---- | ----------- | ---------- | ------------------------ | --------- | --------------------------------------------------- | ----------- | ---------- |
| 02-01-T1 | 01   | 1    | DATA-01     | T-02-02    | Versioned cache write    | unit      | `npm test -- src/services/pokeapi/cache.test.ts`    | ❌ W0       | ⬜ pending |
| 02-01-T1 | 01   | 1    | DATA-02     | —          | Zero fetch after hydrate | unit      | `npm test -- src/services/pokeapi/cache.test.ts`    | ❌ W0       | ⬜ pending |
| 02-01-T1 | 01   | 1    | DATA-04     | T-02-01    | Separate key; no clear() | unit      | `npm test -- src/services/pokeapi/keys.test.ts`     | ❌ W0       | ⬜ pending |
| 02-01-T2 | 01   | 1    | BOOT-04     | —          | Progress + retry         | component | `npm test -- src/screens/BootScreen.test.tsx`       | ❌ W0       | ⬜ pending |
| 02-01-T2 | 01   | 1    | BOOT-04     | —          | Game gate when not ready | component | `npm test -- src/screens/GameScreen.test.tsx`       | ❌ W0       | ⬜ pending |
| 02-01-T2 | 01   | 1    | DATA-01     | —          | Sprite pixel + fallback  | component | `npm test -- src/components/PokemonSprite.test.tsx` | ❌ W0       | ⬜ pending |
| 02-02-T1 | 02   | 2    | DATA-01/02/04 | T-02-01/02/04/05 | Implement cache/client | unit | `npm test -- src/services/pokeapi` | ❌ W0→impl | ⬜ pending |
| 02-02-T2 | 02   | 2    | BOOT-04     | —          | Boot progress + route    | component | `npm test -- src/screens/BootScreen.test.tsx`       | ❌ W0→impl | ⬜ pending |
| 02-03-T1 | 03   | 3    | BOOT-04     | T-02-06    | Try again resume         | component | `npm test -- src/screens/BootScreen.test.tsx`       | ❌ W0→impl | ⬜ pending |
| 02-03-T2 | 03   | 3    | BOOT-04     | —          | Game gate                | component | `npm test -- src/screens/GameScreen.test.tsx`       | ❌ W0→impl | ⬜ pending |
| 02-04-T1 | 04   | 4    | DATA-01     | T-02-04    | Sprite pixel + shiny     | component | `npm test -- src/components/PokemonSprite.test.tsx` | ❌ W0→impl | ⬜ pending |
| 02-04-T2 | 04   | 4    | DATA-02/BOOT-04 | T-02-05 | Quota note + sync Game sample | mixed | `npm test -- --run` | ❌ W0→impl | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `pokemon-safari-app/src/services/pokeapi/cache.test.ts` — DATA-01/02/04, D-03, D-06, D-10
- [ ] `pokemon-safari-app/src/services/pokeapi/client.test.ts` — concurrency + DTO shaping
- [ ] `pokemon-safari-app/src/services/pokeapi/keys.test.ts` — key isolation
- [ ] `pokemon-safari-app/src/screens/BootScreen.test.tsx` — BOOT-04 progress + retry
- [ ] `pokemon-safari-app/src/screens/GameScreen.test.tsx` — D-02 gate
- [ ] `pokemon-safari-app/src/components/PokemonSprite.test.tsx` — pixel class + fallback
- [ ] Test helpers: stub `fetch` + seed/clear **only** poke-cache key

---

## Manual-Only Verifications

| Behavior                                        | Requirement          | Why Manual              | Test Instructions                                                                     |
| ----------------------------------------------- | -------------------- | ----------------------- | ------------------------------------------------------------------------------------- |
| Zero PokéAPI calls during Game after warm cache | DATA-02              | Network-tab observation | Warm cache → open Game → DevTools Network: filter `pokeapi.co` → expect zero requests |
| Crisp nearest-neighbor sprites                  | DATA-01 / success #4 | Visual                  | Render sprite at 2x/3x — edges stay pixelated, not blurry                             |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
