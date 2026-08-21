/**
 * Pure Pokédex browse filters (session UI uses these selectors).
 */

import { MEGA_CATALOG } from '@/data/megaCatalog'
import { NATIONAL_DEX_COUNT } from '@/services/pokeapi/keys'
import type { DexData } from '@/types/save'

export type DexStatusFilter = 'all' | 'caught' | 'missing' | 'shiny'
export type DexModeFilter = 'all' | 'national' | 'mega'
export type DexFilterState = {
  status: DexStatusFilter
  type: string | null
  mode: DexModeFilter
}

function safeTypes(typeOf: (speciesId: number) => string[], speciesId: number): string[] {
  try {
    return typeOf(speciesId)
  } catch {
    return []
  }
}

function matchesStatus(dex: DexData, speciesId: number, status: DexStatusFilter): boolean {
  const entry = dex[String(speciesId)]
  const caught = entry?.firstCapturedAt != null
  switch (status) {
    case 'all':
      return true
    case 'caught':
      return caught
    case 'missing':
      return !caught
    case 'shiny':
      return entry?.shinyOwned === true
  }
}

function matchesType(
  dex: DexData,
  typeOf: (speciesId: number) => string[],
  speciesId: number,
  type: string | null,
): boolean {
  if (type === null) return true
  const entry = dex[String(speciesId)]
  if (entry?.firstCapturedAt == null) return false
  const types = safeTypes(typeOf, speciesId)
  return types.includes(type)
}

export function rosterIdsForMode(mode: DexModeFilter): number[] {
  if (mode === 'national') {
    return Array.from({ length: NATIONAL_DEX_COUNT }, (_, i) => i + 1)
  }
  if (mode === 'mega') {
    return MEGA_CATALOG.map((e) => e.id)
  }
  return [
    ...Array.from({ length: NATIONAL_DEX_COUNT }, (_, i) => i + 1),
    ...MEGA_CATALOG.map((e) => e.id),
  ]
}

export function filterDexSpeciesIds(
  dex: DexData,
  filter: DexFilterState,
  typeOf: (speciesId: number) => string[],
): number[] {
  const out: number[] = []
  for (const id of rosterIdsForMode(filter.mode)) {
    if (!matchesStatus(dex, id, filter.status)) continue
    if (!matchesType(dex, typeOf, id, filter.type)) continue
    out.push(id)
  }
  return out
}

export function dexDenominator(mode: DexModeFilter): number {
  return rosterIdsForMode(mode).length
}
