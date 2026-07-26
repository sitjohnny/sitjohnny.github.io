import { PixelButton } from '@/components/PixelButton'
import { recapCopy } from '@/data/educationConfig'

type RecapCardProps = {
  a: number
  b: number
  product: number
  onContinue: () => void
}

export function RecapCard({ a, b, product, onContinue }: RecapCardProps) {
  return (
    <div className="gba-dialog flex w-full flex-col items-center gap-4 p-6 text-center">
      <h2
        id="encounter-recap-heading"
        className="font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] text-text"
      >
        {recapCopy.heading}
      </h2>
      <p className="font-[family-name:var(--font-numeral)] text-[32px] font-normal leading-[1.2] tracking-[0.06em] text-text">
        {a} × {b} = {product}.
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
