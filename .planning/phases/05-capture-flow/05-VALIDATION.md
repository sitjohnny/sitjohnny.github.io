---
phase: 5
slug: capture-flow
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-26
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| **Framework**          | Vitest 4.x + @testing-library/react + jsdom                                                |
| **Config file**        | `pokemon-safari-app/vite.config.ts` + `src/test/setup.ts`                                  |
| **Quick run command**  | `cd pokemon-safari-app && npx vitest run src/game/capture.test.ts src/game/timing.test.ts` |
| **Full suite command** | `cd pokemon-safari-app && npm test`                                                        |
| **Estimated runtime**  | ~5–15 seconds (quick); full suite varies                                                   |

---

## Sampling Rate

- **After every task commit:** Run quick vitest on changed test file(s)
- **After every plan wave:** Run `cd pokemon-safari-app && npm test`
- **Before `/gsd-verify-work`:** Full suite must be green + `tsc -b` clean
- **Max feedback latency:** 15 seconds (quick); full suite as needed

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior                        | Test Type   | Automated Command                                            | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | -------------------------------------- | ----------- | ------------------------------------------------------------ | ----------- | ---------- |
| 05-01-T1 | 01   | 1    | CATCH-03    | T-05-01    | Odds only from `data/`                 | unit        | `npx vitest run src/game/capture.test.ts`                    | ✅ exists   | ✅ green |
| 05-01-T1 | 01   | 1    | CATCH-02    | —          | N/A                                    | unit        | `npx vitest run src/game/timing.test.ts`                     | ✅ exists   | ✅ green |
| 05-01-T2 | 01   | 1    | CATCH-05    | —          | N/A                                    | unit        | `npx vitest run src/game/capture.test.ts`                    | ✅ exists   | ✅ green |
| 05-01-T2 | 01   | 1    | DATA-03     | T-05-01    | No rate literals / Math.random in game | unit        | `npx vitest run src/data/config-surface.test.ts`             | ✅ exists   | ✅ green |
| 05-02-T1 | 02   | 2    | CATCH-03    | T-05-04    | Capture gated to timing stage          | integration | `npx vitest run src/hooks/useEncounterFlow.test.ts`          | ✅ exists   | ✅ green |
| 05-03-T1 | 03   | 3    | CATCH-02    | T-05-04    | Mash lock during flash/shake           | component   | `npx vitest run src/components/encounter/TimingBar.test.tsx` | ✅ exists   | ✅ green |
| 05-04-T1 | 04   | 4    | CATCH-04    | T-05-04    | Attempt counter single-writer          | integration | `npx vitest run src/hooks/useEncounterFlow.test.ts`          | ✅ exists   | ✅ green |
| 05-04-T2 | 04   | 4    | CATCH-04    | T-05-04    | Fail beat → flee; D-29 recap           | integration | `npx vitest run src/hooks/useEncounterFlow.test.ts src/game/capture.test.ts src/components/encounter/TimingBar.test.tsx src/screens/GameScreen.test.tsx` | ✅ exists   | ✅ green |
| 05-04-T2 | 04   | 4    | CATCH-05    | T-05-01    | Distribution gates unchanged           | unit        | `npx vitest run src/game/capture.test.ts`                    | ✅ exists   | ✅ green |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [x] `src/game/capture.test.ts` — stubs for CATCH-03, CATCH-05, D-25
- [x] `src/game/timing.test.ts` — stubs for CATCH-02 grading + sweet-spot
- [x] `src/components/encounter/TimingBar.test.tsx` — Capture lock / keyboard (uses `flushFrames`)
- [x] Extend `src/hooks/useEncounterFlow.test.ts` — timing→shake→result/flee + recap routing
- [x] Extend `src/data/config-surface.test.ts` — `captureModifiers.timing` + `timingBar` exports
- [x] Framework install: none — Vitest infra already present

---

## Manual-Only Verifications

| Behavior                                     | Requirement     | Why Manual                                                  | Test Instructions                                                                  |
| -------------------------------------------- | --------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Kid-friendly commons / hard legendaries feel | CATCH-05        | Tunable feel; distribution tests cover bounds but not "fun" | Playtest commons vs legendary after Phase 5; full kid playtest deferred to Phase 8 |
| Timing-bar visual ping-pong + reduced-motion | CATCH-02 / D-17 | Motion preference is visual                                 | Enable prefers-reduced-motion; confirm slower ping-pong, same Capture skill        |
| Kind flee after three fails (no punishing red) | CATCH-04 / UX-02 | Visual chrome                                               | Fail three throws; confirm "It got away!" + kind body; Continue → map or recap     |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s (quick)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** phase 05 automated rows green after 05-04
