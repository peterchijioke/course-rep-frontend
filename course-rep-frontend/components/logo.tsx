import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export function Logo({
  href = '/',
  className = '',
}: {
  href?: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={`brand ${className}`.trim()}
      aria-label="Course Rep home"
    >
      <span className="brand-mark">
        <GraduationCap />
      </span>
      <span>Course Rep</span>
    </Link>
  )
}
