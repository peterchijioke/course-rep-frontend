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
import { announcements, upcomingDeadlines, getEnrolledCourses, type Course } from '@/lib/data'
import { defaultUserProfile, getUserProfile, type UserProfile } from '@/lib/user-profile'

export default function DashboardOverviewPage() {
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile)
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setProfile(getUserProfile())
    setEnrolledCourses(getEnrolledCourses())

    const handleProfileUpdate = () => setProfile(getUserProfile())
    const handleCoursesUpdate = () => setEnrolledCourses(getEnrolledCourses())

    window.addEventListener('user-profile-updated', handleProfileUpdate)
    window.addEventListener('enrolled-courses-updated', handleCoursesUpdate)
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate)
      window.removeEventListener('enrolled-courses-updated', handleCoursesUpdate)
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
      {mounted && enrolledCourses.length === 0 && (
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
            <span>Upcoming lectures</span>
            <strong>{enrolledCourses.length === 0 ? 0 : 6}</strong>
            <small>{enrolledCourses.length === 0 ? 'Enroll courses to activate' : 'Next one in 2 days'}</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <FileText />
          </div>
          <div>
            <span>Pending assessments</span>
            <strong>{enrolledCourses.length === 0 ? 0 : 3}</strong>
            <small className="warning-text">
              {enrolledCourses.length === 0 ? 'No assessments yet' : '1 due this week'}
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
            {announcements.map(([course, title, body, time, author, urgent]) => (
              <article
                className={`announcement ${urgent ? 'urgent' : ''}`}
                key={String(title)}
              >
                <div className="announcement-icon">
                  <Bell />
                </div>
                <div className="announcement-copy">
                  <div className="announcement-meta">
                    <Pill>{course}</Pill>
                    {urgent && <Pill tone="urgent-pill">Urgent</Pill>}
                    <span className="time">{time}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                  <span className="author">{author}</span>
                </div>
              </article>
            ))}
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

          <div className="lecture-card-body">
            <div className="lecture-date">
              <span>MON</span>
              <strong>12</strong>
              <small>OCT</small>
            </div>
            <div className="lecture-info">
              <Pill>CSC 401</Pill>
              <h3>Software Engineering</h3>
              <div className="lecture-detail-row">
                <Clock3 /> 10:00 AM – 12:00 PM
              </div>
              <div className="lecture-detail-row">
                <MapPin /> Lecture Hall B
              </div>
            </div>
          </div>

          <div className="lecture-footer">
            <span>Dr. Adaeze Okafor</span>
            <Link href="/dashboard/calendar" className="text-button">
              Add to calendar
            </Link>
          </div>
        </Panel>
      </div>

      {/* Row 2: Upcoming Deadlines + My Courses + Marketplace (3 equal columns) */}
      <div className="lower-grid">
        <Panel>
          <div className="panel-header">
            <div>
              <h2>Upcoming deadlines</h2>
              <p>Keep your momentum going</p>
            </div>
            <Link href="/dashboard/calendar" className="text-button">
              See all <ChevronRight />
            </Link>
          </div>
          <div className="deadline-list">
            {upcomingDeadlines.map((d) => (
              <div className="deadline" key={d.title}>
                <div className="deadline-date">
                  <strong>{d.day}</strong>
                  <span>{d.month}</span>
                </div>
                <div className="deadline-info">
                  <Pill>{d.course}</Pill>
                  <h3>{d.title}</h3>
                  <p>
                    <Clock3 /> {d.due}
                  </p>
                </div>
                <span className="status soon">{d.timeLeft}</span>
              </div>
            ))}
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
                <div className="course-row" key={c.code}>
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
                    {c.unread > 0 && <span className="unread">{c.unread}</span>}
                    <span className="course-next">
                      <CalendarDays /> {c.next}
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
            <Link
              href="/dashboard/marketplace"
              className="marketplace-preview-item"
            >
              <span className="market-preview-icon">
                <BookOpen />
              </span>
              <div>
                <strong>CSC 403 past questions</strong>
                <small>Study materials · ₦2,500</small>
              </div>
              <ChevronRight />
            </Link>
            <Link
              href="/dashboard/marketplace"
              className="marketplace-preview-item"
            >
              <span className="market-preview-icon green">
                <Store />
              </span>
              <div>
                <strong>Scientific calculator</strong>
                <small>Electronics · ₦8,000</small>
              </div>
              <ChevronRight />
            </Link>
          </div>
        </Panel>
      </div>
    </>
  )
}
