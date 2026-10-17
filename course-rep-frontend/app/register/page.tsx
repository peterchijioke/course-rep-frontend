'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Pill } from '@/components/pill'
import { loginUser } from '@/lib/auth'
import { saveUserProfile } from '@/lib/user-profile'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role] = useState<'student' | 'rep'>('student')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    loginUser()
    saveUserProfile({
      name: name.trim() || 'Peter Chijioke',
      email: email.trim() || 'peter.chijioke@example.edu.ng',
      phone: phone.trim() || '+234 812 345 6789',
      role,
    })
    router.push('/onboarding')
    router.refresh()
  }

  return (
    <main className="auth-shell">
      <section className="auth-form-side">
        <div className="auth-brand">
          <Logo href="/" />
        </div>
        <div className="auth-card">
          <Pill>Tertiary Academic Command Centre</Pill>
          <h1>Create your account</h1>
          <p>Start staying informed about your academic journey and class schedule.</p>

          <form onSubmit={handleSubmit}>

            <label>
              Full name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Peter Chijioke"
              />
            </label>

            <label>
              University or personal email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.edu.ng"
              />
            </label>

            <label>
              Phone number (for WhatsApp class updates)
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 812 345 6789"
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

            <label className="check-label">
              <input
                type="checkbox"
                required
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />{' '}
              I agree to the Terms of Service and Privacy Policy
            </label>

            <button type="submit" className="primary-button auth-submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'} <ChevronRight />
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link href="/login">Log in</Link>
          </p>
        </div>
      </section>

      <aside className="auth-story">
        <div className="story-glow story-glow-one" />
        <div className="story-glow story-glow-two" />
        <div className="auth-story-brand">
          <Logo href="/" />
        </div>
        <div className="story-content">
          <span className="story-kicker">Your academic command centre</span>
          <h2>Stay ahead of every lecture, deadline, and update.</h2>
          <p>
            Course Rep brings your academic life into one calm, focused workspace built for
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
