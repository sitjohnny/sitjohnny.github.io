import { DexTile } from '@/components/dex/DexTile'
import { GEN1_COUNT } from '@/services/pokeapi/keys'
import type { DexData } from '@/types/save'

type DexGridProps = {
  dex: DexData
  onSelect: (speciesId: number) => void
}

/**
 * 4-column National Dex grid of all Gen 1 tiles in ascending id order
 * (D-01 — 151 entries; D-10 — numbered tile grid).
 */
export function DexGrid({ dex, onSelect }: DexGridProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {Array.from({ length: GEN1_COUNT }, (_, i) => i + 1).map((id) => (
        <DexTile
          key={id}
          speciesId={id}
          entry={dex[String(id)]}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
