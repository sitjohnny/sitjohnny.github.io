/**
 * Timing bar geometry and motion knobs (DATA-03) — edit here only; UI must not hardcode these values.
 */

export const timingBar = {
  periodMs: 1400,
  reducedMotionScale: 1.75,
  zones: {
    common: { perfect: 0.12, great: 0.32, good: 0.5 },
    rare: { perfect: 0.04, great: 0.15, good: 0.26 },
    legendary: { perfect: 0.02, great: 0.08, good: 0.14 },
  },
  sweetSpotOffsets: [0.62, 0.38, 0.7],
  sweetSpotJitter: 0.06,
  sweetSpotMin: 0.15,
  sweetSpotMax: 0.85,
} as const
