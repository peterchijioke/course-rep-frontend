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
import { Skeleton } from '@/components/ui/skeleton'
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <span>Enrolled courses</span>
            {loading ? (
              <div style={{ marginTop: '7px' }}>
                <Skeleton style={{ height: '26px', width: '38px', marginBottom: '6px' }} />
                <Skeleton style={{ height: '11px', width: '85px' }} />
              </div>
            ) : (
              <>
                <strong>{mounted ? enrolledCourses.length : 0}</strong>
                <small className={enrolledCourses.length === 0 ? 'warning-text' : ''}>
                  {enrolledCourses.length === 0 ? 'Configuration pending' : 'All courses active'}
                </small>
              </>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <CalendarDays />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span>Upcoming timetable slots</span>
            {loading ? (
              <div style={{ marginTop: '7px' }}>
                <Skeleton style={{ height: '26px', width: '38px', marginBottom: '6px' }} />
                <Skeleton style={{ height: '11px', width: '95px' }} />
              </div>
            ) : (
              <>
                <strong>{timetableSlots.length}</strong>
                <small>{timetableSlots.length === 0 ? 'No lectures today' : `${timetableSlots.length} items scheduled`}</small>
              </>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <FileText />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span>Announcements</span>
            {loading ? (
              <div style={{ marginTop: '7px' }}>
                <Skeleton style={{ height: '26px', width: '38px', marginBottom: '6px' }} />
                <Skeleton style={{ height: '11px', width: '85px' }} />
              </div>
            ) : (
              <>
                <strong>{Array.isArray(announcementsList) ? announcementsList.length : 0}</strong>
                <small className={Array.isArray(announcementsList) && announcementsList.some((a) => !a.is_read) ? 'warning-text' : ''}>
                  {Array.isArray(announcementsList) ? announcementsList.filter((a) => !a.is_read).length : 0} unread updates
                </small>
              </>
            )}
          </div>
        </div>

        <Link href="/dashboard/insights" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-icon emerald" style={{ background: '#ecfdf5', color: '#059669' }}>
            <GraduationCap />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span>Target GPA</span>
            {loading ? (
              <div style={{ marginTop: '7px' }}>
                <Skeleton style={{ height: '26px', width: '48px', marginBottom: '6px' }} />
                <Skeleton style={{ height: '11px', width: '100px' }} />
              </div>
            ) : (
              <>
                <strong>
                  {profile.targetCGPA || 4.52}{' '}
                  <small style={{ fontSize: '11px', color: '#64748b' }}>/ 5.0</small>
                </strong>
                <small style={{ color: '#059669' }}>First Class Target</small>
              </>
            )}
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
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '6px 0' }}>
                {[1, 2].map((i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', borderTop: i > 1 ? '1px solid var(--border)' : 'none', paddingTop: i > 1 ? '14px' : '0' }}>
                    <Skeleton style={{ width: '30px', height: '30px', borderRadius: '7px', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <Skeleton style={{ width: '60px', height: '18px', borderRadius: '12px' }} />
                        <Skeleton style={{ width: '45px', height: '18px', borderRadius: '12px' }} />
                      </div>
                      <Skeleton style={{ width: '75%', height: '15px', marginBottom: '6px' }} />
                      <Skeleton style={{ width: '90%', height: '12px', marginBottom: '6px' }} />
                      <Skeleton style={{ width: '35%', height: '10px' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : !Array.isArray(announcementsList) || announcementsList.length === 0 ? (
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

          {loading ? (
            <div className="lecture-card-body" style={{ flex: 1, display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <Skeleton style={{ width: '58px', height: '68px', borderRadius: '8px', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Skeleton style={{ width: '70px', height: '18px', borderRadius: '12px', marginBottom: '10px' }} />
                <Skeleton style={{ width: '80%', height: '16px', marginBottom: '10px' }} />
                <Skeleton style={{ width: '120px', height: '13px', marginBottom: '8px' }} />
                <Skeleton style={{ width: '100px', height: '13px' }} />
              </div>
            </div>
          ) : nextLectureSlot ? (
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
            <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              No upcoming lecture scheduled.
            </div>
          )}

          <div className="lecture-footer">
            <span>{loading ? <Skeleton style={{ width: '60px', height: '12px' }} /> : nextLectureSlot ? nextLectureSlot.course_code : 'Timetable clear'}</span>
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
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '6px 0' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', borderTop: i > 1 ? '1px solid var(--border)' : 'none', paddingTop: i > 1 ? '12px' : '0' }}>
                    <Skeleton style={{ width: '38px', height: '42px', borderRadius: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Skeleton style={{ width: '60px', height: '14px', borderRadius: '10px', marginBottom: '6px' }} />
                      <Skeleton style={{ width: '75%', height: '13px', marginBottom: '4px' }} />
                      <Skeleton style={{ width: '90px', height: '10px' }} />
                    </div>
                    <Skeleton style={{ width: '50px', height: '18px', borderRadius: '6px' }} />
                  </div>
                ))}
              </div>
            ) : timetableSlots.length === 0 ? (
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
                {loading
                  ? 'Loading courses...'
                  : enrolledCourses.length > 0
                  ? `${enrolledCourses.length} active courses`
                  : 'Courses pending'}
              </p>
            </div>
            <Link href="/dashboard/courses" className="text-button">
              {enrolledCourses.length > 0 ? 'View all' : 'Configure'} <ChevronRight />
            </Link>
          </div>

          {loading ? (
            <div className="course-list">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 0', borderTop: i > 1 ? '1px solid var(--border)' : 'none' }}>
                  <Skeleton style={{ width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Skeleton style={{ width: '65px', height: '14px', marginBottom: '5px' }} />
                    <Skeleton style={{ width: '80%', height: '12px' }} />
                  </div>
                  <Skeleton style={{ width: '100px', height: '20px', borderRadius: '6px' }} />
                </div>
              ))}
            </div>
          ) : enrolledCourses.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 14px', borderRadius: '9px', border: '1px solid var(--border)' }}>
                    <Skeleton style={{ width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Skeleton style={{ width: '70%', height: '13px', marginBottom: '5px' }} />
                      <Skeleton style={{ width: '45%', height: '10px' }} />
                    </div>
                    <Skeleton style={{ width: '14px', height: '14px', borderRadius: '50%' }} />
                  </div>
                ))}
              </div>
            ) : marketItems.length === 0 ? (
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
