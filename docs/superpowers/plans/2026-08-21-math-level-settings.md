# Math Level & Operator Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let players enable operators (+ − × ÷) and digit-pair levels (1–6) in Settings; replace rarity-based math mix with equal operator→level→adaptive selection; default all operators + Level 2.

**Architecture:** Persist `MathEducationSettings` in localStorage. Pure `selectFact(rng, stats, exclude, settings)` picks an enabled operator equally, then an enabled level equally, then a fact from that `(operator, level)` pool (enumerate when small; sample + miss-review when large). Question generator builds prompts for four operators. Settings UI enforces ≥1 operator and ≥1 level.

**Tech Stack:** Vite, React 19, TypeScript, Zustand, Vitest, Testing Library, existing Safari education / Settings patterns.

**Spec:** `docs/superpowers/specs/2026-08-21-math-level-settings-design.md`

## Global Constraints

- Levels are **global** (same set for all operators)
- Math selection **ignores** encounter rarity
- Digit pairs are **mutually exclusive** (L1=`1×1` … L6=`3×3`)
- Digit ranges: 1-digit `1–9`, 2-digit `10–99`, 3-digit `100–999`
- Kid-safe: non-negative subtraction, exact integer division, skip trivial `×0`/`×1`/`÷1`
- Default: all four operators on; **only Level 2** on
- Cannot turn off the last operator or last level
- Answer input max digits: **6**
- Pure selection must not read `localStorage` (settings passed in)
- Work from `pokemon-safari-app/`; run `npm test` / targeted vitest
- Commit after each task; `docs/` is gitignored — use `git add -f` only if committing docs

## File map

| File                                             | Responsibility                                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `src/data/educationConfig.ts`                    | Digit ranges, level pairs, Settings copy, trivial exclusions; remove live `rarityEducationMix` / narrow double-digit band |
| `src/game/education/mathSettings.ts`             | Load / persist / validate `MathEducationSettings`                                                                         |
| `src/game/education/mathSettings.test.ts`        | Persistence + validation tests                                                                                            |
| `src/game/education/adaptiveLearning.ts`         | Pool builders + new `selectFact`                                                                                          |
| `src/game/education/adaptiveLearning.test.ts`    | Replace rarity-mix tests with settings-driven tests                                                                       |
| `src/game/education/questionTypes.ts`            | `addition` / `subtraction` categories + fact key unions                                                                   |
| `src/game/education/questionGenerator.ts`        | Build prompts for four operators; pass settings into `selectFact`                                                         |
| `src/hooks/useEncounterFlow.ts`                  | Load settings; pass into `nextEducationQuestion` / math provider                                                          |
| `src/components/encounter/EducationQuestion.tsx` | `MAX_DIGITS = 6`                                                                                                          |
| `src/screens/SettingsScreen.tsx`                 | Operators + levels UI; reset prefs on erase                                                                               |
| `src/data/config-surface.test.ts`                | Lock new config surface; drop rarity-mix expectations                                                                     |

---

### Task 1: Education config — levels, ranges, copy

**Files:**

- Modify: `pokemon-safari-app/src/data/educationConfig.ts`
- Modify: `pokemon-safari-app/src/data/config-surface.test.ts`
- Test: `pokemon-safari-app/src/data/config-surface.test.ts`

**Interfaces:**

- Produces:

