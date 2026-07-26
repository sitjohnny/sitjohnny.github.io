# Phase 5: Capture Flow - Research

**Researched:** 2026-07-26
**Domain:** Client-side game logic (seeded RNG capture math + timing-bar mini-game), React encounter UI, config-driven odds
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Copied verbatim from `05-CONTEXT.md`:

- **D-01:** Timing indicator moves **continuously**; player presses **Capture** to stop it.
- **D-02:** Grades are **Perfect / Great / Good / Miss**; each applies a timing modifier to capture chance.
- **D-03:** Final chance combines **rarity + education capture bonus + timing** (plus ball/berry slots — see odds). User said "RPS modifier"; Phase 4 replaced RPS with education — use **`session.captureBonus` / `educationCaptureBonus`**, never rebuild RPS.
- **D-04:** After **three failed** capture attempts the Pokémon **flees**.
- **D-05:** Display **Poké Ball shake** animation and clear **success/failure**.
- **D-06:** Phase **stops** after the capture outcome path (no dex/save/inventory UI beyond what's required for the roll).
- **D-07:** **Miss = worst timing modifier only** — still rolls; does not auto-fail the throw.
- **D-08:** **Rarity scales zone widths** (Perfect/Great/Good shrink, Miss grows for rare/legendary); **indicator speed stays constant**.
- **D-09:** Indicator **ping-pongs** continuously (left↔right) until Capture.
- **D-10:** **Off-center sweet spot** — Perfect is not dead-center so rhythm varies by direction.
- **D-11:** **Color bands only** on the bar (no Perfect/Great/Good text labels); grade shown after press.
- **D-12:** Sweet spot **repositions after every failed attempt**.
- **D-13:** **Large Capture button** under the bar; **Space / Enter** also fire it (not tap-anywhere on the bar).
- **D-14:** After press, **briefly flash** Perfect/Great/Good/Miss, then start the shake.
- **D-15:** Keep a visible **math/education boost chip** on the timing screen (e.g. "Math boost: +15%").
- **D-16:** Show **attempts remaining** during the bar (e.g. "Throw X of 3" or ball icons).
- **D-17:** `prefers-reduced-motion` → **slower ping-pong**, less flashy transitions; same Capture skill (not static zone-tapping).
- **D-18:** Screen composition: **Pokémon sprite + timing bar + Capture button**.
- **D-19:** Indicator **starts moving immediately** when the timing screen mounts (no ready pause / arm step).
- **D-20:** On Capture, indicator **freezes in place**; that position is the grade.
- **D-21:** **Ignore mashed Capture** during grade flash / shake until the attempt resolves.
- **D-22:** Formula is **additive**, then **clamp to [0, 1]** (0–100%): `rarityBase + education + timing + ball + berry`, then RNG roll. Pure `game/` logic; values from `data/`.
- **D-23:** Phase 5 always uses **default Poké Ball** and **no berry**; no ball/berry picker UI. Config slots remain so Phase 7 can wire inventory without changing the formula shape.
- **D-24:** **No raw catch %** shown to the player — qualitative cues only (boost chip, grade flash, rarity). Boost chip may still show +15% as a modifier label, not the final chance.
- **D-25:** **Same odds each throw** within an encounter — only the timing grade varies (no escalating pity / guaranteed third throw).
- **D-26:** On fail with attempts left: **short fail beat** → remount timing bar (new sweet spot). No explicit "Try Again" gate.
- **D-27:** **No Run / berry actions between throws** this phase.
- **D-28:** After three fails: **kind flee card** + large **Continue** (non-punishing copy per CATCH-04 / UX-02).
- **D-29:** Wrong-answer **recap after the encounter ends**: success or flee card → Continue → recap (wrong answers only) → map. Preserves Phase 4 D-13/D-14.
- **D-30:** **Classic 1–3 shakes** as flavor animation (shake count is presentation, not a second RNG gate).
- **D-31:** **Capture roll resolves before the shake starts**; animation plays the known success/fail ending.
- **D-32:** Success = **Caught card** (sprite + "Gotcha! [Name] was caught!" + large Continue); shiny callout if applicable. Full celebration polish deferred to Phase 8.
- **D-33:** On fail after shakes: **ball opens / Pokémon pops out**, then fail beat → retry bar or flee card.

### Claude's Discretion

- Exact Perfect/Great/Good/Miss **modifier numbers** and per-rarity **zone width tables** in `data/` (kid-friendly; commons easy, legendaries hard — CATCH-05)
- Exact indicator **period / speed** (and reduced-motion scale factor)
- Exact off-center sweet-spot **placement algorithm** (must vary by attempt; config-tunable)
- Exact **grade-flash / fail-beat / shake** durations (extend `encounterTimingMs` or sibling config)
- Shake-count **mapping** from near-miss vs success (flavor only; must not contradict the pre-resolved roll)
- Exact flee / fail / Gotcha **copy pools**
- Whether attempt UI is text ("Throw 1 of 3") vs ball icons
- How rarity bands map from existing `RarityBand` / `captureModifiers.rarity`
- Seeded-RNG approach for the capture roll (must be unit-testable like Phase 4 grass rolls)

### Deferred Ideas (OUT OF SCOPE)

- Ball / Great Ball / Berry **selection UI** and inventory consumption (Phase 7, PROG-03/04)
- Run-away button between throws (explicitly declined for Phase 5)
- Full celebration / SFX for catch (Phase 8, AUDIO-01 / UX-02)
- Pokédex seen/caught updates (Phase 6) — Phase 5 may stub a session flag if needed for handoff, but no dex UI
- Pity / escalating odds on later throws (explicitly declined)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CATCH-02 | Player plays a timing-bar mini-game; accuracy further improves capture chance (generous windows for commons; harder for legendaries) | New `game/timing.ts` pure grader + `data/timingBar.ts` per-rarity zone tables (Standard Stack, Pattern 2). Indicator via rAF/CSS ping-pong (Pattern 3). |
| CATCH-03 | Capture roll uses ball type, berry (if used), education capture bonus, timing accuracy, and rarity from config | New `game/capture.ts` additive `computeCatchChance` + `rollCapture` consuming `data/captureModifiers.ts` (already has rarity/ball/berry/education slots) + `session.captureBonus` (Pattern 1). |
| CATCH-04 | Player can retry a failed capture; after three failed attempts the Pokémon flees with kind, non-punishing feedback | Session `attemptsUsed` counter + extended `EncounterStage` (`timing`→`shake`→`result`/`flee`); flee card + Continue → recap path (Architecture, Pattern 4). |
| CATCH-05 | Common Pokémon are easy to catch; legendary Pokémon remain difficult | Additive odds with `captureModifiers.rarity` (common 0.6 / rare 0.3 / legendary 0.1) + per-rarity zone widths; verified by seeded-RNG distribution tests (Validation Architecture). |
</phase_requirements>

## Summary

Phase 5 is an **entirely internal** feature: no new npm packages, no network, no external services. Every capability is built from patterns already proven in Phases 3–4 of this repo — a seeded, injectable `Rng` (Mulberry32) driving **pure `game/` logic**, tuning values in **`data/` config**, a **Zustand `encounterStore` stage machine**, and a **full-screen React `EncounterOverlay`** that switches on stage. Phase 5 replaces the Phase 4 `handoff` stub (`HandoffStub.tsx` / `'handoff'` stage) with a timing-bar → capture-roll → shake → result/flee loop.

The two hard problems are (1) the **capture math** — an additive-then-clamped `[0,1]` chance combining rarity base, education bonus, timing modifier, ball, and berry, rolled once per throw against the injected `Rng`; and (2) the **timing-bar mini-game** — a continuously ping-ponging indicator whose freeze position maps to a Perfect/Great/Good/Miss grade through per-rarity zone-width tables. Both must be split into pure, unit-testable functions (`game/capture.ts`, `game/timing.ts`) with all numbers living in `data/` (extend `captureModifiers.ts`, add a timing-bar config), exactly like `game/encounter.ts` + `data/rates.ts` from Phase 4. The indicator animation should be driven by an rAF loop (or time-derived position) writing an imperative transform + CSS var — never per-frame React state — mirroring `useExploreLoop`; the grade is read from a numeric position ref at Capture time so the pure grader stays deterministic.

The retry/flee/recap flow extends the existing stage machine and the module-level flow functions in `useEncounterFlow.ts`. Key correctness constraints from CONTEXT: the roll **resolves before** the shake animation (shake is flavor only), Capture is **locked** during grade-flash/shake, odds are **identical each throw** (only timing varies — no pity), and after success or flee the **Continue → wrong-answer-recap → map** path from Phase 4 (D-29) must be preserved.

**Primary recommendation:** Add two pure modules — `src/game/capture.ts` (additive chance + seeded roll) and `src/game/timing.ts` (position→grade + attempt-varying sweet-spot) — plus `src/data/timingBar.ts` (per-rarity zones, period, sweet-spot config) and timing modifiers on `captureModifiers.ts`; extend `EncounterStage`/`EncounterSession` for attempts and grade; build the timing/shake/result/flee UI as React components under `components/encounter/`; drive the indicator with an rAF/CSS ping-pong (imperative, reduced-motion = slower); and cover the math and grading with seeded Vitest tests in the Phase 4 style. No external dependencies.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Capture chance math (additive + clamp) | Pure `game/` logic | `data/` config | DATA-03 + testability; no React/DOM/RNG-source coupling. Mirrors `game/encounter.ts`. |
| Capture roll (RNG draw vs chance) | Pure `game/` logic | `utils/rng` | Injected `Rng` keeps it deterministic and unit-testable (Phase 4 pattern). |
| Timing grade (position → Perfect/Great/Good/Miss) | Pure `game/` logic | `data/` zone tables | Grade must be reproducible from a numeric position independent of the animation. |
| Sweet-spot placement (varies by attempt) | Pure `game/` logic | `data/` config | Config-tunable, deterministic given attempt index (+ optional seed). |
| Indicator ping-pong animation | React component (imperative rAF / CSS) | `hooks/` | Per-frame motion must stay out of React state (MAP-04 precedent, `useExploreLoop`). |
| Stage sequencing (timing→shake→result/flee) | Zustand `encounterStore` + `useEncounterFlow` | React overlay | Existing session state machine owns transitions. |
| Result / flee / shake presentation | React `components/encounter/*` | `data/` copy pools | UI-only; reads pre-resolved outcome (roll already decided). |
| Odds / zone / timing tuning values | `data/` config | — | DATA-03: no rates in components (enforced by `config-surface.test.ts`). |

## Standard Stack

### Core

All already installed and in active use — **no new packages**.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.8 | Timing bar, result/flee cards, overlay switch | Locked stack; existing encounter UI is React over the canvas map. `[VERIFIED: codebase package.json]` |
| TypeScript (strict) | 5.9.3 | Typed session/stage/grade contracts | Strict mode in `game/` + `data/`. `[VERIFIED: codebase package.json]` |
| Zustand | 5.0.14 | `encounterStore` session + stage machine | Existing store owns encounter session; Phase 5 extends it. `[VERIFIED: codebase encounterStore.ts]` |
| Vitest | 4.1.10 | Unit tests for pure capture/timing math | Phase 4 tests grass rolls the same way. `[VERIFIED: codebase package.json]` |
| @testing-library/react + user-event + jest-dom | 16.3.2 / 14.6.1 / 7.0.0 | Component/interaction tests for cards + Capture button | Used across encounter components. `[VERIFIED: codebase package.json]` |

### Supporting

| Module (new) | Location | Purpose | When to Use |
|--------------|----------|---------|-------------|
| `game/capture.ts` | `src/game/` | `computeCatchChance()` (additive+clamp) + `rollCapture(rng, chance)` | CATCH-03 roll logic |
| `game/timing.ts` | `src/game/` | `gradeAt(position, zones)` + `sweetSpotFor(attempt, cfg[, rng])` | CATCH-02 grading + off-center sweet spot |
| `data/timingBar.ts` | `src/data/` | Per-rarity zone widths, indicator period, reduced-motion scale, sweet-spot bounds | CATCH-02/05 tuning (DATA-03) |
| Extended `data/captureModifiers.ts` | `src/data/` | Add `timing: { perfect, great, good, miss }` modifier slot | CATCH-03 timing term |
| Extended `data/rates.ts` `encounterTimingMs` | `src/data/` | Add `gradeFlash`, `failBeat`, `shake*` durations | D-14/D-26/D-30 timings |
| `utils/rng` (`Rng`, `createRng`, `getDefaultRng`, `setDefaultRngForTests`) | existing | Seeded roll source | Inject into flow; tests override |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| rAF loop writing imperative transform + CSS var | Pure CSS `@keyframes` alternate-infinite for ping-pong | CSS is simpler for motion, but reading the exact freeze position at Capture requires `getBoundingClientRect`/`getComputedStyle` and is jsdom-hostile. Prefer a numeric position source (rAF ref or time-derived) so the pure grader is deterministic and testable. A **hybrid** is fine: CSS drives the *visual* sweep while an rAF/time function computes the numeric position for grading — but keep one source of truth for the graded position. |
| Additive-then-clamp odds (D-22) | Multiplicative / Gen-3 catch formula | Locked to additive by D-22; multiplicative is opaque for a 7-year-old and harder to tune. |
| Extend `captureModifiers.ts` in place | New separate `data/captureOdds.ts` | Extending keeps the DATA-03 surface consolidated and already-tested by `config-surface.test.ts`. |

**Installation:**
```bash
# None — Phase 5 adds no dependencies.
```

**Version verification:** No package installs in this phase; all libraries above are already pinned in `pokemon-safari-app/package.json`. `[VERIFIED: codebase package.json 2026-07-26]`

## Package Legitimacy Audit

**Not applicable — Phase 5 installs no external packages.** All logic is built from existing repo modules (`utils/rng`, `game/*`, `data/*`, `store/encounterStore`, `components/encounter/*`). No registry lookups required.

## Architecture Patterns

### System Architecture Diagram

```
Phase 4 handoff point
   │  session.captureBonus already set (education step)
   ▼
[EncounterStage: feedback] ──(timer)──▶ [timing]   ◀── REPLACES old 'handoff' stub
                                           │
                          TimingBar UI (React)
                          rAF/time → position ref [0,1]  ── writes CSS var / transform (no React state)
                          Capture button / Space / Enter
                                           │  press → freeze position, LOCK input (D-21)
                                           ▼
                          game/timing.ts  gradeAt(position, zones[rarity])  ──▶ 'perfect'|'great'|'good'|'miss'
                                           │
                          game/capture.ts computeCatchChance({rarityBase, education, timing, ball, berry})
                                           │  additive → clamp[0,1]        (values from data/)
                                           ▼
                          game/capture.ts rollCapture(rng, chance)  ──▶ caught: boolean   (roll resolves NOW, D-31)
                                           │
                                  [EncounterStage: shake]  (flavor only; plays known ending, D-30/D-31)
                                     ┌───────────────┴───────────────┐
                              caught=true                       caught=false
                                     ▼                                ▼
                          [result: Caught card]         attemptsUsed+1
                          Gotcha! + Continue                 │
                                     │              attemptsUsed < 3 ? ──yes──▶ fail beat → [timing] (new sweet spot, D-12/D-26)
                                     │                                └──no──▶ [flee: kind flee card] + Continue (D-28)
                                     ▼                                              │
                          Continue ──────────────────────────────────────────────┘
                                     ▼
                     education wrong? ──yes──▶ [recap] (Phase 4 RecapCard, D-29) ──▶ close → map
                                     └──no───▶ close → map
```

Data flow: the education `captureBonus` enters on the session; the player's timing press produces a numeric position; pure functions turn that into a grade, a chance, and a boolean; the store advances stages; React presents pre-resolved outcomes.

### Recommended Project Structure
```
pokemon-safari-app/src/
├── game/
│   ├── capture.ts          # NEW — computeCatchChance + rollCapture (pure)
│   ├── capture.test.ts     # NEW — additive/clamp + seeded-roll distribution
│   ├── timing.ts           # NEW — gradeAt + sweetSpotFor (pure)
│   └── timing.test.ts      # NEW — zone boundaries + attempt-varying sweet spot
├── data/
│   ├── captureModifiers.ts # EXTEND — add timing modifier slot
│   ├── timingBar.ts        # NEW — per-rarity zones, period, sweet-spot cfg, reduced-motion scale
│   └── rates.ts            # EXTEND — encounterTimingMs: gradeFlash/failBeat/shake*
├── types/
│   └── encounter.ts        # EXTEND — EncounterStage + '..timing'|'shake'|'result'|'flee'; session attemptsUsed + lastGrade
├── store/
│   └── encounterStore.ts   # EXTEND — actions: startTiming/registerThrow/toResult/toFlee/incrementAttempt
├── hooks/
│   └── useEncounterFlow.ts # EXTEND — module-level fns: capture(position), continueFromResult/Flee
└── components/encounter/
    ├── TimingBar.tsx        # NEW — ping-pong indicator + Capture button (replaces HandoffStub route)
    ├── GradeFlash.tsx       # NEW (or inline) — brief Perfect/Great/Good/Miss flash (D-14)
    ├── BallShake.tsx        # NEW — 1–3 shake flavor animation to known ending (D-30/D-31/D-33)
    ├── CaughtCard.tsx       # NEW — Gotcha! result card (D-32)
    ├── FleeCard.tsx         # NEW — kind flee card (D-28)
    └── EncounterOverlay.tsx # EXTEND — switch new stages; retire HandoffStub
```

### Pattern 1: Pure additive capture math (CATCH-03)
**What:** A pure function summing config modifiers, clamped to `[0,1]`, then a seeded roll. No React/DOM/`Math.random`.
**When to use:** The capture roll on every throw.
**Example:**
```typescript
// Source: mirrors src/game/encounter.ts + src/game/education/answerValidator.ts (this repo)
import { captureModifiers } from '@/data/captureModifiers'
import type { RarityBand } from '@/types/encounter'
import type { Rng } from '@/utils/rng'
import type { TimingGrade } from '@/game/timing'

export type CatchInputs = {
  rarity: RarityBand
  educationBonus: number   // session.captureBonus (already applied in Phase 4)
  grade: TimingGrade
  ball?: keyof typeof captureModifiers.ball  // Phase 5 always 'poke' (D-23)
  berry?: boolean                            // Phase 5 always false (D-23)
}

export function computeCatchChance(
  inputs: CatchInputs,
  cfg = captureModifiers,
): number {
  const rarityBase = cfg.rarity[inputs.rarity]
  const timing = cfg.timing[inputs.grade]
  const ball = cfg.ball[inputs.ball ?? 'poke']
  const berry = inputs.berry ? cfg.berry : 0
  const sum = rarityBase + inputs.educationBonus + timing + ball + berry
  return Math.min(1, Math.max(0, sum)) // additive → clamp [0,1] (D-22)
}

export function rollCapture(rng: Rng, chance: number): boolean {
  return rng.next() < chance // resolves BEFORE shake (D-31)
}
```

### Pattern 2: Pure timing grade + attempt-varying sweet spot (CATCH-02, D-08/D-10/D-12)
**What:** Map a normalized position `[0,1]` to a grade using per-rarity zone widths anchored on an off-center sweet spot; recompute the sweet spot per attempt.
**When to use:** On Capture (grade) and on (re)mounting the bar (sweet spot).
**Example:**
```typescript
// Source: new module, same purity contract as game/encounter.ts
import { timingBar } from '@/data/timingBar'
import type { RarityBand } from '@/types/encounter'
import type { Rng } from '@/utils/rng'

export type TimingGrade = 'perfect' | 'great' | 'good' | 'miss'

// Distance from the sweet spot decides the grade; zone widths shrink for rarer mons (D-08).
export function gradeAt(
  position: number,          // [0,1] frozen indicator position (D-20)
  sweetSpot: number,         // [0,1] off-center center (D-10)
  rarity: RarityBand,
  cfg = timingBar,
): TimingGrade {
  const z = cfg.zones[rarity]              // { perfect, great, good } half-widths, config-driven
  const d = Math.abs(position - sweetSpot)
  if (d <= z.perfect) return 'perfect'
  if (d <= z.great) return 'great'
  if (d <= z.good) return 'good'
  return 'miss'                            // Miss still rolls (D-07)
}

// Deterministic given attempt index (config-tunable); optional rng for jitter.
export function sweetSpotFor(attempt: number, cfg = timingBar, rng?: Rng): number {
  // e.g. rotate through cfg.sweetSpotOffsets[attempt % n], clamped to [min,max]
  const base = cfg.sweetSpotOffsets[attempt % cfg.sweetSpotOffsets.length]!
  const jitter = rng ? (rng.next() - 0.5) * cfg.sweetSpotJitter : 0
  return Math.min(cfg.sweetSpotMax, Math.max(cfg.sweetSpotMin, base + jitter))
}
```

### Pattern 3: Imperative ping-pong indicator (no per-frame React state) (D-09/D-19/D-20, MAP-04 precedent)
**What:** Drive the indicator position with a time function inside rAF, writing an imperative transform / CSS var; keep a numeric position ref for grading. Freeze = stop the loop and read the ref.
**When to use:** The timing bar screen.
**Example:**
```typescript
// Source: pattern mirrors src/hooks/useExploreLoop.ts (rAF + refs, no React state per frame)
// Triangle wave for ping-pong: 0→1→0 over `period` ms.
function pingPong(elapsedMs: number, periodMs: number): number {
  const t = (elapsedMs % periodMs) / periodMs      // 0..1
  return t < 0.5 ? t * 2 : 2 - t * 2               // 0→1→0
}

// In the component effect:
//   const posRef = useRef(0)
//   const period = prefersReducedMotion() ? cfg.periodMs * cfg.reducedMotionScale : cfg.periodMs  (D-17)
//   rAF tick: posRef.current = pingPong(now - start, period);
//             indicatorRef.current.style.transform = `translateX(${posRef.current * trackWidth}px)`
//   On Capture: cancelAnimationFrame; const grade = gradeAt(posRef.current, sweetSpot, rarity)
```
`prefers-reduced-motion` scales the **period** (slower), not the mechanic (D-17). Existing `prefersReducedMotion()` lives in `@/hooks/useMapCamera`. `[VERIFIED: codebase useMapCamera.ts]`

### Pattern 4: Stage-machine extension + roll-before-shake (D-14/D-21/D-31)
**What:** Extend `EncounterStage` and add store actions; capture resolves the roll immediately, stores the outcome, then plays a flavor shake that animates to the *known* ending.
**When to use:** Capture press handling.
**Example:**
```typescript
// Source: extends src/store/encounterStore.ts + src/hooks/useEncounterFlow.ts
// Capture handler (module-level fn like advanceFromAppear/submitAnswer):
export function capture(position: number): void {
  const s = useEncounterStore.getState()
  if (s.stage !== 'timing') return           // ignore mashing during flash/shake (D-21)
  const grade = gradeAt(position, s.session!.sweetSpot, s.session!.rarity)
  const chance = computeCatchChance({ rarity: s.session!.rarity, educationBonus: s.session!.captureBonus, grade })
  const caught = rollCapture(flowRngRef.current, chance)   // resolve BEFORE shake (D-31)
  s.registerThrow({ grade, caught })         // sets lastGrade, stage:'shake', stores caught
  // GradeFlash (D-14) + BallShake (D-30) are presentational; on shake end → toResult/incrementAttempt→toFlee/toTiming
}
```

### Anti-Patterns to Avoid
- **Per-frame React state for the indicator:** re-render storm; violates the MAP-04 precedent. Use refs + imperative writes (Pattern 3).
- **Rolling capture during/after the shake:** the shake is flavor; rolling there risks shake count contradicting the outcome (D-30/D-31). Roll on Capture, before shake.
- **Hardcoding zone widths / modifiers / percentages in components:** `config-surface.test.ts` fails the build on rate literals in `components/` and `screens/`, and bans `Math.random(` in `game/`. Put all numbers in `data/`. `[VERIFIED: codebase config-surface.test.ts]`
- **Reading the raw catch % into the UI (D-24):** show qualitative cues only; the boost chip shows the education modifier label, not final odds.
- **Escalating/pity odds across throws (D-25):** keep non-timing terms constant; only the grade varies.
- **Using `getDefaultRng()` directly in the roll path for tests:** inject via the flow's `flowRngRef` / hook `options.rng` so tests use `setDefaultRngForTests` or a sequence rng.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Random source | A new PRNG or `Math.random` | `createRng` / `getDefaultRng` / `setDefaultRngForTests` in `@/utils/rng` | Deterministic, testable, already banned `Math.random` in `game/`. `[VERIFIED: codebase rng.ts]` |
| Reduced-motion detection | New matchMedia wrapper | `prefersReducedMotion()` from `@/hooks/useMapCamera` | Already used by AppearFlash + explore loop. `[VERIFIED: codebase useMapCamera.ts]` |
| Sprite rendering (wild/caught) | New `<img>` handling | `PokemonSprite` (`size` 64/96, shiny, silhouette fallback) | Handles broken/missing sprites; shiny prop covers D-32 callout. `[VERIFIED: codebase PokemonSprite.tsx]` |
| Large touch buttons | Custom button | `PixelButton` (touch-target, variants, reduced-motion active state) | Meets kid touch-target sizing; Space/Enter is native `<button>` activation (D-13). `[VERIFIED: codebase PixelButton.tsx]` |
| Wrong-answer recap after encounter | New recap UI | `RecapCard` + existing `toRecap()`/`dismissHandoff` branching | D-29 preserves Phase 4 D-13/D-14. `[VERIFIED: codebase RecapCard.tsx, useEncounterFlow.ts]` |
| Full-screen modal shell / focus mgmt | New overlay | Extend `EncounterOverlay` (scrim, `role=dialog`, focus restore) | Focus + a11y already handled per stage. `[VERIFIED: codebase EncounterOverlay.tsx]` |
| Per-frame animation loop | New rAF plumbing | Mirror `useExploreLoop` refs/imperative pattern | Proven no-re-render loop; jsdom rAF shim + `flushFrames` already exist. `[VERIFIED: codebase useExploreLoop.ts, test/setup.ts]` |

**Key insight:** Phase 5 is a composition exercise, not a greenfield one. The seeded-RNG + pure-`game/` + `data/`-config + Zustand-stage + React-overlay skeleton from Phase 4 already covers ~80% of the machinery; the new code is two pure math modules, config tables, a handful of presentational components, and stage wiring.

## Runtime State Inventory

Not a rename/refactor/migration phase — this section is intentionally omitted. Phase 5 adds new logic and UI and extends (does not rename) existing session/stage contracts. The only pre-existing runtime artifact touched is the ephemeral, in-memory `encounterStore` session (no persisted keys — Phase 7 owns save). Adaptive education stats in `localStorage` (`recordAttempt`/`persistAdaptiveStats`) are untouched by capture. `[VERIFIED: codebase encounterStore.ts, adaptiveStore usage]`

## Common Pitfalls

### Pitfall 1: Non-deterministic capture roll breaks tests
**What goes wrong:** Roll uses `Math.random` or the module-singleton `getDefaultRng()`, so tests can't assert caught/flee outcomes.
**Why it happens:** Convenience; the singleton is seeded once from `Date.now()`.
**How to avoid:** Thread the injected `Rng` through the flow (`useEncounterFlow({ rng })` and `flowRngRef.current`, as Phase 4 does) and use `setDefaultRngForTests` / a sequence rng in tests. `game/` code takes `rng` as a parameter. `[VERIFIED: codebase useEncounterFlow.ts, rng.ts]`
**Warning signs:** `config-surface.test.ts` "forbids Math.random( under src/game/" failing; flaky capture tests.

### Pitfall 2: Indicator freeze position is unreadable / mismatched with the visual
**What goes wrong:** The grade uses a position derived one way while the visual uses another (CSS keyframes vs computed value), so the flashed grade doesn't match where the player saw the indicator.
**Why it happens:** Two independent motion sources.
**How to avoid:** One numeric source of truth for the graded position (rAF-updated ref or a pure time function evaluated at press). If CSS drives the visual, derive the visual transform from the same numeric position. Freeze the visual at the frozen position (D-20).
**Warning signs:** Players report "I hit Perfect but it said Good."

### Pitfall 3: Roll resolved after the shake, contradicting the animation
**What goes wrong:** Shake count or a second RNG decides success, violating D-30/D-31.
**How to avoid:** `rollCapture` runs on Capture; store `caught`; `BallShake` reads it and plays the known ending. Shake count is purely cosmetic mapping (Claude's discretion) and must not gate the result.
**Warning signs:** Ball shakes 3× then opens as a fail, or vice-versa.

### Pitfall 4: Capture mashing during flash/shake fires extra throws (D-21)
**What goes wrong:** Space/Enter/click during grade-flash or shake registers a second throw or double-counts an attempt.
**How to avoid:** Gate `capture()` on `stage === 'timing'` only; ignore input in `shake`/`result`/`flee`. Disable the Capture button during resolution.
**Warning signs:** `attemptsUsed` jumps by 2; flee after fewer than 3 visible throws.

### Pitfall 5: Odds accidentally escalate across throws (D-25)
**What goes wrong:** Someone adds a per-attempt bonus / pity, making later throws easier.
**How to avoid:** `computeCatchChance` inputs exclude attempt index; only `grade` changes between throws. Add a test asserting equal chance for equal grade across attempts.
**Warning signs:** Third-throw catch rate materially higher than first.

### Pitfall 6: Commons too hard / legendaries too easy (CATCH-05)
**What goes wrong:** Miscalibrated `data/` values; e.g. Miss modifier too punishing on commons.
**How to avoid:** Additive design: common base 0.6 + education 0.15 already ≈ 0.75 before timing → even a Miss stays catchable; legendary base 0.1 keeps it a chase. Add distribution tests (thousands of seeded rolls) asserting common catch ≥ target and legendary ≤ target across grades. Keep all numbers in `data/` for real-device retune (STATE.md concern: kid timing windows unmeasured; Phase 8 playtest). `[VERIFIED: codebase captureModifiers.ts, STATE.md]`
**Warning signs:** Distribution test bands violated.

### Pitfall 7: Losing the wrong-answer recap path (D-29)
**What goes wrong:** New result/flee Continue calls `close()` directly, skipping the recap for a wrong education answer.
**How to avoid:** Reuse/adapt the existing branch: if `session.education?.correct === false` → `toRecap()`, else `close()`. Both the Caught-card and Flee-card Continue must route through this. `[VERIFIED: codebase useEncounterFlow.ts dismissHandoff]`
**Warning signs:** No recap after a wrong answer + catch/flee.

## Code Examples

### Reduced-motion-aware period (D-17)
```typescript
// Source: prefersReducedMotion from src/hooks/useMapCamera.ts (this repo)
import { prefersReducedMotion } from '@/hooks/useMapCamera'
import { timingBar } from '@/data/timingBar'

const periodMs = prefersReducedMotion()
  ? timingBar.periodMs * timingBar.reducedMotionScale  // slower, same skill (D-17)
  : timingBar.periodMs
```

### Extended config shape (DATA-03)
```typescript
// Source: extends src/data/captureModifiers.ts + new src/data/timingBar.ts
// captureModifiers.ts (add timing slot)
export const captureModifiers = {
  education: educationCaptureBonus,
  ball: { poke: 0, great: 0.15 },
  berry: 0.1,
  rarity: { common: 0.6, rare: 0.3, legendary: 0.1 },
  timing: { perfect: 0.25, great: 0.15, good: 0.05, miss: -0.05 }, // tune for CATCH-05
} as const

// data/timingBar.ts (new)
export const timingBar = {
  periodMs: 1400,
  reducedMotionScale: 1.75,
  zones: {
    common:    { perfect: 0.14, great: 0.26, good: 0.40 }, // wide = easy
    rare:      { perfect: 0.09, great: 0.18, good: 0.30 },
    legendary: { perfect: 0.05, great: 0.11, good: 0.20 }, // narrow = hard (D-08)
  },
  sweetSpotOffsets: [0.62, 0.38, 0.70], // off-center, varies by attempt (D-10/D-12)
  sweetSpotJitter: 0.06,
  sweetSpotMin: 0.15,
  sweetSpotMax: 0.85,
} as const
```
*(Numbers above are illustrative starting points — Claude's discretion; must be tuned and covered by distribution tests. Do not treat as final.)* `[ASSUMED]`

### Seeded roll test shape (Phase 4 style)
```typescript
// Source: mirrors src/game/encounter.test.ts stubRng + distribution assertions
function stubRng(values: number[]): Rng {
  let i = 0
  return { next: () => values[i++] ?? values[values.length - 1]! }
}
// chance boundary: rng.next() < chance
expect(rollCapture(stubRng([chance - 1e-9]), chance)).toBe(true)
expect(rollCapture(stubRng([chance]), chance)).toBe(false)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| RPS capture modifier (original brief) | Education (multiplication) `captureBonus` on session | Phase 4 | Phase 5 must consume `session.captureBonus`; never rebuild RPS (D-03). `[VERIFIED: codebase encounter.ts types + STATE.md]` |
| `handoff` stage + `HandoffStub.tsx` ("Ready to throw!") | Timing → shake → result/flee stages | Phase 5 (this) | Retire the stub route in `EncounterOverlay`; `handoffCopy` in `educationConfig.ts` can be retired/replaced. `[VERIFIED: codebase HandoffStub.tsx, EncounterOverlay.tsx]` |

**Deprecated/outdated:**
- `HandoffStub.tsx` and `handoffCopy` (`educationConfig.ts`): replaced by the timing UI. The `feedback` timer in `useEncounterFlow.doSubmitAnswer` currently advances to `'handoff'` — repoint it to the new timing stage.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Illustrative modifier/zone/period numbers in `captureModifiers.ts`/`timingBar.ts` | Code Examples / Standard Stack | Wrong values break CATCH-05 kid-friendliness; mitigated by leaving them to discretion + distribution tests + Phase 8 playtest. User confirms final tuning. |
| A2 | Timing modifier for Miss is a small negative and Perfect a moderate positive | Code Examples | If Miss must never reduce below the education-only floor, sign/magnitude changes; confirm intended "Miss still meaningfully rolls" feel (D-07). |
| A3 | New stages named `timing`/`shake`/`result`/`flee` | Architecture | Naming is planner's call; no functional risk. |
| A4 | Sweet-spot varies by attempt via a config offset list (+ optional jitter) | Pattern 2 | If a smoother algorithm is desired, swap the pure function; contract unchanged. |
| A5 | rAF-driven numeric position is the graded source of truth (CSS optional for visuals) | Pattern 3 | If team prefers pure CSS, must still expose a numeric position for grading; otherwise grade/visual mismatch (Pitfall 2). |

**All numeric tuning is explicitly Claude's Discretion per CONTEXT; the planner must gate final values behind distribution tests, and STATE.md flags a real-device kid playtest (Phase 8) for timing windows.**

## Open Questions (RESOLVED)

1. **Where should the `feedback → timing` transition fire?** — **RESOLVED:** Replace the `handoff` stage target with `timing` after `feedbackHold` (keep the post-feedback timer); retire `HandoffStub` from `EncounterOverlay`. Do not keep a parallel `handoff` stage. Locked by plans `05-02` / `05-01` (types + flow).
   - What we knew: `doSubmitAnswer` schedules `setStage('handoff')` after `feedbackHold`. `[VERIFIED: codebase useEncounterFlow.ts]`

2. **Shake-count mapping (flavor).** — **RESOLVED:** Map shake count (1–3) from the pre-computed `chance` bucket for tension; purely cosmetic. Success always ends closed; fail always opens / pops (D-30/D-31/D-33). Never a second RNG gate. Locked by plans `05-02` (BallShake) / `05-04` (fail ending).

3. **Does the session need `sweetSpot` persisted in the store or recomputed in the component?** — **RESOLVED:** Persist `sweetSpot` (plus `attemptsUsed`, `lastGrade`, `lastCaught`, `lastChance`) on `EncounterSession`; recompute via `sweetSpotFor(attemptsUsed)` inside `startTiming()` whenever (re)entering `timing` (D-12). Locked by plan `05-02` store/session contracts.

## Environment Availability

**SKIPPED — no new external dependencies.** Phase 5 is code/config only within the existing toolchain (React/TS/Vite/Vitest already installed and used across Phases 1–4). No CLI tools, services, runtimes, or network access are introduced. `[VERIFIED: codebase package.json]`

## Validation Architecture

Nyquist validation is enabled (`workflow.nyquist_validation: true`). `[VERIFIED: codebase .planning/config.json]`

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 + @testing-library/react 16.3.2 + jsdom 29.1.1 |
| Config file | `pokemon-safari-app/vite.config.ts` (Vitest via Vite config) + `src/test/setup.ts` (rAF/matchMedia shims, `flushFrames`) |
| Quick run command | `cd pokemon-safari-app && npx vitest run src/game/capture.test.ts src/game/timing.test.ts` |
| Full suite command | `cd pokemon-safari-app && npm test` (`vitest run`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CATCH-03 | Additive chance sums rarity+education+timing+ball+berry, clamps [0,1] | unit | `npx vitest run src/game/capture.test.ts` | ❌ Wave 0 |
| CATCH-03 | `rollCapture(rng, chance)` boundary: `< chance` catches, `>=` fails; pure/no localStorage | unit | `npx vitest run src/game/capture.test.ts` | ❌ Wave 0 |
| CATCH-02 | `gradeAt` maps positions to Perfect/Great/Good/Miss at zone boundaries around off-center sweet spot | unit | `npx vitest run src/game/timing.test.ts` | ❌ Wave 0 |
| CATCH-02 | `sweetSpotFor(attempt)` varies by attempt, stays within [min,max] (D-12) | unit | `npx vitest run src/game/timing.test.ts` | ❌ Wave 0 |
| CATCH-05 | Distribution: commons catch ≥ target across grades; legendaries ≤ target (thousands of seeded rolls, 2 seeds) | unit | `npx vitest run src/game/capture.test.ts` | ❌ Wave 0 |
| CATCH-04 | After 3 failed rolls the stage machine reaches `flee`; success reaches `result`; attempts don't double-count | integration | `npx vitest run src/hooks/useEncounterFlow.test.ts` | ⚠️ extend existing |
| CATCH-04 | Result/Flee Continue routes to recap when education wrong, else closes (D-29) | integration | `npx vitest run src/hooks/useEncounterFlow.test.ts` | ⚠️ extend existing |
| CATCH-02/CATCH-04 | Capture locked during flash/shake (D-21); Space/Enter/click fire once | component | `npx vitest run src/components/encounter/TimingBar.test.tsx` | ❌ Wave 0 |
| DATA-03 | New config exports present; no rate literals in components/screens; no `Math.random(` in game/ | unit | `npx vitest run src/data/config-surface.test.ts` | ⚠️ extend existing |
| D-25 | Equal grade ⇒ equal chance across attempts (no pity) | unit | `npx vitest run src/game/capture.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run <changed test file(s)>` (quick, < 5s per pure module)
- **Per wave merge:** `cd pokemon-safari-app && npm test` (full suite)
- **Phase gate:** Full suite green + `tsc -b` build clean before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/game/capture.test.ts` — covers CATCH-03, CATCH-05, D-25
- [ ] `src/game/timing.test.ts` — covers CATCH-02 grading + sweet-spot
- [ ] `src/components/encounter/TimingBar.test.tsx` — covers Capture lock/keyboard (uses `flushFrames` for rAF)
- [ ] Extend `src/hooks/useEncounterFlow.test.ts` — timing→shake→result/flee stage flow + recap routing (CATCH-04, D-29)
- [ ] Extend `src/data/config-surface.test.ts` — assert new `captureModifiers.timing` + `timingBar` exports
- [ ] Framework install: none — Vitest infra already present. `[VERIFIED: codebase package.json, test/setup.ts]`

## Security Domain

`security_enforcement: true`, ASVS level 1. `[VERIFIED: codebase .planning/config.json]` This is a frontend-only, offline-during-play kid's game with **no auth, no network calls during capture, no server, no PII, no secrets**. Capture inputs are player button presses; there is no untrusted external data in this phase.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No accounts/auth in product scope |
| V3 Session Management | no | No server sessions (ephemeral in-memory encounter session only) |
| V4 Access Control | no | Single local player; no privileged actions |
| V5 Input Validation | minimal | Only numeric player position [0,1] internal to the app; clamp position and `attemptsUsed`; guard against NaN in `computeCatchChance` (already clamped [0,1]) |
| V6 Cryptography | no | Seeded PRNG is for gameplay only — **not** security-sensitive; never used for secrets |

### Known Threat Patterns for {React SPA / localStorage / GitHub Pages}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Rate/odds literals leaking into components (tamper-prone, untestable) | Tampering | Keep in `data/`; enforced by `config-surface.test.ts` |
| Corrupt/hostile localStorage (adaptive edu stats, unrelated to capture) | Tampering | Not written by Phase 5; existing namespaced keys; never `localStorage.clear()` |
| PRNG misused where security matters | Info Disclosure | N/A — gameplay only; no security use of `Rng` |

No new attack surface is introduced. No `checkpoint:security` gating required for this phase beyond the standard `config-surface`/lint gates.

## Sources

### Primary (HIGH confidence)
- Codebase (read directly this session): `src/utils/rng.ts`, `src/game/encounter.ts`, `src/game/encounter.test.ts`, `src/game/education/answerValidator.ts`, `src/types/encounter.ts`, `src/store/encounterStore.ts`, `src/hooks/useEncounterFlow.ts`, `src/hooks/useEncounterFlow.test.ts`, `src/hooks/useExploreLoop.ts`, `src/hooks/useMapCamera.ts`, `src/data/captureModifiers.ts`, `src/data/rates.ts`, `src/data/educationConfig.ts`, `src/data/config-surface.test.ts`, `src/components/encounter/*` (Overlay, HandoffStub, AppearFlash, EducationQuestion, RecapCard + tests), `src/components/PixelButton.tsx`, `src/components/PokemonSprite.tsx`, `src/index.css`, `src/test/setup.ts`, `package.json`, `.planning/config.json` — `[VERIFIED: codebase]`
- `.planning/phases/05-capture-flow/05-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.cursor/rules/gsd.md` — `[VERIFIED: planning docs]`

### Secondary (MEDIUM confidence)
- None required — all findings grounded in repo code.

### Tertiary (LOW confidence)
- Illustrative tuning numbers in Code Examples — `[ASSUMED]`, flagged in Assumptions Log.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all modules read directly; no new packages.
- Architecture: HIGH — extends proven Phase 3/4 patterns verified in-repo.
- Pitfalls: HIGH — derived from actual constraints in code (config-surface test, rng ban, stage machine) and locked decisions.
- Tuning values: LOW ([ASSUMED]) — intentionally left to discretion + tests + Phase 8 playtest.

**Research date:** 2026-07-26
**Valid until:** 2026-08-25 (stable internal codebase; ~30 days)
