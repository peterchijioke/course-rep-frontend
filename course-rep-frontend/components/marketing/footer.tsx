import Link from 'next/link'
import { Logo } from '@/components/logo'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Logo href="/" />
          <p>Your academic life, organized for better progress.</p>
          <a href="mailto:support@courserep.app">support@courserep.app</a>
        </div>
        <div className="footer-column">
          <strong>PRODUCT</strong>
          <Link href="/features">Features</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/professor-atlas-info">Prof. Zikora</Link>
          <Link href="/dashboard/calendar">Academic calendar</Link>
        </div>
        <div className="footer-column">
          <strong>COMMUNITY</strong>
          <Link href="/dashboard/groups">Student groups</Link>
          <Link href="/dashboard/messages">Messages</Link>
          <Link href="/dashboard/support">Support center</Link>
        </div>
        <div className="footer-column">
          <strong>COMPANY</strong>
          <Link href="/about">About Course Rep</Link>
          <Link href="/register">Get started</Link>
          <a href="mailto:support@courserep.app">Contact</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Course Rep. All rights reserved.</span>
      </div>
    </footer>
  )
}
