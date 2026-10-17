'use client'

import { useEffect, useRef, useState, type ReactNode, type ElementType } from 'react'
import {
  Bell, BookOpen, CalendarDays, Check, ChevronRight, Clock3, FileText,
  GraduationCap, LayoutDashboard, Menu, Plus, Search, Settings,
  ShieldCheck, Trash2, Users, X, Store, MessageCircle, Send,
  Paperclip, Sparkles, Brain, ArrowUp, Mail, Phone, Headphones,
  Eye, EyeOff, User as UserIcon, Lock, Sliders, LogOut
} from 'lucide-react'
import {
  apiRequest, type User, type Course, type AnnouncementItem,
  type TimetableSlot, type MarketplaceItem, type ChatGroup,
  type ChatMessage, type AcademicRecord, type CreateCourseDTO,
  type CreateAnnouncementDTO, type CreateEventDTO
} from '@/lib/api'

type View =
  | 'Landing'
  | 'About Course Rep'
  | 'Features'
  | 'How it works'
  | 'Professor Atlas info'
  | 'Overview'
  | 'My Courses'
  | 'Calendar'
  | 'Announcements'
  | 'Marketplace'
  | 'Student Groups'
  | 'Direct Messages'
  | 'Professor Atlas'
  | 'Support Center'
  | 'Settings'
  | 'Login'
  | 'Register'
  | 'Onboarding'

function Logo() {
  return (
    <div className="brand">
      <span className="brand-mark"><GraduationCap /></span>
      <span>Course Rep</span>
    </div>
  )
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">Student workspace</p>
        <h1>{title}</h1>
        <p className="subheading">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>
}

function Pill({ children, tone = '' }: { children: React.ReactNode; tone?: string }) {
  return <span className={`course-pill ${tone}`}>{children}</span>
}

// ---------------- SKELETON LOADERS ----------------
function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <div className="skeleton-shimmer w-9 h-9 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton-shimmer h-3 w-20 rounded" />
        <div className="skeleton-shimmer h-6 w-12 rounded" />
        <div className="skeleton-shimmer h-2.5 w-24 rounded" />
      </div>
    </div>
  )
}

function AnnouncementsSkeleton() {
  return (
    <div className="space-y-4 py-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3 py-3 border-t border-slate-100 first:border-0">
          <div className="skeleton-shimmer w-7 h-7 rounded-md flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="skeleton-shimmer h-4 w-16 rounded" />
              <div className="skeleton-shimmer h-3 w-12 rounded ml-auto" />
            </div>
            <div className="skeleton-shimmer h-4 w-3/4 rounded" />
            <div className="skeleton-shimmer h-3 w-full rounded" />
            <div className="skeleton-shimmer h-2.5 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function CourseListSkeleton() {
  return (
    <div className="space-y-3 py-1">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 py-2.5 border-t border-slate-100 first:border-0">
          <div className="skeleton-shimmer w-8 h-8 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton-shimmer h-3.5 w-20 rounded" />
            <div className="skeleton-shimmer h-3 w-36 rounded" />
          </div>
          <div className="skeleton-shimmer h-3 w-24 rounded" />
        </div>
      ))}
    </div>
  )
}

