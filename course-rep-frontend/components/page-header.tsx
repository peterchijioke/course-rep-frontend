import type { ReactNode } from 'react'

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle: string
  action?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">Course Rep workspace</p>
        <h1>{title}</h1>
        <p className="subheading">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}
