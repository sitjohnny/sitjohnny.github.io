/**
 * Namespaced, versioned localStorage adapter for the player save envelope.
 *
 * This module may read and write `SAVE_KEY` and nothing else — never the poke-cache
 * or edu-stats keys, and never a blanket wipe of all origin storage.
 */

import { WORLD_SPAWN } from "@/data/worldConfig";
import { SAVE_KEY } from "@/services/pokeapi/keys";
import type { Direction } from "@/types/map";
import type {
  DexData,
  DexEntry,
  ExploreSave,
  LoadedSave,
  SaveEnvelopeV2,
} from "@/types/save";

export const SAVE_SCHEMA_VERSION = 2;

const FACINGS: ReadonlySet<Direction> = new Set([
  "up",
  "down",
  "left",
  "right",
]);

export function defaultExploreSave(): ExploreSave {
  return { x: WORLD_SPAWN.x, y: WORLD_SPAWN.y, facing: "down" };
}

function isQuotaError(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014)
  );
}

function isFiniteNonNegative(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

function isIsoOrNull(v: unknown): v is string | null {
  return v === null || typeof v === "string";
}

function isIntegerCoord(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && Number.isInteger(n);
}

function sanitizeEntry(raw: unknown): DexEntry | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null;
  }
  const entry = raw as Record<string, unknown>;
  if (typeof entry.seen !== "boolean") return null;
  if (!isIsoOrNull(entry.firstEncounteredAt)) return null;
  if (!isIsoOrNull(entry.firstCapturedAt)) return null;
  if (!isFiniteNonNegative(entry.catchCount)) return null;
  if (typeof entry.shinyOwned !== "boolean") return null;
  return {
    seen: entry.seen,
    firstEncounteredAt: entry.firstEncounteredAt,
    firstCapturedAt: entry.firstCapturedAt,
    catchCount: entry.catchCount,
    shinyOwned: entry.shinyOwned,
  };
}

/** Drops invalid entries; returns null when `raw` is not a plain object. */
function sanitizeDex(raw: unknown): DexData | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null;
  }
  const out: DexData = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const entry = sanitizeEntry(value);
    if (entry) out[key] = entry;
  }
  return out;
}

function sanitizeExplore(raw: unknown): ExploreSave {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return defaultExploreSave();
  }
  const obj = raw as Record<string, unknown>;
  if (!isIntegerCoord(obj.x) || !isIntegerCoord(obj.y)) {
    return defaultExploreSave();
  }
  if (typeof obj.facing !== "string" || !FACINGS.has(obj.facing as Direction)) {
    return defaultExploreSave();
  }
  return { x: obj.x, y: obj.y, facing: obj.facing as Direction };
}

function emptyLoaded(): LoadedSave {
  return { dex: {}, explore: defaultExploreSave() };
}

function parseToLoaded(raw: string | null): LoadedSave {
  if (!raw) return emptyLoaded();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return emptyLoaded();
    }
    const obj = parsed as Record<string, unknown>;
    if (
      typeof obj.data !== "object" ||
      obj.data === null ||
      Array.isArray(obj.data)
    ) {
      return emptyLoaded();
    }
    const data = obj.data as Record<string, unknown>;
    const dex = sanitizeDex(data.dex);
    if (dex === null) {
      return emptyLoaded();
    }

    if (obj.version === 1) {
      return { dex, explore: defaultExploreSave() };
    }
    if (obj.version === 2) {
      return { dex, explore: sanitizeExplore(data.explore) };
    }
    return emptyLoaded();
  } catch {
    return emptyLoaded();
  }
}

/** Returns empty dex + default explore on missing/corrupt/unknown version. */
export function loadSave(): LoadedSave {
  return parseToLoaded(localStorage.getItem(SAVE_KEY));
}

export function persistSave(data: {
  dex: DexData;
  explore: ExploreSave;
}): "ok" | "quota" {
  const envelope: SaveEnvelopeV2 = {
    version: 2,
    savedAt: new Date().toISOString(),
    data: {
      dex: data.dex,
      explore: sanitizeExplore(data.explore),
    },
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(envelope));
    return "ok";
  } catch (e) {
    if (isQuotaError(e)) return "quota";
    throw e;
  }
}

/** Test-only: removes only SAVE_KEY. */
export function resetSaveForTests(): void {
  localStorage.removeItem(SAVE_KEY);
}
