/** Classic Gen 1 type palette (DATA-03) — UI must not hardcode these elsewhere. */
export const typeColors: Record<string, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
}

const FALLBACK_TYPE_COLOR = '#787878'

export function primaryTypeColor(types: string[]): string {
  const primary = types[0]
  if (!primary) return FALLBACK_TYPE_COLOR
  return typeColors[primary] ?? FALLBACK_TYPE_COLOR
}
