/** Slim Gen 1 Pokémon DTO + versioned poke-cache envelope (DATA-01, DATA-04). */

export type PokemonDto = {
  id: number
  name: string
  types: string[]
  sprites: { front_default: string | null; front_shiny: string | null }
}

export type CacheEnvelopeV1 = {
  version: 1
  fetchedAt: string
  pokemon: PokemonDto[]
}

export type CacheEnvelope = CacheEnvelopeV1