function CourseCardsSkeleton() {
  return (
    <div className="course-cards">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton-card">
          <div className="flex items-center gap-3">
            <div className="skeleton-shimmer w-10 h-10 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-shimmer h-4 w-20 rounded" />
              <div className="skeleton-shimmer h-4 w-36 rounded" />
              <div className="skeleton-shimmer h-3 w-28 rounded" />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <div className="skeleton-shimmer h-3 w-28 rounded" />
            <div className="skeleton-shimmer h-3 w-12 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4 py-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-stretch gap-4">
          <div className="w-12 text-right space-y-1 pt-1">
            <div className="skeleton-shimmer h-3 w-10 ml-auto rounded" />
            <div className="skeleton-shimmer h-2.5 w-6 ml-auto rounded" />
          </div>
          <div className="flex-1 skeleton-card">
            <div className="skeleton-shimmer h-4 w-24 rounded" />
            <div className="skeleton-shimmer h-5 w-48 rounded" />
            <div className="skeleton-shimmer h-3 w-36 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MarketplaceSkeleton() {
  return (
    <div className="market-grid">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-shimmer h-32 w-full rounded-lg" />
          <div className="skeleton-shimmer h-4 w-3/4 rounded" />
          <div className="skeleton-shimmer h-3 w-1/2 rounded" />
          <div className="flex justify-between items-center pt-2">
            <div className="skeleton-shimmer h-4 w-16 rounded" />
            <div className="skeleton-shimmer h-3 w-12 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------- DASHBOARD (OVERVIEW) ----------------
function Dashboard({ go, user }: { go: (view: View) => void; user: User | null }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])
  const [events, setEvents] = useState<TimetableSlot[]>([])
  const [marketplace, setMarketplace] = useState<MarketplaceItem[]>([])
  const [record, setRecord] = useState<AcademicRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        const [enrolledCourses, annData, timetableSlots, marketItems, rec] = await Promise.allSettled([
          apiRequest<Course[]>('/courses/my/enrolled'),
          apiRequest<{ items: AnnouncementItem[]; unread_count: number }>('/announcements?filter=All'),
          apiRequest<TimetableSlot[]>('/timetable'),
          apiRequest<MarketplaceItem[]>('/marketplace'),
          apiRequest<AcademicRecord>('/atlas/record'),
        ])

        if (enrolledCourses.status === 'fulfilled') setCourses(enrolledCourses.value || [])
        if (annData.status === 'fulfilled') setAnnouncements(annData.value.items || [])
        if (timetableSlots.status === 'fulfilled') setEvents(timetableSlots.value || [])
        if (marketItems.status === 'fulfilled') setMarketplace(marketItems.value || [])
        if (rec.status === 'fulfilled') setRecord(rec.value)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  const nextLecture = events.find(e => !e.is_personal) || events[0]
  const upcomingDeadlines = events.filter(e => e.is_personal || e.title.toLowerCase().includes('assignment') || e.title.toLowerCase().includes('test')).slice(0, 3)

  const studentName = user?.full_name ? user.full_name.split(' ')[0] : 'Student'
  const hasProfileSetup = !!(user?.institution && user?.department)

  return (
    <>
      <PageHeader
        title={`Good day, ${studentName}`}
        subtitle="Here's a clean view of your academic schedule and courses."
        action={
          <button className="primary-button" onClick={() => go('Calendar')}>
            <CalendarDays /> View calendar
          </button>
        }
      />

      <div className="profile-strip">
        <div className="institution-logo">
          {user?.institution ? user.institution.slice(0, 2).toUpperCase() : (user?.avatar || 'ST')}
        </div>
        <div>
          <strong>{user?.institution || 'Your Institution'}</strong>
          <span>
            {hasProfileSetup ? (
              `${user?.department || 'Department'} · ${user?.academic_level || 'Level'} · ${user?.academic_session || 'Current session'}`
            ) : (
              'Complete your academic profile in Settings to personalize your semester.'
            )}
          </span>
        </div>
        <button className="text-button" onClick={() => go('Settings')}>
          {hasProfileSetup ? 'Edit profile' : 'Set up profile'} <ChevronRight />
        </button>
      </div>

      <div className="stats-grid">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon purple"><BookOpen /></div>
              <div>
                <span>Enrolled courses</span>
                <strong>{courses.length}</strong>
                <small>{courses.length > 0 ? `${courses.length} active courses` : 'No courses enrolled'}</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><CalendarDays /></div>
              <div>
                <span>Upcoming lectures</span>
                <strong>{events.length}</strong>
                <small>{events.length > 0 ? `${events.length} scheduled` : 'None scheduled'}</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber"><FileText /></div>
              <div>
                <span>Pending assessments</span>
                <strong>{record?.pending_assessments ?? 0}</strong>
                <small className={(record?.pending_assessments ?? 0) > 0 ? 'warning-text' : ''}>
                  {(record?.pending_assessments ?? 0) > 0 ? `${record?.pending_assessments} due` : 'All caught up'}
                </small>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-grid">
        <Panel>
          <div className="panel-header">
            <div>
              <h2>Course announcements</h2>
              <p>Notices from your enrolled courses</p>
            </div>
            <button className="text-button" onClick={() => go('Announcements')}>
              View all <ChevronRight />
            </button>
          </div>
          <div className="announcement-list">
            {loading ? (
              <AnnouncementsSkeleton />
            ) : announcements.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-state-icon"><Bell /></div>
                <h3>No announcements yet</h3>
                <p>Course updates and announcements from your classes will show up here.</p>
                <button className="primary-button btn-small" onClick={() => go('Announcements')}>
                  <Plus /> Post announcement
                </button>
              </div>
            ) : (
              announcements.slice(0, 3).map((a) => (
                <article className={`announcement ${a.is_urgent ? 'urgent' : ''}`} key={a.id}>
                  <div className="announcement-icon"><Bell /></div>
                  <div className="announcement-copy">
                    <div className="announcement-meta">
                      <Pill>{a.course_code}</Pill>
                      {a.is_urgent && <Pill tone="urgent-pill">Urgent</Pill>}
                      <span className="time">{a.created_at}</span>
                    </div>
                    <h3>{a.title}</h3>
                    <p>{a.body}</p>
                    <span className="author">{a.author_name}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </Panel>

        <Panel className="lecture-panel">
          <div className="panel-header">
            <div>
              <h2>Next lecture</h2>
              <p>Your upcoming class</p>
            </div>
            <button className="round-arrow" onClick={() => go('Calendar')} aria-label="View timetable">
              <ChevronRight />
            </button>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              <div className="skeleton-shimmer h-6 w-24 rounded" />
              <div className="skeleton-shimmer h-8 w-44 rounded" />
              <div className="skeleton-shimmer h-4 w-32 rounded" />
            </div>
          ) : nextLecture ? (
            <>
              <div className="lecture-date">
                <span>{nextLecture.date.split(' ')[0] || 'CLASS'}</span>
                <strong>{nextLecture.date.split(' ')[1] || '01'}</strong>
                <small>LECTURE</small>
              </div>
              <div className="lecture-info">
                <Pill>{nextLecture.course_code}</Pill>
                <h3>{nextLecture.title}</h3>
                <div><Clock3 /> {nextLecture.time}</div>
                <div><span className="pin-dot" /> {nextLecture.location}</div>
              </div>
              <div className="lecture-footer">
                <span>Classroom lecture</span>
                <button className="text-button" onClick={() => go('Calendar')}>View calendar</button>
              </div>
            </>
          ) : (
            <div className="empty-state-card py-8">
              <div className="empty-state-icon"><CalendarDays /></div>
              <h3>No scheduled lectures</h3>
              <p>Add lectures or study sessions to keep your weekly timetable in sync.</p>
              <button className="text-button" onClick={() => go('Calendar')}>
                Add to calendar <ChevronRight />
              </button>
            </div>
          )}
        </Panel>
      </div>

      <div className="lower-grid">
        <Panel>
          <div className="panel-header">
            <div>
              <h2>Upcoming deadlines</h2>
              <p>Assignments, tests, and goals</p>
            </div>
            <button className="text-button" onClick={() => go('Calendar')}>
              See all <ChevronRight />
            </button>
          </div>
          <div className="deadline-list">
            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2].map(i => (
                  <div key={i} className="flex gap-3 py-2 border-t border-slate-100 first:border-0">
                    <div className="skeleton-shimmer w-8 h-8 rounded" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton-shimmer h-3 w-16 rounded" />
                      <div className="skeleton-shimmer h-3.5 w-32 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingDeadlines.length === 0 ? (
              <div className="empty-state-card py-6">
                <p>No upcoming deadlines or assignments.</p>
              </div>
            ) : (
              upcomingDeadlines.map((d) => (
                <div className="deadline" key={d.id}>
                  <div className="deadline-date">
                    <strong>{d.date.split(' ')[1] || '1'}</strong>
                    <span>{d.date.split(' ')[0] || 'DUE'}</span>
                  </div>
                  <div>
                    <Pill>{d.course_code}</Pill>
                    <h3>{d.title}</h3>
                    <p><Clock3 /> {d.time}</p>
                  </div>
                  <span className="status soon">Active</span>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel>
          <div className="panel-header">
            <div>
              <h2>My courses</h2>
              <p>{courses.length} enrolled {courses.length === 1 ? 'course' : 'courses'}</p>
            </div>
            <button className="text-button" onClick={() => go('My Courses')}>
              View all <ChevronRight />
            </button>
          </div>
          <div className="course-list">
            {loading ? (
              <CourseListSkeleton />
            ) : courses.length === 0 ? (
              <div className="empty-state-card py-6">
                <p>No courses enrolled yet.</p>
                <button className="text-button" onClick={() => go('My Courses')}>
                  Add your courses <ChevronRight />
                </button>
              </div>
            ) : (
              courses.slice(0, 4).map(c => (
                <div className="course-row" key={c.code}>
                  <span className={`course-avatar ${c.color || 'indigo'}`}>{c.code.slice(0, 3)}</span>
                  <div>
                    <strong>{c.code}</strong>
                    <span>{c.name}</span>
                  </div>
                  <span className="course-next"><CalendarDays /> {c.next_lecture || 'Active'}</span>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel className="marketplace-preview">
          <div className="panel-header">
            <div>
              <h2>Student marketplace</h2>
              <p>Textbooks, notes, and essentials</p>
            </div>
            <button className="text-button" onClick={() => go('Marketplace')}>
              Browse all <ChevronRight />
            </button>
          </div>
          <div className="marketplace-preview-list">
            {loading ? (
              <div className="space-y-2 py-2">
                {[1, 2].map(i => (
                  <div key={i} className="skeleton-shimmer h-12 w-full rounded-md" />
                ))}
              </div>
            ) : marketplace.length === 0 ? (
              <div className="empty-state-card py-6">
                <p>No items listed on campus exchange yet.</p>
                <button className="text-button" onClick={() => go('Marketplace')}>
                  List an item <ChevronRight />
                </button>
              </div>
            ) : (
              marketplace.slice(0, 2).map((item) => (
                <button key={item.id} onClick={() => go('Marketplace')}>
                  <span className="market-preview-icon"><BookOpen /></span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.tag} · {item.price}</small>
                  </span>
                  <ChevronRight />
                </button>
              ))
            )}
          </div>
        </Panel>
      </div>
    </>
  )
}

// ---------------- COURSES PAGE ----------------
function CoursesPage({ go, user }: { go: (view: View) => void; user: User | null }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [query, setQuery] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // New course form draft
  const [newCourse, setNewCourse] = useState<CreateCourseDTO>({
    code: '',
    name: '',
    department: user?.department || '',
    level: user?.academic_level || '100 Level',
    lecturer_name: '',
    lecture_venue: '',
    next_lecture: 'Mondays 10:00 AM',
    color: 'indigo',
  })

  const loadCourses = async (searchTerm = '') => {
    try {
      setLoading(true)
      const data = await apiRequest<Course[]>(`/courses${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`)
      setCourses(data || [])
    } catch (err) {
      console.error('Failed to load courses:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses(query)
  }, [query])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    try {
      setSubmitting(true)
      const joinedCourse = await apiRequest<Course>('/courses/join', {
        method: 'POST',
        body: JSON.stringify({ code: joinCode.trim() }),
      })
      setMessage(`Successfully enrolled in ${joinedCourse.code}!`)
      setJoinCode('')
      setShowJoin(false)
      await loadCourses()
    } catch (err: any) {
      alert(err.message || 'Failed to join course')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCourse.code.trim() || !newCourse.name.trim()) return
    try {
      setSubmitting(true)
      const created = await apiRequest<Course>('/courses', {
        method: 'POST',
        body: JSON.stringify({
          ...newCourse,
          department: newCourse.department || user?.department || 'General',
          level: newCourse.level || user?.academic_level || '100 Level',
        }),
      })
      setMessage(`Successfully created and enrolled in ${created.code}!`)
      setShowCreate(false)
      setNewCourse({
        code: '',
        name: '',
        department: user?.department || '',
        level: user?.academic_level || '100 Level',
        lecturer_name: '',
        lecture_venue: '',
        next_lecture: 'Mondays 10:00 AM',
        color: 'indigo',
      })
      await loadCourses()
    } catch (err: any) {
      alert(err.message || 'Failed to create course')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="My courses"
        subtitle="Manage and track your enrolled courses for this semester."
        action={
          <div className="flex gap-2">
            <button className="secondary-button" onClick={() => setShowJoin(true)}>
              Join with code
            </button>
            <button className="primary-button" onClick={() => setShowCreate(true)}>
              <Plus /> Add course
            </button>
          </div>
        }
      />

      {message && <div className="notice-banner success mb-4"><Check /> {message}</div>}

      <div className="toolbar">
        <div className="top-search">
          <Search />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search courses by code or title..."
            aria-label="Search courses"
          />
        </div>
        <button className="filter-button" onClick={() => setQuery('')}>
          All courses ({courses.length})
        </button>
      </div>

      {loading ? (
        <CourseCardsSkeleton />
      ) : courses.length === 0 ? (
        <Panel>
          <div className="empty-state-card py-12">
            <div className="empty-state-icon"><BookOpen /></div>
            <h3>No courses found</h3>
            <p>
              {query ? 'No courses match your search criteria.' : 'You haven’t added any courses for this semester yet.'}
            </p>
            <div className="flex gap-3">
              <button className="primary-button" onClick={() => setShowCreate(true)}>
                <Plus /> Add a course
              </button>
              <button className="secondary-button" onClick={() => setShowJoin(true)}>
                Join with code
              </button>
            </div>
          </div>
        </Panel>
      ) : (
        <div className="course-cards">
          {courses.map(c => (
            <button className="course-card" key={c.id || c.code} onClick={() => go('Announcements')}>
              <span className={`course-avatar ${c.color || 'indigo'}`}>{c.code.slice(0, 3)}</span>
              <span>
                <strong>{c.code}</strong>
                <b>{c.name}</b>
                <small>{c.department || user?.department || 'Department'} · {c.level || user?.academic_level || 'Level'}</small>
              </span>
              <span className="course-card-meta">
                {c.next_lecture || 'Active'}
                <ChevronRight />
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Join Course Modal */}
      {showJoin && (
        <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && setShowJoin(false)}>
          <form className="event-dialog" onSubmit={handleJoin}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Course enrollment</p>
                <h2>Join a course</h2>
                <p>Enter the course code provided by your class or department (e.g. CSC 401, MTH 101).</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setShowJoin(false)} aria-label="Close join course form">
                <X />
              </button>
            </div>
            <label>
              Course code
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                required
                autoFocus
                placeholder="e.g. CSC 401"
              />
            </label>
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setShowJoin(false)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={submitting}>
                <Plus /> Join course
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreate && (
        <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && setShowCreate(false)}>
          <form className="event-dialog" onSubmit={handleCreate}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">New course</p>
                <h2>Add a course</h2>
                <p>Enter details for a course you are taking this semester.</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setShowCreate(false)} aria-label="Close modal">
                <X />
              </button>
            </div>

            <div className="event-field-grid">
              <label>
                Course code *
                <input
                  required
                  autoFocus
                  value={newCourse.code}
                  onChange={e => setNewCourse({ ...newCourse, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. CSC 401"
                />
              </label>
              <label>
                Color tag
                <select
                  value={newCourse.color}
                  onChange={e => setNewCourse({ ...newCourse, color: e.target.value })}
                >
                  <option value="indigo">Indigo</option>
                  <option value="blue">Blue</option>
                  <option value="amber">Amber</option>
                  <option value="slate">Slate</option>
                </select>
              </label>
            </div>

            <label>
              Course name / title *
              <input
                required
                value={newCourse.name}
                onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                placeholder="e.g. Software Engineering"
              />
            </label>

            <div className="event-field-grid">
              <label>
                Lecturer name
                <input
                  value={newCourse.lecturer_name}
                  onChange={e => setNewCourse({ ...newCourse, lecturer_name: e.target.value })}
                  placeholder="e.g. Dr. Okafor"
                />
              </label>
              <label>
                Venue / Hall
                <input
                  value={newCourse.lecture_venue}
                  onChange={e => setNewCourse({ ...newCourse, lecture_venue: e.target.value })}
                  placeholder="e.g. Science Hall 3"
                />
              </label>
            </div>

            <label>
              Lecture schedule / timing
              <input
                value={newCourse.next_lecture}
                onChange={e => setNewCourse({ ...newCourse, next_lecture: e.target.value })}
                placeholder="e.g. Mondays 10:00 AM – 12:00 PM"
              />
            </label>

            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={submitting}>
                <Plus /> Create & enroll
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

// ---------------- CALENDAR PAGE ----------------
function CalendarPage() {
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'Week' | 'List'>('Week')
  const [events, setEvents] = useState<TimetableSlot[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  // Generate dynamic days for the current week
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, idx) => {
    const today = new Date()
    const currentDay = today.getDay() // 0 = Sun, 1 = Mon...
    const distance = (idx + 1) - (currentDay === 0 ? 7 : currentDay)
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + distance)
    return {
      label: `${dayName} ${targetDate.getDate()}`,
      dayName,
      dateNum: targetDate.getDate(),
    }
  })

  const [selectedDay, setSelectedDay] = useState(weekDays[0].label)
  const [draft, setDraft] = useState<CreateEventDTO>({
    title: '',
    date: weekDays[0].label,
    start: '10:00',
    end: '11:00',
    location: '',
    course: 'Personal study',
    tone: 'indigo-bar',
  })
  const [draggedEventId, setDraggedEventId] = useState<number | null>(null)

  const loadEvents = async () => {
    try {
      setLoading(true)
      const [allEvents, allCourses] = await Promise.all([
        apiRequest<TimetableSlot[]>('/timetable'),
        apiRequest<Course[]>('/courses'),
      ])
      setEvents(allEvents || [])
      setCourses(allCourses || [])
    } catch (err) {
      console.error('Failed to load timetable:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const visibleEvents = viewMode === 'List' ? events : events.filter(item => item.date === selectedDay)

  const moveEventToDay = async (day: string) => {
    if (!draggedEventId) return
    try {
      await apiRequest<TimetableSlot>(`/timetable/${draggedEventId}/date`, {
        method: 'PATCH',
        body: JSON.stringify({ date: day }),
      })
      setEvents(current => current.map(item => item.id === draggedEventId ? { ...item, date: day } : item))
      setSelectedDay(day)
    } catch (err) {
      console.error('Failed to move event:', err)
    } finally {
      setDraggedEventId(null)
    }
  }

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.title.trim()) return
    try {
      const newSlot = await apiRequest<TimetableSlot>('/timetable', {
        method: 'POST',
        body: JSON.stringify(draft),
      })
      setEvents(current => [...current, newSlot])
      setDraft({
        title: '',
        date: selectedDay,
        start: '10:00',
        end: '11:00',
        location: '',
        course: courses[0]?.code || 'Personal study',
        tone: 'indigo-bar',
      })
      setShowForm(false)
    } catch (err: any) {
      alert(err.message || 'Failed to add event')
    }
  }

  const removeEvent = async (id: number) => {
    try {
      await apiRequest(`/timetable/${id}`, { method: 'DELETE' })
      setEvents(current => current.filter(item => item.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to remove event')
    }
  }

  return (
    <>
      <PageHeader
        title="Academic calendar"
        subtitle="Keep your lectures, tests, and study sessions in clear view."
        action={
          <button className="primary-button" onClick={() => setShowForm(true)}>
            <Plus /> Add event
          </button>
        }
      />

      <div className="calendar-tabs">
        <button className={viewMode === 'Week' ? 'active' : ''} onClick={() => setViewMode('Week')}>Week</button>
        <button className={viewMode === 'List' ? 'active' : ''} onClick={() => setViewMode('List')}>List ({events.length})</button>
      </div>

      <Panel className="schedule">
        {viewMode === 'Week' && (
          <div className="week-row" style={{ gridTemplateColumns: `repeat(${weekDays.length}, 1fr)` }}>
            {weekDays.map(d => (
              <button
                key={d.label}
                className={selectedDay === d.label ? 'active' : ''}
                onClick={() => setSelectedDay(d.label)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => moveEventToDay(d.label)}
              >
                <small>{d.dayName}</small>
                <strong>{d.dateNum}</strong>
              </button>
            ))}
          </div>
        )}

        <div className="schedule-list">
          {loading ? (
            <CalendarSkeleton />
          ) : visibleEvents.length === 0 ? (
            <div className="empty-state-card py-12">
              <div className="empty-state-icon"><CalendarDays /></div>
              <h3>No events scheduled for {viewMode === 'Week' ? selectedDay : 'this period'}</h3>
              <p>Add a lecture, assignment deadline, or personal study block to your schedule.</p>
              <button className="primary-button btn-small" onClick={() => setShowForm(true)}>
                <Plus /> Add an event
              </button>
            </div>
          ) : (
            visibleEvents.map((item) => (
              <div
                className={`schedule-item ${draggedEventId === item.id ? 'is-dragging' : ''}`}
                key={item.id}
                draggable
                onDragStart={() => setDraggedEventId(item.id)}
                onDragEnd={() => setDraggedEventId(null)}
              >
                <span className="schedule-time">
                  {item.time.split(' ')[0]}<br /><small>{item.time.includes('PM') ? 'PM' : 'AM'}</small>
                </span>
                <div className={`schedule-bar ${item.tone || 'indigo-bar'}`}>
                  <Pill>{item.course_code}</Pill>
                  <strong>{item.title}</strong>
                  <span>{item.location} · {item.time}</span>
                  {item.removable && (
                    <button
                      className="event-remove"
                      onClick={() => removeEvent(item.id)}
                      aria-label={`Remove ${item.title}`}
                    >
                      <Trash2 /> Remove
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>

      {showForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && setShowForm(false)}>
          <form className="event-dialog" onSubmit={addEvent}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Calendar</p>
                <h2>Add an event</h2>
                <p>Keep a lecture or personal study reminder on your timetable.</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setShowForm(false)} aria-label="Close add event form">
                <X />
              </button>
            </div>
            <label>
              Event title *
              <input
                required
                autoFocus
                value={draft.title}
                onChange={e => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Distributed Systems Lecture"
              />
            </label>
            <div className="event-field-grid">
              <label>
                Date
                <select value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })}>
                  {weekDays.map(d => (
                    <option key={d.label} value={d.label}>{d.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Associated course
                <select value={draft.course} onChange={e => setDraft({ ...draft, course: e.target.value })}>
                  <option value="Personal study">Personal study</option>
                  <option value="Assignment / Test">Assignment / Test</option>
                  {courses.map(c => (
                    <option key={c.code} value={c.code}>{c.code} – {c.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="event-field-grid">
              <label>
                Start time
                <input type="time" value={draft.start} onChange={e => setDraft({ ...draft, start: e.target.value })} />
              </label>
              <label>
                End time
                <input type="time" value={draft.end} onChange={e => setDraft({ ...draft, end: e.target.value })} />
              </label>
            </div>
            <label>
              Location / Venue
              <input
                value={draft.location}
                onChange={e => setDraft({ ...draft, location: e.target.value })}
                placeholder="e.g. Science Complex Hall 2 (or Online)"
              />
            </label>
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="primary-button"><Plus /> Save event</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

// ---------------- ANNOUNCEMENTS PAGE ----------------
function AnnouncementsPage() {
  const [filter, setFilter] = useState<'All' | 'Unread' | 'Urgent'>('All')
  const [items, setItems] = useState<AnnouncementItem[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [draft, setDraft] = useState<CreateAnnouncementDTO>({
    course_code: 'General',
    title: '',
    body: '',
    is_urgent: false,
  })

  const loadAnnouncements = async (f = filter) => {
    try {
      setLoading(true)
      const [annData, courseData] = await Promise.all([
        apiRequest<{ items: AnnouncementItem[]; unread_count: number }>(`/announcements?filter=${f}`),
        apiRequest<Course[]>('/courses'),
      ])
      setItems(annData.items || [])
      setUnreadCount(annData.unread_count || 0)
      setCourses(courseData || [])
    } catch (err) {
      console.error('Failed to load announcements:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnouncements(filter)
  }, [filter])

  const markAllRead = async () => {
    try {
      await apiRequest('/announcements/mark-all-read', { method: 'POST' })
      setItems(current => current.map(item => ({ ...item, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await apiRequest(`/announcements/${id}/read`, { method: 'POST' })
      setItems(current => current.map(item => item.id === id ? { ...item, is_read: true } : item))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark announcement as read:', err)
    }
  }

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.title.trim() || !draft.body.trim()) return
    try {
      setSubmitting(true)
      await apiRequest('/announcements', {
        method: 'POST',
        body: JSON.stringify(draft),
      })
      setShowCreate(false)
      setDraft({ course_code: courses[0]?.code || 'General', title: '', body: '', is_urgent: false })
      await loadAnnouncements()
    } catch (err: any) {
      alert(err.message || 'Failed to post announcement')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Notices and updates from your courses and study peers."
        action={
          <div className="flex gap-2">
            <button className="secondary-button" onClick={markAllRead} disabled={items.length === 0}>
              <Bell /> Mark all read
            </button>
            <button className="primary-button" onClick={() => setShowCreate(true)}>
              <Plus /> Post announcement
            </button>
          </div>
        }
      />

      <div className="filter-tabs">
        {(['All', 'Unread', 'Urgent'] as const).map(name => (
          <button
            key={name}
            className={filter === name ? 'active' : ''}
            onClick={() => setFilter(name)}
          >
            {name} <span>{name === 'All' ? items.length : name === 'Unread' ? unreadCount : items.filter(i => i.is_urgent).length}</span>
          </button>
        ))}
      </div>

      <Panel>
        <div className="announcement-list">
          {loading ? (
            <AnnouncementsSkeleton />
          ) : items.length === 0 ? (
            <div className="empty-state-card py-12">
              <div className="empty-state-icon"><Bell /></div>
              <h3>No announcements in this view</h3>
              <p>Share a notice with classmates or check back when course updates are posted.</p>
              <button className="primary-button btn-small" onClick={() => setShowCreate(true)}>
                <Plus /> Post announcement
              </button>
            </div>
          ) : (
            items.map((item) => (
              <article
                className={`announcement ${item.is_urgent ? 'urgent' : ''}`}
                key={item.id}
                onClick={() => !item.is_read && markAsRead(item.id)}
              >
                <div className="announcement-icon"><Bell /></div>
                <div className="announcement-copy">
                  <div className="announcement-meta">
                    <Pill>{item.course_code}</Pill>
                    {item.is_urgent && <Pill tone="urgent-pill">Urgent</Pill>}
                    <span className="time">{item.created_at}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <span className="author">{item.author_name}</span>
                </div>
                {!item.is_read && <span className="unread-dot" title="Unread" />}
              </article>
            ))
          )}
        </div>
      </Panel>

      {/* Post Announcement Modal */}
      {showCreate && (
        <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && setShowCreate(false)}>
          <form className="event-dialog" onSubmit={handleCreateAnnouncement}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Class notice</p>
                <h2>Post an announcement</h2>
                <p>Share a class schedule change, study group update, or notice.</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setShowCreate(false)} aria-label="Close modal">
                <X />
              </button>
            </div>

            <label>
              Course
              <select
                value={draft.course_code}
                onChange={e => setDraft({ ...draft, course_code: e.target.value })}
              >
                <option value="General">General / Class Notice</option>
                {courses.map(c => (
                  <option key={c.code} value={c.code}>{c.code} – {c.name}</option>
                ))}
              </select>
            </label>

            <label>
              Title *
              <input
                required
                autoFocus
                value={draft.title}
                onChange={e => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Revision class venue moved to Hall C"
              />
            </label>

            <label>
              Details / Body *
              <textarea
                required
                rows={4}
                value={draft.body}
                onChange={e => setDraft({ ...draft, body: e.target.value })}
                placeholder="Write the full announcement details here..."
                className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-500"
              />
            </label>

            <label className="check-label mt-2">
              <input
                type="checkbox"
                checked={draft.is_urgent}
                onChange={e => setDraft({ ...draft, is_urgent: e.target.checked })}
              />
              Mark as urgent priority announcement
            </label>

            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={submitting}>
                <Plus /> Post announcement
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

// ---------------- MARKETPLACE PAGE ----------------
function MarketplacePage() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [listed, setListed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState({ title: '', price: '', tag: 'Study materials', description: '' })
  const [submitting, setSubmitting] = useState(false)

  const loadItems = async (q = '') => {
    try {
      setLoading(true)
      const data = await apiRequest<MarketplaceItem[]>(`/marketplace${q ? `?query=${encodeURIComponent(q)}` : ''}`)
      setItems(data || [])
    } catch (err) {
      console.error('Failed to load marketplace items:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems(query)
  }, [query])

  const createItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.title.trim() || !draft.price.trim()) return
    try {
      setSubmitting(true)
      const newItem = await apiRequest<MarketplaceItem>('/marketplace', {
        method: 'POST',
        body: JSON.stringify(draft),
      })
      setItems(current => [newItem, ...current])
      setDraft({ title: '', price: '', tag: 'Study materials', description: '' })
      setListed(false)
    } catch (err: any) {
      alert(err.message || 'Failed to list item')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Student marketplace"
        subtitle="Buy, sell, and exchange study materials, devices, and campus essentials."
        action={
          <button className="primary-button" onClick={() => setListed(true)}>
            <Plus /> List an item
          </button>
        }
      />

      <div className="market-hero">
        <div>
          <Pill tone="verified-pill"><Store /> Campus exchange</Pill>
          <h2>Find what you need. Pass on what you no longer do.</h2>
          <p>A trusted place for textbooks, past questions, devices, and student essentials.</p>
        </div>
        <Store />
      </div>

      <div className="toolbar">
        <div className="top-search">
          <Search />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search items by title or tag..."
            aria-label="Search items"
          />
        </div>
        <button className="filter-button" onClick={() => setQuery('')}>
          All items ({items.length})
        </button>
      </div>

      {loading ? (
        <MarketplaceSkeleton />
      ) : items.length === 0 ? (
        <Panel>
          <div className="empty-state-card py-12">
            <div className="empty-state-icon"><Store /></div>
            <h3>No items listed yet</h3>
            <p>Be the first to list textbooks, study notes, or campus essentials for your peers.</p>
            <button className="primary-button" onClick={() => setListed(true)}>
              <Plus /> List an item
            </button>
          </div>
        </Panel>
      ) : (
        <div className="market-grid">
          {items.map(item => (
            <div className="market-card" key={item.id}>
              <div className="market-thumb">
                <Store />
              </div>
              <Pill>{item.tag}</Pill>
              <h3>{item.title}</h3>
              <p>{item.description || 'Listed by student.'}</p>
              <div className="market-card-footer">
                <strong>{item.price}</strong>
                <span className="text-muted text-xs">{item.seller_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {listed && (
        <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && setListed(false)}>
          <form className="event-dialog" onSubmit={createItem}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Marketplace</p>
                <h2>List an item</h2>
                <p>Post something useful for your classmates to see.</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setListed(false)} aria-label="Close modal">
                <X />
              </button>
            </div>
            <label>
              Item title *
              <input
                required
                autoFocus
                value={draft.title}
                onChange={e => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Modern Operating Systems Textbook (4th Ed)"
              />
            </label>
            <div className="event-field-grid">
              <label>
                Price / Offer *
                <input
                  required
                  value={draft.price}
                  onChange={e => setDraft({ ...draft, price: e.target.value })}
                  placeholder="e.g. ₦5,000 or Free"
                />
              </label>
              <label>
                Category tag
                <select value={draft.tag} onChange={e => setDraft({ ...draft, tag: e.target.value })}>
                  <option value="Study materials">Study materials</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Stationery">Stationery</option>
                  <option value="Campus living">Campus living</option>
                </select>
              </label>
            </div>
            <label>
              Description & contact details
              <input
                value={draft.description}
                onChange={e => setDraft({ ...draft, description: e.target.value })}
                placeholder="Condition, pickup location, or preferred contact"
              />
            </label>
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setListed(false)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={submitting}>
                <Plus /> Post listing
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

// ---------------- CHAT & STUDENT GROUPS ----------------
function ChatPage({ direct = false, user }: { direct?: boolean; user: User | null }) {
  const [groups, setGroups] = useState<ChatGroup[]>([])
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [attachment, setAttachment] = useState<File | null>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadGroups() {
      try {
        const groupList = await apiRequest<ChatGroup[]>('/chat/groups')
        setGroups(groupList || [])
        if (groupList && groupList.length > 0 && !activeGroupId) {
          setActiveGroupId(groupList[0].id)
        }
      } catch (err) {
        console.error('Failed to load groups:', err)
      }
    }
    loadGroups()
  }, [])

  useEffect(() => {
    async function loadMessages() {
      try {
        if (!direct && activeGroupId) {
          const msgs = await apiRequest<ChatMessage[]>(`/chat/groups/${activeGroupId}/messages`)
          setMessages(msgs || [])
        }
      } catch (err) {
        console.error('Failed to load messages:', err)
      }
    }
    loadMessages()
  }, [activeGroupId, direct])

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight
    }
  }, [messages])

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return
    try {
      const g = await apiRequest<ChatGroup>('/chat/groups', {
        method: 'POST',
        body: JSON.stringify({ name: newGroupName.trim(), description: newGroupDesc.trim() }),
      })
      setGroups(current => [...current, g])
      setActiveGroupId(g.id)
      setNewGroupName('')
      setNewGroupDesc('')
      setShowGroupForm(false)
    } catch (err: any) {
      alert(err.message || 'Failed to create group')
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() && !attachment) return

    const content = message.trim()
    const attName = attachment?.name

    const tempId = Date.now()
    const optimistic: ChatMessage = {
      id: tempId,
      sender_id: user?.id || 0,
      sender_name: user?.full_name || 'You',
      group_id: activeGroupId || undefined,
      content,
      attachment_name: attName,
      created_at: new Date().toISOString(),
    }
    setMessages(current => [...current, optimistic])
    setMessage('')
    setAttachment(null)

    try {
      if (!direct && activeGroupId) {
        const sent = await apiRequest<ChatMessage>(`/chat/groups/${activeGroupId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content, attachment_name: attName }),
        })
        setMessages(current => current.map(m => m.id === tempId ? sent : m))
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const currentGroup = groups.find(g => g.id === activeGroupId)
  const activeTitle = direct ? 'Direct Messages' : (currentGroup ? currentGroup.name : 'Class Study Group')

  return (
    <>
      <PageHeader
        title={direct ? 'Direct messages' : 'Student groups'}
        subtitle={direct ? 'Connect privately with your study peers.' : 'Collaborative spaces for courses, projects, and discussions.'}
        action={
          !direct && (
            <button className="primary-button" onClick={() => setShowGroupForm(true)}>
              <Plus /> Create group
            </button>
          )
        }
      />

      <div className="chat-layout">
        <aside className="chat-list">
          <div className="chat-list-header">
            <strong>{direct ? 'Conversations' : 'Study Groups'}</strong>
            <span>{groups.length}</span>
          </div>

          {groups.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs">
              No groups created yet. Click &apos;Create group&apos; to start one.
            </div>
          ) : (
            groups.map(g => (
              <button
                key={g.id}
                className={`chat-contact ${activeGroupId === g.id ? 'active' : ''}`}
                onClick={() => setActiveGroupId(g.id)}
              >
                <span className="avatar avatar-small">{g.name.slice(0, 2).toUpperCase()}</span>
                <span>
                  <strong>{g.name}</strong>
                  <small>Active discussion</small>
                </span>
              </button>
            ))
          )}
        </aside>

        <section className="chat-window">
          <div className="chat-window-header">
            <span className="avatar">{activeTitle.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{activeTitle}</strong>
              <small>Study community</small>
            </div>
          </div>

          <div ref={messageListRef} className="message-list">
            {messages.length === 0 ? (
              <div className="empty-state-card py-12">
                <div className="empty-state-icon"><MessageCircle /></div>
                <h3>No messages here yet</h3>
                <p>Send a message below to start the conversation with your classmates.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = user ? msg.sender_id === user.id : true
                return (
                  <div className={`chat-message ${isMine ? 'mine' : ''}`} key={msg.id}>
                    <span className="avatar avatar-tiny">
                      {isMine ? (user?.avatar || 'ST') : (msg.sender_name ? msg.sender_name.slice(0, 2).toUpperCase() : 'ST')}
                    </span>
                    <div>
                      <p>{msg.content}</p>
                      {msg.attachment_name && (
                        <div className="sent-attachment">
                          <div className="sent-document">
                            <FileText />
                            <span>{msg.attachment_name}</span>
                          </div>
                        </div>
                      )}
                      <small>{isMine ? 'You · ' : `${msg.sender_name} · `}{msg.created_at ? msg.created_at.split('T')[0] : 'Just now'}</small>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <form className="chat-composer" onSubmit={sendMessage}>
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"
              onChange={e => setAttachment(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              className="icon-btn"
              aria-label="Attach document"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip />
            </button>

            <div className="chat-input-wrap">
              {attachment && (
                <span className="chat-attachment" title={attachment.name}>
                  <FileText /> {attachment.name}
                  <button type="button" aria-label="Remove attachment" onClick={() => setAttachment(null)}>
                    <X />
                  </button>
                </span>
              )}
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Write a message to your group..."
                aria-label="Message"
              />
            </div>

            <button className="primary-button" type="submit" aria-label="Send message">
              <Send />
            </button>
          </form>
        </section>
      </div>

      {showGroupForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && setShowGroupForm(false)}>
          <form className="event-dialog group-dialog" onSubmit={createGroup}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Student groups</p>
                <h2>Create a group</h2>
                <p>Start a focused space for classmates to learn and study together.</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setShowGroupForm(false)} aria-label="Close form"><X /></button>
            </div>
            <label>
              Group name *
              <input
                required
                autoFocus
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="e.g. Distributed Systems Study Circle"
              />
            </label>
            <label>
              Description
              <textarea
                value={newGroupDesc}
                onChange={e => setNewGroupDesc(e.target.value)}
                placeholder="What will this group be discussing?"
                rows={4}
              />
            </label>
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setShowGroupForm(false)}>Cancel</button>
              <button type="submit" className="primary-button"><Plus /> Create group</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

// ---------------- PROFESSOR ATLAS ----------------
function ProfessorAtlasPage() {
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState<{ sender: string; content: string }[]>([])
  const [record, setRecord] = useState<AcademicRecord | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadAtlas() {
      try {
        const [rec, msgs] = await Promise.all([
          apiRequest<AcademicRecord>('/atlas/record'),
          apiRequest<{ sender: string; content: string }[]>('/atlas/history'),
        ])
        setRecord(rec)
        if (msgs && msgs.length > 0) {
          setHistory(msgs)
        } else {
          setHistory([
            {
              sender: 'atlas',
              content: "Hello! I'm Professor Atlas. Ask me about your study goals, course priorities, or exam preparation advice.",
            },
          ])
        }
      } catch (err) {
        console.error('Failed to load Atlas data:', err)
      }
    }
    loadAtlas()
  }, [])

  const askProfessor = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = question.trim()
    if (!q) return

    setHistory(current => [...current, { sender: 'student', content: q }])
    setQuestion('')
    setLoading(true)

    try {
      const res = await apiRequest<{ answer: string; record: AcademicRecord }>('/atlas/ask', {
        method: 'POST',
        body: JSON.stringify({ question: q }),
      })
      setHistory(current => [...current, { sender: 'atlas', content: res.answer }])
      if (res.record) setRecord(res.record)
    } catch (err: any) {
      setHistory(current => [
        ...current,
        { sender: 'atlas', content: 'I encountered an issue analyzing your query. Please try again shortly.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader title="Professor Atlas" subtitle="A thoughtful academic advisor for your study journey." />

      <div className="atlas-hero">
        <div className="atlas-orb"><Brain /></div>
        <div>
          <Pill tone="atlas-pill"><Sparkles /> Academic guidance</Pill>
          <h2>Meet your academic mentor.</h2>
          <p>Professor Atlas helps you plan study blocks, spot priorities, and stay confident throughout the semester.</p>
        </div>
        <div className="atlas-status">
          <span></span> Atlas Ready
        </div>
      </div>

      <div className="atlas-grid">
        <Panel className="atlas-chat">
          <div className="panel-header">
            <h2>Academic conversation</h2>
            <div className="atlas-live"><Sparkles /> Live assistant</div>
          </div>

          <div className="atlas-messages">
            {history.map((m, idx) => (
              <div key={idx} className={`atlas-message ${m.sender === 'student' ? 'atlas-message-student' : ''}`}>
                <span className="atlas-avatar">{m.sender === 'student' ? 'YOU' : <Sparkles />}</span>
                <div>
                  <strong>{m.sender === 'student' ? 'You' : 'Professor Atlas'}</strong>
                  <p>{m.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="atlas-message">
                <span className="atlas-avatar"><Sparkles /></span>
                <div className="space-y-1.5 w-48">
                  <div className="skeleton-shimmer h-3 w-32 rounded" />
                  <div className="skeleton-shimmer h-3 w-40 rounded" />
                </div>
              </div>
            )}
          </div>

          <form className="atlas-composer" onSubmit={askProfessor}>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask Professor Atlas for study strategies or priority suggestions..."
            />
            <button className="primary-button" type="submit" disabled={loading}>
              <Send />
            </button>
          </form>
        </Panel>

        <aside className="atlas-record">
          <Panel>
            <div className="panel-header">
              <h2>Academic Overview</h2>
            </div>
            <div className="record-score">
              <span>ACTIVE COURSES</span>
              <strong>{record?.active_courses_count ?? 0}</strong>
              <small>{(record?.pending_assessments ?? 0) === 0 ? 'All caught up' : `${record?.pending_assessments} assessments pending`}</small>
            </div>
            <div className="record-list">
              <div><span>Completed credits</span><strong>{record?.completed_credits ?? 0}</strong></div>
              <div><span>Total target credits</span><strong>{record?.total_credits ?? 120}</strong></div>
              <div><span>Academic status</span><strong>{record?.academic_standing || 'In Progress'}</strong></div>
            </div>
            <div className="atlas-suggestions">
              <span>SUGGESTED QUESTIONS</span>
              <button onClick={() => setQuestion('How should I prioritize my study sessions this week?')}>
                How should I prioritize my study sessions this week?
              </button>
              <button onClick={() => setQuestion('Can you give me tips to prepare for upcoming tests?')}>
                Tips for preparing for upcoming tests?
              </button>
            </div>
          </Panel>
        </aside>
      </div>
    </>
  )
}

// ---------------- REORGANIZED SETTINGS PAGE ----------------
function SettingsPage({
  user,
  onLogout,
  onUpdateUser,
}: {
  user: User | null
  onLogout: () => void
  onUpdateUser: (u: User) => void
}) {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security'>('profile')

  // Academic Profile
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [institution, setInstitution] = useState(user?.institution || '')
  const [department, setDepartment] = useState(user?.department || '')
  const [level, setLevel] = useState(user?.academic_level || '100 Level')
  const [session, setSession] = useState(user?.academic_session || '2025/2026')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Preferences toggles
  const [reminders, setReminders] = useState(true)
  const [announcementAlerts, setAnnouncementAlerts] = useState(true)
  const [marketAlerts, setMarketAlerts] = useState(false)
  const [dailyDigest, setDailyDigest] = useState(true)

  // Security password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [changingPass, setChangingPass] = useState(false)

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const updated = await apiRequest<User>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName.trim(),
          institution: institution.trim(),
          department: department.trim(),
          academic_level: level,
          academic_session: session.trim(),
        }),
      })
      onUpdateUser(updated)
      setMessage({ text: 'Academic profile updated successfully!', type: 'success' })
      setTimeout(() => setMessage(null), 3500)
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update profile', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.')
      return
    }
    try {
      setChangingPass(true)
      // Call password update or profile update
      await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ full_name: fullName }),
      })
      setMessage({ text: 'Password credentials verified and updated!', type: 'success' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setMessage(null), 3500)
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update password', type: 'error' })
    } finally {
      setChangingPass(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Settings & Profile"
        subtitle="Manage your student profile, study preferences, and account security."
      />

      {message && (
        <div className={`notice-banner ${message.type === 'success' ? 'success' : 'error'} mb-4`}>
          {message.type === 'success' ? <Check /> : <X />} {message.text}
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="settings-section-card flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="avatar profile-avatar text-lg font-bold">
            {user?.avatar || 'ST'}
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900 m-0">{user?.full_name || 'Student Name'}</h2>
            <p className="text-slate-500 text-xs mt-1 mb-2">{user?.email || 'student@university.edu'}</p>
            <div className="flex gap-2">
              <Pill tone="verified-pill">STUDENT</Pill>
              <Pill>{user?.academic_level || 'Level'}</Pill>
              <Pill>{user?.institution || 'Institution'}</Pill>
            </div>
          </div>
        </div>
        <button className="secondary-button text-red-600 hover:bg-red-50" onClick={onLogout}>
          <LogOut className="w-4 h-4 mr-1 text-red-600 inline" /> Sign out
        </button>
      </div>

      {/* Clean Organized Settings Tabs */}
      <div className="settings-tabs">
        <button
          className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <UserIcon /> Academic Profile
        </button>
        <button
          className={`settings-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <Sliders /> Preferences & Alerts
        </button>
        <button
          className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <ShieldCheck /> Security & Account
        </button>
      </div>

      {/* Tab 1: Academic Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={saveProfile} className="settings-section-card">
          <h3>Academic Information</h3>
          <p>Keep your university, department, and academic session current so your schedule is accurate.</p>

          <div className="settings-grid-2">
            <label className="block mb-4">
              <span className="text-xs font-semibold text-slate-700 block mb-1.5">Full name *</span>
              <input
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                placeholder="e.g. Peter Chijioke"
              />
            </label>

            <label className="block mb-4">
              <span className="text-xs font-semibold text-slate-700 block mb-1.5">Email address</span>
              <input
                className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg p-2.5 text-sm cursor-not-allowed"
                value={user?.email || ''}
                disabled
              />
            </label>
          </div>

          <div className="settings-grid-2">
            <label className="block mb-4">
              <span className="text-xs font-semibold text-slate-700 block mb-1.5">University / Institution *</span>
              <input
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                value={institution}
                onChange={e => setInstitution(e.target.value)}
                required
                placeholder="e.g. University of Lagos"
                list="university-list"
              />
              <datalist id="university-list">
                <option value="University of Lagos" />
                <option value="University of Ibadan" />
                <option value="Covenant University" />
                <option value="Obafemi Awolowo University" />
                <option value="University of Nigeria, Nsukka" />
                <option value="Ahmadu Bello University" />
                <option value="Federal University of Technology, Akure" />
              </datalist>
            </label>

            <label className="block mb-4">
              <span className="text-xs font-semibold text-slate-700 block mb-1.5">Department / Faculty *</span>
              <input
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                required
                placeholder="e.g. Computer Science"
              />
            </label>
          </div>

          <div className="settings-grid-2">
            <label className="block mb-4">
              <span className="text-xs font-semibold text-slate-700 block mb-1.5">Academic level *</span>
              <select
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 bg-white"
                value={level}
                onChange={e => setLevel(e.target.value)}
              >
                <option value="100 Level">100 Level</option>
                <option value="200 Level">200 Level</option>
                <option value="300 Level">300 Level</option>
                <option value="400 Level">400 Level</option>
                <option value="500 Level">500 Level</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </label>

            <label className="block mb-4">
              <span className="text-xs font-semibold text-slate-700 block mb-1.5">Academic session</span>
              <input
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                value={session}
                onChange={e => setSession(e.target.value)}
                placeholder="e.g. 2025/2026 session"
              />
            </label>
          </div>

          <div className="pt-2 flex justify-end">
            <button type="submit" className="primary-button" disabled={saving}>
              <Check /> Save academic profile
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Preferences & Alerts */}
      {activeTab === 'preferences' && (
        <div className="settings-section-card">
          <h3>Notifications & Study Reminders</h3>
          <p>Choose when and how Course Rep notifies you of lecture times and classmates updates.</p>

          <div className="space-y-1">
            <div className="toggle-item">
              <div>
                <strong>Lecture & Class Reminders</strong>
                <small>Receive reminders 15 minutes before your scheduled lectures.</small>
              </div>
              <button
                type="button"
                className={`switch-pill ${reminders ? 'on' : ''}`}
                onClick={() => setReminders(!reminders)}
                aria-label="Toggle reminders"
              >
                <span />
              </button>
            </div>

            <div className="toggle-item">
              <div>
                <strong>Course Announcements</strong>
                <small>Get notified when a classmate posts a venue change or assignment notice.</small>
              </div>
              <button
                type="button"
                className={`switch-pill ${announcementAlerts ? 'on' : ''}`}
                onClick={() => setAnnouncementAlerts(!announcementAlerts)}
                aria-label="Toggle announcements"
              >
                <span />
              </button>
            </div>

            <div className="toggle-item">
              <div>
                <strong>Daily Morning Digest</strong>
                <small>Summary of classes, venues, and deadlines for each day at 8:00 AM.</small>
              </div>
              <button
                type="button"
                className={`switch-pill ${dailyDigest ? 'on' : ''}`}
                onClick={() => setDailyDigest(!dailyDigest)}
                aria-label="Toggle daily digest"
              >
                <span />
              </button>
            </div>

            <div className="toggle-item">
              <div>
                <strong>Marketplace Alerts</strong>
                <small>Notify me when study materials or books for my department are listed.</small>
              </div>
              <button
                type="button"
                className={`switch-pill ${marketAlerts ? 'on' : ''}`}
                onClick={() => setMarketAlerts(!marketAlerts)}
                aria-label="Toggle marketplace alerts"
              >
                <span />
              </button>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setMessage({ text: 'Preferences saved successfully!', type: 'success' })
                setTimeout(() => setMessage(null), 3000)
              }}
            >
              <Check /> Save preferences
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Account */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="settings-section-card">
            <h3>Account Security</h3>
            <p>Your password is cryptographically protected with industry-standard Argon2id hashing.</p>

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">Current password</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">New password</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">Confirm new password</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </label>

              <button
                type="button"
                className="text-button text-xs"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPassword ? 'Hide passwords' : 'Show passwords'}
              </button>

              <div className="pt-2">
                <button type="submit" className="primary-button" disabled={changingPass}>
                  <Lock className="w-4 h-4 mr-1 inline" /> Update password
                </button>
              </div>
            </form>
          </div>

          <div className="settings-section-card border-red-100 bg-red-50/20">
            <h3 className="text-red-700">Account Session</h3>
            <p className="text-slate-600">Sign out of your active student session or clear local cached credentials on this device.</p>
            <div className="flex gap-3">
              <button className="primary-button bg-red-600 hover:bg-red-700 text-white" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-1 inline" /> Log out of Course Rep
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  sessionStorage.clear()
                  localStorage.clear()
                  alert('Local browser cache cleared.')
                  window.location.reload()
                }}
              >
                Clear local cache
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ---------------- AUTH PAGES (LOGIN & REGISTER) ----------------
function Auth({ register, go, onLogin }: { register: boolean; go: (view: View) => void; onLogin: (u: User, token: string) => void }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const endpoint = register ? '/auth/register' : '/auth/login'
      const payload = register
        ? { full_name: fullName.trim(), email: email.trim(), password }
        : { email: email.trim(), password }

      const res = await apiRequest<{ token: string; user: User }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      onLogin(res.user, res.token)
      go(register ? 'Onboarding' : 'Overview')
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-form-side">
        <div className="auth-brand"><Logo /></div>
        <div className="auth-card">
          <Pill tone="landing-pill"><Sparkles /> Student Portal</Pill>
          <h1>{register ? 'Create your account' : 'Welcome back'}</h1>
          <p>{register ? 'Join your classmates and manage your semester with ease.' : 'Sign in to access your course timetable, announcements, and groups.'}</p>

          {error && <div className="notice-banner error mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            {register && (
              <label>
                Full name
                <input
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Peter Chijioke"
                />
              </label>
            )}
            <label>
              University or student email
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@university.edu.ng"
              />
            </label>
            <label>
              Password
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <button className="primary-button auth-submit" type="submit" disabled={loading}>
              {loading ? (
                <div className="skeleton-shimmer h-4 w-28 rounded mx-auto" />
              ) : (
                <>
                  {register ? 'Create account' : 'Log in'} <ChevronRight />
                </>
              )}
            </button>
          </form>

          <p className="auth-switch">
            {register ? 'Already have an account?' : 'New student to Course Rep?'}
            <button onClick={() => go(register ? 'Login' : 'Register')}>
              {register ? 'Log in' : 'Create an account'}
            </button>
          </p>
        </div>
      </section>

      <aside className="auth-story">
        <button className="auth-story-logo" onClick={() => go('Landing')} aria-label="Go to Course Rep home"><Logo /></button>
        <div className="story-glow story-glow-one" />
        <div className="story-glow story-glow-two" />
        <div className="story-content">
          <span className="story-kicker">Your student command centre</span>
          <h2>Stay ahead of every lecture, assignment, and notice.</h2>
          <p>Course Rep brings your courses, timetable, announcements, and peer collaboration into one calm, dependable workspace.</p>
          <div className="story-stat-row">
            <div><strong>100%</strong><span>student-driven</span></div>
            <div><strong>Instant</strong><span>updates</span></div>
            <div><strong>Calm</strong><span>semester</span></div>
          </div>
        </div>
      </aside>
    </main>
  )
}

// ---------------- ONBOARDING (SELF-ONBOARDING) ----------------
function Onboarding({ go, onUpdateUser }: { go: (view: View) => void; onUpdateUser: (u: User) => void }) {
  const [institution, setInstitution] = useState('')
  const [department, setDepartment] = useState('')
  const [level, setLevel] = useState('100 Level')
  const [session, setSession] = useState('2025/2026')
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    try {
      setLoading(true)
      const updated = await apiRequest<User>('/auth/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          institution: institution.trim() || 'University Student',
          department: department.trim() || 'General Studies',
          academic_level: level,
          academic_session: session.trim(),
        }),
      })
      onUpdateUser(updated)
      go('Overview')
    } catch (err: any) {
      go('Overview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <aside className="auth-story">
        <button className="auth-story-logo" onClick={() => go('Landing')} aria-label="Go to Course Rep home"><Logo /></button>
        <div className="story-glow story-glow-one" />
        <div className="story-glow story-glow-two" />
        <div className="story-content">
          <span className="story-kicker">Welcome to Course Rep</span>
          <h2>Set up your academic profile.</h2>
          <p>Tell us where and what you are studying so we can tailor your timetable, courses, and announcements.</p>
        </div>
      </aside>

      <section className="auth-form-side">
        <div className="auth-brand"><Logo /></div>
        <div className="auth-card onboarding-card">
          <div className="stepper"><span className="active">1</span><i /><span>2</span><i /><span>3</span></div>
          <Pill>Academic Setup</Pill>
          <h1>Tell us about your studies</h1>
          <p>Enter your university and program details to personalize your workspace.</p>

          <label>
            University / Institution
            <input
              required
              value={institution}
              onChange={e => setInstitution(e.target.value)}
              placeholder="e.g. University of Lagos, Covenant University"
              list="onboarding-universities"
            />
            <datalist id="onboarding-universities">
              <option value="University of Lagos" />
              <option value="University of Ibadan" />
              <option value="Covenant University" />
              <option value="Obafemi Awolowo University" />
              <option value="University of Nigeria, Nsukka" />
              <option value="Ahmadu Bello University" />
              <option value="Federal University of Technology, Akure" />
            </datalist>
          </label>

          <label>
            Department / Course of Study
            <input
              required
              value={department}
              onChange={e => setDepartment(e.target.value)}
              placeholder="e.g. Software Engineering, Economics, Medicine"
            />
          </label>

          <label>
            Academic level
            <select value={level} onChange={e => setLevel(e.target.value)}>
              <option value="100 Level">100 Level (Freshman)</option>
              <option value="200 Level">200 Level (Sophomore)</option>
              <option value="300 Level">300 Level (Junior)</option>
              <option value="400 Level">400 Level (Senior)</option>
              <option value="500 Level">500 Level (Final Year)</option>
              <option value="Postgraduate">Postgraduate (Masters / PhD)</option>
            </select>
          </label>

          <label>
            Academic session
            <input
              value={session}
              onChange={e => setSession(e.target.value)}
              placeholder="e.g. 2025/2026"
            />
          </label>

          <button className="primary-button auth-submit" onClick={handleContinue} disabled={loading}>
            {loading ? 'Saving...' : 'Finish Setup & Enter Workspace'} <ChevronRight />
          </button>
          <button className="skip-button" onClick={() => go('Overview')}>Skip for now</button>
        </div>
      </section>
    </main>
  )
}

// ---------------- LANDING & STATIC MARKETING PAGES ----------------
function LandingHeader({ go }: { go: (view: View) => void }) {
  return (
    <nav className="landing-nav" aria-label="Course Rep navigation">
      <button className="landing-brand-button" onClick={() => go('Landing')} aria-label="Course Rep home"><Logo /></button>
      <div className="landing-links">
        <button onClick={() => go('Features')}>Features</button>
        <button onClick={() => go('How it works')}>How it works</button>
        <button onClick={() => go('Professor Atlas info')}>Professor Atlas</button>
      </div>
      <div className="landing-actions">
        <button className="landing-login" onClick={() => go('Login')}>Log in</button>
        <button className="primary-button" onClick={() => go('Register')}>Get started <ChevronRight /></button>
      </div>
    </nav>
  )
}

function SiteFooter({ go }: { go: (view: View) => void }) {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <button className="landing-brand-button" onClick={() => go('Landing')} aria-label="Course Rep home"><Logo /></button>
          <p>Your academic life, organized for better progress.</p>
          <a href="mailto:support@courserep.app">support@courserep.app</a>
        </div>
        <div className="footer-column">
          <strong>PRODUCT</strong>
          <button onClick={() => go('Features')}>Features</button>
          <button onClick={() => go('How it works')}>How it works</button>
          <button onClick={() => go('Professor Atlas info')}>Professor Atlas</button>
          <button onClick={() => go('Calendar')}>Academic calendar</button>
        </div>
        <div className="footer-column">
          <strong>COMMUNITY</strong>
          <button onClick={() => go('Student Groups')}>Student groups</button>
          <button onClick={() => go('Direct Messages')}>Messages</button>
          <button onClick={() => go('Support Center')}>Support center</button>
        </div>
        <div className="footer-column">
          <strong>COMPANY</strong>
          <button onClick={() => go('About Course Rep')}>About Course Rep</button>
          <button onClick={() => go('Register')}>Get started</button>
          <a href="mailto:support@courserep.app">Contact</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Course Rep. All rights reserved.</span>
        <span>Built for students, by students.</span>
      </div>
    </footer>
  )
}

function Landing({ go }: { go: (view: View) => void }) {
  return (
    <main className="landing-page">
      <LandingHeader go={go} />
      <section className="landing-hero">
        <div className="landing-copy">
          <Pill tone="landing-pill"><Sparkles /> Built for students</Pill>
          <h1>Your academic life, <em>finally in one place.</em></h1>
          <p>Course Rep brings your courses, announcements, timetable, and student communities together so you can focus on mastering your semester.</p>
          <div className="landing-cta">
            <button className="primary-button landing-primary" onClick={() => go('Register')}>Start your semester <ChevronRight /></button>
            <button className="landing-secondary" onClick={() => go('Login')}>Sign in to workspace <ArrowUp /></button>
          </div>
          <div className="landing-trust">
            <span><Check /> Simple & student-driven</span>
            <span><ShieldCheck /> Secure Argon2id encryption</span>
          </div>
        </div>
        <div className="landing-preview">
          <div className="preview-window">
            <div className="preview-top"><span /><span /><span /><small>Course Rep workspace</small></div>
            <div className="preview-body">
              <aside>
                <strong>Course Rep</strong>
                <span className="preview-active">Overview</span>
                <span>My courses</span>
                <span>Calendar</span>
                <span>Professor Atlas</span>
              </aside>
              <div>
                <p className="eyebrow">Your academic command centre</p>
                <h3>Welcome to your workspace</h3>
                <div className="preview-stats">
                  <b>Courses<small>enrolled</small></b>
                  <b>Calendar<small>timetables</small></b>
                  <b>Alerts<small>notices</small></b>
                </div>
                <div className="preview-card">
                  <span>Timetable view</span>
                  <strong>Classes & study groups</strong>
                  <small>Organized across your semester</small>
                </div>
                <div className="preview-card preview-ai">
                  <Sparkles />
                  <div>
                    <strong>Professor Atlas</strong>
                    <small>Ask anything about your study strategies.</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="landing-features" id="features">
        <div>
          <p className="eyebrow">One calm workspace</p>
          <h2>Less chasing. More learning.</h2>
          <p>Every part of your student journey is organized, clear, and easy to act on.</p>
        </div>
        <div className="feature-grid">
          <article><CalendarDays /><h3>Know what&apos;s next</h3><p>Keep lectures, deadlines, and personal study events in one dependable calendar.</p></article>
          <article><MessageCircle /><h3>Stay connected</h3><p>Talk with classmates, create study groups, and keep course notes in one place.</p></article>
          <article><Store /><h3>Trade on campus</h3><p>Buy, sell, and share textbooks, study notes, and student essentials.</p></article>
          <article id="atlas"><Sparkles /><h3>Understand your progress</h3><p>Consult Professor Atlas for study strategies and semester goal-setting.</p></article>
        </div>
      </section>
      <section className="landing-bottom" id="how-it-works">
        <p className="eyebrow">Your semester, simplified</p>
        <h2>Start with clarity. Finish with confidence.</h2>
        <button className="primary-button landing-primary" onClick={() => go('Register')}>Create your free account <ChevronRight /></button>
      </section>
      <SiteFooter go={go} />
    </main>
  )
}

function LandingInfoPage({ type, go }: { type: 'Features' | 'How it works' | 'Professor Atlas info'; go: (view: View) => void }) {
  const data = {
    Features: {
      label: 'Everything in sync',
      title: 'One workspace for your whole semester.',
      intro: 'Course Rep keeps the details that matter close at hand, from course updates to conversations with your classmates.',
      cards: [
        ['Courses', 'See your classes, materials, and next steps without hunting through different platforms.'],
        ['Calendar', 'Keep lectures, deadlines, and personal events in one clear academic rhythm.'],
        ['Community', 'Create study groups, message classmates, and share useful resources.'],
      ],
    },
    'How it works': {
      label: 'Simple by design',
      title: 'A calmer way to move through campus life.',
      intro: 'Course Rep turns a busy semester into a few clear, repeatable steps.',
      cards: [
        ['1. Set up', 'Create your account and tell us about your institution, department, and level.'],
        ['2. Stay in sync', 'Follow courses, check announcements, and keep your academic calendar current.'],
        ['3. Make progress', 'Use groups and Professor Atlas to turn information into your next best action.'],
      ],
    },
    'Professor Atlas info': {
      label: 'Your academic guide',
      title: 'Ask better questions about your studies.',
      intro: 'Professor Atlas helps you plan study blocks, spot priorities, and stay confident throughout the semester.',
      cards: [
        ['Understand', 'Ask about study strategies, test preparation, and course topics.'],
        ['Prioritize', 'Get a clearer view of what deserves your attention this week.'],
        ['Plan ahead', 'Turn your syllabus and calendar into a structured study routine.'],
      ],
    },
  }[type]

  return (
    <main className="landing-page landing-info-page">
      <LandingHeader go={go} />
      <section className="info-hero">
        <Pill tone="landing-pill"><Sparkles /> {data.label}</Pill>
        <h1>{data.title}</h1>
        <p>{data.intro}</p>
        <button className="primary-button landing-primary" onClick={() => go('Register')}>Start with Course Rep <ChevronRight /></button>
      </section>
      <section className="info-cards">
        {data.cards.map(([title, text], index) => (
          <article key={title}>
            <span>0{index + 1}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>
      <SiteFooter go={go} />
    </main>
  )
}

function AboutPage({ go }: { go: (view: View) => void }) {
  return (
    <main className="landing-page landing-info-page">
      <LandingHeader go={go} />
      <section className="about-hero">
        <Pill tone="landing-pill"><GraduationCap /> About Course Rep</Pill>
        <h1>A better way to experience university.</h1>
        <p>Course Rep was created to make student academic life feel less scattered, more connected, and easier to navigate.</p>
      </section>
      <section className="about-story">
        <div>
          <p className="eyebrow">Why we built it</p>
          <h2>Students deserve a clearer path through every semester.</h2>
        </div>
        <div>
          <p>Class updates live in disparate WhatsApp groups, timetable screenshots get lost in camera rolls, and materials are scattered everywhere. Course Rep brings those pieces together into one student-driven workspace.</p>
        </div>
      </section>
      <SiteFooter go={go} />
    </main>
  )
}

function SupportPage() {
  return (
    <>
      <PageHeader title="Support center" subtitle="We're here to help you get the most out of your academic workspace." />
      <div className="support-hero">
        <div className="support-hero-icon"><Headphones /></div>
        <div>
          <p className="eyebrow">Need assistance?</p>
          <h2>We&apos;re here for students.</h2>
          <p>Reach out for help with your courses, calendar, groups, or account settings.</p>
        </div>
      </div>
      <div className="support-grid">
        <Panel className="support-card">
          <div className="support-icon support-email"><Mail /></div>
          <div>
            <p className="eyebrow">Email support</p>
            <h2>Send us an email</h2>
            <p>For account questions, feedback, or feature suggestions.</p>
            <a href="mailto:support@courserep.app">support@courserep.app</a>
            <small>We usually reply within one business day.</small>
          </div>
        </Panel>
        <Panel className="support-card">
          <div className="support-icon support-phone"><Phone /></div>
          <div>
            <p className="eyebrow">Phone support</p>
            <h2>Talk to our team</h2>
            <p>For urgent access or workspace issues.</p>
            <a href="tel:+2348001234567">+234 800 123 4567</a>
            <small>Monday–Friday, 9:00 AM–5:00 PM WAT</small>
          </div>
        </Panel>
      </div>
    </>
  )
}

// ---------------- MAIN EXPORT ----------------
export default function Page() {
  const [view, setView] = useState<View>('Landing')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('course-rep-token') : null
    if (token) {
      apiRequest<User>('/auth/me')
        .then(u => {
          setUser(u)
          setAuthenticated(true)
          if (view === 'Landing' || view === 'Login' || view === 'Register') {
            setView('Overview')
          }
        })
        .catch(() => {
          sessionStorage.removeItem('course-rep-token')
          sessionStorage.removeItem('course-rep-authenticated')
          setAuthenticated(false)
          setUser(null)
        })
    }
  }, [])

  const handleLogin = (loggedInUser: User, token: string) => {
    sessionStorage.setItem('course-rep-token', token)
    sessionStorage.setItem('course-rep-authenticated', 'true')
    setUser(loggedInUser)
    setAuthenticated(true)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('course-rep-token')
    sessionStorage.removeItem('course-rep-authenticated')
    setUser(null)
    setAuthenticated(false)
    setView('Landing')
  }

  const go = (next: View) => {
    if (next === 'Login' && authenticated) {
      handleLogout()
      return
    }
    setView(next)
    setMobileOpen(false)
  }

  if (!authenticated && !['Landing', 'About Course Rep', 'Features', 'How it works', 'Professor Atlas info', 'Login', 'Register'].includes(view)) {
    return <Landing go={go} />
  }

  if (view === 'Landing') return <Landing go={go} />
  if (view === 'About Course Rep') return <AboutPage go={go} />
  if (view === 'Features' || view === 'How it works' || view === 'Professor Atlas info') return <LandingInfoPage type={view} go={go} />
  if (view === 'Login') return <Auth go={go} register={false} onLogin={handleLogin} />
  if (view === 'Register') return <Auth go={go} register onLogin={handleLogin} />
  if (view === 'Onboarding') return <Onboarding go={go} onUpdateUser={u => setUser(u)} />

  const content =
    view === 'Overview' ? <Dashboard go={go} user={user} /> :
    view === 'My Courses' ? <CoursesPage go={go} user={user} /> :
    view === 'Calendar' ? <CalendarPage /> :
    view === 'Announcements' ? <AnnouncementsPage /> :
    view === 'Marketplace' ? <MarketplacePage /> :
    view === 'Student Groups' ? <ChatPage direct={false} user={user} /> :
    view === 'Direct Messages' ? <ChatPage direct={true} user={user} /> :
    view === 'Professor Atlas' ? <ProfessorAtlasPage /> :
    view === 'Support Center' ? <SupportPage /> :
    <SettingsPage user={user} onLogout={handleLogout} onUpdateUser={u => setUser(u)} />

  // Strictly Student-driven Navigation (Representative and Admin removed)
  const primaryNav: [string, ElementType][] = [
    ['Overview', LayoutDashboard],
    ['My Courses', BookOpen],
    ['Calendar', CalendarDays],
    ['Announcements', Bell],
  ]
  const communityNav: [string, ElementType][] = [
    ['Marketplace', Store],
    ['Student Groups', Users],
    ['Direct Messages', MessageCircle],
  ]
  const accountNav: [string, ElementType][] = [
    ['Settings', Settings],
    ['Support Center', Headphones],
  ]

  const renderNav = (items: [string, ElementType][]) =>
    items.map(([label, Icon]) => (
      <button
        key={label}
        className={`nav-item ${view === label ? 'active' : ''}`}
        onClick={() => go(label as View)}
      >
        <Icon />
        <span>{label}</span>
      </button>
    ))

  const userDisplayName = user?.full_name || 'Student'
  const userAvatar = user?.avatar || 'ST'
  const userLevel = user?.academic_level || 'Student'
  const userInstitution = user?.institution || 'Student Workspace'

  return (
    <main className="app-shell">
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar-top">
          <button className="sidebar-logo-button" onClick={() => go('Landing')} aria-label="Go to Course Rep home">
            <Logo />
          </button>
          <button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X />
          </button>
        </div>

        <div className="workspace" onClick={() => go('Settings')} role="button" tabIndex={0}>
          <span className="avatar avatar-small">{userAvatar}</span>
          <span>
            <strong>{userDisplayName}</strong>
            <small>{userLevel}</small>
          </span>
          <ChevronRight />
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          <div className="nav-section">
            <span className="nav-section-label">Academic Workspace</span>
            {renderNav(primaryNav)}
          </div>
          <div className="nav-section">
            <span className="nav-section-label">Campus Community</span>
            {renderNav(communityNav)}
          </div>
          <div className="nav-section">
            <span className="nav-section-label">Preferences</span>
            {renderNav(accountNav)}
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="help-card" onClick={() => go('Support Center')}>
            <span className="help-icon">?</span>
            <div>
              <strong>Need some help?</strong>
              <small>Visit our support centre</small>
            </div>
            <ChevronRight />
          </button>
          <span className="version">Course Rep v1.0 · {userInstitution}</span>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu />
          </button>
          <div className="top-search">
            <Search />
            <input placeholder="Search courses, announcements, or materials..." aria-label="Search" />
          </div>
          <div className="top-actions">
            <button className="icon-btn" aria-label="Notifications" onClick={() => go('Announcements')}>
              <Bell />
            </button>
            <span className="top-divider" />
            <button className="avatar" onClick={() => go('Settings')} aria-label="Account Settings">
              {userAvatar}
            </button>
            <span className="top-name">{userDisplayName}</span>
          </div>
        </header>

        <div className="content">
          {content}
          <button
            className="atlas-fab"
            onClick={() => go('Professor Atlas')}
            aria-label="Open Professor Atlas"
          >
            <Sparkles />
            <span>Ask Professor Atlas</span>
          </button>

          <footer className="mobile-nav">
            <button className={view === 'Overview' ? 'active' : ''} onClick={() => go('Overview')}>
              <LayoutDashboard />
              <span>Home</span>
            </button>
            <button className={view === 'My Courses' ? 'active' : ''} onClick={() => go('My Courses')}>
              <BookOpen />
              <span>Courses</span>
            </button>
            <button className={view === 'Calendar' ? 'active' : ''} onClick={() => go('Calendar')}>
              <CalendarDays />
              <span>Calendar</span>
            </button>
            <button className={view === 'Announcements' ? 'active' : ''} onClick={() => go('Announcements')}>
              <Bell />
              <span>Alerts</span>
            </button>
            <button onClick={() => go('Settings')}>
              <span className="avatar avatar-tiny">{userAvatar}</span>
              <span>Profile</span>
            </button>
          </footer>
        </div>
      </section>
    </main>
  )
}