```ts
export type MathOperator =
  | "addition"
  | "subtraction"
  | "multiplication"
  | "division";
export type MathLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type DigitClass = 1 | 2 | 3;

export const digitRanges: Record<DigitClass, { min: number; max: number }> = {
  1: { min: 1, max: 9 },
  2: { min: 10, max: 99 },
  3: { min: 100, max: 999 },
};

/** Mutually exclusive operand digit classes [leftClass, rightClass] for display order;
 * generation may swap for subtraction / division rules. */
export const levelDigitPairs: Record<
  MathLevel,
  readonly [DigitClass, DigitClass]
> = {
  1: [1, 1],
  2: [1, 2],
  3: [2, 2],
  4: [3, 1],
  5: [3, 2],
  6: [3, 3],
};

export const DEFAULT_MATH_EDUCATION_SETTINGS = {
  operators: {
    addition: true,
    subtraction: true,
    multiplication: true,
    division: true,
  },
  levels: {
    1: false,
    2: true,
    3: false,
    4: false,
    5: false,
    6: false,
  },
} as const;

export const mathSettingsCopy = {
  operatorsHeading: "Math operators",
  levelsHeading: "Math levels",
  allLevels: "All levels",
  operators: {
    addition: "Addition (+)",
    subtraction: "Subtraction (−)",
    multiplication: "Multiplication (×)",
    division: "Division (÷)",
  },
  levels: {
    1: { label: "Level 1", description: "One-digit numbers only (e.g. 7 × 4)" },
    2: {
      label: "Level 2",
      description: "One-digit with two-digit (e.g. 8 + 47)",
    },
    3: {
      label: "Level 3",
      description: "Two-digit with two-digit (e.g. 36 − 19)",
    },
    4: {
      label: "Level 4",
      description: "Three-digit with one-digit (e.g. 248 ÷ 4)",
    },
    5: {
      label: "Level 5",
      description: "Three-digit with two-digit (e.g. 156 × 23)",
    },
    6: {
      label: "Level 6",
      description: "Three-digit with three-digit (e.g. 412 + 307)",
    },
  },
} as const;

/** Skip ×0, ×1 and ÷1 (and symmetric × when either factor is 0 or 1). */
export const trivialExclusions = {
  multiplyMinFactor: 2,
  divideMinDivisor: 2,
} as const;

/** Max facts to fully enumerate before switching to sample+review (keeps L6 feasible). */
export const maxEnumeratePoolSize = 12_000;
```

- Remove exports used only by the old selector: `rarityEducationMix`, `doubleDigitMultiplication`, `divisionProblems`, `longDivisionProblems`, `multiplicationRange` — **or** keep deprecated aliases only if something outside education still imports them; prefer delete + fix imports in this task / Task 3.
- Keep: `adaptiveWeights`, `masteryThreshold`, feedback/capture/spelling copy.

- [ ] **Step 1: Write the failing config-surface assertions**

In `config-surface.test.ts`, replace the block that expects `doubleDigitMultiplication` / `rarityEducationMix` / old division ranges with:

```ts
it("exports math level digit ranges, pairs, defaults, and settings copy", () => {
  expect(digitRanges).toEqual({
    1: { min: 1, max: 9 },
    2: { min: 10, max: 99 },
    3: { min: 100, max: 999 },
  });
  expect(levelDigitPairs[2]).toEqual([1, 2]);
  expect(levelDigitPairs[6]).toEqual([3, 3]);
  expect(DEFAULT_MATH_EDUCATION_SETTINGS.operators.addition).toBe(true);
  expect(DEFAULT_MATH_EDUCATION_SETTINGS.levels[2]).toBe(true);
  expect(DEFAULT_MATH_EDUCATION_SETTINGS.levels[1]).toBe(false);
  expect(mathSettingsCopy.levels[2].description).toMatch(
    /one-digit with two-digit/i,
  );
  expect(maxEnumeratePoolSize).toBe(12_000);
});
```

Remove imports of deleted symbols.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd pokemon-safari-app && npx vitest run src/data/config-surface.test.ts -t "math level"`

Expected: FAIL (exports missing)

- [ ] **Step 3: Implement config exports; delete live rarity mix**

Update `educationConfig.ts` with the interfaces above. Delete `rarityEducationMix`, `doubleDigitMultiplication`, `divisionProblems`, `longDivisionProblems`, and `multiplicationRange` if nothing else needs them after a quick grep — leave temporary re-exports only if Task 3 is not in the same commit window; prefer removing and fixing compile errors in Task 3 immediately after.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd pokemon-safari-app && npx vitest run src/data/config-surface.test.ts`

