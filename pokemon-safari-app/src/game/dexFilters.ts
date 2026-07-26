/**
 * Pure Pokédex browse filters (session UI uses these selectors).
 */

import { GEN1_COUNT } from '@/services/pokeapi/keys'
import type { DexData } from '@/types/save'

export type DexStatusFilter = 'all' | 'caught' | 'missing' | 'shiny'
export type DexFilterState = { status: DexStatusFilter; type: string | null }

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
  typeOf: (speciesId: number) => string[],
  speciesId: number,
  type: string | null,
): boolean {
  if (type === null) return true
  const types = safeTypes(typeOf, speciesId)
  return types.includes(type)
}

export function filterDexSpeciesIds(
  dex: DexData,
  filter: DexFilterState,
  typeOf: (speciesId: number) => string[],
): number[] {
  const out: number[] = []
  for (let id = 1; id <= GEN1_COUNT; id += 1) {
    if (!matchesStatus(dex, id, filter.status)) continue
    if (!matchesType(typeOf, id, filter.type)) continue
    out.push(id)
  }
  return out
}
