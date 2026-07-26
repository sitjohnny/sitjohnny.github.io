import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'destructive'

type PixelButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  children: ReactNode
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'rounded-[4px] bg-accent text-text shadow-[4px_4px_0_#1a3324]',
  secondary: 'rounded-[4px] bg-secondary text-on-secondary shadow-[4px_4px_0_#1a3324]',
  destructive:
    'rounded-[4px] border-4 border-destructive bg-destructive text-on-secondary shadow-[4px_4px_0_#7a2f28]',
}

export function PixelButton({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...rest
}: PixelButtonProps) {
  return (
    <button
      type={type}
      className={[
        'touch-target inline-flex items-center justify-center px-4 py-3 font-[family-name:var(--font-body)] text-[16px] font-normal leading-[1.5]',
        'touch-manipulation transition-transform duration-[80ms] ease-out active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100',
        VARIANT_CLASS[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