Expected: PASS (fix any other assertions that still reference deleted exports)

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/data/educationConfig.ts pokemon-safari-app/src/data/config-surface.test.ts
git commit -m "$(cat <<'EOF'
feat(safari): add math level config and retire rarity education mix

EOF
)"
```

---

### Task 2: `mathSettings` load / persist / validate

**Files:**

- Create: `pokemon-safari-app/src/game/education/mathSettings.ts`
- Create: `pokemon-safari-app/src/game/education/mathSettings.test.ts`

**Interfaces:**

- Consumes: `DEFAULT_MATH_EDUCATION_SETTINGS` from `@/data/educationConfig`
- Produces:

```ts
export const MATH_SETTINGS_KEY = "pokemon-safari:math-education-settings";

export type MathEducationSettings = {
  operators: {
    addition: boolean;
    subtraction: boolean;
    multiplication: boolean;
    division: boolean;
  };
  levels: {
    1: boolean;
    2: boolean;
    3: boolean;
    4: boolean;
    5: boolean;
    6: boolean;
  };
};

export function defaultMathEducationSettings(): MathEducationSettings;
export function isValidMathEducationSettings(
  value: unknown,
): value is MathEducationSettings;
/** At least one operator and one level enabled. */
export function isUsableMathEducationSettings(
  settings: MathEducationSettings,
): boolean;
export function loadMathEducationSettings(): MathEducationSettings;
/** No-ops (returns false) if settings are not usable; otherwise persists and returns true. */
export function persistMathEducationSettings(
  settings: MathEducationSettings,
): boolean;
export function clearMathEducationSettings(): void;
```

JSON note: after `JSON.parse`, level keys may be strings `"1"`…`"6"`. Normalize to numeric keys `1`…`6` inside `isValidMathEducationSettings` / a `normalize` helper before accepting.

- [ ] **Step 1: Write failing tests**

```ts
import { afterEach, describe, expect, it } from "vitest";
import {
  MATH_SETTINGS_KEY,
  clearMathEducationSettings,
  defaultMathEducationSettings,
  isUsableMathEducationSettings,
  loadMathEducationSettings,
  persistMathEducationSettings,
} from "./mathSettings";

afterEach(() => {
  localStorage.removeItem(MATH_SETTINGS_KEY);
});

