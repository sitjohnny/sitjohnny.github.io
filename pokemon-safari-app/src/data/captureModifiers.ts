/**
 * Capture modifier surface (DATA-03) — Phase 5 CATCH-03 owns the semantics.
 * Edit here only; UI must not hardcode these values.
 */

import { educationCaptureBonus } from './rates'

export const captureModifiers = {
  education: educationCaptureBonus,
  ball: { poke: 0, great: 0.15 },
  berry: 0.1,
  rarity: { common: 0.75, rare: 0.25, legendary: 0.05 },
  timing: { perfect: 0.25, great: 0.15, good: 0.05, miss: -0.05 },
} as const
