---
phase: 05-capture-flow
verified: 2026-07-26T14:55:00Z
status: human_needed
score: 10/10 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 9/10
  gaps_closed:
    - "Pressing Capture freezes the attempt, grades timing, rolls catch, then GradeFlash briefly shows the grade before BallShake plays (D-14)"
  gaps_remaining: []
  regressions: []
deferred:
  - truth: "BallShake shows a visible 1–3 shake animation (D-05 / D-30), not timer-only duration"
    addressed_in: "Phase 8"
    evidence: "Phase 8 goal: 'The game feels alive and rewarding for a 7-year-old, with sound and celebration on every meaningful moment' — visual shake/celebration polish fits that polish phase; catch outcome wiring already resolves before BallShake."
human_verification:
  - test: "Play one encounter, fail the first throw deliberately, and on the SECOND throw confirm the grade word (Perfect!/Great!/Good!/Miss!) flashes before the ball appears and shakes — on both throws, not just the first"
    expected: "Grade flash visibly precedes the ball on every throw, including retries"
    why_human: "The D-14 fix is proven at the DOM-commit level by MutationObserver tests, but perceived flash duration and ordering feel need a real browser/device (plan 05-05 human-check)"
  - test: "Encounter a common, answer the math question correctly, play the timing bar, land a catch"
    expected: "Feedback → timing with Math boost chip → grade flash → shake → Gotcha! Continue returns to map (no recap)"
    why_human: "Visual timing feel, grade→shake order, and kid-readable copy cannot be fully proven by unit tests alone"
  - test: "Force three failed throws (miss / bad luck)"
    expected: "Each fail shows Oh! It broke free! then a new throw; after third, kind flee card; no Run / berry / raw catch %"
    why_human: "Emotional tone and continuous loop feel need a real device/browser"
  - test: "Encounter a legendary (or rare) and compare band width / catch feel to a common"
    expected: "Narrower perfect zone; catches feel rare even with good timing"
    why_human: "Distribution tests prove odds; feel is subjective"
---

# Phase 5: Capture Flow Verification Report

**Phase Goal:** Player captures Pokémon through the timing-bar → roll loop using the capture bonus carried from Phase 4's education step; odds stay forgiving for commons and challenging for legendaries

**Verified:** 2026-07-26T14:55:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure (plan 05-05)
**Mode:** mvp (ROADMAP goal is outcome-form; User Flow Coverage uses the PLAN-rendered user story that maps the same outcome)

## Re-Verification Summary

Initial verification (2026-07-26T14:20:00Z) scored 9/10 with one BLOCKER: `EncounterOverlay`'s `gradeFlashDone` flag leaked across throws, mounting `BallShake` before `GradeFlash` on every shake after the first flash (D-14 violation, Truth #8). Plan 05-05 (gap closure) was executed. This re-verification confirms:

- **Gap closed:** Truth #8 now VERIFIED with full 3-level + behavioral evidence (below).
- **No regressions:** All 9 previously-verified truths spot-checked — artifacts exist, wiring intact, all 6 focused suites green (74 tests).

## User Flow Coverage

