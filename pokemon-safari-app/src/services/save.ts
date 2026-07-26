/**
 * Namespaced, versioned localStorage adapter for the player save envelope (D-05, D-18, D-21).
 *
 * This module may read and write `SAVE_KEY` and nothing else — never the poke-cache
 * or edu-stats keys, and never a blanket wipe of all origin storage.
 */

import { SAVE_KEY } from '@/services/pokeapi/keys'
import type { DexData, DexEntry, SaveEnvelopeV1 } from '@/types/save'

export const SAVE_SCHEMA_VERSION = 1

function isQuotaError(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)
  )
}

function isFiniteNonNegative(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0
}

function isIsoOrNull(v: unknown): v is string | null {
  return v === null || typeof v === 'string'
}

function sanitizeEntry(raw: unknown): DexEntry | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return null
  }
  const entry = raw as Record<string, unknown>
  if (typeof entry.seen !== 'boolean') return null
  if (!isIsoOrNull(entry.firstEncounteredAt)) return null
  if (!isIsoOrNull(entry.firstCapturedAt)) return null
  if (!isFiniteNonNegative(entry.catchCount)) return null
  if (typeof entry.shinyOwned !== 'boolean') return null
  return {
    seen: entry.seen,
    firstEncounteredAt: entry.firstEncounteredAt,
    firstCapturedAt: entry.firstCapturedAt,
    catchCount: entry.catchCount,
    shinyOwned: entry.shinyOwned,
  }
}

/** Drops invalid entries; returns null when `raw` is not a plain object. */
function sanitizeDex(raw: unknown): DexData | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return null
  }
  const out: DexData = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const entry = sanitizeEntry(value)
    if (entry) out[key] = entry
  }
  return out
}

function parseEnvelope(raw: string | null): SaveEnvelopeV1 | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null
    }
    const obj = parsed as Record<string, unknown>
    if (obj.version !== SAVE_SCHEMA_VERSION) {
      return null
    }
    if (typeof obj.data !== 'object' || obj.data === null || Array.isArray(obj.data)) {
      return null
    }
    const data = obj.data as Record<string, unknown>
    const dex = sanitizeDex(data.dex)
    if (dex === null) {
      return null
    }
    const savedAt =
      typeof obj.savedAt === 'string' ? obj.savedAt : new Date(0).toISOString()
    return {
      version: 1,
      savedAt,
      data: { dex },
    }
  } catch {
    return null
  }
}

/** Returns `{}` on missing, corrupt, wrong-version, or malformed dex. */
export function loadSave(): DexData {
  const envelope = parseEnvelope(localStorage.getItem(SAVE_KEY))
  return envelope?.data.dex ?? {}
}

export function persistSave(dex: DexData): 'ok' | 'quota' {
  const envelope: SaveEnvelopeV1 = {
    version: 1,
    savedAt: new Date().toISOString(),
    data: { dex },
  }
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(envelope))
    return 'ok'
  } catch (e) {
    if (isQuotaError(e)) return 'quota'
    throw e
  }
}

/** Test-only: removes only SAVE_KEY. */
export function resetSaveForTests(): void {
  localStorage.removeItem(SAVE_KEY)
}
