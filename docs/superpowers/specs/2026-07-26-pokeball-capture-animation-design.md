# Pokéball Capture Animation Design

**Date:** 2026-07-26  
**Status:** Approved

## Goal

Replace the placeholder capture glyph in `BallShake` with the supplied Pokéball pixel art. The closed ball rocks left and right during capture shakes. A successful capture keeps the ball closed and adds a brief sparkle cue. A failed capture plays the opening frames, holds briefly on the fully open ball, and then enters the existing fail beat.

## Scope

This change is limited to capture-result visuals and their timing. It does not alter capture probability, shake-count calculation, encounter stages, retry behavior, or the pre-resolved `caught` result.

## Assets

Split the supplied vertical strip into three separate PNG files:

- `src/assets/encounter/ball-closed.png`
- `src/assets/encounter/ball-mid-open.png`
- `src/assets/encounter/ball-full-open.png`

Remove the flat pink strip background to transparency. Normalize all three frames to the same transparent canvas and alignment so swapping frames does not move the ball. Preserve hard pixel edges and render at 64 × 64 CSS pixels with pixelated image rendering.

Separate files follow the existing `PlayerSprite` asset convention and make each visual state explicit.

## Architecture

`BallShake` remains the sole owner of capture throw visuals. It receives the already-resolved `caught` flag and capture `chance`; it never rolls capture.

The component gains an internal visual phase:

- `shaking`
- `resolve-caught`
- `resolve-mid-open`
- `resolve-full-open`

The public props and the surrounding flow remain unchanged. `ShakeSequence`, `EncounterOverlay`, `useEncounterFlow`, and the encounter store continue to hand off to `BallShake` and react only when its existing `onComplete` callback fires.

## Animation Flow

### Shared shake

Every throw begins with the closed sprite. It performs the existing one to three flavor shakes derived from `chance`.

Each shake rocks left and right around a bottom-center transform origin, reaching -12° and +12° before returning to neutral for the configured gap. React timing advances distinct shake cycles using the existing `shakeOnce` and `shakeGap` values, so the visual count and completion timing share one source of truth.

### Successful capture

After the final shake:

1. Keep the closed sprite stationary.
2. Enter `resolve-caught`.
3. Show four lightweight CSS sparkle elements around the ball.
4. Keep the success cue visible for the existing `shakeResolve` duration.
5. Call `onComplete`.

The ball never opens on a successful capture.

### Escaped Pokémon

After the final shake:

1. Show `ball-mid-open.png` for 120 ms.
2. Show `ball-full-open.png`.
3. Hold the full-open frame for 250 ms.
4. Call `onComplete`, which enters the existing fail beat.

Add named timing values in `rates.ts` for the 120 ms opening step and 250 ms hold rather than embedding numeric delays in the component.

## Reduced Motion

When reduced motion is preferred:

- Keep the closed ball stationary during the shortened shake period.
- Show static sparkles for a successful result.
- Skip the mid-open frame for an escape.
- Show the full-open frame for the existing reduced resolve duration, then call `onComplete`.

This preserves the result and important visual state changes without rocking, popping, or rapid frame transitions.

## Rendering and Styling

The sprite replaces the current `●` / `○` content and placeholder square styling. The outer dialog layout remains unchanged.

CSS owns:

- pixelated image rendering;
- the closed-ball rock keyframe;
- sparkle shape, placement, and success animation;
- reduced-motion overrides.

React owns:

- phase progression;
- shake count;
- timers;
- sprite selection;
- final callback timing.

Keep useful state attributes on the visual container, including `data-shakes`, `data-caught`, and `data-ending`. Add `data-phase` so phase transitions can be asserted without coupling tests to CSS class names.

## Accessibility

The sprites and sparkles are decorative and remain hidden from assistive technology. Preserve the existing polite live-region result text:

- `Caught`
- `Broke free`

Reduced-motion behavior must produce the same result text and callback behavior as standard motion.

## Error and Lifecycle Handling

Every phase timer must be cleared when the component unmounts or its dependencies change. `onComplete` must fire exactly once per mounted throw sequence.

The component must tolerate a remount between retries without carrying phase state from the previous throw. Sprite import failures remain build-time asset errors; no runtime fallback is required.

## Testing

Add or extend `BallShake` tests using fake timers.

Verify:

- the closed sprite is shown during all shake cycles;
- the existing chance thresholds still produce one, two, or three shakes;
- a successful result enters `resolve-caught`, renders sparkles, never renders an open sprite, and completes after the success resolve period;
- a failed result progresses from closed to mid-open to full-open, holds the full-open frame, and then completes;
- reduced motion has no rock phase animation, uses static success sparkles, and jumps directly to full-open on failure;
- `onComplete` fires once and timers are cleaned up on unmount;
- the existing result live-region text and state attributes remain correct.

Existing encounter-flow tests should remain unchanged because capture resolution and stage transitions are outside this component.

## Acceptance Criteria

- The supplied strip is converted into three aligned, transparent PNG frames.
- The closed ball visibly rocks left and right for each flavor shake.
- A caught Pokémon resolves on the closed ball with a brief four-sparkle cue.
- An escaped Pokémon resolves through mid-open, full-open, a brief hold, and the existing fail beat.
- Reduced-motion users receive static, shortened equivalents.
- Capture logic, retry logic, and encounter-store behavior do not change.
