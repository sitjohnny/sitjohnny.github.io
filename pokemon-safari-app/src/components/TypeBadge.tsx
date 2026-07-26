import { typeColors } from '@/data/typeColors'

type TypeBadgeProps = {
  type: string
}

function displayLabel(type: string): string {
  if (!type) return ''
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const backgroundColor = typeColors[type] ?? '#787878'

  return (
    <span
      className="inline-block rounded-[4px] px-2 py-0.5 font-[family-name:var(--font-label)] text-[12px] font-normal leading-tight text-white"
      style={{ backgroundColor }}
    >
      {displayLabel(type)}
    </span>
  )
}
