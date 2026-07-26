/**
 * Capture modifier surface (DATA-03) — Phase 5 CATCH-03 owns the semantics.
 * Edit here only; UI must not hardcode these values.
 */

import { educationCaptureBonus } from './rates'

export const captureModifiers = {
  education: educationCaptureBonus,
  ball: { poke: 0, great: 0.15 },
  berry: 0.1,
  rarity: { common: 0.6, rare: 0.3, legendary: 0.1 },
} as const
