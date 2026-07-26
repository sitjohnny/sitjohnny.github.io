/** Per-biome encounter species pools — edit here only; UI must not hardcode species ids. */

import type { BiomeId } from '@/types/map'
import type { RarityBand } from '@/types/encounter'

/** Classic Gen 1 legendaries / mythicals (spec). */
export const GEN1_LEGENDARY_IDS = [144, 145, 146, 150, 151] as const

/**
 * Forest rare band — finals and standouts (spec).
 * Keep sorted for review; order does not affect equal-weight picks.
 */
export const FOREST_RARE_IDS = [
  3, 6, 9, 12, 15, 18, 22, 24, 26, 28, 31, 34, 36, 38, 40, 45, 47, 49, 51, 53,
  55, 57, 59, 62, 65, 68, 71, 73, 76, 78, 80, 82, 85, 87, 89, 91, 94, 97, 99,
  101, 103, 105, 106, 107, 110, 112, 113, 115, 117, 119, 121, 122, 123, 124,
  125, 126, 127, 128, 130, 131, 132, 134, 135, 136, 137, 139, 141, 142, 143,
  149,
] as const

const legendarySet = new Set<number>(GEN1_LEGENDARY_IDS)
const rareSet = new Set<number>(FOREST_RARE_IDS)

function forestCommonIds(): number[] {
  const out: number[] = []
  for (let id = 1; id <= 151; id++) {
    if (legendarySet.has(id) || rareSet.has(id)) continue
    out.push(id)
  }
  return out
}

/**
 * Forest pools for MAP-03. Lake and Mountain pools are Phase 7 and are added here, not in code.
 * All ids are Gen 1 (1..151) so getPokemon can resolve them from the Phase 2 cache.
 */
export const biomeEncounterTables: Record<
  BiomeId,
  Record<RarityBand, readonly number[]>
> = {
  forest: {
    common: forestCommonIds(),
    rare: FOREST_RARE_IDS,
    legendary: GEN1_LEGENDARY_IDS,
  },
}
