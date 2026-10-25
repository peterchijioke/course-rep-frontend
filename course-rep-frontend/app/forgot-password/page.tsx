'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, ChevronRight, Copy, KeyRound, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Pill } from '@/components/pill'
import { api } from '@/lib/api'
import { loginUser } from '@/lib/auth'
import { saveUserProfile } from '@/lib/user-profile'

export default function ForgotPasswordPage() {
  const router = useRouter()

  // Stepper state: 'request' | 'verify' | 'success'
  const [step, setStep] = useState<'request' | 'verify' | 'success'>('request')

  // Form states
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Step 1: Request Password Reset Code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await api.auth.forgotPassword(email.trim())
      setSuccessMsg(res.message || 'Verification code sent to your email.')
      if (res.code) {
        setGeneratedCode(res.code)
        setCode(res.code) // Auto-populate for seamless development/testing flow
      }
      setStep('verify')
    } catch (err: any) {
      setError(err?.message || 'Failed to request password reset code. Please verify your email.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify Code and Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('Please enter the 6-digit verification code.')
      return
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await api.auth.resetPassword({
        email: email.trim(),
        code: code.trim(),
        new_password: newPassword,
      })

      if (res.token) {
        loginUser(res.token)
      }

      if (res.user) {
        saveUserProfile({
          name: res.user.full_name || 'Student',
          email: res.user.email || email,
          institution: res.user.institution,
          department: res.user.department,
          level: (res.user.academic_level as any) || '400 Level',
          role: (res.user.role as any) || 'student',
          avatar: res.user.avatar_url || res.user.avatar,
        })
      }

      setStep('success')
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Please check your verification code.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-form-side">
        <div className="auth-brand">
          <Logo href="/" />
        </div>

        <div className="auth-card">
          <Pill>Account Recovery</Pill>

          {/* Stepper Header */}
          {step === 'request' && (
            <>
              <h1>Forgot password</h1>
              <p>Enter your registered university email to receive a secure 6-digit reset code.</p>
            </>
          )}

          {step === 'verify' && (
            <>
              <h1>Enter reset code</h1>
              <p>We generated a verification code for <strong>{email}</strong>.</p>
            </>
          )}

          {step === 'success' && (
            <>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <CheckCircle2 style={{ width: '28px', height: '28px' }} />
              </div>
              <h1>Password updated!</h1>
              <p>Your password has been securely reset. You can now access your Gradia workspace.</p>
            </>
          )}

          {/* Error Banner */}
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12.5px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          {/* Step 1: Request Code Form */}
          {step === 'request' && (
            <form onSubmit={handleRequestCode}>
              <label>
                University or Personal Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.edu.ng"
                  autoFocus
                />
              </label>

              <button
                type="submit"
                className="primary-button auth-submit"
                disabled={loading}
              >
                {loading ? 'Sending code...' : 'Send reset code'} <ChevronRight />
              </button>

              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <Link
                  href="/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#64748b',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  <ArrowLeft style={{ width: '13px', height: '13px' }} /> Back to login
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: Verification Code & New Password Form */}
          {step === 'verify' && (
            <form onSubmit={handleResetPassword}>
              {/* Dev/Testing Helper Badge showing generated code */}
              {generatedCode && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(79, 70, 229, 0.08)',
                    border: '1px solid rgba(79, 70, 229, 0.25)',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>6-Digit Verification Code</span>
                    <strong style={{ fontSize: '17px', color: '#4338ca', letterSpacing: '0.15em' }}>{generatedCode}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    style={{
                      border: '1px solid #c7d2fe',
                      background: '#ffffff',
                      color: '#4338ca',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Copy style={{ width: '12px', height: '12px' }} />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}

              <label>
                6-Digit Reset Code
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  style={{ letterSpacing: '0.1em', fontWeight: 700 }}
                  autoFocus
                />
              </label>

              <label style={{ marginTop: '14px' }}>
                New Password
                <div className="password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <label style={{ marginTop: '14px' }}>
                Confirm New Password
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                />
              </label>

              <button
                type="submit"
                className="primary-button auth-submit"
                disabled={loading}
              >
                {loading ? 'Updating password...' : 'Reset password & continue'} <ChevronRight />
              </button>

              <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#64748b',
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ArrowLeft style={{ width: '12px', height: '12px' }} /> Change email
                </button>

                <button
                  type="button"
                  onClick={handleRequestCode}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#4338ca',
                    fontSize: '11.5px',
                    fontWeight: 650,
                    cursor: 'pointer',
                  }}
                  disabled={loading}
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Success Screen */}
          {step === 'success' && (
            <div style={{ marginTop: '10px' }}>
              <div
                style={{
                  padding: '14px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  fontSize: '12.5px',
                  color: '#065f46',
                  lineHeight: '1.5',
                }}
              >
                <ShieldCheck style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
                Your security credentials have been updated and synced with your official university profile.
              </div>

              <button
                type="button"
                className="primary-button auth-submit"
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard <ChevronRight />
              </button>

              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Link
                  href="/login"
                  style={{
                    fontSize: '12px',
                    color: '#4338ca',
                    fontWeight: 650,
                    textDecoration: 'none',
                  }}
                >
                  Return to sign in
                </Link>
              </div>
            </div>
          )}

          <p className="auth-switch" style={{ marginTop: '24px' }}>
            Remember your credentials?{' '}
            <Link href="/login">Sign in here</Link>
          </p>
        </div>
      </section>

      {/* Right Story Aside */}
      <aside className="auth-story">
        <div className="story-glow story-glow-one" />
        <div className="story-glow story-glow-two" />
        <div className="auth-story-brand">
          <Logo href="/" variant="white" />
        </div>
        <div className="story-content">
          <span className="story-kicker">Security &amp; Privacy First</span>
          <h2>Protecting your academic journey, assignments, and records.</h2>
          <p>
            Gradia safeguards your attendance, exam predictions, course registrations, and continuous assessment data with industry-standard encryption.
          </p>
          <div className="story-stat-row">
            <div>
              <strong>100%</strong>
              <span>encrypted session</span>
            </div>
            <div>
              <strong>6-digit</strong>
              <span>OTP verification</span>
            </div>
            <div>
              <strong>Instant</strong>
              <span>credential recovery</span>
            </div>
          </div>
          <div className="story-quote">
            <span>“</span>
            <p>One-click account recovery ensures I never lose track of a deadline or course announcement.</p>
          </div>
        </div>
      </aside>
    </main>
  )
}
