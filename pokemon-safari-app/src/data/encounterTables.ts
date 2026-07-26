/** Per-biome encounter species pools — edit here only; UI must not hardcode species ids. */

import type { BiomeId } from '@/types/map'
import type { RarityBand } from '@/types/encounter'

/**
 * Forest pools for MAP-03. Lake and Mountain pools are Phase 7 and are added here, not in code.
 * All ids are Gen 1 (1..151) so getPokemon can resolve them from the Phase 2 cache.
 */
export const biomeEncounterTables: Record<
  BiomeId,
  Record<RarityBand, readonly number[]>
> = {
  forest: {
    common: [10, 11, 13, 14, 16, 19, 21, 29, 32, 43, 46, 48, 69],
    rare: [25, 63, 123, 127, 133, 143],
    legendary: [144, 145, 146, 150, 151],
  },
}
