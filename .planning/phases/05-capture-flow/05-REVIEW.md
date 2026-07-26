---
phase: 05-capture-flow
reviewed: 2026-07-26T14:50:00Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - pokemon-safari-app/src/components/encounter/BallShake.tsx
  - pokemon-safari-app/src/components/encounter/CaughtCard.tsx
  - pokemon-safari-app/src/components/encounter/EncounterOverlay.test.tsx
  - pokemon-safari-app/src/components/encounter/EncounterOverlay.tsx
  - pokemon-safari-app/src/components/encounter/FailBeat.tsx
  - pokemon-safari-app/src/components/encounter/FleeCard.tsx
  - pokemon-safari-app/src/components/encounter/GradeFlash.tsx
  - pokemon-safari-app/src/components/encounter/ShakeSequence.tsx
  - pokemon-safari-app/src/components/encounter/TimingBar.test.tsx
  - pokemon-safari-app/src/components/encounter/TimingBar.tsx
  - pokemon-safari-app/src/data/captureModifiers.ts
  - pokemon-safari-app/src/data/config-surface.test.ts
  - pokemon-safari-app/src/data/educationConfig.ts
  - pokemon-safari-app/src/data/rates.ts
  - pokemon-safari-app/src/data/timingBar.ts
  - pokemon-safari-app/src/game/capture.test.ts
  - pokemon-safari-app/src/game/capture.ts
  - pokemon-safari-app/src/game/timing.test.ts
  - pokemon-safari-app/src/game/timing.ts
  - pokemon-safari-app/src/hooks/useEncounterFlow.test.ts
  - pokemon-safari-app/src/hooks/useEncounterFlow.ts
  - pokemon-safari-app/src/index.css
  - pokemon-safari-app/src/screens/GameScreen.test.tsx
  - pokemon-safari-app/src/store/encounterStore.ts
  - pokemon-safari-app/src/types/encounter.ts
findings:
  critical: 0
  warning: 2
  info: 5
  total: 7
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-07-26T14:50:00Z
**Depth:** standard
**Files Reviewed:** 25
**Status:** issues_found

## Summary

Plan 05-05 closed the prior D-14 blocker: keyed `ShakeSequence` remounts per throw, and `registerThrow` is stage-guarded. Capture math, retry/flee bookkeeping, and mash gating via `stage === 'timing'` remain sound. Remaining issues are a latent GradeFlash timer reset from an unstable `onComplete`, ungarded `toResult`/`toFlee` transitions, and known polish/config gaps (several deferred or non-blocking).

## Warnings

### WR-01: Unstable GradeFlash `onComplete` can reset the flash timer

**File:** `pokemon-safari-app/src/components/encounter/ShakeSequence.tsx:32-33`
**File:** `pokemon-safari-app/src/components/encounter/GradeFlash.tsx:20-27`
**Issue:** `ShakeSequence` passes `onComplete={() => setFlashDone(true)}`, a new function every render. `GradeFlash`’s effect depends on `onComplete`, so any re-render of `ShakeSequence` during the flash clears and restarts the timeout. `EncounterOverlay` is not memoized; `ExploreSurface` re-renders whenever `useEncounterFlow`’s `pendingEncounters` subscription (or `facing` / toast flags) updates, which re-renders the overlay tree and can stretch or indefinitely postpone the GradeFlash → BallShake handoff.
**Fix:** Stabilize the callback (or stop depending on identity):

```tsx
import { useCallback, useState } from 'react'

export function ShakeSequence({ grade, caught, chance, onComplete }: ShakeSequenceProps) {
  const [flashDone, setFlashDone] = useState(false)
  const onFlashComplete = useCallback(() => setFlashDone(true), [])

  if (!flashDone) {
    return <GradeFlash grade={grade} onComplete={onFlashComplete} />
  }
  return <BallShake caught={caught} chance={chance} onComplete={onComplete} />
}
```

Alternatively, keep a ref for `onComplete` inside `GradeFlash` and depend only on `[reducedMotion]`.

