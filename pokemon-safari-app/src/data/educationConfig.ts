/** Adaptive multiplication education knobs and copy — edit here only; UI must not hardcode these values. */

/** D-08 single-digit multiplication range (excludes ×1). */
export const multiplicationRange = { min: 2, max: 9 } as const

/** Double-digit × single-digit facts (double-digit operand first). */
export const doubleDigitMultiplication = {
  min: 10,
  max: 20,
} as const

/**
 * Exact integer division: numerator ÷ single-digit divisor.
 * Only facts with an integer quotient are generated (excludes ÷1).
 */
export const divisionProblems = {
  numeratorMin: 10,
  numeratorMax: 100,
  divisorMin: 2,
  divisorMax: 9,
} as const

/**
 * Exact integer long division: two-digit ÷ two-digit within 10–100.
 */
export const longDivisionProblems = {
  numeratorMin: 10,
  numeratorMax: 100,
  divisorMin: 10,
  divisorMax: 100,
  quotientMin: 2,
} as const

/**
 * Per-rarity category mix for selectFact.
 * Cuts are absolute in order: division → double → single (remainder).
 * `longWithinDivision` is nested under division draws.
 */
export const rarityEducationMix = {
  common: {
    division: 0.05,
    double: 0.25,
    longWithinDivision: 0,
  },
  rare: {
    division: 0.4,
    double: 0.45,
    longWithinDivision: 0.15,
  },
  legendary: {
    division: 0.75,
    double: 0.25,
    longWithinDivision: 0.4,
  },
} as const

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
