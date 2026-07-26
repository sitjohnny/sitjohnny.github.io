# Phase 4: Encounters - Context

**Gathered:** 2026-07-25
**Status:** Ready for planning
**Source:** User brief (education system) + interactive discuss-phase

<domain>
## Phase Boundary

Consume Phase 3's `encounter_candidate` queue (`drainEncounters()`), run config-driven grass rolls (MAP-03 / DATA-03), and when a Pokémon appears, run the adaptive multiplication education step that replaces Rock-Paper-Scissors. Apply a capture bonus, then stop at a clear "Ready to throw!" handoff stub.

**In scope:** Grass outcome rolls + biome tables in `data/`; appear flash/animation; modular education question system (`game/education/`); adaptive Local Storage stats; +15% / +0% capture modifier; wrong-answer post-encounter recap; Phase 5 handoff stub.

**Out of scope:** Timing-bar mini-game, full capture roll / retry / flee, ball/berry inventory wiring, Pokédex binding, audio. Stop after this milestone and document the education architecture before continuing.

</domain>

<decisions>
## Implementation Decisions

### Phase scope & requirement rewrite
- **D-01:** Phase 4 delivers **rolls + education** end-to-end (not education-only, not deferred to Phase 5).
- **D-02:** Education runs only on **Pokémon outcomes** (including rare/legendary). Nothing and item outcomes skip the question.
- **D-03:** After education, show a clear **"Ready to throw!" handoff stub** that holds the encounter + capture bonus — no timing bar in this phase.
- **D-04:** Lock the CATCH-01 rewrite now: **adaptive multiplication replaces Rock-Paper-Scissors**. Planner must update REQUIREMENTS.md / ROADMAP.md wording so Phase 5 does not rebuild RPS.

### Encounter flow (locked from brief)
- **D-05:** Flow: Pokémon appears (short animation) → one multiplication question → player answers → apply capture bonus → continue to handoff stub (timing bar later).
- **D-06:** Appear animation and question UI are **sequenced**: appear flash/animation completes, *then* the question UI mounts.
- **D-07:** Question UI is a **full-screen takeover** (map paused); large readable text; large touch-friendly controls; **no answer timer**; lightweight animations; responsive desktop + mobile.

### Math questions (locked from brief)
- **D-08:** Single-digit multiplication only (`1–9 × 1–9`).
- **D-09:** Question screen shows: Pokémon sprite, question, numeric input, Submit button.
- **D-10:** Desktop: keyboard entry + Enter to submit. Mobile: **native numeric keypad** (`inputMode="numeric"` / equivalent) and large touch controls — not a custom in-app pad.
- **D-11:** Correct → positive message + **+15% capture chance**. Incorrect → encouraging message + **+0%** bonus; do **not** reveal the correct answer immediately; encounter always continues.

### Feedback & wrong-answer reveal
- **D-12:** After submit, show **inline** positive/encouraging feedback on the question screen, then advance to the handoff stub (no answer reveal yet on incorrect).
- **D-13:** Correct answer is revealed **after the encounter ends**, via a **post-encounter recap card** before returning to the map (survives Phase 5 when the stub is replaced by capture).
- **D-14:** Recap card shows for **wrong answers only**; correct answers skip the recap.
- **D-15:** Recap dismisses via explicit large **Continue** — no auto-advance.

### Adaptive learning
- **D-16:** Track each multiplication fact in Local Storage (e.g. `"7x8": { "correct": N, "incorrect": M }`). Use a **namespaced, versioned key** separate from PokéAPI cache and player save (never `localStorage.clear()`).
- **D-17:** Selection is **weighted-random, miss-biased** — weak facts favored often but not exclusively.
- **D-18:** Mastered facts use an **accuracy threshold + minimum attempt count**; knobs live in `data/` config. Occasionally review mastered facts.
- **D-19:** Never-attempted facts start with **equal starter weight** (all 81 facts eligible; no grade-level onboarding).
- **D-20:** **No immediate back-to-back repeat** of the same fact across consecutive encounters.
- **D-21:** Keep selection/persist logic in a reusable **`adaptiveLearning` service** under `game/education/`.

### Education module architecture (locked from brief)
- **D-22:** Design around **interfaces**, not hardcoded multiplication only — future categories (addition, subtraction, division, vocabulary, geography, etc.) must plug in without changing encounter flow.
- **D-23:** Suggested module layout (planner may refine names/paths within `game/education/`):
  - `adaptiveLearning.ts`
  - `questionGenerator.ts`
  - `answerValidator.ts`
  - `questionTypes.ts`
