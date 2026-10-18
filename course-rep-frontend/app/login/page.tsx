'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Pill } from '@/components/pill'
import { loginUser } from '@/lib/auth'
import { api } from '@/lib/api'
import { saveUserProfile } from '@/lib/user-profile'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTarget = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await api.auth.login({ email: email.trim(), password })
      loginUser(res.token)

      if (res.user) {
        saveUserProfile({
          name: res.user.full_name || 'Peter Chijioke',
          email: res.user.email || email,
          institution: res.user.institution || 'Example University',
          department: res.user.department || 'Computer Science',
          level: (res.user.academic_level as any) || '400 Level',
          semester: 'First Semester',
          role: (res.user.role as any) || 'student',
        })
      }

      router.push(redirectTarget)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.')
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-form-side">
        <div className="auth-brand">
          <Logo href="/" />
        </div>
        <div className="auth-card">
          <Pill>Tertiary Academic Workspace</Pill>
          <h1>Welcome back</h1>
          <p>Log in to continue to your academic workspace.</p>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label>
              Email address
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.edu.ng"
              />
            </label>

            <label>
              Password
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <button type="submit" className="primary-button auth-submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'} <ChevronRight />
            </button>
          </form>

          <p className="auth-switch">
            New to Gradia?{' '}
            <Link href="/register">Create an account</Link>
          </p>
        </div>
      </section>

      <aside className="auth-story">
        <div className="story-glow story-glow-one" />
        <div className="story-glow story-glow-two" />
        <div className="auth-story-brand">
          <Logo href="/" variant="white" />
        </div>
        <div className="story-content">
          <span className="story-kicker">Your academic command centre</span>
          <h2>Stay ahead of every lecture, deadline, and update.</h2>
          <p>
            Gradia brings your academic life into one calm, focused workspace built for
            students who want to move with clarity.
          </p>
          <div className="story-stat-row">
            <div>
              <strong>4</strong>
              <span>active courses</span>
            </div>
            <div>
              <strong>6</strong>
              <span>upcoming lectures</span>
            </div>
            <div>
              <strong>3</strong>
              <span>new updates</span>
            </div>
          </div>
          <div className="story-quote">
            <span>“</span>
            <p>Everything I need for the semester is finally in one place.</p>
            <small>— Peter, Computer Science 400L</small>
          </div>
        </div>
      </aside>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="auth-shell" />}>
      <LoginForm />
    </Suspense>
  )
}
