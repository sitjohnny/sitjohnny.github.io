/**
 * Namespaced, versioned localStorage adapter for per-fact math progress (D-16).
 *
 * This is the only education module allowed to touch a browser global. It may
 * read and write `EDU_STATS_KEY` and nothing else — never the poke-cache or
 * player save, and never a blanket clear of all origin storage.
 */

import { EDU_STATS_KEY } from '@/services/pokeapi/keys'
import type { AdaptiveStats, FactStat } from './questionTypes'

export const EDU_STATS_SCHEMA_VERSION = 1

type EduStatsEnvelope = {
  version: number
  facts: AdaptiveStats
}

function isQuotaError(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)
  )
}

function isFiniteNonNegative(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0
}

function sanitizeFacts(raw: unknown): AdaptiveStats | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return null
  }
  const out: AdaptiveStats = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      continue
    }
    const entry = value as Record<string, unknown>
    if (!isFiniteNonNegative(entry.correct) || !isFiniteNonNegative(entry.incorrect)) {
      continue
    }
    out[key] = {
      correct: entry.correct,
      incorrect: entry.incorrect,
    }
  }
  return out
}

function parseEnvelope(raw: string | null): EduStatsEnvelope | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null
    }
    const obj = parsed as Record<string, unknown>
    if (obj.version !== EDU_STATS_SCHEMA_VERSION) {
      return null
    }
    const facts = sanitizeFacts(obj.facts)
    if (facts === null) {
      return null
    }
    return { version: EDU_STATS_SCHEMA_VERSION, facts }
  } catch {
    return null
  }
}

/** Returns `{}` on missing, corrupt, wrong-version, or malformed facts. */
export function loadAdaptiveStats(): AdaptiveStats {
  const envelope = parseEnvelope(localStorage.getItem(EDU_STATS_KEY))
  return envelope?.facts ?? {}
}

/** Pure: increments the target fact counter without mutating `stats`. */
export function recordAttempt(
  stats: AdaptiveStats,
  factKey: string,
  correct: boolean,
): AdaptiveStats {
  const prev: FactStat = stats[factKey] ?? { correct: 0, incorrect: 0 }
  return {
    ...stats,
    [factKey]: {
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1),
    },
  }
}

export function persistAdaptiveStats(stats: AdaptiveStats): 'ok' | 'quota' {
  const envelope: EduStatsEnvelope = {
    version: EDU_STATS_SCHEMA_VERSION,
    facts: stats,
  }
  try {
    localStorage.setItem(EDU_STATS_KEY, JSON.stringify(envelope))
    return 'ok'
  } catch (e) {
    if (isQuotaError(e)) return 'quota'
    throw e
  }
}

/** Removes only EDU_STATS_KEY (adaptive progress). Never touches poke-cache or save. */
export function clearAdaptiveStats(): void {
  localStorage.removeItem(EDU_STATS_KEY)
}

/** Test-only: removes only EDU_STATS_KEY. */
export function resetAdaptiveStatsForTests(): void {
  clearAdaptiveStats()
}