### WR-02: `toResult` / `toFlee` still lack stage invariants

**File:** `pokemon-safari-app/src/store/encounterStore.ts:145-146`
**Issue:** `registerThrow` was hardened to no-op unless `stage === 'timing'`, but `toResult` / `toFlee` still force those stages from any state with no session/`lastCaught` / `attemptsUsed` checks. A stray call shows Gotcha or flee UI without a resolved throw (tests already call `toResult()` mid-shake to skip animation). Same single-writer class of footgun that WR-03 addressed for throws.
**Fix:**

```ts
toResult: () =>
  set((state) => {
    if (state.stage !== 'shake' || !state.session?.lastCaught) return state
    return { stage: 'result' as const }
  }),
toFlee: () =>
  set((state) => {
    if (state.stage !== 'shake' || !state.session) return state
    if (state.session.lastCaught) return state
    const attempts = Math.min(3, Math.max(0, state.session.attemptsUsed | 0))
    if (attempts < 3) return state
    return { stage: 'flee' as const }
  }),
```

(Keep `onShakeComplete` as the only production caller; update tests that short-circuit shake to go through the guarded path or set stage/session fixtures first.)

## Info

### IN-01: BallShake shakes are timer-only (Phase 8 deferred)

**File:** `pokemon-safari-app/src/components/encounter/BallShake.tsx:12-37,43-56`
**File:** `pokemon-safari-app/src/index.css:132-134`
**Issue:** `data-shakes` drives timeout length only; CSS has no per-shake animation, and fail ending is a static tilt (`ball-broke-free`) without a sprite pop (D-05 / D-30 / D-33). VERIFICATION already deferred visible shake polish to Phase 8.
**Fix:** Add keyed CSS/WAAPI shakes aligned to `encounterTimingMs.shakeOnce` / `shakeGap` / `shakeResolve` in the polish phase; keep the timeout as `onComplete` authority.

### IN-02: `sweetSpotJitter` never applied in production

**File:** `pokemon-safari-app/src/store/encounterStore.ts:117`
**File:** `pokemon-safari-app/src/game/timing.ts:29-37`
**Issue:** `startTiming` calls `sweetSpotFor(attemptsUsed)` with no `rng`, so `timingBar.sweetSpotJitter` is dead. Attempt variation still comes from `sweetSpotOffsets` (D-12).
**Fix:** Thread encounter RNG into `sweetSpotFor`, or remove `sweetSpotJitter` until needed.

### IN-03: CaughtCard `shiny` prop never wired

**File:** `pokemon-safari-app/src/components/encounter/EncounterOverlay.tsx:156-157`
**File:** `pokemon-safari-app/src/components/encounter/CaughtCard.tsx:8-15,34-38`
**Issue:** Overlay never passes `shiny`; session has no shiny flag. Copy/sprite support is unreachable.
**Fix:** Add session shiny when rolls exist; otherwise leave for the celebration phase.

### IN-04: TimingBar `locked` unused by Overlay

**File:** `pokemon-safari-app/src/components/encounter/TimingBar.tsx:22-23,48-49,72-73`
**File:** `pokemon-safari-app/src/components/encounter/EncounterOverlay.tsx:138-145`
**Issue:** Mash lock works because TimingBar unmounts when `stage !== 'timing'`; `locked` is tested but never passed in production.
**Fix:** Document unmount-as-lock, or remove the prop until a design keeps the bar mounted through flash/shake.

### IN-05: Shake-count thresholds hardcoded in BallShake

**File:** `pokemon-safari-app/src/components/encounter/BallShake.tsx:12-16`
**Issue:** Flavor buckets `0.75` / `0.4` live in the component while DATA-03 pushes tunables into `data/`.
**Fix:** Move to `timingBar` or `captureModifiers` (e.g. `shakeBuckets: [0.4, 0.75]`) and import them.

---

_Reviewed: 2026-07-26T14:50:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