describe("mathSettings", () => {
  it("loadMathEducationSettings defaults to all operators and level 2 only", () => {
    localStorage.removeItem(MATH_SETTINGS_KEY);
    expect(loadMathEducationSettings()).toEqual(defaultMathEducationSettings());
    expect(loadMathEducationSettings().levels[2]).toBe(true);
    expect(loadMathEducationSettings().levels[1]).toBe(false);
  });

  it("persistMathEducationSettings round-trips a custom usable set", () => {
    const next = defaultMathEducationSettings();
    next.operators.addition = false;
    next.levels[2] = false;
    next.levels[1] = true;
    expect(persistMathEducationSettings(next)).toBe(true);
    expect(loadMathEducationSettings()).toEqual(next);
  });

  it("persistMathEducationSettings rejects zero operators", () => {
    const bad = defaultMathEducationSettings();
    bad.operators = {
      addition: false,
      subtraction: false,
      multiplication: false,
      division: false,
    };
    expect(isUsableMathEducationSettings(bad)).toBe(false);
    expect(persistMathEducationSettings(bad)).toBe(false);
    expect(localStorage.getItem(MATH_SETTINGS_KEY)).toBeNull();
  });

  it("loadMathEducationSettings returns defaults for corrupt JSON", () => {
    localStorage.setItem(MATH_SETTINGS_KEY, "{not-json");
    expect(loadMathEducationSettings()).toEqual(defaultMathEducationSettings());
  });

  it("clearMathEducationSettings removes the key", () => {
    persistMathEducationSettings(defaultMathEducationSettings());
    clearMathEducationSettings();
    expect(localStorage.getItem(MATH_SETTINGS_KEY)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd pokemon-safari-app && npx vitest run src/game/education/mathSettings.test.ts`

Expected: FAIL (module missing)

- [ ] **Step 3: Implement `mathSettings.ts`**

Mirror `spellingSettings.ts` quota handling. Structure:

```ts
import { DEFAULT_MATH_EDUCATION_SETTINGS } from "@/data/educationConfig";

export const MATH_SETTINGS_KEY = "pokemon-safari:math-education-settings";

export type MathEducationSettings = {
  /* as above */
};

export function defaultMathEducationSettings(): MathEducationSettings {
  return structuredClone(
    DEFAULT_MATH_EDUCATION_SETTINGS,
  ) as MathEducationSettings;
}

export function isUsableMathEducationSettings(
  settings: MathEducationSettings,
): boolean {
  const ops = Object.values(settings.operators).some(Boolean);
  const levels = Object.values(settings.levels).some(Boolean);
  return ops && levels;
}

export function isValidMathEducationSettings(
  value: unknown,
): value is MathEducationSettings {
  // require operators object with 4 booleans; levels 1–6 booleans (accept string keys)
  // return false if shape wrong
}

export function loadMathEducationSettings(): MathEducationSettings {
  const raw = localStorage.getItem(MATH_SETTINGS_KEY);
  if (raw == null) return defaultMathEducationSettings();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      !isValidMathEducationSettings(parsed) ||
      !isUsableMathEducationSettings(parsed)
    ) {
      return defaultMathEducationSettings();
    }
    return parsed;
  } catch {
    return defaultMathEducationSettings();
  }
}

export function persistMathEducationSettings(
  settings: MathEducationSettings,
): boolean {
  if (!isUsableMathEducationSettings(settings)) return false;
  try {
    localStorage.setItem(MATH_SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (e) {
    if (isQuotaError(e)) return false;
    throw e;
  }
}

export function clearMathEducationSettings(): void {
  localStorage.removeItem(MATH_SETTINGS_KEY);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd pokemon-safari-app && npx vitest run src/game/education/mathSettings.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/game/education/mathSettings.ts pokemon-safari-app/src/game/education/mathSettings.test.ts
git commit -m "$(cat <<'EOF'
feat(safari): persist math operator and level settings

EOF
)"
```

---

### Task 3: Pool builders + settings-driven `selectFact`

**Files:**

- Modify: `pokemon-safari-app/src/game/education/adaptiveLearning.ts`
- Modify: `pokemon-safari-app/src/game/education/adaptiveLearning.test.ts`
- Modify: `pokemon-safari-app/src/game/education/questionTypes.ts` (FactKey union only — full question types in Task 4)

**Interfaces:**

- Consumes: `digitRanges`, `levelDigitPairs`, `maxEnumeratePoolSize`, `trivialExclusions`, `MathEducationSettings`
- Produces:

```ts
export function digitClassOf(n: number): DigitClass;
export function additionFactKeyOf(a: number, b: number): `${number}p${number}`;
export function subtractionFactKeyOf(
  a: number,
  b: number,
): `${number}m${number}`;
// keep factKeyOf / divisionFactKeyOf

export function factsFor(operator: MathOperator, level: MathLevel): FactKey[]; // may return [] when enumeration skipped (size > maxEnumeratePoolSize)

export function sampleFact(
  rng: Rng,
  operator: MathOperator,
  level: MathLevel,
): FactKey;

export function selectFact(
  rng: Rng,
  stats: AdaptiveStats,
  excludeFactKey?: string | null,
  settings?: MathEducationSettings, // default = defaultMathEducationSettings()
): FactKey;
```

**Selection algorithm (must match spec):**

1. `enabledOps` / `enabledLevels` from settings (throw only if empty — callers must pass usable settings; if empty, use defaults for this call).
2. `op = weightedPick` equal weights over `enabledOps`.
3. `level = weightedPick` equal weights over `enabledLevels`.
4. Build candidates:
   - If `estimatePoolSize(op, level) ≤ maxEnumeratePoolSize`, enumerate `factsFor(op, level)`, drop `excludeFactKey`, adaptive `weightedPick`.
   - Else: build `review` = keys in `stats` that parse to this op+level and ≠ exclude; if review nonempty, adaptive pick from review with probability `0.5`, else `sampleFact`; if sample equals exclude, resample up to 8 times.
5. If step 4 yields nothing, try other enabled levels for same op, then other ops (same rules). Final fallback: `sampleFact` with defaults for `(multiplication, 2)`.

**Operator generation rules:**

| Op  | Rule                                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `+` | Both orders when digit classes differ; keys `apb`                                                                                   |
| `−` | Sample/enumerate pairs matching digit classes; if `a < b` swap so minuend ≥ subtrahend; key `amb`                                   |
| `×` | Factors ≥ `trivialExclusions.multiplyMinFactor`; both orders when classes differ                                                    |
| `÷` | Asymmetric: longer class = dividend, shorter = divisor; symmetric: both in class; divisor ≥ 2; exact positive integer quotient only |

**Remove:** rarity parameter and all `rarityEducationMix` branching; remove `allDoubleDigitFacts` / old division pool APIs **or** rewrite them as thin wrappers deleted from public tests.

Update `FactKey` in `questionTypes.ts`:

```ts
export type FactKey =
  | `${number}x${number}`
  | `${number}d${number}`
  | `${number}p${number}`
  | `${number}m${number}`
  | SpellingFactKey;
```

- [ ] **Step 1: Write failing selection tests** (replace rarity-mix cases)

```ts
import { defaultMathEducationSettings } from "./mathSettings";
import { selectFact, digitClassOf } from "./adaptiveLearning";
import { createRng } from "@/utils/rng";

const only = (
  patch: (s: ReturnType<typeof defaultMathEducationSettings>) => void,
) => {
  const s = defaultMathEducationSettings();
  // turn all levels/ops off then patch
  for (const k of Object.keys(s.operators) as (keyof typeof s.operators)[])
    s.operators[k] = false;
  for (const k of [1, 2, 3, 4, 5, 6] as const) s.levels[k] = false;
  patch(s);
  return s;
};

it("selectFact with only addition + level 1 yields 1-digit + 1-digit keys", () => {
  const settings = only((s) => {
    s.operators.addition = true;
    s.levels[1] = true;
  });
  const rng = createRng(1);
  for (let i = 0; i < 40; i++) {
    const key = selectFact(rng, {}, null, settings);
    expect(key).toMatch(/^\d+p\d+$/);
    const [a, b] = key.split("p").map(Number);
    expect(digitClassOf(a!)).toBe(1);
    expect(digitClassOf(b!)).toBe(1);
  }
});

it("selectFact ignores rarity — legendary settings Level 2 never emit level-6 shapes", () => {
  // settings default level 2 only; call selectFact many times; assert no 3-digit⊗3-digit
});

it("selectFact roughly equalizes two enabled operators over many draws", () => {
  const settings = only((s) => {
    s.operators.addition = true;
    s.operators.subtraction = true;
    s.levels[1] = true;
  });
  // 400 draws; |addShare - 0.5| < 0.08
});

it("subtraction facts are non-negative", () => {
  /* parse amb; a >= b */
});
it("division facts divide evenly and skip ÷1", () => {
  /* n % d === 0; d >= 2 */
});
it("never returns excludeFactKey over 200 draws", () => {
  /* keep existing intent */
});
```

Delete tests that assert `rarityEducationMix.common` / legendary never single-digit / etc.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd pokemon-safari-app && npx vitest run src/game/education/adaptiveLearning.test.ts`

Expected: FAIL on new API / old rarity tests removed

- [ ] **Step 3: Implement pool + `selectFact`**

Implement helpers and selection in `adaptiveLearning.ts`. Keep `factWeight` / `isMastered` / `pickFromPools` patterns where useful.

For `sampleFact` multiplication example:

```ts
function randomInDigitClass(
  rng: Rng,
  cls: DigitClass,
  minFactor?: number,
): number {
  const { min, max } = digitRanges[cls];
  const lo = minFactor != null ? Math.max(min, minFactor) : min;
  const span = max - lo + 1;
  return lo + Math.floor(rng.next() * span);
}
```

Division sampling: pick divisor in short class (≥2), pick quotient so dividend = divisor \* quotient lands in long class (loop with capped retries).

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd pokemon-safari-app && npx vitest run src/game/education/adaptiveLearning.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/game/education/adaptiveLearning.ts \
  pokemon-safari-app/src/game/education/adaptiveLearning.test.ts \
  pokemon-safari-app/src/game/education/questionTypes.ts
git commit -m "$(cat <<'EOF'
feat(safari): select math facts from operator and level settings

EOF
)"
```

---

### Task 4: Question types + generator for four operators

**Files:**

- Modify: `pokemon-safari-app/src/game/education/questionTypes.ts`
- Modify: `pokemon-safari-app/src/game/education/questionGenerator.ts`
- Modify: `pokemon-safari-app/src/game/education/questionGenerator.test.ts`
- Modify: `pokemon-safari-app/src/game/education/answerValidator.ts` (only if category narrow types need widening — numeric path already covers all math)

**Interfaces:**

```ts
export type MathEducationQuestion = {
  category: "addition" | "subtraction" | "multiplication" | "division";
  prompt: string;
  factKey:
    | `${number}x${number}`
    | `${number}d${number}`
    | `${number}p${number}`
    | `${number}m${number}`;
  a: number;
  b: number;
  expected: number;
  recapLine: string;
};

// EducationProvider.nextQuestion gains optional settings:
nextQuestion: (
  rng: Rng,
  stats: AdaptiveStats,
  rarity: RarityBand,
  excludeFactKey?: string | null,
  mathSettings?: MathEducationSettings,
) => EducationQuestion;
```

`buildMathQuestion`:

| key | category       | prompt                 | expected |
| --- | -------------- | ---------------------- | -------- |
| `p` | addition       | `What is ${a} + ${b}?` | `a + b`  |
| `m` | subtraction    | `What is ${a} − ${b}?` | `a - b`  |
| `x` | multiplication | unchanged              | `a * b`  |
| `d` | division       | unchanged              | `a / b`  |

`mathEducationProvider.nextQuestion` → `selectFact(rng, stats, exclude, mathSettings ?? defaultMathEducationSettings())`.

`nextEducationQuestion(..., options?: { spellingEnabled?: boolean; mathSettings?: MathEducationSettings })` forwards `mathSettings`.

- [ ] **Step 1: Write failing generator tests**

```ts
it('builds addition questions from p keys via selectFact settings', () => {
  const settings = /* only addition + level 1 */
  const q = mathEducationProvider.nextQuestion(stubRng([0, 0, 0, 0]), {}, 'legendary', null, settings)
  expect(q.category).toBe('addition')
  expect(q.prompt).toMatch(/\+/)
  expect(q.expected).toBe(q.a + q.b)
})

it('legendary rarity does not change category when only subtraction level 1 enabled', () => {
  // many draws; all subtraction
})
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `cd pokemon-safari-app && npx vitest run src/game/education/questionGenerator.test.ts`

- [ ] **Step 3: Implement parser + builder + provider wiring**

Replace `parseFactKey` to detect `p` / `m` / `x` / `d` (prefer matching operator char with a small parser: try split on known separators in order that cannot appear in numbers).

- [ ] **Step 4: Run tests — expect PASS**

Also run: `npx vitest run src/game/education/answerValidator.test.ts` (still green for mult).

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/game/education/questionTypes.ts \
  pokemon-safari-app/src/game/education/questionGenerator.ts \
  pokemon-safari-app/src/game/education/questionGenerator.test.ts
git commit -m "$(cat <<'EOF'
feat(safari): generate addition and subtraction education questions

EOF
)"
```

---

### Task 5: Wire encounter flow + raise answer digit cap

**Files:**

- Modify: `pokemon-safari-app/src/hooks/useEncounterFlow.ts`
- Modify: `pokemon-safari-app/src/components/encounter/EducationQuestion.tsx`
- Modify: `pokemon-safari-app/src/components/encounter/EducationQuestion.test.tsx`
- Modify any tests that stub `nextEducationQuestion` / assume only `×`/`÷` if they break

**Interfaces:**

- `doAdvanceFromAppear` / `doReplaceSpellingWithMath` call `loadMathEducationSettings()` once and pass into providers.
- `MAX_DIGITS = 6` in `EducationQuestion.tsx`.

- [ ] **Step 1: Write failing digit-cap test**

```ts
it("caps digit length at six characters", async () => {
  // type 1234567 → value 123456
});
```

Rename/remove the old four-character test.

- [ ] **Step 2: Run test — expect FAIL**

Run: `cd pokemon-safari-app && npx vitest run src/components/encounter/EducationQuestion.test.tsx -t "six characters"`

- [ ] **Step 3: Set `MAX_DIGITS = 6` and pass settings in `useEncounterFlow`**

```ts
import { loadMathEducationSettings } from "@/game/education/mathSettings";

// in doAdvanceFromAppear:
const mathSettings = loadMathEducationSettings();
const question = nextEducationQuestion(
  rng,
  loadAdaptiveStats(),
  session.rarity,
  state.lastFactKey,
  { spellingEnabled: false, mathSettings },
);

// in doReplaceSpellingWithMath:
mathEducationProvider.nextQuestion(
  rng,
  loadAdaptiveStats(),
  session.rarity,
  state.lastFactKey,
  loadMathEducationSettings(),
);
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
cd pokemon-safari-app && npx vitest run \
  src/components/encounter/EducationQuestion.test.tsx \
  src/hooks/useEncounterFlow.test.ts \
  src/screens/GameScreen.test.tsx
```

Expected: PASS (update any fixtures that assumed old fact shapes only if they fail)

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/hooks/useEncounterFlow.ts \
  pokemon-safari-app/src/components/encounter/EducationQuestion.tsx \
  pokemon-safari-app/src/components/encounter/EducationQuestion.test.tsx
git commit -m "$(cat <<'EOF'
feat(safari): apply math settings in encounters and allow 6-digit answers

EOF
)"
```

---

### Task 6: Settings UI + reset clears math prefs

**Files:**

- Modify: `pokemon-safari-app/src/screens/SettingsScreen.tsx`
- Modify: `pokemon-safari-app/src/screens/SettingsScreen.test.tsx`

**UI behavior:**

- Section above Reset Save using `mathSettingsCopy`
- Operator checkboxes; if only one op enabled, that checkbox is `disabled` or click is no-op
- Level checkboxes + descriptions; same last-level guard
- “All levels” checked iff levels 1–6 all true; checking it sets all true; unchecking a level while all were true unchecks “All levels”
- On change: update React state + `persistMathEducationSettings`
- `eraseProgress`: call `clearMathEducationSettings()` (defaults return on next load) **before** reload

- [ ] **Step 1: Write failing Settings tests**

```ts
it('renders operator and level controls with level descriptions', () => {
  render(<MemoryRouter><SettingsScreen /></MemoryRouter>)
  expect(screen.getByRole('checkbox', { name: /addition/i })).toBeChecked()
  expect(screen.getByText(/one-digit with two-digit/i)).toBeInTheDocument()
  expect(screen.getByRole('checkbox', { name: /level 2/i })).toBeChecked()
})

it('does not allow unchecking the last operator', async () => {
  const user = userEvent.setup()
  // uncheck addition, subtraction, multiplication — division remains
  // attempting to uncheck division leaves it checked
})

it('eraseProgress clears math settings key', () => {
  persistMathEducationSettings(/* custom */)
  // eraseProgress with stubbed reload
  expect(localStorage.getItem(MATH_SETTINGS_KEY)).toBeNull()
})
```

Update the existing “shows only Reset Save” test — Settings now has more controls; assert Reset Save still present and math section present.

- [ ] **Step 2: Run tests — expect FAIL**

Run: `cd pokemon-safari-app && npx vitest run src/screens/SettingsScreen.test.tsx`

- [ ] **Step 3: Implement Settings UI**

Use native checkboxes with existing typography tokens (`font-body`, `text-text`, padding consistent with screen). Keep layout simple: stacked fieldsets, no card chrome unless interaction requires it.

```tsx
const [math, setMath] = useState(loadMathEducationSettings);

function updateMath(next: MathEducationSettings) {
  if (!persistMathEducationSettings(next)) return;
  setMath(next);
}
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add pokemon-safari-app/src/screens/SettingsScreen.tsx \
  pokemon-safari-app/src/screens/SettingsScreen.test.tsx
git commit -m "$(cat <<'EOF'
feat(safari): add math operator and level toggles to Settings

EOF
)"
```

---

### Task 7: Full suite sweep + leftover rarity references

**Files:**

- Grep/fix any remaining `rarityEducationMix`, `doubleDigitMultiplication`, `allDoubleDigitFacts`, `multiplicationRange` imports
- Modify tests as needed (`config-surface`, `useEncounterFlow`, `GameScreen`, etc.)

- [ ] **Step 1: Grep for dead symbols**

```bash
cd pokemon-safari-app && rg "rarityEducationMix|doubleDigitMultiplication|allDoubleDigitFacts|longDivisionProblems|divisionProblems|multiplicationRange" src
```

Expected: no production references; tests only if intentionally asserting removal.

- [ ] **Step 2: Run full unit suite**

Run: `cd pokemon-safari-app && npm test`

Expected: PASS

- [ ] **Step 3: Fix any failures** (keep changes minimal; do not expand scope)

- [ ] **Step 4: Re-run `npm test`**

Expected: PASS

- [ ] **Step 5: Commit if fixes landed**

```bash
git add -u pokemon-safari-app
git commit -m "$(cat <<'EOF'
fix(safari): finish math settings migration test sweep

EOF
)"
```

(Skip empty commit if already green with nothing to stage.)

---

## Self-review (plan vs spec)

| Spec requirement                             | Task                                       |
| -------------------------------------------- | ------------------------------------------ |
| Global levels + operator checkboxes          | 1, 2, 6                                    |
| Descriptions next to levels                  | 1 (`mathSettingsCopy`), 6                  |
| Default all ops + Level 2                    | 1, 2                                       |
| Block last op/level off                      | 2, 6                                       |
| Ignore rarity for math                       | 3, 4, 5                                    |
| Equal op → equal level → adaptive            | 3                                          |
| Mutually exclusive digit pairs + full ranges | 1, 3                                       |
| Kid-safe − / ÷ / trivial skip                | 3                                          |
| Fact keys `p` / `m` / `x` / `d`              | 3, 4                                       |
| Addition + subtraction questions             | 4                                          |
| Wire Settings into encounter                 | 5                                          |
| MAX_DIGITS 6                                 | 5                                          |
| Reset Save clears prefs                      | 6                                          |
| Retire rarity mix / narrow double band       | 1, 3, 7                                    |
| Large pool feasibility (L6)                  | 3 (`maxEnumeratePoolSize` + sample/review) |

No TBD placeholders. Types aligned: `MathEducationSettings` owned by `mathSettings.ts`, defaults from `educationConfig.ts`, `selectFact(..., settings)` consumed by generator and encounter flow.
