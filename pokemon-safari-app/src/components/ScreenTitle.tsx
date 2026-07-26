import type { HTMLAttributes, ReactNode } from 'react'

type ScreenTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  children: ReactNode
  as?: 'h1' | 'h2'
}

export function ScreenTitle({
  children,
  as: Tag = 'h1',
  className = '',
  ...rest
}: ScreenTitleProps) {
  return (
    <Tag
      className={[
        'font-[family-name:var(--font-display)] text-[22px] font-bold leading-[1.2] tracking-[0.02em] text-text',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  )
}
