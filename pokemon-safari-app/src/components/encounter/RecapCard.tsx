import { PixelButton } from '@/components/PixelButton'
import { recapCopy, spellingCopy } from '@/data/educationConfig'

type RecapCardProps = {
  equation: string
  onContinue: () => void
  imageUrl?: string | null
  photographer?: string | null
  pexelsUrl?: string | null
}

export function RecapCard({
  equation,
  onContinue,
  imageUrl,
  photographer,
}: RecapCardProps) {
  const showImage = Boolean(imageUrl)
  const attribution =
    showImage && photographer
      ? spellingCopy.attribution.replace('{name}', photographer)
      : null

  return (
    <div className="gba-dialog flex w-full flex-col items-center gap-4 p-6 text-center">
      <h2
        id="encounter-recap-heading"
        className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] text-text"
      >
        {recapCopy.heading}
      </h2>
      {showImage ? (
        <div className="flex w-full flex-col items-center gap-2">
          <img
            src={imageUrl!}
            alt="Quick recap spelling picture"
            className="max-h-40 w-full max-w-xs object-cover"
          />
          {attribution ? (
            <p className="font-[family-name:var(--font-label)] text-[12px] text-muted">
              {attribution}
            </p>
          ) : null}
        </div>
      ) : null}
      <p className="font-[family-name:var(--font-numeral)] text-[32px] font-normal leading-[1.2] tracking-[0.06em] text-text">
        {equation}.
      </p>
      <p className="font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5] text-text">
        {recapCopy.closing}
      </p>
      <PixelButton variant="primary" className="w-full" onClick={onContinue}>
        Continue
      </PixelButton>
    </div>
  )
}
