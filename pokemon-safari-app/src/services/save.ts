/**
 * Namespaced, versioned localStorage adapter for the player save envelope.
 *
 * This module may read and write `SAVE_KEY` and nothing else — never the poke-cache
 * or edu-stats keys, and never a blanket wipe of all origin storage.
 */

import { WORLD_SPAWN } from '@/data/worldConfig'
import { SAVE_KEY } from '@/services/pokeapi/keys'
import type { Direction } from '@/types/map'
import type {
  DexData,
  DexEntry,
  ExploreSave,
  LoadedSave,
  SaveEnvelopeV2,
} from '@/types/save'

export const SAVE_SCHEMA_VERSION = 2

const FACINGS: ReadonlySet<Direction> = new Set(['up', 'down', 'left', 'right'])

export function defaultExploreSave(): ExploreSave {
  return { x: WORLD_SPAWN.x, y: WORLD_SPAWN.y, facing: 'down' }
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

function isIsoOrNull(v: unknown): v is string | null {
  return v === null || typeof v === 'string'
}

function isIntegerCoord(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n)
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

type SanitizedDex = {
  value: DexData
  recovered: boolean
}

/** Drops invalid entries; returns null when `raw` is not a plain object. */
function sanitizeDex(raw: unknown): SanitizedDex | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return null
  }
  const out: DexData = {}
  const entries = Object.entries(raw as Record<string, unknown>)
  for (const [key, value] of entries) {
    const entry = sanitizeEntry(value)
    if (entry) out[key] = entry
  }
  return { value: out, recovered: Object.keys(out).length !== entries.length }
}

function sanitizeExplore(raw: unknown): ExploreSave {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return defaultExploreSave()
  }
  const obj = raw as Record<string, unknown>
  if (!isIntegerCoord(obj.x) || !isIntegerCoord(obj.y)) {
    return defaultExploreSave()
  }
  if (typeof obj.facing !== 'string' || !FACINGS.has(obj.facing as Direction)) {
    return defaultExploreSave()
  }
  return { x: obj.x, y: obj.y, facing: obj.facing as Direction }
}

function isExploreRawValid(raw: unknown): boolean {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return false
  }
  const obj = raw as Record<string, unknown>
  if (!isIntegerCoord(obj.x) || !isIntegerCoord(obj.y)) {
    return false
  }
  if (typeof obj.facing !== 'string' || !FACINGS.has(obj.facing as Direction)) {
    return false
  }
  return true
}

function emptyLoaded(): LoadedSave {
  return { dex: {}, explore: defaultExploreSave() }
}

export type LoadSaveResult = {
  data: LoadedSave
  /** True when corrupt/unknown version or partial slice recovery forced defaults. */
  recovered: boolean
}

function parseToLoadedWithMeta(raw: string | null): LoadSaveResult {
  if (raw === null || raw === '') {
    return { data: emptyLoaded(), recovered: false }
  }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { data: emptyLoaded(), recovered: true }
    }
    const obj = parsed as Record<string, unknown>
    if (typeof obj.data !== 'object' || obj.data === null || Array.isArray(obj.data)) {
      return { data: emptyLoaded(), recovered: true }
    }
    const data = obj.data as Record<string, unknown>
    const dexResult = sanitizeDex(data.dex)
    if (dexResult === null) {
      return { data: emptyLoaded(), recovered: true }
    }
    const { value: dex, recovered: dexRecovered } = dexResult

    if (obj.version === 1) {
      return {
        data: { dex, explore: defaultExploreSave() },
        recovered: dexRecovered,
      }
    }
    if (obj.version === 2) {
      const explore = sanitizeExplore(data.explore)
      const exploreRecovered = !isExploreRawValid(data.explore)
      return {
        data: { dex, explore },
        recovered: dexRecovered || exploreRecovered,
      }
    }
    return { data: emptyLoaded(), recovered: true }
  } catch {
    return { data: emptyLoaded(), recovered: true }
  }
}

/** Returns empty dex + default explore on missing/corrupt/unknown version, plus recovery meta. */
export function loadSaveWithMeta(): LoadSaveResult {
  return parseToLoadedWithMeta(localStorage.getItem(SAVE_KEY))
}

/** Returns empty dex + default explore on missing/corrupt/unknown version. */
export function loadSave(): LoadedSave {
  return loadSaveWithMeta().data
}

export function persistSave(data: {
  dex: DexData
  explore: ExploreSave
}): 'ok' | 'quota' {
  const envelope: SaveEnvelopeV2 = {
    version: 2,
    savedAt: new Date().toISOString(),
    data: {
      dex: data.dex,
      explore: sanitizeExplore(data.explore),
    },
  }
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(envelope))
    return 'ok'
  } catch (e) {
    if (isQuotaError(e)) return 'quota'
    throw e
  }
}

/** Removes only SAVE_KEY (player progress). Never touches poke-cache or edu-stats. */
export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY)
}

/** Test-only: removes only SAVE_KEY. */
export function resetSaveForTests(): void {
  clearSave()
}
