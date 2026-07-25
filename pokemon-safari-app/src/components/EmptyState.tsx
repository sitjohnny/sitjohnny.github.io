type EmptyStateProps = {
  heading?: string
  body?: string
}

const DEFAULT_HEADING = 'Safari isn’t ready yet'
const DEFAULT_BODY =
  'Coming in a later adventure. Use the icons below to look around.'

export function EmptyState({
  heading = DEFAULT_HEADING,
  body = DEFAULT_BODY,
}: EmptyStateProps) {
  return (
    <div className="pixel-border mx-auto max-w-sm bg-dominant p-2">
      <div className="space-y-3 p-2 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] tracking-[0.02em] text-text">
          {heading}
        </h2>
        <p className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-muted">
          {body}
        </p>
      </div>
    </div>
  )
}
