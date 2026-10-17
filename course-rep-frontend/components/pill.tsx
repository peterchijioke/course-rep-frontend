import type { ReactNode } from 'react'

export function Pill({
  children,
  tone = '',
}: {
  children: ReactNode
  tone?: string
}) {
  return <span className={`course-pill ${tone}`}>{children}</span>
}
