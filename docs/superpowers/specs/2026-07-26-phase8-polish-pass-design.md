# Phase 8 Polish Pass Design

**Date:** 2026-07-26  
**Status:** Approved  
**Replaces:** Roadmap Phase 8 “Audio, Feedback & Polish” (audio and biome unlocks removed)

## Goal

Ship a no-new-gameplay polish pass so Pokémon Safari feels smoother, recovers from known failures kindly, works better across phone/tablet/desktop, and is easier to maintain. This design **replaces Phase 8** on the roadmap.

## Scope

**In scope**

- Screen transitions for routes (Game ↔ Dex ↔ Settings) and overlays (encounter overlay, dex detail sheet)
- Unified button / press animations via shared tokens or a pressable primitive
- True multi-breakpoint responsive layouts (widen map, dex grid, settings on tablet/desktop)
- React error boundary plus recovery for known failures: boot/cache load, save quota, corrupt save
- Harden existing localStorage PokéAPI cache and save hydrate paths (no service worker / PWA)
- Profile-guided performance work: boot and runtime, clear wins only
- Broader refactor: dedupe shared UI, split oversized hooks/screens/tests (`useEncounterFlow` and related)
- Update roadmap Phase 8 success criteria to match this polish-only phase

**Out of scope**

- New gameplay features, encounter rates, biomes, unlocks, inventory, or daily rewards
- Audio, SFX, mute toggle, gesture audio unlock
- Service worker / offline app-shell caching
- New celebration systems beyond what already ships
- Speculative rewrites without a measured performance reason

## Approach

**Layered polish waves**

1. **Foundations** — motion/press tokens, error boundary + failure UX, cache/save recovery hardening  
2. **Transitions + responsive breakpoints** — route/overlay motion; multi-width layouts  
3. **Performance** — profile first; land only clear boot/runtime wins  
4. **Structural refactors** — split hotspots and finish dedupe on top of shared primitives  

Waves 1–3 deliver visible polish early; wave 4 preserves behavior while reducing maintenance cost.

## Architecture

Keep the existing app shape: HashRouter `AppShell`, Zustand stores, versioned poke-cache + player save in localStorage. Add a thin polish layer; do not add gameplay modules.

| Unit | Responsibility | Depends on |
| --- | --- | --- |
| Motion tokens (CSS / Tailwind) | Durations, press scale, route/overlay enter-exit; gated by `prefers-reduced-motion` | `index.css` / theme |
| Pressable primitive or shared class | One press-feedback API replacing duplicated `active:scale-95` call sites | Motion tokens |
| `ScreenTransition` | Short fade/slide around router outlet | React Router outlet, motion tokens |
| Overlay motion | Encounter overlay + Dex detail sheet enter/exit | Motion tokens |
| `AppErrorBoundary` | Catch fatal render errors; kid-friendly recovery | App / AppShell |
| Failure notices | Consistent Boot retry, quota, corrupt-save messaging | Existing Boot / QuotaNote patterns |
| Cache/save harden | Validation, offline-aware Boot copy, safe save fallbacks | `services/pokeapi/cache`, save flush / envelope |
| Encounter flow split | Smaller modules with same public behavior | Existing `useEncounterFlow` tests |

**Offline meaning (explicit):** After a successful Gen 1 poke-cache, gameplay must not call PokéAPI. This pass does **not** make the HTML/JS shell load without network (no service worker).

## Components & UI contracts

### Button / press animations

- Shared press: ~80ms scale-down on pointer down; quick settle on release
- Call sites migrate: `PixelButton`, `DPad`, `DexTile`, `CacheGateNotice`, and any similar controls touched in-phase
- Optional subtle focus/active affordance for keyboard users only where needed
- `prefers-reduced-motion: reduce` → no scale/transition; instant state change

### Screen & overlay transitions

- Routes: short crossfade (~150–200ms) between Game / Dex / Settings
- Encounter overlay: fade + slight rise in; reverse on dismiss / flee / catch-complete
- Dex detail sheet: slide/fade using the same timing tokens
- Reduced motion: immediate swap; no enter/exit animation

### Responsive breakpoints

| Band | Layout intent |
| --- | --- |
| Phone (below ~640px) | Keep single-column shell; fix safe-area, landscape overflow, cramped spacing |
| Tablet (~640–1024px) | Drop hard `max-w-[480px]` cap; widen map viewport; more dex columns; settings use width without multi-pane dashboard |
| Desktop (above ~1024px) | Centered wider play surface with side margins; bottom nav stays inside the play column |

**Layout rules**

- One composition per screen; no card-heavy desktop redesign
- Map remains the visual anchor on Game; dex stays a dense grid with more columns
- Touch targets remain at least current `touch-target` size; desktop still gets press feedback

## Error handling & data flow

1. **Cold boot** → hydrate poke-cache → invalid / missing / offline fetch fail → Boot retry with clearer, offline-aware copy (strengthen existing path)
2. **Save read** → corrupt / unreadable → migrate or fall back to safe defaults; keep poke-cache intact; notice that the affected save slice may have reset
3. **Save write** → quota failure → existing quota UX with clearer “still playable; progress may not stick” messaging
4. **Uncaught render error** → `AppErrorBoundary` → “Something went wrong” + Reload / Go to Game (no stack traces for kids)

No new failure modes for audio or biome systems (those features are out of scope).

## Performance

- Measure before changing (boot time, explore frame cost, dex scroll)
- Apply only clear wins: avoid unnecessary re-renders, trim heavy work on explore/encounter paths, light code-splitting if cold start is clearly heavy
- Directional bars: no sustained walk jank on a mid phone; dex scroll usable at 151 entries; no cold-boot regression without a measured reason

## Refactor

- Extract shared press/motion helpers during foundations; finish call-site migration during polish
- Split `useEncounterFlow` into smaller units (state-machine steps / pure helpers) with behavior-preserving tests
- Reduce oversized screen/test files where they block maintenance
- Diffs must not intentionally change gameplay, rates, or biomes

## Testing

- Unit/component: pressable + reduced-motion; error boundary recovery UI; cache/save failure paths (corrupt save, quota, offline fetch → retry copy)
- Route/overlay: transition wrapper does not break navigation or trap focus; reduced-motion path is instant
- Regression: Game / encounter / dex / Phase 7 persistence suites stay green after hook splits
- Manual: phone, tablet, desktop widths; landscape phone; warm-cache boot with network disabled (no PokéAPI after cache ready)

## Success criteria (new Phase 8)

1. Tab and overlay transitions feel intentional; reduced-motion users get instant swaps  
2. Buttons/tiles share consistent press feedback  
3. Layouts use extra width on tablet/desktop without losing mobile-first game feel  
4. Fatal UI errors and known cache/save failures show kid-friendly recovery  
5. After a valid Gen 1 cache, gameplay does not need PokéAPI (hardened data path; no service worker)  
6. Only clear, measured performance wins land; structural refactors preserve behavior  
7. Roadmap Phase 8 documents polish-only scope — **no audio, no biome unlocks**

## Roadmap impact

Replace Phase 8 title/goal/requirements/success criteria with this polish pass. Drop `AUDIO-01`, `AUDIO-02`, and biome-unlock celebration requirements from Phase 8. Keep dependency on Phase 7 (persistence) so save hardening builds on the versioned save envelope.
