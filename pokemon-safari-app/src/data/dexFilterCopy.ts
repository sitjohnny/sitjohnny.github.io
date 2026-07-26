import { typeColors } from '@/data/typeColors'
import type { DexFilterState, DexStatusFilter } from '@/game/dexFilters'

/** Gen 1 type names for horizontal filter chips (stable order). */
export const DEX_TYPE_FILTER_OPTIONS = Object.keys(typeColors).sort()

function statusEmptyHeading(status: DexStatusFilter): string {
  switch (status) {
    case 'shiny':
      return 'No shiny catches yet.'
    case 'caught':
      return 'No catches yet.'
    case 'missing':
      return 'Nothing missing here.'
    default:
      return 'No Pokémon match this filter.'
  }
}

function typeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function dexFilterEmptyCopy(filter: DexFilterState): {
  heading: string
  body: string
} {
  const typePart = filter.type ? ` ${typeLabel(filter.type)}` : ''
  const heading =
    filter.type && filter.status === 'all'
      ? `No${typePart} Pokémon in the dex.`
      : statusEmptyHeading(filter.status)

  if (filter.type && filter.status !== 'all') {
    return {
      heading,
      body: `Try another type or status filter.`,
    }
  }
  if (filter.status === 'shiny') {
    return {
      heading,
      body: 'Catch a shiny in the grass to fill this list.',
    }
  }
  if (filter.status === 'caught') {
    return {
      heading,
      body: 'Catch Pokémon in the grass to fill your Pokédex.',
    }
  }
  return {
    heading,
    body: 'Adjust the filters above to see more entries.',
  }
}
