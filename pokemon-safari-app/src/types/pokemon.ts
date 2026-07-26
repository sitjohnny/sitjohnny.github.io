/** Slim Gen 1 Pokémon DTO + versioned poke-cache envelope (DATA-01, DATA-04). */

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
}

export type CacheEnvelopeV2 = {
  version: 2
  fetchedAt: string
  pokemon: PokemonDto[]
}

export type CacheEnvelope = CacheEnvelopeV2
