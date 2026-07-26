/** Adaptive multiplication education knobs and copy — edit here only; UI must not hardcode these values. */

/** D-08 single-digit multiplication range. */
export const multiplicationRange = { min: 1, max: 9 } as const

/** Double-digit × single-digit facts (double-digit operand first). */
export const doubleDigitMultiplication = {
  min: 10,
  max: 20,
  probability: 0.2, // chance a question draws from this pool
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
  correct: ['Nice!', 'You got it!', 'Great job!'],
  incorrect: ['Not quite — you’ll get it next time!', 'Keep going — you’ve got this!'],
  correctSuffix: '+{boost}% catch boost',
  incorrectSuffix: 'No catch boost this time',
} as const

export const recapCopy = {
  heading: 'Quick recap',
  closing: 'You’ll see this one again soon.',
} as const

export const handoffCopy = {
  heading: 'Ready to throw!',
  body: 'Your catch boost is ready. The timing throw comes next.',
} as const
