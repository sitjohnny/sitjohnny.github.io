# Phase 4: Encounters - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-25
**Phase:** 04-encounters
**Areas discussed:** Phase boundary, Wrong-answer reveal timing, Adaptive aggressiveness, Question UI shell

---

## Phase boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Rolls + education | Drain candidates, MAP-03 rolls + appear, then math + bonus; stop before timing bar | ✓ |
| Education only | Assume Pokémon already chosen; defer grass rolls | |
| Education as Phase 5 | Keep Phase 4 as MAP-03/DATA-03 only | |

**User's choice:** Rolls + education
**Notes:** Aligns Phase 3 seam with the education brief.

| Option | Description | Selected |
|--------|-------------|----------|
| Pokémon outcomes only | Question on Pokémon (incl. rare/legendary); nothing/item skip | ✓ |
| Every non-nothing outcome | Items also get a question | |
| Claude decides | Education strictly on Pokémon | |

**User's choice:** Pokémon outcomes only

| Option | Description | Selected |
|--------|-------------|----------|
| Clear handoff stub | "Ready to throw!" holds encounter + bonus | ✓ |
| Auto-dismiss to map | Close encounter; store bonus silently | |
| Claude decides | Prefer visible stub | |

**User's choice:** Clear handoff stub

| Option | Description | Selected |
|--------|-------------|----------|
| Lock CATCH-01 rewrite now | Adaptive math replaces RPS in requirements | ✓ |
| Leave CATCH-01 wording | Rename later in Phase 5 | |
| Claude decides | Prefer locking rename in CONTEXT | |

**User's choice:** Lock the rewrite now

---

## Wrong-answer reveal timing

| Option | Description | Selected |
|--------|-------------|----------|
| After encounter ends | Reveal later, not immediately | ✓ |
| Never reveal | Encouragement only | |
| Next time fact appears | Reminder before retry | |

**User's choice:** After the encounter ends

| Option | Description | Selected |
|--------|-------------|----------|
| Post-encounter recap card | Before return to map; survives Phase 5 | ✓ |
| On handoff stub | Fold into Ready to throw | |
| Claude decides | After encounter, kid-friendly | |

**User's choice:** Post-encounter recap card

| Option | Description | Selected |
|--------|-------------|----------|
| Wrong answers only | Correct skips recap | ✓ |
| Always | Every encounter gets recap | |
| Claude decides | Prefer wrong-only | |

**User's choice:** Wrong answers only

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit Continue | Large button, no auto-advance | ✓ |
| Auto-advance with skip | Short delay | |
| Claude decides | Prefer explicit Continue | |

**User's choice:** Explicit Continue

---

## Adaptive aggressiveness

| Option | Description | Selected |
|--------|-------------|----------|
| Weighted-random, miss-biased | Favor weak facts without exclusive drilling | ✓ |
| Strongly targeted | Almost always weakest facts | |
| Claude decides | Planner tunes formula | |

**User's choice:** Weighted-random, miss-biased

| Option | Description | Selected |
|--------|-------------|----------|
| Accuracy threshold + min attempts | Mastery knobs in data/ | ✓ |
| Streak-based | N correct in a row | |
| Claude decides | Kid-friendly default in data/ | |

**User's choice:** Accuracy threshold

| Option | Description | Selected |
|--------|-------------|----------|
| Equal starter weight | All unseen facts eligible | ✓ |
| Gentle progression | Unlock harder facts over time | |
| Claude decides | No grade onboarding | |

**User's choice:** Equal starter weight

| Option | Description | Selected |
|--------|-------------|----------|
| No immediate repeat | Never same fact twice in a row | ✓ |
| Cooldown of last N | Avoid last N facts | |
| Claude decides | At least no back-to-back | |

**User's choice:** No immediate repeat

---

## Question UI shell

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen takeover | Pause map; fill viewport | ✓ |
| Modal overlay | Dimmed map behind panel | |
| Claude decides | Prefer full-screen | |

**User's choice:** Full-screen takeover

| Option | Description | Selected |
|--------|-------------|----------|
| Native numeric keypad | OS keypad via inputMode | ✓ |
| In-app number pad | Custom 0–9 buttons | |
| Claude decides | Prefer native | |

**User's choice:** Native numeric keypad

| Option | Description | Selected |
|--------|-------------|----------|
| Inline then advance | Feedback on question screen, then stub | ✓ |
| Instant advance | Toast while transitioning | |
| Claude decides | Short kid-friendly feedback | |

**User's choice:** Inline then advance

| Option | Description | Selected |
|--------|-------------|----------|
| Sequenced stages | Appear completes, then question mounts | ✓ |
| Appear-in-place | Animate into question chrome | |
| Claude decides | Lightweight, no cutscenes | |

**User's choice:** Sequenced stages

---

## Claude's Discretion

- Exact adaptive weighting formula and mastery threshold defaults (config-tunable)
- Adaptive Local Storage key/version
- Appear animation implementation details
- Feedback copy pools
- Handoff stub visual composition
- Nothing/item outcome presentation
- Seeded RNG details for grass rolls

## Deferred Ideas

- Timing bar, full capture roll, retry/flee (Phase 5)
- Non-multiplication education categories (interfaces only now)
- Encounter/answer SFX (Phase 8)
- Broader biome unlock tables (Phase 7)
