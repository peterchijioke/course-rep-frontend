import type { CSSProperties, ReactNode } from 'react'

export function Panel({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <section className={`panel ${className}`} style={style}>
      {children}
    </section>
  )
}