User story (from PLAN rendering of ROADMAP goal + CONTEXT):
«As a child who finished the math question, I want to throw with a timing bar and catch the Pokémon (or see it flee kindly after three tries), so that commons feel easy to catch and legendaries stay exciting.»

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| After math feedback | Timing screen with sprite, Math boost chip, Capture | `feedback` timer → `startTiming()`; Overlay mounts `TimingBar` with `captureBonus` | ✓ |
| Play timing bar | Indicator moves; commons wider bands than legendaries | `pingPong` + `timingBar.zones`; Capture freezes position → `gradeAt` | ✓ |
| Throw | Grade flash then ball shake to pre-rolled outcome | Roll in `capture()` before shake; keyed `ShakeSequence` guarantees flash-before-shake on EVERY throw (fixed by 05-05) | ✓ |
| Catch | Gotcha! {Name} was caught! + Continue | `CaughtCard` + `captureCopy.gotcha*` | ✓ |
| Miss with tries left | Oh! It broke free! then new timing throw | `FailBeat` → `startTiming()` / new `sweetSpotFor(attemptsUsed)` | ✓ |
| Three fails | It got away! / That's okay — you'll find another! | `FleeCard` + `toFlee` at `attemptsUsed >= 3` | ✓ |
| Outcome | Commons easy; legendaries stay hard | CATCH-05 distribution tests ≥0.7 common / ≤0.2 legendary | ✓ |

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | The capture flow consumes the education capture bonus already carried on the encounter session from Phase 4 and shows the player that it improved their chance | ✓ VERIFIED (regression check) | `useEncounterFlow.ts:137` passes `educationBonus: session.captureBonus` into `computeCatchChance`; `applyAnswer` writes `session.captureBonus`; TimingBar shows `captureCopy.mathBoost` |
| 2 | Player plays the timing-bar mini-game with generous windows for commons and tighter ones for legendaries, and accuracy visibly affects the result | ✓ VERIFIED (regression check) | `timingBar.zones` per-rarity widths; `gradeAt` + `cfg.timing[grade]`; `timing.test.ts` green |
| 3 | Capture roll accounts for ball type, berry use, education capture bonus, timing accuracy, and rarity — all from config | ✓ VERIFIED (regression check) | `computeCatchChance` + `captureModifiers.ts` intact; `capture.test.ts` green |
| 4 | Player can retry a failed capture, and after three fails the Pokémon flees with kind, non-punishing feedback | ✓ VERIFIED (regression check) | `onShakeComplete` → failBeat → `startTiming` while `attemptsUsed < 3`; else `toFlee`; `useEncounterFlow.test.ts` green |
| 5 | A child can reliably catch common Pokémon while legendaries remain a genuine chase | ✓ VERIFIED (regression check) | `capture.test.ts` CATCH-05 distribution suite green (≥0.7 common / ≤0.2 legendary) |
| 6 | Miss is a timing modifier that still rolls — never an auto-fail (D-07) | ✓ VERIFIED (regression check) | `timing.miss: -0.05` in config; test green |
| 7 | Equal timing grade yields equal chance across attempt indexes — no pity (D-25) | ✓ VERIFIED (regression check) | `computeCatchChance` has no attempt index; test green |
| 8 | Pressing Capture freezes the attempt, grades timing, rolls catch, then GradeFlash briefly shows the grade before BallShake plays (D-14) — **on every throw, including retries** | ✓ VERIFIED (gap closed) | `ShakeSequence.tsx` owns local `flashDone` (starts `false` per mount); Overlay renders `<ShakeSequence key={`${session.attemptsUsed}:${grade}`}>` at `EncounterOverlay.tsx:147-153`; `gradeFlashDone` removed from all source (only a comment in the test survives); `EncounterOverlay.test.tsx` MutationObserver regression proves BallShake mounts zero commits before GradeFlash on the second throw; suite green |
| 9 | Timing indicator ping-pongs continuously; Capture / Space / Enter; track tap does not capture; mash outside timing ignored (D-01/D-13/D-21) | ✓ VERIFIED (strengthened) | `TimingBar.test.tsx` green; `registerThrow` now early-returns unless `session && stage === 'timing'` (`encounterStore.ts:132`) — mash-lock hardened at the store (WR-03), covered by no-op test at `useEncounterFlow.test.ts:590` |
| 10 | Failed throw shows Oh! It broke free! then remounts timing with a new sweet spot; Caught/Flee Continue → recap when education wrong (D-26/D-29) | ✓ VERIFIED (regression check) | `FailBeat` + `sweetSpotFor(attemptsUsed)`; `continueFromResult`/`continueFromFlee` → `toRecap`; suites green |

**Score:** 10/10 truths verified

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Visible Poké Ball 1–3 shake animation (timer-only today) | Phase 8 | Phase 8 celebration / polish goal; outcome already pre-resolved before BallShake |

