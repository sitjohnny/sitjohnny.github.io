/** Namespaced, individually-versioned localStorage keys (D-11, DATA-04). */
export const CACHE_VERSION = 3
export const CACHE_KEY = `pokemon-safari:poke-cache:v${CACHE_VERSION}`
/** Reserved for Phase 7 — never written or cleared this phase. */
export const SAVE_KEY = 'pokemon-safari:save:v1'
/**
 * Phase 4 adaptive-learning key — versioned independently of the poke-cache and
 * the player save (D-16 / DATA-04).
 */
export const EDU_STATS_VERSION = 1
export const EDU_STATS_KEY = `pokemon-safari:edu-stats:v${EDU_STATS_VERSION}`
/** Gen 1 species count — single source of truth for prefetch / cache completeness. */
export const GEN1_COUNT = 151
