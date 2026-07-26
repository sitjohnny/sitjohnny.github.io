/** Biome unlock thresholds — edit here only; UI must not hardcode these values. */

/** Local union until Lake/Mountain biomes land in Phase 7 (PROG-01 / DATA-03). */
type UnlockableBiomeId = 'forest' | 'lake' | 'mountain'

/** PROG-01 numbers; DATA-03 requires the file now, Phase 7 consumes it. */
export const biomeUnlockThresholds: Record<UnlockableBiomeId, number> = {
  forest: 0,
  lake: 10,
  mountain: 30,
}
