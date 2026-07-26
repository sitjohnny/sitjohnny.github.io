/**
 * Deterministic 2D value noise in [0, 1).
 * Lattice samples are hashed from (seed, ix, iy); bilinear interpolate.
 */

function hash2D(seed: number, ix: number, iy: number): number {
  let h = (seed | 0) ^ Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function fade(t: number): number {
  return t * t * (3 - 2 * t)
}

/** Continuous value noise at world sample point (sx, sy) — typically x/NOISE_SCALE. */
export function noise2D(seed: number, sx: number, sy: number): number {
  const x0 = Math.floor(sx)
  const y0 = Math.floor(sy)
  const x1 = x0 + 1
  const y1 = y0 + 1
  const tx = fade(sx - x0)
  const ty = fade(sy - y0)

  const n00 = hash2D(seed, x0, y0)
  const n10 = hash2D(seed, x1, y0)
  const n01 = hash2D(seed, x0, y1)
  const n11 = hash2D(seed, x1, y1)

  const nx0 = n00 + (n10 - n00) * tx
  const nx1 = n01 + (n11 - n01) * tx
  return nx0 + (nx1 - nx0) * ty
}