### Required Artifacts (gap-closure focus + regression)

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `pokemon-safari-app/src/components/encounter/ShakeSequence.tsx` | Child owning GradeFlash→BallShake handoff, local flashDone, remounted per throw | ✓ VERIFIED | 37 lines; exactly one `useState(false)` (`flashDone`); no store imports; presentational only |
| `pokemon-safari-app/src/components/encounter/EncounterOverlay.tsx` | Keyed ShakeSequence on shake stage; gradeFlashDone removed | ✓ VERIFIED | `stage === 'shake' && grade` renders `<ShakeSequence key={`${session.attemptsUsed}:${grade}`}>`; no `gradeFlashDone`, no direct GradeFlash/BallShake imports |
| `pokemon-safari-app/src/components/encounter/EncounterOverlay.test.tsx` | Regression: flash-before-shake across TWO consecutive throws | ✓ VERIFIED | Two `registerThrow` calls; MutationObserver counts BallShake `[data-ending]` mounts across shake-entry commits (`toBe(0)`); settled-DOM assertions per throw |
| `pokemon-safari-app/src/store/encounterStore.ts` | registerThrow stage invariant guard | ✓ VERIFIED | `if (!state.session || state.stage !== 'timing') return state` at line 132 |
| `pokemon-safari-app/src/hooks/useEncounterFlow.test.ts` | registerThrow no-op test | ✓ VERIFIED | "registerThrow is a no-op outside the timing stage (WR-03 / T-05-04)" at line 590 |
| All 16 previously-verified artifacts (capture.ts, timing.ts, timingBar.ts, captureModifiers.ts, TimingBar, GradeFlash, BallShake, CaughtCard, FleeCard, useEncounterFlow, tests, types, css) | Per initial verification | ✓ VERIFIED (existence + suite regression) | All present on disk; 6 suites / 74 tests green |

### Key Link Verification (gap-closure focus)

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `EncounterOverlay.tsx` | `ShakeSequence.tsx` | `stage === 'shake' && grade` renders keyed `<ShakeSequence>` | ✓ WIRED | Key = `${attemptsUsed}:${grade}` throw identity — remount before paint |
| `ShakeSequence.tsx` | `GradeFlash` → `BallShake` | local `flashDone: false` → GradeFlash; onComplete → BallShake | ✓ WIRED | Sequencing verified by MutationObserver test |
| `encounterStore.ts` | `registerThrow` | early return when `!state.session || state.stage !== 'timing'` | ✓ WIRED | No-op unit test green |
| `ShakeSequence.onComplete` | `onShakeComplete` (flow) | Overlay forwards `onBallShakeComplete` | ✓ WIRED | Retry/flee routing unchanged and green |
| All 11 previously-verified links (capture↔config, timing↔config, flow↔math, TimingBar↔bonus, flee/recap routing, etc.) | Per initial verification | ✓ WIRED (regression) | Suites green; education-bonus wiring re-confirmed at `useEncounterFlow.ts:137` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| ShakeSequence | `grade` / `caught` / `chance` | `session.lastGrade` / `lastCaught` / `lastChance` written by `registerThrow` from `doCapture`'s real roll | Yes — pre-resolved, not re-rolled | ✓ FLOWING |
| TimingBar | `captureBonus` | `session.captureBonus` from `applyAnswer`/`captureBonusFor` | Yes — 0.15 correct / 0 | ✓ FLOWING (regression) |
| `doCapture` | `chance`/`caught` | `computeCatchChance` + `rollCapture(rng)` | Yes | ✓ FLOWING (regression) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Full plan-05-05 verification suite (Overlay regression + flow + TimingBar + GameScreen + capture + timing) | `npx vitest run src/components/encounter/EncounterOverlay.test.tsx src/hooks/useEncounterFlow.test.ts src/components/encounter/TimingBar.test.tsx src/screens/GameScreen.test.tsx src/game/capture.test.ts src/game/timing.test.ts` | 6 files, 74 tests passed | ✓ PASS |
| D-14 second-throw ordering regression exists and is commit-level | Read `EncounterOverlay.test.tsx` — MutationObserver over shake-entry commits, `ballShakeMountCount(records)).toBe(0)` | Genuine transient-catching test (settled-DOM alone could not fail) | ✓ PASS |
| `gradeFlashDone` eliminated | `grep -rn "gradeFlashDone" src/` | Only one comment line in the test file; zero source occurrences | ✓ PASS |
| TDD commits exist | `git cat-file -t d269600 2cbb4e2` | Both are commits (RED then GREEN) | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase probes declared | SKIPPED |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| CATCH-02 | 05-01, 05-02, 05-03, 05-05 | Timing-bar mini-game; accuracy improves chance; generous commons / harder legendaries | ✓ SATISFIED | Timing math + TimingBar + D-14 flash-then-shake now correct on every throw |
| CATCH-03 | 05-01, 05-02 | Roll uses ball, berry, education, timing, rarity from config | ✓ SATISFIED | `computeCatchChance` + `captureModifiers` (regression green) |
| CATCH-04 | 05-04, 05-05 | Retry; flee after 3 fails with kind feedback | ✓ SATISFIED | Retry loop reads correctly with fixed flash ordering; `registerThrow` guard prevents attempt inflation |
| CATCH-05 | 05-01, 05-04 | Commons easy; legendaries difficult | ✓ SATISFIED | Distribution unit tests green |

