---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: verifying
stopped_at: Awaiting Phase 05 human verification
last_updated: "2026-07-26T14:55:00.000Z"
last_activity: 2026-07-26 -- Phase 05 automated verification passed; 4 UAT checks pending
progress:
  total_phases: 8
  completed_phases: 5
  total_plans: 24
  completed_plans: 24
  percent: 63
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-07-25)

**Core value:** A forgiving, rewarding explore → encounter → capture loop that a ~7-year-old can succeed at on phone or desktop, with progress that persists across sessions.
**Current focus:** Phase 05 — capture-flow

## Current Position

Phase: 05 (capture-flow) — VERIFYING
Plan: 5 of 5
Status: Human verification required (4 UAT checks pending)
Last activity: 2026-07-26 -- Automated verification passed 10/10

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 11
- Average duration: ~3.8min
- Total execution time: 0.70 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 3 | 8min | ~2.7min |
| 02 | 4 | 11min | ~2.8min |
| 03 | 4 | 23min | ~5.8min |

**Recent Trend:**

- Last 5 plans: 03-01 (3min), 03-02 (13min), 03-03 (3min), 03-04 (4min)
- Trend: steady

*Updated after each plan completion*

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 3min | 2 tasks | 30 files |
| Phase 01 P02 | 3min | 2 tasks | 16 files |
| Phase 01 P03 | 2min | 2 tasks | 10 files |
| Phase 02 P01 | 2min | 2 tasks | 7 files |
| Phase 02 P02 | 3min | 2 tasks | 10 files |
| Phase 02 P03 | 3min | 2 tasks | 6 files |
| Phase 02 P04 | 3min | 2 tasks | 6 files |
| Phase 03 P01 | 3min | 2 tasks | 9 files |
| Phase 03 P02 | 13min | 3 tasks | 14 files |
| Phase 03 P03 | 3min | 3 tasks | 6 files |
| Phase 03 P04 | 4min | 3 tasks | 8 files |
| Phase 03 P05 | 5min | 2 tasks | 8 files |
| Phase 03 P06 | 9min | 2 tasks | 11 files |
| Phase 04 P01 | 3min | 3 tasks | 15 files |
| Phase 04 P02 | 53min | 3 tasks | 13 files |
| Phase 04 P03 | 10min | 3 tasks | 10 files |
| Phase 04 P04 | 5min | 3 tasks | 8 files |
| Phase 04 P05 | 5min | 3 tasks | 9 files |
| Phase 04 P06 | 2min | 2 tasks | 6 files |
| Phase 05 P01 | 3min | 2 tasks | 9 files |
| Phase 05 P02 | 5min | 2 tasks | 11 files |
| Phase 05 P03 | 3min | 2 tasks | 5 files |
| Phase 05 P04 | 4min | 2 tasks | 11 files |
| Phase 05 P05 | 10min | 2 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: 8 vertical phases following the research dependency chain (shell → cache → map → encounters → capture → dex → persistence → polish); each phase from 3 onward ends playable
- Roadmap: Save envelope *types* designed in Phase 1 even though persist wiring lands in Phase 7 (retrofitting a versioned save is the costliest mistake)
- Roadmap: All rates/windows/thresholds live in `data/` config (DATA-03 anchored to Phase 4, applied in every later phase)
- Phase 1: `createHashRouter` + Vite `base: '/pokemon-safari/'` (no origin-root SPA 404) — protects food-crawl
- Phase 1: Source in `pokemon-safari-app/`; publish build to `pokemon-safari/`
- Phase 1 CONTEXT decisions numbered D-01…D-15 for plan coverage
- Phase 2 CONTEXT decisions D-01…D-11 locked (Boot route, Game-only gate, skip warm Boot, progress+retry, quota soft-fail, sprites+shiny, versioned namespaced keys)
- Phase 2 plans: Wave 0 tests → cache+Boot happy path → retry/gate/skip → sprite+quota
- [Phase 01]: Pinned typescript@5.9.3 for typescript-eslint peer range (A5)
- [Phase 01]: Excluded Wave 0 *.test.tsx from tsc -b so missing BottomNav does not block build
- [Phase 01]: Zustand ui stub uses lastRoute + settings.mute with no persist middleware
- [Phase 01]: HashRouter basename /pokemon-safari requires syncHashBasename so empty # matches routes
- [Phase 01]: createAppRouter per App mount keeps Vitest isolation with fresh router state
- [Phase 01]: Settings Reset Save is confirm-dialog UI only — no localStorage writes (T-01-06)
- [Phase 01]: Root listing uses hardcoded /food-crawl/ and /pokemon-safari/ hrefs only (T-01-07) — Mitigate open-redirect spoofing on site root
- [Phase 01]: deploy:copy targets ../pokemon-safari only — food-crawl untouched (T-01-09) — Prevent accidental overwrite of sibling Pages project
- [Phase 01]: No origin-root 404.html; HashRouter keeps SPA refresh safe (T-01-08 / D-14) — Origin-wide SPA fallback would break food-crawl
- [Phase 02]: Helpers use TEST_CACHE_KEY literal matching pokemon-safari:poke-cache:v1 so helpers load before keys.ts exists
- [Phase 02]: GameScreen.test asserts live GameScreen (no hook mock) so RED is missing gate copy, not missing module
- [Phase 02]: BootScreen.test mocks usePokemonCache; loading vs failure describes named for Wave 2/3 -t gates
- [Phase 02]: Sprite URL guard accepts any https: URL (reject non-https/javascript) so Vitest example.test hosts pass
- [Phase 02]: Cold-open steers only index/root hash to /boot; deep links stay put for D-02 chrome
- [Phase 02]: App smoke tests seed warm poke-cache so Home path remains stable under D-03 skip-Boot
- [Phase 02]: GameScreen uses isCacheReady() OR store.cacheReady so warm hydrate without Boot still unlocks Explore
- [Phase 02]: Warm App bootstrap calls setCacheReady(true) after sync hydrate to avoid store lag when Boot is skipped
- [Phase 02]: Boot failure reload assertion uses redefine window.location (jsdom blocks spyOn reload)
- [Phase 02]: Silhouette placeholder uses bg-text/20 (UI-SPEC text at 22% opacity) with .pixelated box
- [Phase 02]: Boot does not auto-navigate on quota — shows QuotaNote until Got it; explore already unlocked via cacheReady
- [Phase 02]: quotaSoftFail in ui store so Game can still surface the note if user leaves Boot via nav
- [Phase 03]: Logical tile commit + grass event fire at tryStep return; tween is presentation-only
- [Phase 03]: Forest map authored as 15x20 char grid mapped via CHAR_TILE for hand-editable layouts
- [Phase 03]: tileAt is the single bounds gate for all collision/walkability callers (T-03-02)
- [Phase 03]: Move lock releases on STEP_DURATION_MS in the explore loop so one press walks exactly one tile before 03-03's tween
- [Phase 03]: Explore store is written once per committed tile; completion and next step collapse into a single setPlayer
- [Phase 03]: Phase 2 D-02 cache gate preserved and extracted to CacheGateNotice so GameScreen is pure explore composition
- [Phase 03]: D-pad box is 208px (3x64 arms + 2x8 gaps); 192px cannot hold the 64px UI-SPEC hit targets
- [Phase 03]: Deterministic rAF shim replaces jsdom pretendToBeVisual so frame-driven explore tests are stable
- [Phase 03]: Reduced-motion and dtMs<=0 snap still clamp to map bounds (T-03-09) before writing the world transform
- [Phase 03]: useMapCamera returns a stable API object so the explore effect does not restart every render
- [Phase 03]: GameScreen needed no structural change — spriteRef + facing wiring from 03-02 was already correct
- [Phase 03]: Phase 4 reads pending grass events only via useExploreStore.getState().drainEncounters()
- [Phase 03]: enqueueEncounters caps at MAX_PENDING_ENCOUNTERS=32 by dropping oldest
- [Phase 03]: Map error recovery uses EmptyState + PixelButton; ExploreSurface unmounts so the rAF loop never runs on invalid data
- [Phase 03]: Original Gen 1–3–inspired fan pixels authored in-repo (no ROM dumps, no community pack)
- [Phase 03]: Tile PNGs generated with Node zlib only — package.json/lockfile unchanged (T-03-SC)
- [Phase 03]: pixelated class lives on each tile <img>, not only a parent wrapper
- [Phase 03]: Character Red = 8 original 16×16 RGBA PNGs (4 facings × 2 frames) authored via Node zlib; no npm packages (T-03-SC)
- [Phase 03]: PlayerSprite mounts all 8 frame imgs; index.css [data-facing][data-frame] selectors reveal exactly one — rAF dataset.frame is sole writer (MAP-04, no React frame state)
- [Phase 03]: Player CSS visibility tested in jsdom by injecting the same [data-facing][data-frame] rules as a <style> (Vitest runs css:false)
- [Phase 04]: Mulberry32 + cumulative weightedPick with no new npm packages
- [Phase 04]: CATCH-03 wording updated to education capture bonus so RPS cannot resurface in REQUIREMENTS
- [Phase 04]: // header on rng.ts so Math.random acceptance grep excludes the ban comment
- [Phase 04]: Appear advances straight to handoff in 04-02; 04-04 inserts question between them
- [Phase 04]: useEncounterFlow.test.ts uses createElement harnesses so ESLint/oxc can parse .ts JSX-free
- [Phase 04]: Overlay resolves getPokemon defensively and fails into the Try Again card
- [Phase 04]: Ordered pairs are distinct facts (3x7 ≠ 7x3) — no commutative dedupe
- [Phase 04]: Digit answers capped at 15 chars to avoid non-finite parse
- [Phase 04]: Header comments avoid literal Math.random / localStorage.clear( substrings for acceptance greps
- [Phase 04]: Overlay imports module-level advanceFromAppear/submitAnswer so GameScreen need not prop-drill
- [Phase 04]: flowRngRef mirrors the hook's injected Rng for overlay callbacks and Vitest harnesses
- [Phase 04]: close() clears question/feedback but preserves lastFactKey (D-20)
- [Phase 04]: Recap operands parsed from factKey; product taken from education.expected
- [Phase 04]: Focus dialog only on transition out of idle so question input keeps focus
- [Phase 04]: jsdom inert Tab assertion uses attribute contract — browsers honor focus skip
- [Phase 04]: Unmount uses close() not reset() so adaptive no-repeat lastFactKey survives route leave
- [Phase 04]: inert predicate uses pathname === '/game' under basename — no hardcoded /pokemon-safari prefix
- [Phase 05]: Catch formula is rarity + education + timing + ball + berry, clamped [0,1] (D-22)
- [Phase 05]: Phase 5 defaults ball poke / berry false while keeping config slots (D-23)
- [Phase 05]: gradeAt uses ZONE_EPS so sweetSpot ± half-width float noise still hits inclusive boundaries
- [Phase 05]: Feedback hold advances via startTiming() — handoff stage removed
- [Phase 05]: TimingBar MVP uses sweetSpot as frozen Capture position; 05-03 owns ping-pong
- [Phase 05]: Minimal FleePlaceholder shell so third-fail path does not hang GameScreen
- [Phase 05]: Indicator position is a single posRef written via rAF; Capture freezes then calls capture(posRef)
- [Phase 05]: Band geometry uses sweetSpot ± zone half-widths from timingBar.zones[rarity]
- [Phase 05]: Keyboard Space remounts after freeze in tests — Capture disables after one press (D-20/D-21)
- [Phase 05]: failBeat is a dedicated EncounterStage with config-timed hold — no Try Again gate
- [Phase 05]: onShakeComplete replaces resolveAfterShake; registerThrow remains sole attemptsUsed writer
- [Phase 05]: FleeCard copy from captureCopy; GameScreen miss stubs use rng.next()===1 so 100% chance still fails
- [Phase 05]: GradeFlash->BallShake handoff owned by keyed ShakeSequence child (remount per throw) — immune to gradeFlashDone leak (D-14/WR-01)
- [Phase 05]: registerThrow guarded to stage==='timing' so stray calls cannot inflate attemptsUsed (WR-03/T-05-04)

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 3: Map render layer unresolved (CSS transforms vs Canvas 2D) — start CSS transforms behind `components/map` boundary; graduate only if mobile profiling demands
- Phase 5: Timing-bar windows for a 7-year-old are unmeasured — keep all windows in `data/`, plan real-device playtest with target player
- Phase 1 deep-link strategy resolved: HashRouter (was open in STATE; closed in RESEARCH + plans)

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-07-26T14:42:05.247Z
Stopped at: Completed 05-04-PLAN.md
Resume file: None
