import { MEGA_CATALOG_LENGTH } from '@/data/megaCatalog'

/** Namespaced, individually-versioned localStorage keys (D-11, DATA-04). */
export const CACHE_VERSION = 4
export const CACHE_KEY = `pokemon-safari:poke-cache:v${CACHE_VERSION}`
/** Reserved for Phase 7 — never written or cleared this phase. */
export const SAVE_KEY = 'pokemon-safari:save:v1'
/**
 * Phase 4 adaptive-learning key — versioned independently of the poke-cache and
 * the player save (D-16 / DATA-04).
 */
export const EDU_STATS_VERSION = 1
export const EDU_STATS_KEY = `pokemon-safari:edu-stats:v${EDU_STATS_VERSION}`
/** National Dex Gen 1–5 inclusive. */
export const NATIONAL_DEX_COUNT = 649
export const TOTAL_ROSTER_COUNT = NATIONAL_DEX_COUNT + MEGA_CATALOG_LENGTH
/** Remove in Task 4 when roster prefetch goes live. */
export const GEN1_COUNT = 151
