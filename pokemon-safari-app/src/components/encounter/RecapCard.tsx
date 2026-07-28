import { useEffect, useState } from 'react'
import { PixelButton } from '@/components/PixelButton'
import { recapCopy, spellingCopy } from '@/data/educationConfig'

type RecapCardProps = {
  equation: string
  onContinue: () => void
  imageUrl?: string | null
  photographer?: string | null
  pexelsUrl?: string | null
}

type ImageStatus = 'loading' | 'ready' | 'error'

export function RecapCard({
  equation,
  onContinue,
  imageUrl,
  photographer,
  pexelsUrl,
}: RecapCardProps) {
  const showImage = Boolean(imageUrl)
  const [imageStatus, setImageStatus] = useState<ImageStatus>(() =>
    showImage ? 'loading' : 'ready',
  )

  useEffect(() => {
    setImageStatus(showImage ? 'loading' : 'ready')
  }, [imageUrl, showImage])

  function handleImageLoad() {
    setImageStatus('ready')
  }

  function handleImageError() {
    setImageStatus('error')
  }

  const attribution =
    imageStatus === 'ready' && photographer
      ? spellingCopy.attribution.replace('{name}', photographer)
      : null

  const showImageBlock = showImage && imageStatus !== 'error'

  return (
    <div className="gba-dialog flex w-full flex-col items-center gap-4 p-6 text-center">
      <h2
        id="encounter-recap-heading"
        className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] text-text"
      >
        {recapCopy.heading}
      </h2>
      {showImageBlock ? (
        <div className="flex w-full flex-col items-center gap-2">
          <img
            src={imageUrl!}
            alt="Quick recap spelling picture"
            onLoad={handleImageLoad}
            onError={handleImageError}
            className="max-h-40 w-full max-w-xs object-cover"
          />
          {imageStatus === 'loading' ? (
            <p className="font-[family-name:var(--font-body)] text-[14px] text-muted">
              {spellingCopy.loading}
            </p>
          ) : null}
          {attribution ? (
            <p className="font-[family-name:var(--font-label)] text-[12px] text-muted">
              {pexelsUrl ? (
                <a href={pexelsUrl} target="_blank" rel="noopener noreferrer">
                  {attribution}
                </a>
              ) : (
                attribution
              )}
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
