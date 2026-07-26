/**
 * Pure Pokédex reducers and selectors (D-06, D-07, D-09, D-12).
 * No React, Zustand, or browser storage — clock is injected as ISO strings.
 */

import type { DexData, DexEntry } from '@/types/save'

export type DexTileState = {
  kind: 'unknown' | 'caught'
  label: string
  shinyOwned: boolean
}

export function emptyDexEntry(): DexEntry {
  return {
    seen: false,
    firstEncounteredAt: null,
    firstCapturedAt: null,
    catchCount: 0,
    shinyOwned: false,
  }
}

function speciesKey(speciesId: number): string {
  return String(speciesId)
}

function padDexNumber(speciesId: number): string {
  return String(Math.trunc(speciesId)).padStart(3, '0')
}

/** First encounter: sets seen + firstEncounteredAt. Idempotent once seen. */
export function markSeen(dex: DexData, speciesId: number, nowIso: string): DexData {
  const key = speciesKey(speciesId)
  const prev = dex[key]
  if (prev?.seen) return dex
  return {
    ...dex,
    [key]: {
      ...(prev ?? emptyDexEntry()),
      seen: true,
      firstEncounteredAt: prev?.firstEncounteredAt ?? nowIso,
    },
  }
}

/** Successful catch: increments catchCount, stamps firstCapturedAt once, ORs shiny. */
export function recordCatch(
  dex: DexData,
  args: { speciesId: number; shiny: boolean },
  nowIso: string,
): DexData {
  const key = speciesKey(args.speciesId)
  const prev = dex[key] ?? emptyDexEntry()
  return {
    ...dex,
    [key]: {
      seen: true,
      firstEncounteredAt: prev.firstEncounteredAt ?? nowIso,
      firstCapturedAt: prev.firstCapturedAt ?? nowIso,
      catchCount: prev.catchCount + 1,
      shinyOwned: prev.shinyOwned || args.shiny,
    },
  }
}

/**
 * Reveal rules: silhouette until firstCapturedAt exists (D-06/D-07).
 * Seen-only looks identical to never-seen on the grid.
 */
export function dexTileState(
  entry: DexEntry | undefined,
  speciesId: number,
  name: string,
): DexTileState {
  const num = padDexNumber(speciesId)
  if (!entry?.firstCapturedAt) {
    return {
      kind: 'unknown',
      label: `#${num} Pokémon`,
      shinyOwned: false,
    }
  }
  return {
    kind: 'caught',
    label: `#${num} ${name}`,
    shinyOwned: entry.shinyOwned,
  }
}

export function countSeen(dex: DexData): number {
  let n = 0
  for (const entry of Object.values(dex)) {
    if (entry.seen) n += 1
  }
  return n
}

export function countCaught(dex: DexData): number {
  let n = 0
  for (const entry of Object.values(dex)) {
    if (entry.firstCapturedAt !== null) n += 1
  }
  return n
}