- **D-24:** Capture bonus is a **modifier carried on the encounter session** for Phase 5 (+15% or +0%); exact type shape is Claude's discretion as long as it's config-friendly and testable.

### Claude's Discretion
- Exact weighted-random formula and mastery threshold defaults (must be config-tunable)
- Exact Local Storage key string / version integer for adaptive stats
- Appear-animation implementation details (CSS vs canvas), as long as sequenced and lightweight
- Exact copy pools for positive / encouraging messages
- Handoff stub visual composition and copy ("Ready to throw!" or equivalent)
- How nothing/item outcomes present feedback (brief toast vs silent continue) — education not involved
- Seeded-RNG approach for grass rolls (must be unit-testable against config tables)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` — Phase 4 goal (MAP-03 / DATA-03); Phase 5 capture criteria to update for math-vs-RPS
- `.planning/REQUIREMENTS.md` — MAP-03, DATA-03; CATCH-01 (rewrite to adaptive math); CATCH-02+ remain Phase 5
- `.planning/PROJECT.md` — kid audience, config-driven gameplay, folder layout, localStorage constraints

### Prior phase seams
- `.planning/phases/03-exploration/03-CONTEXT.md` — encounter_candidate emit-only boundary
- `.planning/phases/02-pok-mon-data-layer/02-CONTEXT.md` — namespaced cache keys; sprite component; never `localStorage.clear()`
- `pokemon-safari-app/src/game/events.ts` — Phase 4 integration seam (`drainEncounters`)
- `pokemon-safari-app/src/store/exploreStore.ts` — `pendingEncounters` / drain API

### Existing UI / data patterns
- `pokemon-safari-app/src/components/PokemonSprite.tsx` — pixelated sprite rendering
- `pokemon-safari-app/src/components/PixelButton.tsx` — large touch-target button pattern
- `pokemon-safari-app/src/services/pokeapi/keys.ts` — namespaced versioned key pattern to mirror for adaptive stats
- `pokemon-safari-app/src/data/exploreConfig.ts` — existing config pattern to extend with encounter/education knobs

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PokemonSprite` — show the encountered species on the question / appear screens
- `PixelButton` — Submit / Continue / handoff actions with existing touch-target styling
- `useExploreStore.drainEncounters()` — single Phase 4 read point for grass candidates
- `getPokemon` / cache layer (Phase 2) — synchronous species metadata for rolls and sprites

### Established Patterns
- Pure `game/` logic separate from React UI (MAP-04 discipline carries forward)
- Config values in `data/`, not hardcoded in components (DATA-03)
- Namespaced versioned localStorage keys; never clear the whole store
- Vitest unit tests for pure game logic (seeded RNG for rolls; adaptive selection)

### Integration Points
- Game screen / explore loop: after movement, drain candidates → roll → maybe open encounter flow
- Encounter session state (new): hold species, rarity, education result, capture bonus until Phase 5
- Bottom nav / map input: pause while full-screen encounter is active

</code_context>

<specifics>
## Specific Ideas

- Adaptive stats JSON shape from the brief:
  ```json
  {
    "7x8": { "correct": 3, "incorrect": 5 },
    "4x6": { "correct": 8, "incorrect": 1 }
  }
  ```
- Milestone stop: after education + handoff stub works, **explain the architecture** before implementing the timing bar (Phase 5).
- Prefer interfaces so adding non-multiplication categories later does not touch encounter flow orchestration.

</specifics>

<deferred>
## Deferred Ideas

- Timing-bar mini-game (Phase 5, CATCH-02)
- Full capture roll with ball/berry/rarity (Phase 5, CATCH-03–05)
- Retry / flee after three fails (Phase 5, CATCH-04)
- Additional education categories beyond multiplication (future — interfaces only in this phase)
- Item-pickup / nothing outcome UX polish beyond what's needed to keep the loop playable
- Audio for encounter / answer feedback (Phase 8, AUDIO-01)
- Lake / Mountain biome tables beyond Forest defaults needed for MAP-03 (broader biome unlocks remain Phase 7)

</deferred>

---

*Phase: 04-encounters*
*Context gathered: 2026-07-25 via discuss-phase (user brief + interactive decisions)*
