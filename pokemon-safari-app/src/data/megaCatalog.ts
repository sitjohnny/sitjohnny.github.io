export type MegaCatalogEntry = {
  id: number
  pokeApiSlug: string
  displayName: string
  baseSpeciesId: number
  kind: 'mega' | 'primal'
}

const MEGA_CATALOG_ROWS: readonly Omit<MegaCatalogEntry, 'id'>[] = [
  { pokeApiSlug: 'venusaur-mega', displayName: 'Mega Venusaur', baseSpeciesId: 3, kind: 'mega' },
  { pokeApiSlug: 'charizard-mega-x', displayName: 'Mega Charizard X', baseSpeciesId: 6, kind: 'mega' },
  { pokeApiSlug: 'charizard-mega-y', displayName: 'Mega Charizard Y', baseSpeciesId: 6, kind: 'mega' },
  { pokeApiSlug: 'blastoise-mega', displayName: 'Mega Blastoise', baseSpeciesId: 9, kind: 'mega' },
  { pokeApiSlug: 'beedrill-mega', displayName: 'Mega Beedrill', baseSpeciesId: 15, kind: 'mega' },
  { pokeApiSlug: 'pidgeot-mega', displayName: 'Mega Pidgeot', baseSpeciesId: 18, kind: 'mega' },
  { pokeApiSlug: 'alakazam-mega', displayName: 'Mega Alakazam', baseSpeciesId: 65, kind: 'mega' },
  { pokeApiSlug: 'slowbro-mega', displayName: 'Mega Slowbro', baseSpeciesId: 80, kind: 'mega' },
  { pokeApiSlug: 'gengar-mega', displayName: 'Mega Gengar', baseSpeciesId: 94, kind: 'mega' },
  { pokeApiSlug: 'kangaskhan-mega', displayName: 'Mega Kangaskhan', baseSpeciesId: 115, kind: 'mega' },
  { pokeApiSlug: 'pinsir-mega', displayName: 'Mega Pinsir', baseSpeciesId: 127, kind: 'mega' },
  { pokeApiSlug: 'gyarados-mega', displayName: 'Mega Gyarados', baseSpeciesId: 130, kind: 'mega' },
  { pokeApiSlug: 'aerodactyl-mega', displayName: 'Mega Aerodactyl', baseSpeciesId: 142, kind: 'mega' },
  { pokeApiSlug: 'mewtwo-mega-x', displayName: 'Mega Mewtwo X', baseSpeciesId: 150, kind: 'mega' },
  { pokeApiSlug: 'mewtwo-mega-y', displayName: 'Mega Mewtwo Y', baseSpeciesId: 150, kind: 'mega' },
  { pokeApiSlug: 'ampharos-mega', displayName: 'Mega Ampharos', baseSpeciesId: 181, kind: 'mega' },
  { pokeApiSlug: 'steelix-mega', displayName: 'Mega Steelix', baseSpeciesId: 208, kind: 'mega' },
  { pokeApiSlug: 'scizor-mega', displayName: 'Mega Scizor', baseSpeciesId: 212, kind: 'mega' },
  { pokeApiSlug: 'heracross-mega', displayName: 'Mega Heracross', baseSpeciesId: 214, kind: 'mega' },
  { pokeApiSlug: 'houndoom-mega', displayName: 'Mega Houndoom', baseSpeciesId: 229, kind: 'mega' },
  { pokeApiSlug: 'tyranitar-mega', displayName: 'Mega Tyranitar', baseSpeciesId: 248, kind: 'mega' },
  { pokeApiSlug: 'blaziken-mega', displayName: 'Mega Blaziken', baseSpeciesId: 257, kind: 'mega' },
  { pokeApiSlug: 'gardevoir-mega', displayName: 'Mega Gardevoir', baseSpeciesId: 282, kind: 'mega' },
  { pokeApiSlug: 'mawile-mega', displayName: 'Mega Mawile', baseSpeciesId: 303, kind: 'mega' },
  { pokeApiSlug: 'aggron-mega', displayName: 'Mega Aggron', baseSpeciesId: 306, kind: 'mega' },
  { pokeApiSlug: 'medicham-mega', displayName: 'Mega Medicham', baseSpeciesId: 308, kind: 'mega' },
  { pokeApiSlug: 'manectric-mega', displayName: 'Mega Manectric', baseSpeciesId: 310, kind: 'mega' },
  { pokeApiSlug: 'sharpedo-mega', displayName: 'Mega Sharpedo', baseSpeciesId: 319, kind: 'mega' },
  { pokeApiSlug: 'camerupt-mega', displayName: 'Mega Camerupt', baseSpeciesId: 323, kind: 'mega' },
  { pokeApiSlug: 'altaria-mega', displayName: 'Mega Altaria', baseSpeciesId: 334, kind: 'mega' },
  { pokeApiSlug: 'banette-mega', displayName: 'Mega Banette', baseSpeciesId: 354, kind: 'mega' },
  { pokeApiSlug: 'absol-mega', displayName: 'Mega Absol', baseSpeciesId: 359, kind: 'mega' },
  { pokeApiSlug: 'glalie-mega', displayName: 'Mega Glalie', baseSpeciesId: 362, kind: 'mega' },
  { pokeApiSlug: 'salamence-mega', displayName: 'Mega Salamence', baseSpeciesId: 373, kind: 'mega' },
  { pokeApiSlug: 'metagross-mega', displayName: 'Mega Metagross', baseSpeciesId: 376, kind: 'mega' },
  { pokeApiSlug: 'latias-mega', displayName: 'Mega Latias', baseSpeciesId: 380, kind: 'mega' },
  { pokeApiSlug: 'latios-mega', displayName: 'Mega Latios', baseSpeciesId: 381, kind: 'mega' },
  { pokeApiSlug: 'rayquaza-mega', displayName: 'Mega Rayquaza', baseSpeciesId: 384, kind: 'mega' },
  { pokeApiSlug: 'kyogre-primal', displayName: 'Primal Kyogre', baseSpeciesId: 382, kind: 'primal' },
  { pokeApiSlug: 'groudon-primal', displayName: 'Primal Groudon', baseSpeciesId: 383, kind: 'primal' },
  { pokeApiSlug: 'lopunny-mega', displayName: 'Mega Lopunny', baseSpeciesId: 428, kind: 'mega' },
  { pokeApiSlug: 'garchomp-mega', displayName: 'Mega Garchomp', baseSpeciesId: 445, kind: 'mega' },
  { pokeApiSlug: 'lucario-mega', displayName: 'Mega Lucario', baseSpeciesId: 448, kind: 'mega' },
  { pokeApiSlug: 'abomasnow-mega', displayName: 'Mega Abomasnow', baseSpeciesId: 460, kind: 'mega' },
  { pokeApiSlug: 'gallade-mega', displayName: 'Mega Gallade', baseSpeciesId: 475, kind: 'mega' },
  { pokeApiSlug: 'audino-mega', displayName: 'Mega Audino', baseSpeciesId: 531, kind: 'mega' },
]

export const MEGA_CATALOG: readonly MegaCatalogEntry[] = MEGA_CATALOG_ROWS.map((row, i) => ({
  ...row,
  id: 650 + i,
}))

export const MEGA_CATALOG_LENGTH = MEGA_CATALOG.length

export const MEGA_CATALOG_BY_ID: ReadonlyMap<number, MegaCatalogEntry> = new Map(
  MEGA_CATALOG.map((e) => [e.id, e]),
)

export function isMegaOrPrimalId(id: number): boolean {
  return MEGA_CATALOG_BY_ID.has(id)
}
