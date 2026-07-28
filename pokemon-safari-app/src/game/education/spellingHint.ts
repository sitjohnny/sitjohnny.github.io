import { spellingHintReveal } from '@/data/educationConfig'
import type { Rng } from '@/utils/rng'

export function rollSpellingHintRatio(
  rng: Rng,
  cfg: typeof spellingHintReveal = spellingHintReveal,
): number {
  return cfg.minRatio + rng.next() * (cfg.maxRatio - cfg.minRatio)
}

export function spellingHintRevealCount(wordLength: number, ratio: number): number {
  if (wordLength < 2) return 0
  return Math.min(wordLength - 1, Math.max(1, Math.round(wordLength * ratio)))
}

export function pickSpellingHintIndices(
  wordLength: number,
  count: number,
  rng: Rng,
): number[] {
  const pool = Array.from({ length: wordLength }, (_, i) => i)
  const picked: number[] = []
  for (let n = 0; n < count && pool.length > 0; n++) {
    const i = Math.min(pool.length - 1, Math.floor(rng.next() * pool.length))
    picked.push(pool.splice(i, 1)[0]!)
  }
  return picked.sort((a, b) => a - b)
}
