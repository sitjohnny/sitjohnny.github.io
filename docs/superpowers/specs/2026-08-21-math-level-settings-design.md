# Math level & operator settings

**Date:** 2026-08-21  
**Status:** Approved for planning  
**App:** `pokemon-safari-app`

## Goal

Let players choose which math **operators** and **difficulty levels** appear during encounters. Replace the current rarity-based math mix with Settings as the sole source of truth for problem shape. Default: all operators enabled, Level 2 only.

## Background

Today education math is multiplication and division only. `selectFact` uses `rarityEducationMix` so common / rare / legendary Pokémon skew toward single-digit, double-digit (10–20 × 2–9), or division / long division. Settings currently exposes Reset Save only (spelling toggle was removed while spelling is product-disabled).

This feature adds addition and subtraction, full digit-class ranges, six mutually exclusive levels, and Settings persistence.

## Decisions (locked)

| Topic | Choice |
| --- | --- |
| Levels vs operators | Global levels — one level set applies to every enabled operator |
| Rarity × math | Ignore rarity for math selection; rarity still chooses the Pokémon |
| Level digit pairs | Mutually exclusive (see Levels) |
| Multi-select pick order | Equal pick among enabled operators, then equal among enabled levels, then adaptive within that pool |
| Problem constraints | Kid-safe: non-negative subtraction, exact integer division, skip trivial ×/÷ cases (e.g. ×0, ×1, ÷1) |
| Empty Settings | Block turning off the last operator and the last level |
| Digit ranges | 1-digit `1–9`, 2-digit `10–99`, 3-digit `100–999` |
| Approach | Settings-driven pools (not rarity-filter, not per-operator levels) |

## Levels

| Level | Operand digit pair | Example |
| --- | --- | --- |
| 1 | 1-digit ⊗ 1-digit | `7 × 4` |
| 2 | 1-digit ⊗ 2-digit (either order) | `8 + 47` |
| 3 | 2-digit ⊗ 2-digit | `36 − 19` |
| 4 | 3-digit ⊗ 1-digit (either order) | `248 ÷ 4` |
| 5 | 3-digit ⊗ 2-digit (either order) | `156 × 23` |
| 6 | 3-digit ⊗ 3-digit | `412 + 307` |

Settings copy (tunable) should describe each level next to its checkbox using the examples above.

## Settings model

Persisted preference (localStorage; same persistence style as the former spelling toggle):

```ts
type MathEducationSettings = {
  operators: {
    addition: boolean
    subtraction: boolean
    multiplication: boolean
    division: boolean
  }
  levels: {
    1: boolean
    2: boolean
    3: boolean
    4: boolean
    5: boolean
    6: boolean
  }
}
```

**Default:**

- All four operators `true`
- Only level `2` `true`; levels 1, 3–6 `false`

**Validation:**

- Corrupt, missing, or partial storage → load defaults
- UI and persist path refuse a state with zero operators or zero levels enabled

**Reset Save:** restore math prefs to defaults along with other progress wipe behavior.

## Settings UI

Place above Reset Save on `SettingsScreen`:

1. **Operators** — four checkboxes (addition, subtraction, multiplication, division). Disabling the last remaining operator is blocked.
2. **Levels** — an “All levels” control plus six rows (checkbox + short description). Disabling the last remaining level is blocked. “All levels” turns 1–6 on; turning any off while all were on clears the “all” state.

No cards beyond what’s needed for interactive controls; follow existing Settings / pixel UI patterns.

## Selection & probability

### Retire

- Live use of `rarityEducationMix` for math category cuts
- Narrow double-digit multiplication band (`10–20`) as the difficulty source of truth

Encounter rarity continues to drive Pokémon selection only.

### New `selectFact` flow (pure, RNG-injected)

1. Accept `MathEducationSettings` (loaded once per question / encounter handoff — do not read `localStorage` inside pure selection).
2. Collect enabled operators; pick one with equal weight.
3. Collect enabled levels; pick one with equal weight.
4. Build the fact pool for `(operator, level)` using digit-pair rules and kid-safe filters.
5. Adaptive weighted pick inside that pool (existing miss-bias / mastery weights).
6. If the pool is empty after filters, fall back to other enabled levels for that operator, then other enabled operators. Never leave the enabled Settings set. Never throw for an empty world if Settings validation held.

### Operand / operator rules

- **Addition / multiplication:** whole numbers in the level’s digit classes; multiplication skips trivial cases (`×0`, `×1` and symmetric equivalents as configured).
- **Subtraction:** always minuend ≥ subtrahend so the answer is non-negative; the two operands’ digit lengths still match the level pair (swap if needed to satisfy ordering).
- **Division:** exact integer quotients only; skip `÷1`. For asymmetric levels (L2/L4/L5), the longer digit-class operand is the dividend and the shorter is the divisor. For symmetric levels, both dividend and divisor use that digit class. Quotient must be a positive integer.

### Fact keys

Stable adaptive keys per problem:

| Operator | Key shape | Example |
| --- | --- | --- |
| Multiplication | `${a}x${b}` (unchanged) | `12x4` |
| Division | `${n}d${d}` (unchanged) | `48d6` |
| Addition | `${a}p${b}` (`p` = plus) | `8p47` |
| Subtraction | `${a}m${b}` (`m` = minus; `a` = minuend) | `36m19` |

## Question generation & answer UI

- `questionTypes` / `questionGenerator`: categories `addition` | `subtraction` | `multiplication` | `division` with prompts and `recapLine` for each.
- Encounter flow: pass math settings into `nextQuestion` / `selectFact`; stop passing rarity into math selection (rarity param may remain on the provider seam for spelling / future use but must not affect math pools).
- Answer input digit cap: raise from 4 to **6** so Level 6 multiplication products (`999 × 999`) fit.

## Architecture (modules)

| Module | Responsibility |
| --- | --- |
| `mathSettings.ts` | load / persist / validate prefs |
| `educationConfig.ts` | level defs, digit ranges, Settings copy, trivial exclusions; remove live rarity mix |
| `adaptiveLearning.ts` | per `(operator, level)` pools + new selection |
| `questionGenerator.ts` / `questionTypes.ts` | four operators in prompts / validation path |
| `SettingsScreen.tsx` | operators + levels UI |
| Encounter / education callers | inject settings into selection |

Keep selection free of React, Zustand, and browser globals; Settings I/O stays in the settings module / UI.

## Error handling

| Case | Behavior |
| --- | --- |
| Corrupt storage | Defaults |
| Last checkbox off | Blocked in UI (+ validate on write) |
| Empty pool for one combo | Fallback within enabled set |
| No facts at all | Should be unreachable if validation holds; if hit, regenerate with defaults for that question only and do not crash the encounter |

## Testing

- Persist / load / validate math settings (defaults, corruption, last-checkbox rules)
- Selection ignores rarity across many draws
- Over many draws, enabled operators and levels appear with roughly equal share
- Each level produces only its digit-pair class
- Subtraction non-negative; division exact; trivial ×/÷ excluded
- Settings UI cannot clear the last operator or level
- Update or remove tests that assert `rarityEducationMix` behavior
- Answer field accepts up to 6 digits for large products

## Out of scope

- Re-enabling spelling questions
- Per-operator level pickers
- Negative answers, remainders, or non-integer division
- Changing capture-bonus amounts or throw limits
- New visual design system beyond Settings content

## Success criteria

- Player can enable any non-empty subset of operators and levels and only sees matching problems
- Fresh install / Reset Save yields all operators + Level 2
- Legendary vs common encounters do not change math difficulty under the same Settings
- Existing adaptive miss-bias still works inside the chosen pool
