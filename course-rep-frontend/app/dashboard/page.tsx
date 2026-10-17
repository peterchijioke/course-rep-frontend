'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileText,
  GraduationCap,
  MapPin,
  Store,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { Pill } from '@/components/pill'
import {
  api,
  getAuthToken,
  type Course,
  type AnnouncementItem,
  type TimetableSlot,
  type MarketplaceItem,
} from '@/lib/api'
import { defaultUserProfile, getUserProfile, saveUserProfile, type UserProfile } from '@/lib/user-profile'

export default function DashboardOverviewPage() {
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile)
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [announcementsList, setAnnouncementsList] = useState<AnnouncementItem[]>([])
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([])
  const [marketItems, setMarketItems] = useState<MarketplaceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setProfile(getUserProfile())

    const loadData = async () => {
      setLoading(true)
      const token = getAuthToken()

      // Fetch user profile if logged in
      if (token) {
        try {
          const me = await api.auth.me()
          if (me) {
            const updated = {
              name: me.full_name,
              email: me.email,
              institution: me.institution,
              department: me.department,
              level: me.academic_level,
              role: (me.role === 'representative' ? 'rep' : me.role) as any,
            }
            saveUserProfile(updated)
            setProfile((prev) => ({ ...prev, ...updated }))
          }
        } catch (e) {
          console.warn('Could not fetch user profile:', e)
        }
      }

      // Fetch enrolled courses
      try {
        const courses = await api.courses.getMyEnrolled()
        setEnrolledCourses(courses || [])
      } catch (e) {
        try {
          const all = await api.courses.getAll()
          setEnrolledCourses(all ? all.slice(0, 4) : [])
        } catch {
          setEnrolledCourses([])
        }
      }

      // Fetch announcements
      try {
        const anns = await api.announcements.getAll()
        setAnnouncementsList(Array.isArray(anns) ? anns : [])
      } catch (e) {
        setAnnouncementsList([])
      }

      // Fetch timetable
      try {
        const slots = await api.timetable.getAll()
        setTimetableSlots(slots || [])
      } catch (e) {
        setTimetableSlots([])
      }

      // Fetch marketplace
      try {
        const items = await api.marketplace.getAll()
        setMarketItems(items || [])
      } catch (e) {
        setMarketItems([])
      }

      setLoading(false)
    }

    loadData()

    const handleProfileUpdate = () => setProfile(getUserProfile())
    window.addEventListener('user-profile-updated', handleProfileUpdate)
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate)
    }
  }, [])

  const instInitials = profile.institution
    ? profile.institution
        .split(' ')
        .filter((w) => w.length > 0)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'EU'

  // Next lecture from timetable or first course
  const nextLectureSlot = timetableSlots.find((s) => !s.is_personal) || timetableSlots[0]

  return (
    <>
      <PageHeader
        title={`Good morning, ${profile.name ? profile.name.split(' ')[0] : 'Student'}`}
        subtitle="Here's what's happening with your academics today."
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              href="/dashboard/insights"
              className="secondary-button"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <GraduationCap style={{ width: '15px' }} /> CGPA Insights
            </Link>
            <Link href="/dashboard/calendar" className="primary-button">
              <CalendarDays /> View calendar
            </Link>
          </div>
        }
      />

      {/* Course Configuration Alert */}
      {mounted && !loading && enrolledCourses.length === 0 && (
        <div className="course-config-jumbotron">
          <div className="jumbotron-content">
            <div className="jumbotron-text">
              <div className="jumbotron-badge">
                <span className="pulsing-dot" /> Action Required
              </div>
              <h2>
                Configure your courses for {profile.level} &bull; {profile.semester}
              </h2>
              <p>
                Enroll your registered courses to activate your lecture timetable, announcements, and academic records.
              </p>
            </div>

            <div className="jumbotron-actions">
              <Link
                href="/dashboard/courses"
                className="primary-button jumbotron-cta"
              >
                <BookOpen style={{ width: '15px' }} />
                <span>Configure Courses</span>
                <ChevronRight style={{ width: '15px' }} />
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="profile-strip">
        <div className="institution-logo">{instInitials}</div>
        <div>
          <strong>{profile.institution || 'Example University'}</strong>
          <span>
            {profile.department} &bull; {profile.level} &bull; {profile.session}
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/dashboard/insights" className="text-button">
            Tertiary insights <ChevronRight />
          </Link>
          <Link href="/dashboard/settings" className="text-button">
            Edit profile <ChevronRight />
          </Link>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon purple">
            <BookOpen />
          </div>
          <div>
            <span>Enrolled courses</span>
            <strong>{mounted ? enrolledCourses.length : 0}</strong>
            <small className={enrolledCourses.length === 0 ? 'warning-text' : ''}>
              {enrolledCourses.length === 0 ? 'Configuration pending' : 'All courses active'}
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <CalendarDays />
          </div>
          <div>
            <span>Upcoming timetable slots</span>
            <strong>{timetableSlots.length}</strong>
            <small>{timetableSlots.length === 0 ? 'No lectures today' : `${timetableSlots.length} items scheduled`}</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <FileText />
          </div>
          <div>
            <span>Announcements</span>
            <strong>{Array.isArray(announcementsList) ? announcementsList.length : 0}</strong>
            <small className={Array.isArray(announcementsList) && announcementsList.some((a) => !a.is_read) ? 'warning-text' : ''}>
              {Array.isArray(announcementsList) ? announcementsList.filter((a) => !a.is_read).length : 0} unread updates
            </small>
          </div>
        </div>

        <Link href="/dashboard/insights" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-icon emerald" style={{ background: '#ecfdf5', color: '#059669' }}>
            <GraduationCap />
          </div>
          <div>
            <span>Target GPA</span>
            <strong>
              {profile.targetCGPA || 4.52}{' '}
              <small style={{ fontSize: '11px', color: '#64748b' }}>/ 5.0</small>
            </strong>
            <small style={{ color: '#059669' }}>First Class Target</small>
          </div>
        </Link>
      </div>

      {/* Row 1: Announcements + Next Lecture */}
      <div className="dashboard-grid">
        <Panel>
          <div className="panel-header">
            <div>
              <h2>Important announcements</h2>
              <p>Stay up to date with your courses</p>
            </div>
            <Link href="/dashboard/announcements" className="text-button">
              View all <ChevronRight />
            </Link>
          </div>
          <div className="announcement-list">
            {!Array.isArray(announcementsList) || announcementsList.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                No announcements broadcasted yet.
              </div>
            ) : (
              announcementsList.slice(0, 3).map((item) => (
                <article
                  className={`announcement ${item.is_urgent ? 'urgent' : ''}`}
                  key={item.id}
                >
                  <div className="announcement-icon">
                    <Bell />
                  </div>
                  <div className="announcement-copy">
                    <div className="announcement-meta">
                      <Pill>{item.course_code}</Pill>
                      {item.is_urgent && <Pill tone="urgent-pill">Urgent</Pill>}
                      <span className="time">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                    <span className="author">{item.author_name}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </Panel>

        <Panel className="lecture-panel-card">
          <div className="panel-header">
            <div>
              <h2>Next lecture</h2>
              <p>Your upcoming class</p>
            </div>
            <Link
              href="/dashboard/calendar"
              className="round-arrow"
              aria-label="View timetable"
            >
              <ChevronRight />
            </Link>
          </div>

          {nextLectureSlot ? (
            <div className="lecture-card-body">
              <div className="lecture-date">
                <span>{nextLectureSlot.date.split(' ')[0] || 'CLASS'}</span>
                <strong>{nextLectureSlot.date.split(' ')[1] || '01'}</strong>
                <small>OCT</small>
              </div>
              <div className="lecture-info">
                <Pill>{nextLectureSlot.course_code || 'LECTURE'}</Pill>
                <h3>{nextLectureSlot.title}</h3>
                <div className="lecture-detail-row">
                  <Clock3 /> {nextLectureSlot.time}
                </div>
                <div className="lecture-detail-row">
                  <MapPin /> {nextLectureSlot.location || 'Lecture Hall'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              No upcoming lecture scheduled.
            </div>
          )}

          <div className="lecture-footer">
            <span>{nextLectureSlot ? nextLectureSlot.course_code : 'Timetable clear'}</span>
            <Link href="/dashboard/calendar" className="text-button">
              View full timetable
            </Link>
          </div>
        </Panel>
      </div>

      {/* Row 2: Upcoming Schedule + My Courses + Marketplace (3 equal columns) */}
      <div className="lower-grid">
        <Panel>
          <div className="panel-header">
            <div>
              <h2>Upcoming timetable</h2>
              <p>Keep your momentum going</p>
            </div>
            <Link href="/dashboard/calendar" className="text-button">
              See all <ChevronRight />
            </Link>
          </div>
          <div className="deadline-list">
            {timetableSlots.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                No events on your calendar yet.
              </div>
            ) : (
              timetableSlots.slice(0, 3).map((slot) => (
                <div className="deadline" key={slot.id}>
                  <div className="deadline-date">
                    <strong>{slot.date.split(' ')[1] || '12'}</strong>
                    <span>{slot.date.split(' ')[0] || 'DAY'}</span>
                  </div>
                  <div className="deadline-info">
                    <Pill>{slot.course_code}</Pill>
                    <h3>{slot.title}</h3>
                    <p>
                      <Clock3 /> {slot.time}
                    </p>
                  </div>
                  <span className="status soon">{slot.location || 'Campus'}</span>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel>
          <div className="panel-header">
            <div>
              <h2>My courses</h2>
              <p>
                {enrolledCourses.length > 0
                  ? `${enrolledCourses.length} active courses`
                  : 'Courses pending'}
              </p>
            </div>
            <Link href="/dashboard/courses" className="text-button">
              {enrolledCourses.length > 0 ? 'View all' : 'Configure'} <ChevronRight />
            </Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <BookOpen style={{ width: '22px', height: '22px' }} />
              </div>
              <strong style={{ display: 'block', fontSize: '13px', marginBottom: '6px' }}>
                No courses configured yet
              </strong>
              <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                Enroll courses for {profile.level} &bull; {profile.semester} to activate your lecture timetable.
              </p>
              <Link
                href="/dashboard/courses"
                className="primary-button"
                style={{ fontSize: '12px', padding: '9px 16px' }}
              >
                Configure {profile.level} Courses
              </Link>
            </div>
          ) : (
            <div className="course-list">
              {enrolledCourses.map((c) => (
                <div className="course-row" key={c.id || c.code}>
                  <span
                    className="course-avatar"
                    style={{ background: c.color || '#4338ca', color: '#fff' }}
                  >
                    {c.code.split(' ')[1] || c.code.slice(0, 3)}
                  </span>
                  <div className="course-details">
                    <strong>{c.code}</strong>
                    <span>{c.name}</span>
                  </div>
                  <div className="course-meta">
                    <span className="course-next">
                      <CalendarDays /> {c.next_lecture || 'Check timetable'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel className="marketplace-preview-panel">
          <div className="panel-header">
            <div>
              <h2>Student marketplace</h2>
              <p>Campus community finds</p>
            </div>
            <Link href="/dashboard/marketplace" className="text-button">
              Browse all <ChevronRight />
            </Link>
          </div>
          <div className="marketplace-preview-list">
            {marketItems.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                No marketplace listings yet.
              </div>
            ) : (
              marketItems.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href="/dashboard/marketplace"
                  className="marketplace-preview-item"
                >
                  <span className="market-preview-icon">
                    <Store />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.tag} · {item.price}</small>
                  </div>
                  <ChevronRight />
                </Link>
              ))
            )}
          </div>
        </Panel>
      </div>
    </>
  )
}
