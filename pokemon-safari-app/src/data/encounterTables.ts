/** Per-biome encounter species pools — edit here only; UI must not hardcode species ids. */

import { LEGENDARY_IDS } from '@/data/legendaryIds'
import { MEGA_CATALOG } from '@/data/megaCatalog'
import { NATIONAL_RARE_IDS } from '@/data/nationalRareIds'
import { NATIONAL_DEX_COUNT } from '@/services/pokeapi/keys'
import type { BiomeId } from '@/types/map'
import type { RarityBand } from '@/types/encounter'

export { FOREST_RARE_IDS } from '@/data/nationalRareIds'

/** Classic Gen 1 legendaries / mythicals (compat alias). */
export const GEN1_LEGENDARY_IDS = LEGENDARY_IDS.filter((id) => id <= 151)

const legendarySet = new Set<number>(LEGENDARY_IDS)
const rareNationalSet = new Set<number>(NATIONAL_RARE_IDS)

if (NATIONAL_RARE_IDS.some((id) => legendarySet.has(id))) {
  throw new Error('national rare overlaps legendary')
}

function forestCommonIds(): number[] {
  const out: number[] = []
  for (let id = 1; id <= NATIONAL_DEX_COUNT; id++) {
    if (legendarySet.has(id) || rareNationalSet.has(id)) continue
    out.push(id)
  }
  return out
}

/**
 * Forest pools for MAP-03. Lake and Mountain pools are Phase 7 and are added here, not in code.
 * National ids are 1..649, with Megas and Primals appended at synthetic ids 650+.
 */
export const biomeEncounterTables: Record<
  BiomeId,
  Record<RarityBand, readonly number[]>
> = {
  forest: {
    common: forestCommonIds(),
    rare: [...NATIONAL_RARE_IDS, ...MEGA_CATALOG.map((e) => e.id)] as const,
    legendary: LEGENDARY_IDS,
  },
}
