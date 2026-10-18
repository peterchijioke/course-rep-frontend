import Link from 'next/link'
import Image from 'next/image'

export function Logo({
  href = '/',
  className = '',
  variant = 'default',
}: {
  href?: string
  className?: string
  variant?: 'default' | 'white'
}) {
  const isWhite = variant === 'white'
  return (
    <Link
      href={href}
      className={`brand ${isWhite ? 'brand--white' : ''} ${className}`.trim()}
      aria-label="Course Rep home"
    >
      <span className="brand-mark">
        <Image
          src="/logo-icon.png"
          alt="Course Rep"
          width={32}
          height={32}
          priority
          className="brand-logo-img brand-logo-default"
        />
        <Image
          src="/logo-white.png"
          alt="Course Rep"
          width={32}
          height={32}
          priority
          className="brand-logo-img brand-logo-white"
        />
      </span>
      <span>Course Rep</span>
    </Link>
  )
}
