'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, LayoutDashboard, Store } from 'lucide-react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { checkIsAuthenticated } from '@/lib/auth'
import { getUserProfile, defaultUserProfile, type UserProfile, saveUserProfile } from '@/lib/user-profile'
import { api } from '@/lib/api'

export function LandingHeader() {
  const [mounted, setMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile)

  useEffect(() => {
    setMounted(true)
    const authed = checkIsAuthenticated()
    setIsAuthenticated(authed)

    if (authed) {
      const initial = getUserProfile()
      setProfile(initial)

      // Fetch latest profile from backend if session is valid
      api.auth.me().then((me) => {
        if (me) {
          const updated = {
            name: me.full_name,
            email: me.email,
            institution: me.institution,
            department: me.department,
            level: me.academic_level,
            role: (me.role === 'representative' ? 'rep' : me.role) as any,
            avatar: me.avatar_url || me.avatar,
            avatar_url: me.avatar_url || me.avatar,
          }
          saveUserProfile(updated)
          setProfile((prev) => ({ ...prev, ...updated }))
        }
      }).catch(() => {
        // Token might have expired or network failed, fallback gracefully
      })
    }

    const handleProfileUpdate = () => {
      setProfile(getUserProfile())
      setIsAuthenticated(checkIsAuthenticated())
    }

    window.addEventListener('user-profile-updated', handleProfileUpdate)
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate)
    }
  }, [])

  return (
    <nav className="landing-nav" aria-label="Gradia navigation">
      <Logo href="/" />

      <div className="landing-links">
        <Link href="/features">Features</Link>
        <Link href="/how-it-works">How it works</Link>
        <Link href="/professor-atlas-info">Prof. Zikora</Link>
        <Link
          href="/marketplace"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#4338ca',
            fontWeight: 650,
          }}
        >
          <Store style={{ width: '14px', height: '14px' }} />
          <span>Marketplace</span>
        </Link>
      </div>

      <div className="landing-actions">
        <ThemeToggle />

        {mounted && isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              href="/dashboard/settings"
              title="Account settings"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                color: 'inherit',
                padding: '4px 6px',
                borderRadius: '8px',
                transition: 'opacity 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#4338ca',
                  background: '#e0e7ff',
                  flexShrink: 0,
                  border: '1.5px solid rgba(99, 102, 241, 0.35)',
                }}
              >
                {profile.avatar && (profile.avatar.startsWith('http://') || profile.avatar.startsWith('https://')) ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  profile.name
                    ? profile.name
                        .split(' ')
                        .filter(Boolean)
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'ST'
                )}
              </div>
              <span
                className="landing-user-name"
                style={{
                  fontSize: '13px',
                  fontWeight: 650,
                  color: 'var(--foreground)',
                  maxWidth: '120px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {profile.name ? profile.name.split(' ')[0] : 'Student'}
              </span>
            </Link>

            <Link
              href="/dashboard"
              className="primary-button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 15px',
                fontSize: '12px',
              }}
            >
              <LayoutDashboard style={{ width: '14px', height: '14px' }} />
              <span>Dashboard</span>
              <ChevronRight style={{ width: '13px', height: '13px' }} />
            </Link>
          </div>
        ) : (
          <>
            <Link href="/login" className="landing-login">
              Log in
            </Link>
            <Link href="/register" className="primary-button">
              Get started <ChevronRight />
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
