'use client'

import { useEffect, useRef, useState, type ReactNode, type ElementType } from 'react'
import {
  Bell, BookOpen, CalendarDays, Check, ChevronRight, Clock3, FileText,
  GraduationCap, LayoutDashboard, LogIn, Menu, Plus, Search, Settings,
  ShieldCheck, Trash2, Upload, Users, X, Store, MessageCircle, Send,
  Paperclip, Sparkles, Brain, ArrowUp, Mail, Phone, Headphones, Loader2
} from 'lucide-react'
import {
  apiRequest, type User, type Course, type AnnouncementItem,
  type TimetableSlot, type MarketplaceItem, type ChatGroup,
  type ChatMessage, type RepresentativeActivityLog,
  type RepresentativeApplication, type AcademicRecord, type AdminStats
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
  | 'Representative'
  | 'Marketplace'
  | 'Student Groups'
  | 'Direct Messages'
  | 'Professor Atlas'
  | 'Support Center'
  | 'Settings'
  | 'Login'
  | 'Register'
  | 'Onboarding'
  | 'Admin'

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
        <p className="eyebrow">Course Rep workspace</p>
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

// ---------------- DASHBOARD ----------------
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

  return (
    <>
      <PageHeader
        title={`Good morning, ${user?.full_name ? user.full_name.split(' ')[0] : 'Student'}`}
        subtitle="Here's what's happening with your academics today."
        action={
          <button className="primary-button" onClick={() => go('Calendar')}>
            <CalendarDays /> View calendar
          </button>
        }
      />

      <div className="profile-strip">
        <div className="institution-logo">
          {user?.institution ? user.institution.slice(0, 2).toUpperCase() : 'EU'}
        </div>
        <div>
          <strong>{user?.institution || 'Example University'}</strong>
          <span>{user?.department || 'Computer Science'} · {user?.academic_level || '400 Level'} · {user?.academic_session || '2026/2027 session'}</span>
        </div>
        <button className="text-button" onClick={() => go('Settings')}>
          Edit profile <ChevronRight />
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><BookOpen /></div>
          <div>
            <span>Enrolled courses</span>
            <strong>{courses.length}</strong>
            <small>All courses active</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><CalendarDays /></div>
          <div>
            <span>Upcoming lectures</span>
            <strong>{events.length}</strong>
            <small>{events.length > 0 ? 'Lectures scheduled' : 'None scheduled'}</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><FileText /></div>
          <div>
            <span>Pending assessments</span>
            <strong>{record?.pending_assessments ?? 3}</strong>
            <small className="warning-text">1 due this week</small>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <Panel>
          <div className="panel-header">
            <div>
              <h2>Important announcements</h2>
              <p>Stay up to date with your courses</p>
            </div>
            <button className="text-button" onClick={() => go('Announcements')}>
              View all <ChevronRight />
            </button>
          </div>
          <div className="announcement-list">
            {loading ? (
              <p className="loading-state"><Loader2 className="animate-spin inline mr-2" /> Loading announcements...</p>
            ) : announcements.length === 0 ? (
              <p className="empty-state">No announcements posted yet.</p>
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
          {nextLecture ? (
            <>
              <div className="lecture-date">
                <span>{nextLecture.date.split(' ')[0] || 'MON'}</span>
                <strong>{nextLecture.date.split(' ')[1] || '12'}</strong>
                <small>OCT</small>
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
            <div className="empty-lecture">
              <CalendarDays />
              <p>No upcoming lectures today.</p>
            </div>
          )}
        </Panel>
      </div>

      <div className="lower-grid">
        <Panel>
          <div className="panel-header">
            <div>
              <h2>Upcoming deadlines</h2>
              <p>Keep your momentum going</p>
            </div>
            <button className="text-button" onClick={() => go('Calendar')}>
              See all <ChevronRight />
            </button>
          </div>
          <div className="deadline-list">
            {upcomingDeadlines.length === 0 ? (
              <p className="empty-state">No imminent deadlines.</p>
            ) : (
              upcomingDeadlines.map((d) => (
                <div className="deadline" key={d.id}>
                  <div className="deadline-date">
                    <strong>{d.date.split(' ')[1] || '10'}</strong>
                    <span>{d.date.split(' ')[0] || 'OCT'}</span>
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
              <p>{courses.length} active courses</p>
            </div>
            <button className="text-button" onClick={() => go('My Courses')}>
              View all <ChevronRight />
            </button>
          </div>
          <div className="course-list">
            {courses.length === 0 ? (
              <p className="empty-state">No courses enrolled yet.</p>
            ) : (
              courses.map(c => (
                <div className="course-row" key={c.code}>
                  <span className={`course-avatar ${c.color}`}>{c.code.split(' ')[1]}</span>
                  <div>
                    <strong>{c.code}</strong>
                    <span>{c.name}</span>
                  </div>
                  <span className="course-next"><CalendarDays /> {c.next_lecture || 'Scheduled'}</span>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel className="marketplace-preview">
          <div className="panel-header">
            <div>
              <h2>Student marketplace</h2>
              <p>Useful finds from your campus community</p>
            </div>
            <button className="text-button" onClick={() => go('Marketplace')}>
              Browse all <ChevronRight />
            </button>
          </div>
          <div className="marketplace-preview-list">
            {marketplace.length === 0 ? (
              <p className="empty-state">No items listed currently.</p>
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
function CoursesPage({ go }: { go: (view: View) => void }) {
  const [courses, setCourses] = useState<Course[]>([])
  const [query, setQuery] = useState('')
  const [showJoin, setShowJoin] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

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

  return (
    <>
      <PageHeader
        title="My courses"
        subtitle="Your active courses for the 2026/2027 academic session."
        action={
          <button className="primary-button" onClick={() => setShowJoin(true)}>
            <Plus /> Join a course
          </button>
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
          All courses <ChevronRight />
        </button>
      </div>

      <div className="course-cards">
        {loading ? (
          <Panel><p><Loader2 className="animate-spin inline mr-2" /> Loading courses from database...</p></Panel>
        ) : courses.length === 0 ? (
          <Panel><p>No courses match your search.</p></Panel>
        ) : (
          courses.map(c => (
            <button className="course-card" key={c.id || c.code} onClick={() => go('Announcements')}>
              <span className={`course-avatar ${c.color}`}>{c.code.split(' ')[1] || 'CSC'}</span>
              <span>
                <strong>{c.code}</strong>
                <b>{c.name}</b>
                <small>{c.department || 'Computer Science'} · {c.level || '400 Level'}</small>
              </span>
              <span className="course-card-meta">
                {c.next_lecture || 'Up to date'}
                <ChevronRight />
              </span>
            </button>
          ))
        )}
      </div>

      {showJoin && (
        <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && setShowJoin(false)}>
          <form className="event-dialog" onSubmit={handleJoin}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Courses</p>
                <h2>Join a course</h2>
                <p>Enter the course code provided by your department (e.g. CSC 401, CSC 403).</p>
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
                {submitting ? <Loader2 className="animate-spin inline mr-1" /> : <Plus />} Join course
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
  const [selectedDay, setSelectedDay] = useState('Mon 12')
  const [events, setEvents] = useState<TimetableSlot[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState({ title: '', date: 'Mon 12', start: '10:00', end: '11:00', location: '', course: 'Personal event' })
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
      setDraft({ title: '', date: 'Mon 12', start: '10:00', end: '11:00', location: '', course: 'Personal event' })
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
        subtitle="Your lectures and deadlines for the week of October 12–18, 2026."
        action={
          <button className="primary-button" onClick={() => setShowForm(true)}>
            <Plus /> Add event
          </button>
        }
      />

      <div className="calendar-tabs">
        <button className={viewMode === 'Week' ? 'active' : ''} onClick={() => setViewMode('Week')}>Week</button>
        <button className={viewMode === 'List' ? 'active' : ''} onClick={() => setViewMode('List')}>List</button>
      </div>

      <Panel className="schedule">
        {viewMode === 'Week' && (
          <div className="week-row">
            {['Mon 12', 'Tue 13', 'Wed 14', 'Thu 15', 'Fri 16'].map(d => (
              <button
                key={d}
                className={selectedDay === d ? 'active' : ''}
                onClick={() => setSelectedDay(d)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => moveEventToDay(d)}
              >
                <small>{d.split(' ')[0]}</small>
                <strong>{d.split(' ')[1]}</strong>
              </button>
            ))}
          </div>
        )}

        <div className="schedule-list">
          {loading ? (
            <p className="loading-state"><Loader2 className="animate-spin inline mr-2" /> Loading calendar events...</p>
          ) : visibleEvents.length === 0 ? (
            <div className="calendar-empty">
              <CalendarDays />
              <strong>No events scheduled</strong>
              <span>Select another day or add a personal event.</span>
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
                <p>Keep a personal reminder alongside your lectures.</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setShowForm(false)} aria-label="Close add event form">
                <X />
              </button>
            </div>
            <label>
              Event title
              <input
                required
                autoFocus
                value={draft.title}
                onChange={e => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Study group session"
              />
            </label>
            <div className="event-field-grid">
              <label>
                Date
                <select value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })}>
                  {['Mon 12', 'Tue 13', 'Wed 14', 'Thu 15', 'Fri 16'].map(d => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label>
                Course
                <select value={draft.course} onChange={e => setDraft({ ...draft, course: e.target.value })}>
                  <option>Personal event</option>
                  {courses.map(c => (
                    <option key={c.code}>{c.code}</option>
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
              Location
              <input
                value={draft.location}
                onChange={e => setDraft({ ...draft, location: e.target.value })}
                placeholder="Optional (e.g. Library Room 3)"
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
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadAnnouncements = async (f = filter) => {
    try {
      setLoading(true)
      const data = await apiRequest<{ items: AnnouncementItem[]; unread_count: number }>(`/announcements?filter=${f}`)
      setItems(data.items || [])
      setUnreadCount(data.unread_count || 0)
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

  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Everything important from your courses and department."
        action={
          <button className="primary-button" onClick={markAllRead}>
            <Bell /> Mark all read
          </button>
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
            <p className="loading-state"><Loader2 className="animate-spin inline mr-2" /> Loading announcements from database...</p>
          ) : items.length === 0 ? (
            <p>No announcements in this view.</p>
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
    </>
  )
}

// ---------------- REPRESENTATIVE PAGE ----------------
function RepresentativePage({ user }: { user: User | null }) {
  const [modal, setModal] = useState<'announcement' | 'timetable' | 'material' | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [activity, setActivity] = useState<RepresentativeActivityLog[]>([])
  const [announcement, setAnnouncement] = useState({ title: '', message: '', course: 'CSC 401' })
  const [schedule, setSchedule] = useState({ course: 'CSC 401', day: 'Monday', time: '10:00 AM', venue: '' })
  const [material, setMaterial] = useState({ title: '', type: 'Lecture notes', course: 'CSC 401' })
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const [allCourses, logs] = await Promise.all([
        apiRequest<Course[]>('/courses'),
        apiRequest<RepresentativeActivityLog[]>('/representative/activity-logs'),
      ])
      setCourses(allCourses || [])
      setActivity(logs || [])
      if (allCourses && allCourses.length > 0) {
        setAnnouncement(prev => ({ ...prev, course: allCourses[0].code }))
        setSchedule(prev => ({ ...prev, course: allCourses[0].code }))
        setMaterial(prev => ({ ...prev, course: allCourses[0].code }))
      }
    } catch (err) {
      console.error('Failed to load rep data:', err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const close = () => setModal(null)

  const submitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!announcement.title.trim() || !announcement.message.trim()) return
    try {
      setSubmitting(true)
      await apiRequest('/representative/announcement', {
        method: 'POST',
        body: JSON.stringify({
          course_code: announcement.course,
          title: announcement.title.trim(),
          message: announcement.message.trim(),
        }),
      })
      setAnnouncement({ title: '', message: '', course: courses[0]?.code || 'CSC 401' })
      close()
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to post announcement')
    } finally {
      setSubmitting(false)
    }
  }

  const submitSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      await apiRequest('/representative/timetable', {
        method: 'POST',
        body: JSON.stringify({
          course_code: schedule.course,
          day: schedule.day,
          time: schedule.time,
          venue: schedule.venue,
        }),
      })
      close()
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update timetable')
    } finally {
      setSubmitting(false)
    }
  }

  const submitMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!material.title.trim()) return
    try {
      setSubmitting(true)
      await apiRequest('/representative/material', {
        method: 'POST',
        body: JSON.stringify({
          course_code: material.course,
          title: material.title.trim(),
          type: material.type,
        }),
      })
      setMaterial({ title: '', type: 'Lecture notes', course: courses[0]?.code || 'CSC 401' })
      close()
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to upload material')
    } finally {
      setSubmitting(false)
    }
  }

  const isRep = user?.role === 'representative' || user?.role === 'admin'

  return (
    <>
      <PageHeader
        title="Representative centre"
        subtitle="Manage the courses you are verified to represent."
        action={
          <Pill tone="verified-pill">
            <ShieldCheck /> {isRep ? 'Verified representative' : 'Student representative candidate'}
          </Pill>
        }
      />

      <Panel className="rep-hero">
        <div>
          <Pill tone="verified-pill"><ShieldCheck /> Approved for 2026/2027</Pill>
          <h2>Your class, coordinated.</h2>
          <p>Keep classmates informed with trusted updates, schedules, assessments, and resources directly connected to PostgreSQL.</p>
        </div>
        <button className="primary-button" onClick={() => setModal('announcement')}>
          <Plus /> New announcement
        </button>
      </Panel>

      <div className="quick-grid">
        <button onClick={() => setModal('announcement')}>
          <Bell />
          <strong>Post announcement</strong>
          <span>Share an update with your class</span>
        </button>
        <button onClick={() => setModal('timetable')}>
          <CalendarDays />
          <strong>Manage timetable</strong>
          <span>Update lecture schedules</span>
        </button>
        <button onClick={() => setModal('material')}>
          <Upload />
          <strong>Upload material</strong>
          <span>Add notes or past questions</span>
        </button>
      </div>

      <div className="rep-columns">
        <Panel>
          <div className="panel-header">
            <div>
              <h2>Verification status</h2>
              <p>Your representative access is active</p>
            </div>
            <span className="status verified">Approved</span>
          </div>
          <div className="verification-row">
            <Check /> Application approved by Department of Computer Science <span>Active</span>
          </div>
        </Panel>

        <Panel>
          <div className="panel-header">
            <div>
              <h2>Recent activity</h2>
              <p>Changes recorded in live database</p>
            </div>
          </div>
          <div className="rep-activity">
            {activity.length === 0 ? (
              <p className="empty-state">No recent activity recorded.</p>
            ) : (
              activity.slice(0, 5).map((item) => (
                <div key={item.id}>
                  <Check />
                  <span>{item.action} — {item.description}</span>
                  <small>{item.created_at.split('T')[0] || 'Recently'}</small>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>

      {modal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && close()}>
          <form
            className="event-dialog representative-dialog"
            onSubmit={modal === 'announcement' ? submitAnnouncement : modal === 'timetable' ? submitSchedule : submitMaterial}
          >
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Representative tools</p>
                <h2>
                  {modal === 'announcement' ? 'Post an announcement' : modal === 'timetable' ? 'Update timetable' : 'Upload course material'}
                </h2>
                <p>Keep your classmates informed with accurate course details.</p>
              </div>
              <button type="button" className="icon-btn" onClick={close} aria-label="Close dialog"><X /></button>
            </div>

            {modal === 'announcement' && (
              <>
                <label>
                  Course
                  <select value={announcement.course} onChange={e => setAnnouncement({ ...announcement, course: e.target.value })}>
                    {courses.map(c => <option key={c.code}>{c.code}</option>)}
                  </select>
                </label>
                <label>
                  Title
                  <input
                    required
                    value={announcement.title}
                    onChange={e => setAnnouncement({ ...announcement, title: e.target.value })}
                    placeholder="e.g. Venue changed for tomorrow's lecture"
                  />
                </label>
                <label>
                  Message
                  <textarea
                    required
                    rows={4}
                    value={announcement.message}
                    onChange={e => setAnnouncement({ ...announcement, message: e.target.value })}
                    placeholder="Write a clear update for your class..."
                  />
                </label>
              </>
            )}

            {modal === 'timetable' && (
              <>
                <label>
                  Course
                  <select value={schedule.course} onChange={e => setSchedule({ ...schedule, course: e.target.value })}>
                    {courses.map(c => <option key={c.code}>{c.code}</option>)}
                  </select>
                </label>
                <label>
                  Day
                  <select value={schedule.day} onChange={e => setSchedule({ ...schedule, day: e.target.value })}>
                    <option>Mon 12</option>
                    <option>Tue 13</option>
                    <option>Wed 14</option>
                    <option>Thu 15</option>
                    <option>Fri 16</option>
                  </select>
                </label>
                <label>
                  Time
                  <input
                    required
                    value={schedule.time}
                    onChange={e => setSchedule({ ...schedule, time: e.target.value })}
                    placeholder="e.g. 10:00 AM – 12:00 PM"
                  />
                </label>
                <label>
                  Venue
                  <input
                    required
                    value={schedule.venue}
                    onChange={e => setSchedule({ ...schedule, venue: e.target.value })}
                    placeholder="e.g. Lecture Hall B"
                  />
                </label>
              </>
            )}

            {modal === 'material' && (
              <>
                <label>
                  Course
                  <select value={material.course} onChange={e => setMaterial({ ...material, course: e.target.value })}>
                    {courses.map(c => <option key={c.code}>{c.code}</option>)}
                  </select>
                </label>
                <label>
                  Material title
                  <input
                    required
                    value={material.title}
                    onChange={e => setMaterial({ ...material, title: e.target.value })}
                    placeholder="e.g. CSC 401 revision notes"
                  />
                </label>
                <label>
                  Material type
                  <select value={material.type} onChange={e => setMaterial({ ...material, type: e.target.value })}>
                    <option>Lecture notes</option>
                    <option>Past questions</option>
                    <option>Study guide</option>
                  </select>
                </label>
              </>
            )}

            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={close}>Cancel</button>
              <button type="submit" className="primary-button" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin inline mr-1" /> : <Check />} Save changes
              </button>
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
              content: "Hello Peter. I've reviewed your current record. Ask me about your grades, course progress, or what to prioritize next.",
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
        { sender: 'atlas', content: 'I encountered an issue analyzing your record. Please try again shortly.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader title="Professor Atlas" subtitle="A thoughtful guide for understanding your academic record." />

      <div className="atlas-hero">
        <div className="atlas-orb"><Brain /></div>
        <div>
          <Pill tone="atlas-pill"><Sparkles /> Academic insight</Pill>
          <h2>Meet your academic analyst.</h2>
          <p>Professor Atlas reviews the records you&apos;ve uploaded and helps you spot patterns, plan ahead, and ask better questions.</p>
        </div>
        <div className="atlas-status">
          <span /> Record connected
          <small>Live synced</small>
        </div>
      </div>

      <div className="atlas-grid">
        <Panel className="atlas-chat">
          <div className="panel-header">
            <div>
              <h2>Ask Professor Atlas</h2>
              <p>Answers are based on your connected PostgreSQL academic record.</p>
            </div>
            <span className="atlas-live"><Sparkles /> Ready</span>
          </div>

          <div className="atlas-messages">
            {history.map((msg, index) => (
              <div
                className={`atlas-message ${msg.sender === 'atlas' ? 'atlas-message-ai' : 'atlas-message-student'}`}
                key={index}
              >
                <span className="atlas-avatar">
                  {msg.sender === 'atlas' ? <Brain /> : 'PE'}
                </span>
                <div>
                  <strong>{msg.sender === 'atlas' ? 'Professor Atlas' : 'You'}</strong>
                  <p>{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="atlas-message atlas-message-ai">
                <span className="atlas-avatar"><Brain /></span>
                <div>
                  <strong>Professor Atlas</strong>
                  <p><Loader2 className="animate-spin inline mr-2" /> Reviewing your record...</p>
                </div>
              </div>
            )}
          </div>

          <form className="atlas-composer" onSubmit={askProfessor}>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask about your academic record or course prioritization..."
              aria-label="Ask Professor Atlas"
            />
            <button className="primary-button" aria-label="Ask Professor Atlas" disabled={loading}>
              <ArrowUp />
            </button>
          </form>
        </Panel>

        <Panel className="atlas-record">
          <div className="panel-header">
            <div>
              <h2>Record snapshot</h2>
              <p>Live metrics from database</p>
            </div>
            <FileText />
          </div>

          <div className="record-score">
            <span>Current average</span>
            <strong>{record?.cgpa ? record.cgpa.toFixed(2) : '3.68'}</strong>
            <small>{record?.academic_standing || 'Strong academic standing'}</small>
          </div>

          <div className="record-list">
            <div>
              <span>Completed credits</span>
              <strong>{record?.completed_credits ?? 72} / {record?.total_credits ?? 120}</strong>
            </div>
            <div>
              <span>Active courses</span>
              <strong>{record?.active_courses_count ?? 4}</strong>
            </div>
            <div>
              <span>Pending assessments</span>
              <strong>{record?.pending_assessments ?? 3}</strong>
            </div>
          </div>

          <div className="atlas-suggestions">
            <span>Try asking</span>
            <button onClick={() => setQuestion('Which course should I prioritize this week?')}>
              What should I prioritize?
            </button>
            <button onClick={() => setQuestion('How is my academic progress trending?')}>
              How is my progress trending?
            </button>
          </div>
        </Panel>
      </div>
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
        subtitle="Buy, sell, and share useful items with your university community."
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
          <p>A trusted place for course materials, devices, and everyday student essentials.</p>
        </div>
        <Store />
      </div>

      <div className="toolbar">
        <div className="top-search">
          <Search />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search marketplace..."
            aria-label="Search marketplace"
          />
        </div>
        <button className="filter-button" onClick={() => setQuery('')}>
          All categories <ChevronRight />
        </button>
      </div>

      <div className="market-grid">
        {loading ? (
          <Panel><p><Loader2 className="animate-spin inline mr-2" /> Loading campus marketplace items...</p></Panel>
        ) : items.length === 0 ? (
          <Panel><p>No listings match your search.</p></Panel>
        ) : (
          items.map(item => (
            <article className="market-card" key={item.id}>
              <div className="market-thumb"><BookOpen /></div>
              <Pill>{item.tag}</Pill>
              <h3>{item.title}</h3>
              <p>{item.seller_name}</p>
              <div className="market-card-footer">
                <strong>{item.price}</strong>
                <button className="text-button">Message seller <ChevronRight /></button>
              </div>
            </article>
          ))
        )}
      </div>

      {listed && (
        <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && setListed(false)}>
          <form className="event-dialog" onSubmit={createItem}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Marketplace</p>
                <h2>List an item</h2>
                <p>Share something useful with your classmates.</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setListed(false)} aria-label="Close listing form">
                <X />
              </button>
            </div>
            <label>
              Item title
              <input
                required
                autoFocus
                value={draft.title}
                onChange={e => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. CSC 403 Past Questions & Study Pack"
              />
            </label>
            <label>
              Price
              <input
                required
                value={draft.price}
                onChange={e => setDraft({ ...draft, price: e.target.value })}
                placeholder="e.g. ₦2,500 or Free"
              />
            </label>
            <label>
              Category
              <select value={draft.tag} onChange={e => setDraft({ ...draft, tag: e.target.value })}>
                <option>Study materials</option>
                <option>Electronics</option>
                <option>Campus essentials</option>
              </select>
            </label>
            <div className="dialog-actions">
              <button type="button" className="secondary-button" onClick={() => setListed(false)}>Cancel</button>
              <button type="submit" className="primary-button" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin inline mr-1" /> : 'Publish listing'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

// ---------------- CHAT PAGE ----------------
function ChatPage({ direct = false, user }: { direct?: boolean; user: User | null }) {
  const [groups, setGroups] = useState<ChatGroup[]>([])
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null)
  const [activeDirectName, setActiveDirectName] = useState('Daniel Chukwu')
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [attachment, setAttachment] = useState<File | null>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const directContacts = [
    { id: 2, name: 'Daniel Chukwu', role: 'Course Rep' },
    { id: 3, name: 'Amaka Nwosu', role: 'Student' },
    { id: 4, name: 'Campus Administrator', role: 'Admin' },
  ]
  const [activeContactId, setActiveContactId] = useState<number>(2)

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
        } else if (direct && activeContactId) {
          const msgs = await apiRequest<ChatMessage[]>(`/chat/direct/${activeContactId}/messages`)
          setMessages(msgs || [])
        }
      } catch (err) {
        console.error('Failed to load messages:', err)
      }
    }
    loadMessages()
  }, [direct, activeGroupId, activeContactId])

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight
    }
  }, [messages])

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return
    try {
      const created = await apiRequest<ChatGroup>('/chat/groups', {
        method: 'POST',
        body: JSON.stringify({ name: newGroupName.trim(), description: newGroupDesc.trim() }),
      })
      setGroups(current => [...current, created])
      setActiveGroupId(created.id)
      setNewGroupName('')
      setNewGroupDesc('')
      setShowGroupForm(false)
    } catch (err: any) {
      alert(err.message || 'Failed to create group')
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed && !attachment) return

    const payload = {
      content: trimmed,
      attachment_name: attachment ? attachment.name : '',
      attachment_url: attachment ? URL.createObjectURL(attachment) : '',
      attachment_type: attachment ? attachment.type : '',
    }

    try {
      let sent: ChatMessage
      if (!direct && activeGroupId) {
        sent = await apiRequest<ChatMessage>(`/chat/groups/${activeGroupId}/messages`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      } else {
        sent = await apiRequest<ChatMessage>(`/chat/direct/${activeContactId}/messages`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }
      setMessages(current => [...current, sent])
      setMessage('')
      setAttachment(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) {
      alert(err.message || 'Failed to send message')
    }
  }

  const activeTitle = direct
    ? directContacts.find(c => c.id === activeContactId)?.name || 'Direct Message'
    : groups.find(g => g.id === activeGroupId)?.name || 'Course Group'

  return (
    <>
      <PageHeader
        title={direct ? 'Direct messages' : 'Student groups'}
        subtitle={direct ? 'Have focused one-on-one conversations with classmates.' : 'Learn together, ask questions, and stay connected with your class.'}
        action={!direct ? <button className="primary-button" onClick={() => setShowGroupForm(true)}><Plus /> Create group</button> : undefined}
      />

      <div className="chat-layout">
        <aside className="chat-list">
          <div className="chat-list-header">
            <strong>{direct ? 'Messages' : 'Your groups'}</strong>
            <span>{direct ? directContacts.length : groups.length}</span>
          </div>
          {direct ? (
            directContacts.map(c => (
              <button
                key={c.id}
                className={`chat-contact ${activeContactId === c.id ? 'active' : ''}`}
                onClick={() => { setActiveContactId(c.id); setActiveDirectName(c.name) }}
              >
                <span className="avatar avatar-small">{c.name.slice(0, 2).toUpperCase()}</span>
                <span>
                  <strong>{c.name}</strong>
                  <small>{c.role} · Tap to chat</small>
                </span>
              </button>
            ))
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
                  <small>Active class discussion</small>
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
              <small>{direct ? 'Online now' : 'Course community'}</small>
            </div>
          </div>

          <div ref={messageListRef} className="message-list">
            {messages.length === 0 ? (
              <p className="empty-chat-message">No messages in this conversation yet. Say hello!</p>
            ) : (
              messages.map((msg) => {
                const isMine = user ? msg.sender_id === user.id : msg.sender_name.includes('Peter')
                return (
                  <div className={`chat-message ${isMine ? 'mine' : ''}`} key={msg.id}>
                    <span className="avatar avatar-tiny">
                      {isMine ? (user?.avatar || 'PE') : msg.sender_name.slice(0, 2).toUpperCase()}
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
                placeholder={direct ? 'Write a direct message...' : 'Message the group...'}
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
                <p>Start a focused space for classmates to learn together.</p>
              </div>
              <button type="button" className="icon-btn" onClick={() => setShowGroupForm(false)} aria-label="Close form"><X /></button>
            </div>
            <label>
              Group name
              <input
                required
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="e.g. CSC 405 Network Study Circle"
              />
            </label>
            <label>
              Description
              <textarea
                value={newGroupDesc}
                onChange={e => setNewGroupDesc(e.target.value)}
                placeholder="What will this group be about?"
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

// ---------------- ADMIN PAGE ----------------
function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [applications, setApplications] = useState<RepresentativeApplication[]>([])
  const [loading, setLoading] = useState(true)

  const loadAdmin = async () => {
    try {
      setLoading(true)
      const [adminStats, apps] = await Promise.all([
        apiRequest<AdminStats>('/admin/stats'),
        apiRequest<RepresentativeApplication[]>('/admin/applications'),
      ])
      setStats(adminStats)
      setApplications(apps || [])
    } catch (err) {
      console.error('Failed to load admin portal:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdmin()
  }, [])

  const handleApprove = async (id: number) => {
    try {
      await apiRequest(`/admin/applications/${id}/approve`, { method: 'POST' })
      await loadAdmin()
    } catch (err: any) {
      alert(err.message || 'Failed to approve application')
    }
  }

  const handleReject = async (id: number) => {
    try {
      await apiRequest(`/admin/applications/${id}/reject`, { method: 'POST' })
      await loadAdmin()
    } catch (err: any) {
      alert(err.message || 'Failed to reject application')
    }
  }

  return (
    <>
      <PageHeader
        title="Admin overview"
        subtitle="A clear view of activity across Example University."
        action={<button className="primary-button"><Settings /> Admin settings</button>}
      />

      <div className="admin-stats stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><Users /></div>
          <div>
            <span>Total students</span>
            <strong>{stats?.total_students ?? 4}</strong>
            <small>Active registered students</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><BookOpen /></div>
          <div>
            <span>Active courses</span>
            <strong>{stats?.active_courses ?? 4}</strong>
            <small>Across departments</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><ShieldCheck /></div>
          <div>
            <span>Pending applications</span>
            <strong>{stats?.pending_applications ?? applications.filter(a => a.status === 'Pending').length}</strong>
            <small className="warning-text">Needs review</small>
          </div>
        </div>
      </div>

      <Panel>
        <div className="panel-header">
          <div>
            <h2>Representative applications</h2>
            <p>Live applications awaiting review</p>
          </div>
        </div>
        <div className="admin-table">
          <div className="table-head">
            <span>Applicant</span>
            <span>Course</span>
            <span>Submitted</span>
            <span>Status</span>
          </div>
          {loading ? (
            <p className="loading-state"><Loader2 className="animate-spin inline mr-2" /> Loading queue...</p>
          ) : applications.length === 0 ? (
            <p className="empty-state">No representative applications in queue.</p>
          ) : (
            applications.map((app) => (
              <div className="table-row" key={app.id}>
                <span>
                  <strong>{app.applicant_name}</strong>
                  <small>{app.applicant_email}</small>
                </span>
                <span>{app.course_code}</span>
                <span>{app.submitted_at ? app.submitted_at.split('T')[0] : 'Recent'}</span>
                <span>
                  {app.status === 'Pending' ? (
                    <div className="flex gap-2">
                      <button className="primary-button btn-small" onClick={() => handleApprove(app.id)}>Approve</button>
                      <button className="secondary-button btn-small" onClick={() => handleReject(app.id)}>Reject</button>
                    </div>
                  ) : (
                    <span className={`status ${app.status.toLowerCase()}`}>{app.status}</span>
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </Panel>
    </>
  )
}

// ---------------- SETTINGS PAGE ----------------
function SettingsPage({ user, onLogout, onUpdateUser }: { user: User | null; onLogout: () => void; onUpdateUser: (u: User) => void }) {
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [institution, setInstitution] = useState(user?.institution || '')
  const [department, setDepartment] = useState(user?.department || '')
  const [level, setLevel] = useState(user?.academic_level || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const updated = await apiRequest<User>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName,
          institution,
          department,
          academic_level: level,
        }),
      })
      onUpdateUser(updated)
      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      alert(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Profile & settings" subtitle="Manage your academic profile, preferences, and account security." />

      {message && <div className="notice-banner success mb-4"><Check /> {message}</div>}

      <div className="settings-layout">
        <Panel>
          <div className="settings-profile">
            <span className="avatar profile-avatar">{user?.avatar || 'PE'}</span>
            <div>
              <h2>{user?.full_name || 'Student Name'}</h2>
              <p>{user?.email || 'student@example.edu.ng'}</p>
              <Pill tone="verified-pill">{user?.role?.toUpperCase() || 'STUDENT'} · {user?.academic_level || '400 Level'}</Pill>
            </div>
          </div>
          <div className="settings-list">
            <button><span><Users /> Academic profile</span><ChevronRight /></button>
            <button><span><Bell /> Notifications</span><span className="toggle on">On</span></button>
            <button><span><ShieldCheck /> Account security (Argon2id)</span><ChevronRight /></button>
            <button onClick={onLogout}><span className="danger">Log out</span><ChevronRight /></button>
          </div>
        </Panel>

        <Panel>
          <div className="panel-header">
            <div>
              <h2>Academic information</h2>
              <p>Personalize your experience</p>
            </div>
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            <label>
              Full name
              <input value={fullName} onChange={e => setFullName(e.target.value)} required />
            </label>
            <label>
              Institution
              <input value={institution} onChange={e => setInstitution(e.target.value)} required />
            </label>
            <label>
              Department
              <input value={department} onChange={e => setDepartment(e.target.value)} required />
            </label>
            <label>
              Academic level
              <input value={level} onChange={e => setLevel(e.target.value)} required />
            </label>
            <button type="submit" className="primary-button mt-4" disabled={saving}>
              {saving ? <Loader2 className="animate-spin inline mr-1" /> : 'Save changes'}
            </button>
          </form>
        </Panel>
      </div>
    </>
  )
}

// ---------------- AUTH PAGES ----------------
function Auth({ register, go, onLogin }: { register: boolean; go: (view: View) => void; onLogin: (u: User, token: string) => void }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const endpoint = register ? '/auth/register' : '/auth/login'
      const payload = register
        ? { full_name: fullName, email, password }
        : { email, password }

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

  // Quick 1-click test fill
  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('password123')
  }

  return (
    <main className="auth-shell">
      <section className="auth-form-side">
        <div className="auth-brand"><Logo /></div>
        <div className="auth-card">
          <Pill>Example University</Pill>
          <h1>{register ? 'Create your account' : 'Welcome back'}</h1>
          <p>{register ? 'Start staying informed about your academic journey.' : 'Log in to continue to your academic workspace.'}</p>

          {error && <div className="notice-banner error mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            {register && (
              <label>
                Full name
                <input
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Peter Chijioke"
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.edu.ng"
              />
            </label>
            <label>
              Password
              <div className="password-input">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
            </label>

            {!register && (
              <div className="demo-credentials mb-3">
                <small className="text-muted block mb-1">Quick login with seeded accounts:</small>
                <div className="flex gap-2">
                  <button type="button" className="btn-small secondary-button" onClick={() => fillDemo('peter.chijioke@example.edu.ng')}>
                    Peter (Student)
                  </button>
                  <button type="button" className="btn-small secondary-button" onClick={() => fillDemo('daniel.chukwu@example.edu.ng')}>
                    Daniel (Rep)
                  </button>
                </div>
              </div>
            )}

            <button className="primary-button auth-submit" type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin inline mr-2" /> : null}
              {register ? 'Create account' : 'Log in'} <ChevronRight />
            </button>
          </form>

          <p className="auth-switch">
            {register ? 'Already have an account?' : 'New to Course Rep?'}
            <button onClick={() => go(register ? 'Login' : 'Register')}>
              {register ? 'Log in' : 'Create an account'}
            </button>
          </p>
        </div>
      </section>

      <aside className="auth-story">
        <button className="auth-story-logo" onClick={() => go('Landing')} aria-label="Go to Course Rep marketing page"><Logo /></button>
        <div className="story-glow story-glow-one" />
        <div className="story-glow story-glow-two" />
        <div className="story-content">
          <span className="story-kicker">Your academic command centre</span>
          <h2>Stay ahead of every lecture, deadline, and update.</h2>
          <p>Course Rep brings your academic life into one calm, focused workspace built for students who want to move with clarity.</p>
          <div className="story-stat-row">
            <div><strong>4</strong><span>active courses</span></div>
            <div><strong>6</strong><span>upcoming lectures</span></div>
            <div><strong>3</strong><span>new updates</span></div>
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

function Onboarding({ go, onUpdateUser }: { go: (view: View) => void; onUpdateUser: (u: User) => void }) {
  const [institution, setInstitution] = useState('Example University')
  const [department, setDepartment] = useState('Computer Science')
  const [level, setLevel] = useState('400 Level')
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    try {
      setLoading(true)
      const updated = await apiRequest<User>('/auth/onboarding', {
        method: 'POST',
        body: JSON.stringify({ institution, department, academic_level: level }),
      })
      onUpdateUser(updated)
      go('Overview')
    } catch (err: any) {
      alert(err.message || 'Failed to save onboarding')
      go('Overview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <aside className="auth-story">
        <button className="auth-story-logo" onClick={() => go('Landing')} aria-label="Go to Course Rep marketing page"><Logo /></button>
        <div className="story-glow story-glow-one" />
        <div className="story-glow story-glow-two" />
        <div className="story-content">
          <span className="story-kicker">Your academic command centre</span>
          <h2>Set up your semester with confidence.</h2>
          <p>Tell us a little about your studies so Course Rep can show you the right courses, announcements, and timetable.</p>
        </div>
      </aside>

      <section className="auth-form-side">
        <div className="auth-brand"><Logo /></div>
        <div className="auth-card onboarding-card">
          <div className="stepper"><span className="active">1</span><i /><span>2</span><i /><span>3</span></div>
          <Pill>Academic profile setup</Pill>
          <h1>Tell us about your studies</h1>
          <p>We&apos;ll use this to personalize your courses, announcements, and timetable.</p>
          <label>
            Institution
            <select value={institution} onChange={e => setInstitution(e.target.value)}>
              <option>Example University</option>
              <option>University of Lagos</option>
              <option>University of Ibadan</option>
            </select>
          </label>
          <label>
            Department
            <select value={department} onChange={e => setDepartment(e.target.value)}>
              <option>Computer Science</option>
              <option>Software Engineering</option>
              <option>Electrical Engineering</option>
            </select>
          </label>
          <label>
            Academic level
            <select value={level} onChange={e => setLevel(e.target.value)}>
              <option>100 Level</option>
              <option>200 Level</option>
              <option>300 Level</option>
              <option>400 Level</option>
              <option>500 Level</option>
            </select>
          </label>
          <button className="primary-button auth-submit" onClick={handleContinue} disabled={loading}>
            {loading ? <Loader2 className="animate-spin inline mr-2" /> : null} Continue <ChevronRight />
          </button>
          <button className="skip-button" onClick={() => go('Overview')}>Skip for now</button>
        </div>
      </section>
    </main>
  )
}

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
          <Pill tone="landing-pill"><Sparkles /> Built for better semesters</Pill>
          <h1>Your academic life, <em>finally in one place.</em></h1>
          <p>Course Rep brings courses, announcements, timetables, conversations, and academic insights together so students can focus on making progress.</p>
          <div className="landing-cta">
            <button className="primary-button landing-primary" onClick={() => go('Register')}>Start your semester <ChevronRight /></button>
            <button className="landing-secondary" onClick={() => go('Login')}>Explore the workspace <ArrowUp /></button>
          </div>
          <div className="landing-trust">
            <span><Check /> Used by students who want clarity</span>
            <span><ShieldCheck /> Built for campus life</span>
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
                <h3>Good morning, Peter</h3>
                <div className="preview-stats">
                  <b>4<small>courses</small></b>
                  <b>6<small>lectures</small></b>
                  <b>3<small>deadlines</small></b>
                </div>
                <div className="preview-card">
                  <span>Next lecture</span>
                  <strong>Software Engineering</strong>
                  <small>Today · 10:00 AM · Lecture Hall B</small>
                </div>
                <div className="preview-card preview-ai">
                  <Sparkles />
                  <div>
                    <strong>Professor Atlas</strong>
                    <small>Ask anything about your academic record.</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="landing-proof">
        <span>Everything you need to stay in sync</span>
        <strong>Courses</strong>
        <strong>Calendar</strong>
        <strong>Community</strong>
        <strong>Academic insight</strong>
      </section>
      <section className="landing-features" id="features">
        <div>
          <p className="eyebrow">One calm workspace</p>
          <h2>Less chasing. More learning.</h2>
          <p>Every part of your student life is connected, clear, and easy to act on.</p>
        </div>
        <div className="feature-grid">
          <article><CalendarDays /><h3>Know what&apos;s next</h3><p>Keep lectures, deadlines, and personal events in one dependable calendar.</p></article>
          <article><MessageCircle /><h3>Stay connected</h3><p>Talk with classmates, create study groups, and keep conversations focused.</p></article>
          <article><Store /><h3>Trade on campus</h3><p>Buy, sell, and share course materials, devices, and everyday student essentials.</p><button className="feature-link" onClick={() => go('Marketplace')}>Explore marketplace <ChevronRight /></button></article>
          <article id="atlas"><Sparkles /><h3>Understand your progress</h3><p>Ask Professor Atlas to help you make sense of the academic record you uploaded.</p></article>
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
      label: 'Your academic analyst',
      title: 'Ask better questions about your academic record.',
      intro: 'Professor Atlas helps you understand the record you have uploaded, spot patterns, and plan your next move with more confidence.',
      cards: [
        ['Understand', 'Ask about grades, credits, course progress, and academic standing.'],
        ['Prioritize', 'Get a clearer view of what deserves your attention this week.'],
        ['Plan ahead', 'Use your record as a starting point for thoughtful academic decisions.'],
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
        <p>Course Rep was created to make academic life feel less scattered, more connected, and easier to navigate.</p>
      </section>
      <section className="about-story">
        <div>
          <p className="eyebrow">Why we built it</p>
          <h2>Students deserve a clearer path through every semester.</h2>
        </div>
        <div>
          <p>Important updates live in one place, class conversations in another, and academic records are often difficult to understand. Course Rep brings those pieces together in one calm workspace.</p>
          <p>Whether you are checking your next lecture, joining a study group, or planning your next academic move, Course Rep helps you stay informed and in control.</p>
        </div>
      </section>
      <section className="about-values">
        <article><span>01</span><h3>Clarity over clutter</h3><p>Simple tools and useful information, without the noise.</p></article>
        <article><span>02</span><h3>Progress together</h3><p>Better academic journeys are built through community.</p></article>
        <article><span>03</span><h3>Designed for students</h3><p>Every feature starts with the realities of campus life.</p></article>
      </section>
      <section className="landing-bottom">
        <p className="eyebrow">Your semester starts here</p>
        <h2>Make academic life feel more manageable.</h2>
        <button className="primary-button landing-primary" onClick={() => go('Register')}>Get started with Course Rep <ChevronRight /></button>
      </section>
      <SiteFooter go={go} />
    </main>
  )
}

function SupportPage() {
  return (
    <>
      <PageHeader title="Support center" subtitle="We're here to help you stay on track with your academic journey." />
      <div className="support-hero">
        <div className="support-hero-icon"><Headphones /></div>
        <div>
          <p className="eyebrow">Need a hand?</p>
          <h2>Let&apos;s get things sorted.</h2>
          <p>Reach out to the Course Rep support team for help with your account, courses, messages, or anything else in your workspace.</p>
        </div>
      </div>
      <div className="support-grid">
        <Panel className="support-card">
          <div className="support-icon support-email"><Mail /></div>
          <div>
            <p className="eyebrow">Email support</p>
            <h2>Send us an email</h2>
            <p>For detailed questions or issues that need a little more context.</p>
            <a href="mailto:support@courserep.app">support@courserep.app</a>
            <small>We usually reply within one business day.</small>
          </div>
        </Panel>
        <Panel className="support-card">
          <div className="support-icon support-phone"><Phone /></div>
          <div>
            <p className="eyebrow">Phone support</p>
            <h2>Talk to our team</h2>
            <p>For urgent account or access issues, give us a call during support hours.</p>
            <a href="tel:+2348001234567">+234 800 123 4567</a>
            <small>Monday–Friday, 9:00 AM–5:00 PM WAT</small>
          </div>
        </Panel>
      </div>
      <Panel className="support-note">
        <strong>Before you contact us</strong>
        <span>Include your university, level, and a short description of the issue so we can help you faster.</span>
      </Panel>
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
    view === 'My Courses' ? <CoursesPage go={go} /> :
    view === 'Calendar' ? <CalendarPage /> :
    view === 'Announcements' ? <AnnouncementsPage /> :
    view === 'Representative' ? <RepresentativePage user={user} /> :
    view === 'Marketplace' ? <MarketplacePage /> :
    view === 'Student Groups' ? <ChatPage direct={false} user={user} /> :
    view === 'Direct Messages' ? <ChatPage direct={true} user={user} /> :
    view === 'Professor Atlas' ? <ProfessorAtlasPage /> :
    view === 'Support Center' ? <SupportPage /> :
    view === 'Settings' ? <SettingsPage user={user} onLogout={handleLogout} onUpdateUser={u => setUser(u)} /> :
    <AdminPage />

  const primaryNav: [string, ElementType][] = [
    ['Overview', LayoutDashboard],
    ['My Courses', BookOpen],
    ['Calendar', CalendarDays],
    ['Announcements', Bell],
    ['Representative', ShieldCheck],
  ]
  const communityNav: [string, ElementType][] = [
    ['Marketplace', Store],
    ['Student Groups', Users],
    ['Direct Messages', MessageCircle],
  ]
  const accountNav: [string, ElementType][] = [
    ['Settings', Settings],
    ['Admin', Users],
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

  const userDisplayName = user?.full_name || 'Peter Chijioke'
  const userAvatar = user?.avatar || 'PE'
  const userRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student'
  const userLevel = user?.academic_level || '400 Level'

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
            <small>{userRole} · {userLevel}</small>
          </span>
          <ChevronRight />
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          <div className="nav-section">
            <span className="nav-section-label">Workspace</span>
            {renderNav(primaryNav)}
          </div>
          <div className="nav-section">
            <span className="nav-section-label">Community</span>
            {renderNav(communityNav)}
          </div>
          <div className="nav-section">
            <span className="nav-section-label">Account</span>
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
          <span className="version">Course Rep v1.0 · {user?.institution || 'Example University'}</span>
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