No orphaned Phase 5 requirement IDs in REQUIREMENTS.md beyond CATCH-02…05 (all claimed by plans).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `BallShake.tsx` / `index.css` | — | Timer-only shakes; no animation | ⚠️ Warning | Deferred to Phase 8 polish (deferred item, unchanged) |
| `HandoffStub.tsx` | file retained | Deprecated stub file | ℹ️ Info | Not mounted from Overlay; residual |
| `timingBar.sweetSpotJitter` | unused in prod | Dead config without rng | ℹ️ Info | Offsets still vary by attempt |

Previous blockers resolved: stale `gradeFlashDone` (fixed by keyed ShakeSequence); `registerThrow` missing stage guard (warning, now hardened). No `TBD`/`FIXME`/`XXX` debt markers in any file touched by 05-05.

### Human Verification Required

### 1. Second-throw grade flash ordering (05-05 plan human-check)

**Test:** Play one encounter, fail the first throw deliberately, and on the SECOND throw confirm the grade word (Perfect!/Great!/Good!/Miss!) flashes before the ball appears and shakes — on both throws, not just the first.
**Expected:** Grade flash visibly precedes the ball on every throw, including retries.
**Why human:** The fix is proven at the DOM-commit level by the MutationObserver test, but perceived flash duration and ordering feel need a real browser/device.

### 2. Happy-path catch with math boost

**Test:** Encounter a common, answer the math question correctly, play the timing bar, land a catch.
**Expected:** Feedback → timing with Math boost chip → grade flash → shake → Gotcha! Continue returns to map (no recap).
**Why human:** Visual timing feel, grade→shake order, and kid-readable copy cannot be fully proven by unit tests alone.

### 3. Retry then flee kindness

**Test:** Force three failed throws (miss / bad luck).
**Expected:** Each fail shows Oh! It broke free! then a new throw; after third, kind flee card; no Run / berry / raw catch %.
**Why human:** Emotional tone and continuous loop feel need a real device/browser.

### 4. Legendary hardness (spot)

**Test:** Encounter a legendary (or rare) and compare band width / catch feel to a common.
**Expected:** Narrower perfect zone; catches feel rare even with good timing.
**Why human:** Distribution tests prove odds; feel is subjective.

### Gaps Summary

No gaps remain. The single blocker from the initial verification — stale `gradeFlashDone` inverting the D-14 GradeFlash→BallShake order on retries — is closed by plan 05-05: sequencing state now lives in a `ShakeSequence` child keyed on throw identity (`${attemptsUsed}:${grade}`), so the reset happens via remount before paint and cannot leak. A commit-level MutationObserver regression test locks the second-throw ordering, and `registerThrow` gained a `stage === 'timing'` invariant guard closing the WR-03 warning as well. All 9 previously-verified truths regression-checked with zero failures (74 tests green across 6 suites).

All automated checks pass; phase goal achievement now awaits the four human playtest items above (visual feel, tone, and ordering perception on a real device).

---

_Verified: 2026-07-26T14:55:00Z_
_Verifier: Claude (gsd-verifier)_
