'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Lock,
  Menu,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
  Store,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { defaultUserProfile, getUserProfile, saveUserProfile, type UserProfile } from '@/lib/user-profile'
import { getEnrolledCourses } from '@/lib/data'
import { api, getAuthToken } from '@/lib/api'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
}

const primaryNav: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Courses', href: '/dashboard/courses', icon: BookOpen },
  { label: 'Calendar', href: '/dashboard/calendar', icon: CalendarDays },
  { label: 'Academic Records', href: '/dashboard/records', icon: GraduationCap },
  { label: 'Insights & Analytics', href: '/dashboard/insights', icon: BarChart3 },
]

const communityNav: NavItem[] = [
  { label: 'Marketplace', href: '/dashboard/marketplace', icon: Store },
  { label: 'Student Groups', href: '/dashboard/groups', icon: Users },
  { label: 'Direct Messages', href: '/dashboard/messages', icon: MessageCircle },
]

const accountNav: NavItem[] = [
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUserProfile)
  const [enrolledCount, setEnrolledCount] = useState<number>(0)
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
    setUserProfile(getUserProfile())

    // Fetch live user and enrolled courses from backend
    const syncWithBackend = async () => {
      const token = getAuthToken()
      if (!token) return

      try {
        const liveUser = await api.auth.me()
        if (liveUser) {
          const updated = {
            name: liveUser.full_name,
            email: liveUser.email,
            institution: liveUser.institution,
            department: liveUser.department,
            level: liveUser.academic_level,
            role: (liveUser.role === 'representative' ? 'rep' : liveUser.role) as any,
          }
          saveUserProfile(updated)
          setUserProfile((prev) => ({ ...prev, ...updated }))
        }
      } catch (err) {
        console.warn('Could not sync user profile from backend:', err)
      }

      try {
        const enrolled = await api.courses.getMyEnrolled()
        if (Array.isArray(enrolled)) {
          setEnrolledCount(enrolled.length)
        }
      } catch (err) {
        // Fallback to local
        setEnrolledCount(getEnrolledCourses().length)
      }
    }

    syncWithBackend()

    const handleProfileUpdate = () => setUserProfile(getUserProfile())
    const updateEnrolled = () => setEnrolledCount(getEnrolledCourses().length)

    window.addEventListener('user-profile-updated', handleProfileUpdate)
    window.addEventListener('enrolled-courses-updated', updateEnrolled)
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate)
      window.removeEventListener('enrolled-courses-updated', updateEnrolled)
    }
  }, [])

  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const renderNavList = (items: NavItem[]) =>
    items.map(({ label, href, icon: Icon, badge }) => {
      const isRecords = href === '/dashboard/records'
      const isLocked = mounted && isRecords && enrolledCount === 0

      if (isLocked) {
        return (
          <Link
            key={href}
            href="/dashboard/courses?notice=enroll-first"
            className="nav-item is-locked"
            title="Enroll courses first in My Courses to activate your Academic Records"
            onClick={() => setMobileOpen(false)}
          >
            <Icon />
            <span>{label}</span>
            <span className="nav-lock-badge">
              <Lock style={{ width: 10, height: 10 }} /> Enroll First
            </span>
          </Link>
        )
      }

      const active = isLinkActive(href)
      return (
        <Link
          key={href}
          href={href}
          className={`nav-item ${active ? 'active' : ''}`}
          onClick={() => setMobileOpen(false)}
        >
          <Icon />
          <span>{label}</span>
          {badge !== undefined && <em>{badge}</em>}
        </Link>
      )
    })

  return (
    <main className="app-shell">
      {mobileOpen && (
        <button
          type="button"
          className="mobile-scrim"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar-top">
          <Logo href="/dashboard" />
          <button
            type="button"
            className="icon-btn mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X />
          </button>
        </div>

        <Link
          href="/dashboard/settings"
          className="workspace"
          onClick={() => setMobileOpen(false)}
        >
          <span className="avatar avatar-small">
            {userProfile.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
          </span>
          <div>
            <strong>{userProfile.name}</strong>
            <small>{userProfile.role === 'rep' ? 'Course Rep' : 'Student'} · {userProfile.level}</small>
          </div>
          <ChevronRight />
        </Link>

        <nav className="side-nav" aria-label="Main navigation">
          <div className="nav-section">
            <span className="nav-section-label">Workspace</span>
            {renderNavList(primaryNav)}
          </div>
          <div className="nav-section">
            <span className="nav-section-label">Community</span>
            {renderNavList(communityNav)}
          </div>
          <div className="nav-section">
            <span className="nav-section-label">Account</span>
            {renderNavList(accountNav)}
          </div>
        </nav>

        <div className="sidebar-footer">
          <Link
            href="/dashboard/support"
            className="help-card"
            onClick={() => setMobileOpen(false)}
          >
            <span className="help-icon">?</span>
            <div>
              <strong>Need some help?</strong>
              <small>Visit our support centre</small>
            </div>
            <ChevronRight />
          </Link>
          <span className="version">Course Rep v1.0 · {userProfile.institution || 'Campus Hub'}</span>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </button>

          <div className="top-search">
            <Search />
            <input placeholder="Search anything..." aria-label="Search" />
          </div>

          <div className="top-actions">
            <ThemeToggle />
            <Link
              href="/dashboard/announcements"
              className="icon-btn notification-btn"
              aria-label="Notifications"
            >
              <Bell />
              <span />
            </Link>
            <span className="top-divider" />
            <Link
              href="/dashboard/settings"
              className="avatar"
              aria-label="User settings"
            >
              {userProfile.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </Link>
            <span className="top-name">{userProfile.name}</span>
          </div>
        </header>

        <div className="content">
          {children}

          {pathname !== '/dashboard/professor-atlas' && (
            <Link
              href="/dashboard/professor-atlas"
              className="atlas-fab"
              aria-label="Open Prof. Zikora"
            >
              <Sparkles />
              <span>Ask Prof. Zikora</span>
            </Link>
          )}

          <footer className="mobile-nav">
            <Link
              href="/dashboard"
              className={pathname === '/dashboard' ? 'active' : ''}
            >
              <LayoutDashboard />
              <span>Home</span>
            </Link>
            <Link
              href="/dashboard/courses"
              className={pathname.startsWith('/dashboard/courses') ? 'active' : ''}
            >
              <BookOpen />
              <span>Courses</span>
            </Link>
            <Link
              href="/dashboard/calendar"
              className={pathname.startsWith('/dashboard/calendar') ? 'active' : ''}
            >
              <CalendarDays />
              <span>Calendar</span>
            </Link>
            <Link
              href="/dashboard/announcements"
              className={pathname.startsWith('/dashboard/announcements') ? 'active' : ''}
            >
              <Bell />
              <span>Alerts</span>
            </Link>
            <Link
              href="/dashboard/settings"
              className={pathname.startsWith('/dashboard/settings') ? 'active' : ''}
            >
              <span className="avatar avatar-tiny">PE</span>
              <span>Profile</span>
            </Link>
          </footer>
        </div>
      </section>
    </main>
  )
}
