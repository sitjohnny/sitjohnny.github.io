/**
 * Timing bar geometry and motion knobs (DATA-03) — edit here only; UI must not hardcode these values.
 */

export const timingBar = {
  periodMs: 1400,
  reducedMotionScale: 1.75,
  zones: {
    common: { perfect: 0.08, great: 0.26, good: 0.4 },
    rare: { perfect: 0.05, great: 0.18, good: 0.3 },
    legendary: { perfect: 0.03, great: 0.11, good: 0.2 },
  },
  sweetSpotOffsets: [0.62, 0.38, 0.7],
  sweetSpotJitter: 0.06,
  sweetSpotMin: 0.15,
  sweetSpotMax: 0.85,
} as const
