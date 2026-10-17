import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

export function LandingHeader() {
  return (
    <nav className="landing-nav" aria-label="Course Rep navigation">
      <Logo href="/" />
      <div className="landing-links">
        <Link href="/features">Features</Link>
        <Link href="/how-it-works">How it works</Link>
        <Link href="/professor-atlas-info">Prof. Zikora</Link>
      </div>
      <div className="landing-actions">
        <ThemeToggle />
        <Link href="/login" className="landing-login">
          Log in
        </Link>
        <Link href="/register" className="primary-button">
          Get started <ChevronRight />
        </Link>
      </div>
    </nav>
  )
}
