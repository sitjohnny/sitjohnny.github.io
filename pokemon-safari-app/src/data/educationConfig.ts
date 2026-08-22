/** Adaptive multiplication education knobs and copy — edit here only; UI must not hardcode these values. */

export type MathOperator =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
export type MathLevel = 1 | 2 | 3 | 4 | 5 | 6
export type DigitClass = 1 | 2 | 3

export const digitRanges: Record<DigitClass, { min: number; max: number }> = {
  1: { min: 1, max: 9 },
  2: { min: 10, max: 99 },
  3: { min: 100, max: 999 },
}

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
}

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
} as const

export const mathSettingsCopy = {
  operatorsHeading: 'Math operators',
  levelsHeading: 'Math levels',
  allLevels: 'All levels',
  operators: {
    addition: 'Addition (+)',
    subtraction: 'Subtraction (−)',
    multiplication: 'Multiplication (×)',
    division: 'Division (÷)',
  },
  levels: {
    1: { label: 'Level 1', description: 'One-digit numbers only (e.g. 7 × 4)' },
    2: {
      label: 'Level 2',
      description: 'One-digit with two-digit (e.g. 8 + 47)',
    },
    3: {
      label: 'Level 3',
      description: 'Two-digit with two-digit (e.g. 36 − 19)',
    },
    4: {
      label: 'Level 4',
      description: 'Three-digit with one-digit (e.g. 248 ÷ 4)',
    },
    5: {
      label: 'Level 5',
      description: 'Three-digit with two-digit (e.g. 156 × 23)',
    },
    6: {
      label: 'Level 6',
      description: 'Three-digit with three-digit (e.g. 412 + 307)',
    },
  },
} as const

/** Skip ×0, ×1 and ÷1 (and symmetric × when either factor is 0 or 1). */
export const trivialExclusions = {
  multiplyMinFactor: 2,
  divideMinDivisor: 2,
} as const

/** Max facts to fully enumerate before switching to sample+review (keeps L6 feasible). */
export const maxEnumeratePoolSize = 12_000

/** D-17 / D-19 adaptive weighting defaults from 04-RESEARCH. */
export const adaptiveWeights = {
  starterWeight: 10,
  missBonus: 4,
  correctPenalty: 1,
  minWeight: 1,
  masteredReviewWeight: 2,
} as const

/** D-18 mastery gate. */
export const masteryThreshold = {
  accuracy: 0.85,
  minAttempts: 6,
} as const

/**
 * 04-UI-SPEC Copywriting Contract. `{boost}` must be interpolated from
 * educationCaptureBonus.correct at render time so retuning the bonus retunes the copy.
 */
export const feedbackCopy = {
  correct: ['That’s right!', 'You got it right!', 'Correct — great job!'],
  incorrect: [
    'That’s not right — try again next time!',
    'Wrong answer — you’ll get the next one!',
  ],
  correctSuffix: '+{boost}% catch boost',
} as const

export const recapCopy = {
  heading: 'Quick recap',
  closing: 'You’ll see this one again soon.',
} as const

/** @deprecated Phase 5 retires HandoffStub; kept for any residual imports. */
export const handoffCopy = {
  heading: 'Ready to throw!',
  body: 'Your catch boost is ready. The timing throw comes next.',
} as const

/** 05-UI-SPEC Copywriting Contract — capture / flee / grade strings. */
export const captureCopy = {
  captureCta: 'Capture',
  continueCta: 'Continue',
  mathBoost: 'Math boost: +{n}%',
  throwOf: 'Throw {n} of {max}',
  grades: {
    perfect: 'Perfect!',
    great: 'Great!',
    good: 'Good!',
    miss: 'Miss!',
  },
  failBeat: 'Oh! It broke free!',
  gotchaHeading: 'Gotcha!',
  gotchaBody: '{Name} was caught!',
  shiny: 'Shiny!',
  fleeHeading: 'It got away!',
  fleeBody: 'That’s okay — you’ll find another!',
} as const

/** Spelling is product-disabled; keep at 0 so mix never selects it even if re-enabled. */
export const spellingMixProbability = 0 as const
/** Share of spelling draws that use the challenge tier (remainder = early). */
export const spellingChallengeProbability = 0.3 as const
/** Fraction of letters a Hint reveals (inclusive range); rolled per hint use. */
export const spellingHintReveal = { minRatio: 0.5, maxRatio: 0.5 } as const
/** Max wait for spelling picture load before treating as error (ms). */
export const spellingImageTimeoutMs = 8000 as const

export const spellingCopy = {
  prompt: 'What is this?',
  loading: 'Loading picture…',
  hint: 'Hint',
  attribution: 'Photo by {name} / Pexels',
} as const

/** @deprecated Spelling toggle removed from Settings while the feature is off. */
export const spellingSettingsCopy = {
  label: 'Spelling questions',
  hint: 'Picture spelling is temporarily unavailable.',
} as const
