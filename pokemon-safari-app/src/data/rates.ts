/** Grass outcome rates and encounter timing — edit here only; UI must not hardcode these values. */

/**
 * MAP-03 source of truth for tall-grass outcomes. Integer weights are normalized by their
 * total, so they can be retuned without touching resolver code.
 */
export const grassOutcomeWeights = {
  pokemon: 45,
  nothing: 25,
  item: 20,
  rare: 8,
  legendary: 2,
} as const

/** D-11 / D-24 education capture bonus applied before Phase 5 timing throw. */
export const educationCaptureBonus = {
  correct: 0.15,
  incorrect: 0,
} as const

/** 04-UI-SPEC Motion + Discretionary Defaults D7/D8 encounter overlay timings (ms). */
export const encounterTimingMs = {
  appearFlash: 240,
  spriteReveal: 180,
  feedbackHold: 1000,
  reducedFeedbackHold: 400,
  itemToast: 1800,
} as const
