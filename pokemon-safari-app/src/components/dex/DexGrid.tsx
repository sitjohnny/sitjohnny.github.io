import { DexTile } from '@/components/dex/DexTile'
import type { DexData } from '@/types/save'

type DexGridProps = {
  dex: DexData
  speciesIds: number[]
  onSelect: (speciesId: number) => void
}

/**
 * 4-column National Dex grid in ascending id order (D-01, D-10).
 */
export function DexGrid({ dex, speciesIds, onSelect }: DexGridProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {speciesIds.map((id) => (
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
