/** Slim Pokémon DTO + versioned poke-cache envelope (DATA-01, DATA-04). */

export type PokemonKind = 'species' | 'mega' | 'primal'

export type PokemonDto = {
  id: number
  name: string
  types: string[]
  sprites: {
    front_default: string | null
    front_shiny: string | null
    official_artwork: string | null
  }
  /** Pre-selected, pre-sanitized English lore (D-14–D-17). null → UI placeholder. */
  flavorText: string | null
  genus: string | null
  height: number
  weight: number
  habitat: string | null
  kind: PokemonKind
  /** National id for mega/primal; null for species. */
  baseSpeciesId: number | null
}

export type CacheEnvelopeV2 = {
  version: 2
  fetchedAt: string
  pokemon: PokemonDto[]
}

/** Poke-cache envelope with species meta (CACHE_VERSION 3). */
export type CacheEnvelopeV3 = {
  version: 3
  fetchedAt: string
  pokemon: PokemonDto[]
}

/** Current poke-cache envelope (species meta + full DTO validation at CACHE_VERSION 4). */
export type CacheEnvelopeV4 = {
  version: 4
  fetchedAt: string
  pokemon: PokemonDto[]
}

export type CacheEnvelope = CacheEnvelopeV4
