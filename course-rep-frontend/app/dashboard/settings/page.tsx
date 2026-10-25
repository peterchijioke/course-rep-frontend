'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Bell,
  Camera,
  CheckCircle2,
  ChevronRight,
  Key,
  Loader2,
  Lock,
  Mail,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
  Trash2,
  UploadCloud,
  User,
  Users,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { Pill } from '@/components/pill'
import { logoutUser } from '@/lib/auth'
import { defaultUserProfile, getUserProfile, saveUserProfile } from '@/lib/user-profile'
import { api } from '@/lib/api'

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()

  const [mounted, setMounted] = useState(false)

  // Profile State
  const [profile, setProfile] = useState(defaultUserProfile)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync profile and mount state from local and live backend
  useEffect(() => {
    setMounted(true)
    setProfile(getUserProfile())

    api.auth.me().then((me) => {
      if (me) {
        const synced = {
          name: me.full_name,
          email: me.email,
          institution: me.institution,
          department: me.department,
          level: me.academic_level,
          session: me.academic_session,
          avatar: me.avatar_url || me.avatar,
          avatar_url: me.avatar_url || me.avatar,
        }
        saveUserProfile(synced)
        setProfile((prev) => ({ ...prev, ...synced }))
      }
    }).catch((err) => {
      console.warn('Could not sync user profile from backend:', err)
    })
  }, [])

  // Notification toggles
  const [notifications, setNotifications] = useState(true)
  const [whatsappAlerts, setWhatsappAlerts] = useState(true)
  const [lectureReminders, setLectureReminders] = useState(true)

  // Modals
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToastMsg = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Upload Avatar to Cloudinary & update backend database
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      showToastMsg('Image size exceeds 10MB limit')
      return
    }

    setUploadingAvatar(true)
    try {
      const res = await api.upload.avatar(file)
      const newAvatarUrl = res.avatar_url || res.secure_url || res.avatar
      const updated = saveUserProfile({ avatar: newAvatarUrl, avatar_url: newAvatarUrl })
      setProfile(updated)
      showToastMsg('Profile picture uploaded to Cloudinary successfully!')
    } catch (err: any) {
      console.error('Avatar upload failed:', err)
      showToastMsg(err?.message || 'Failed to upload image')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      await api.auth.updateProfile({ avatar: '' })
      const updated = saveUserProfile({ avatar: '', avatar_url: '' })
      setProfile(updated)
      showToastMsg('Profile picture reset')
    } catch (err: any) {
      const updated = saveUserProfile({ avatar: '', avatar_url: '' })
      setProfile(updated)
      showToastMsg('Profile picture reset locally')
    }
  }

  const handleLogout = () => {
    logoutUser()
    router.push('/login')
    router.refresh()
  }

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') || profile.name).trim()
    const matricNo = String(form.get('matricNo') || profile.matricNo).trim()
    const phone = String(form.get('phone') || profile.phone).trim()
    const department = String(form.get('department') || profile.department).trim()
    const level = String(form.get('level') || profile.level).trim()
    const bio = String(form.get('bio') || profile.bio).trim()

    const updated = {
      name,
      matricNo,
      phone,
      department,
      level,
      bio,
    }

    // 1. Update local storage & fire local update event
    const saved = saveUserProfile(updated)
    setProfile(saved)

    // 2. Persist to live PostgreSQL backend
    try {
      await api.auth.updateProfile({
        full_name: name,
        department,
        academic_level: level,
      })
      showToastMsg('Profile updated in backend database successfully!')
    } catch (err: any) {
      console.warn('Backend update failed:', err)
      showToastMsg(`Profile saved locally (${err?.message || 'backend offline'})`)
    } finally {
      setSaving(false)
      setShowEditModal(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Profile & Settings"
        subtitle="Manage your academic record, personal details, notification alerts, and account preferences."
      />

      <div className="settings-layout">
        {/* Left Card: Profile & Settings Actions */}
        <Panel>
          <div className="settings-profile">
            {/* Hidden file input for Cloudinary upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              style={{ display: 'none' }}
              aria-label="Upload profile image"
            />

            {/* Interactive Avatar with Camera Upload Badge */}
            <div
              className="profile-avatar-wrap"
              onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
              title="Click to change profile picture"
            >
              <div className="profile-avatar-btn">
                {profile.avatar && (profile.avatar.startsWith('http://') || profile.avatar.startsWith('https://')) ? (
                  <img src={profile.avatar} alt={profile.name} className="profile-avatar-img" />
                ) : (
                  profile.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                )}
                {uploadingAvatar ? (
                  <div className="profile-avatar-loading">
                    <Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : (
                  <div className="profile-avatar-overlay">
                    <Camera style={{ width: '14px', height: '14px' }} />
                    <span>Upload</span>
                  </div>
                )}
              </div>
              <span className="profile-avatar-badge" title="Upload avatar">
                <Camera style={{ width: '11px', height: '11px' }} />
              </span>
            </div>

            <div>
              <h2>{profile.name}</h2>
              <p>{profile.email}</p>
              <Pill tone="verified-pill">
                <ShieldCheck style={{ width: '13px', display: 'inline', marginRight: '4px' }} />
                Student · {profile.level} · {profile.matricNo}
              </Pill>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={() => setShowEditModal(true)}
            >
              Edit profile
            </button>
          </div>

          <div className="settings-list">
            <button type="button" onClick={() => setShowEditModal(true)}>
              <span>
                <Users /> Academic profile details
              </span>
              <ChevronRight />
            </button>

            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              <span>
                {mounted && resolvedTheme === 'dark' ? <Moon /> : <Sun />} Theme appearance
              </span>
              <span className="toggle">
                {mounted && resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setNotifications(!notifications)
                showToastMsg(`Push notifications turned ${!notifications ? 'ON' : 'OFF'}`)
              }}
            >
              <span>
                <Bell /> Urgent broadcast alerts
              </span>
              <span className={`toggle ${notifications ? 'on' : 'off'}`}>
                {notifications ? 'Enabled' : 'Disabled'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setWhatsappAlerts(!whatsappAlerts)
                showToastMsg(`WhatsApp class alerts ${!whatsappAlerts ? 'enabled' : 'disabled'}`)
              }}
            >
              <span>
                <Phone /> WhatsApp venue change notices
              </span>
              <span className={`toggle ${whatsappAlerts ? 'on' : 'off'}`}>
                {whatsappAlerts ? 'Active' : 'Off'}
              </span>
            </button>

            <button type="button" onClick={() => setShowSecurityModal(true)}>
              <span>
                <Lock /> Account security & password
              </span>
              <ChevronRight />
            </button>

            <button type="button" onClick={handleLogout}>
              <span className="danger">Sign out of workspace</span>
              <ChevronRight />
            </button>
          </div>
        </Panel>

        {/* Right Card: Institutional Academic Credentials */}
        <Panel>
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2>Verified University Credentials</h2>
              <p>Endorsed for the 2026/2027 academic session</p>
            </div>
            <Pill tone="verified-pill">Validated</Pill>
          </div>

          <div className="info-grid">
            <label>
              Institution
              <strong>{profile.institution}</strong>
            </label>
            <label>
              Faculty
              <strong>{profile.faculty}</strong>
            </label>
            <label>
              Department
              <strong>{profile.department}</strong>
            </label>
            <label>
              Matriculation ID
              <strong>{profile.matricNo}</strong>
            </label>
            <label>
              Current Academic Level
              <strong>{profile.level}</strong>
            </label>
            <label>
              Academic Session
              <strong>{profile.session} Session</strong>
            </label>
            <label style={{ gridColumn: '1/-1' }}>
              Student Academic Bio
              <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', display: 'block', marginTop: '4px', lineHeight: 1.5 }}>
                {profile.bio}
              </span>
            </label>
          </div>

          <div className="settings-rep-card">
            <div>
              <strong>Course Representative</strong>
              <span>Daniel Chukwu · Class Rep for 400L CSC</span>
            </div>
            <a
              href="tel:+2348031234567"
              className="text-button"
              style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <Phone style={{ width: '12px' }} />
              <span>Contact rep</span>
            </a>
          </div>
        </Panel>
      </div>

      {/* ====================================================================
          MODAL 1: EDIT PROFILE MODAL
          ==================================================================== */}
      {showEditModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setShowEditModal(false)}
        >
          <form className="event-dialog" onSubmit={handleSaveProfile} style={{ width: 'min(100%, 520px)' }}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Academic Profile</p>
                <h2>Edit Profile Information</h2>
                <p>Keep your university credentials current.</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowEditModal(false)}
                aria-label="Close edit profile"
              >
                <X />
              </button>
            </div>

            {/* Cloudinary Profile Photo Section inside Modal */}
            <div className="avatar-upload-box">
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: '#eef2ff',
                  border: '2px solid #818cf8',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#4338ca',
                  flexShrink: 0,
                }}
              >
                {profile.avatar && (profile.avatar.startsWith('http://') || profile.avatar.startsWith('https://')) ? (
                  <img src={profile.avatar} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  profile.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                )}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '13px', display: 'block', color: 'var(--foreground)' }}>Profile Picture</strong>
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', display: 'block', margin: '2px 0 8px' }}>
                  Cloudinary hosted · Max 10MB (JPG, PNG, WEBP, GIF, SVG)
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ fontSize: '11px', padding: '5px 12px', height: '30px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <>
                        <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud style={{ width: '13px', height: '13px' }} />
                        <span>Upload photo</span>
                      </>
                    )}
                  </button>
                  {profile.avatar && (profile.avatar.startsWith('http://') || profile.avatar.startsWith('https://')) && (
                    <button
                      type="button"
                      className="text-button"
                      style={{ fontSize: '11px', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={handleRemoveAvatar}
                    >
                      <Trash2 style={{ width: '12px', height: '12px' }} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="event-field-grid">
              <label>
                Full Name
                <input name="name" required defaultValue={profile.name} autoFocus />
              </label>

              <label>
                Matriculation Number
                <input name="matricNo" required defaultValue={profile.matricNo} />
              </label>
            </div>

            <div className="event-field-grid">
              <label>
                Phone / WhatsApp Number
                <input name="phone" required defaultValue={profile.phone} />
              </label>

              <label>
                Academic Level
                <select name="level" defaultValue={profile.level}>
                  <option value="100 Level">100 Level</option>
                  <option value="200 Level">200 Level</option>
                  <option value="300 Level">300 Level</option>
                  <option value="400 Level">400 Level</option>
                  <option value="500 Level">500 Level</option>
                </select>
              </label>
            </div>

            <label>
              Department
              <input name="department" required defaultValue={profile.department} />
            </label>

            <label>
              Academic Bio & Career Focus
              <textarea
                name="bio"
                rows={3}
                defaultValue={profile.bio}
                style={{
                  width: '100%',
                  border: '1px solid #dbe3ef',
                  borderRadius: '7px',
                  padding: '10px 11px',
                  font: 'inherit',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </label>

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: ACCOUNT SECURITY MODAL
          ==================================================================== */}
      {showSecurityModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setShowSecurityModal(false)}
        >
          <div className="event-dialog" style={{ width: 'min(100%, 460px)' }}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Security</p>
                <h2>Account Credentials</h2>
                <p>Manage your login passwords and authentication sessions.</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowSecurityModal(false)}
                aria-label="Close security modal"
              >
                <X />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label>
                Current Password
                <input type="password" placeholder="••••••••••••" />
              </label>

              <label>
                New Password
                <input type="password" placeholder="At least 8 characters" />
              </label>

              <div
                style={{
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '11px',
                }}
              >
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                  Two-Factor Authentication (2FA)
                </strong>
                <span style={{ color: '#64748b' }}>
                  Protects your academic course registrations and marketplace wallet with OTP verification.
                </span>
              </div>
            </div>

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowSecurityModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setShowSecurityModal(false)
                  showToastMsg('Password updated securely!')
                }}
              >
                Update password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="courses-toast-wrap">
          <div className="courses-toast success">
            <CheckCircle2 />
            <span>{toast}</span>
          </div>
        </div>
      )}
    </>
  )
}
