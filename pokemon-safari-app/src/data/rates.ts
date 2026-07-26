/** Grass outcome rates and encounter timing — edit here only; UI must not hardcode these values. */

/**
 * MAP-03 source of truth for tall-grass outcomes. Integer weights are normalized by their
 * total, so they can be retuned without touching resolver code.
 */
export const grassOutcomeWeights = {
  pokemon: 45,
  nothing: 45,
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
  /** Hold after Capture so the frozen marker is readable before grade flash. */
  timingFreezeHold: 500,
  reducedTimingFreezeHold: 250,
  gradeFlash: 600,
  reducedGradeFlash: 300,
  failBeat: 800,
  reducedFailBeat: 400,
  shakeOnce: 720,
  reducedShakeOnce: 240,
  shakeGap: 240,
  reducedShakeGap: 160,
  shakeResolve: 400,
  reducedShakeResolve: 200,
  shakeOpen: 120,
  shakeEscapeHold: 250,
} as const

/** Kid-tunable shiny encounter rate (DEX-02 / Assumption A2) — consumed by 06-04. */
export const shinyRate = 1 / 75

/** Committed tile steps (any tile) with no Pokémon after an encounter ends. */
export const postEncounterPokemonImmunitySteps = 3

/** Debounced SAVE_KEY flush idle window in ms (D-19). */
export const dexSaveDebounceMs = 800
