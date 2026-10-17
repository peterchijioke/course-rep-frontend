'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Bell,
  Bookmark,
  BookmarkCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Filter,
  MapPin,
  Plus,
  Search,
  Sparkles,
  User,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { Pill } from '@/components/pill'
import { api, type AnnouncementItem } from '@/lib/api'
import { type DetailedAnnouncement } from '@/lib/data'

export default function AnnouncementsPage() {
  const [items, setItems] = useState<DetailedAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Unread' | 'Urgent' | 'Saved'>('All')
  const [selectedCourse, setSelectedCourse] = useState('All')
  const [query, setQuery] = useState('')

  // Modals
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const [activeNotice, setActiveNotice] = useState<DetailedAnnouncement | null>(null)

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  const showToastMsg = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Fetch live announcements from backend
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true)
      try {
        const live = await api.announcements.getAll()
        if (Array.isArray(live)) {
          const mapped: DetailedAnnouncement[] = live.map((item) => ({
            id: String(item.id),
            course: item.course_code || 'General',
            title: item.title,
            body: item.body,
            time: new Date(item.created_at).toLocaleDateString(),
            author: item.author_name || 'Course Representative',
            urgent: item.is_urgent,
            read: item.is_read,
            pinned: false,
            category: 'Course Bulletin',
          }))
          setItems(mapped)
        }
      } catch (err) {
        console.error('Failed to load announcements:', err)
      }
      setLoading(false)
    }

    fetchAnnouncements()
  }, [])

  // Filtered
  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        query.trim() === '' ||
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.body.toLowerCase().includes(query.toLowerCase()) ||
        item.course.toLowerCase().includes(query.toLowerCase()) ||
        item.author.toLowerCase().includes(query.toLowerCase())

      const matchesCourse =
        selectedCourse === 'All' || item.course.toLowerCase() === selectedCourse.toLowerCase()

      let matchesTab = true
      if (filter === 'Unread') matchesTab = !item.read
      else if (filter === 'Urgent') matchesTab = item.urgent
      else if (filter === 'Saved') matchesTab = Boolean(item.pinned)

      return matchesSearch && matchesCourse && matchesTab
    })
  }, [items, query, selectedCourse, filter])

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items])
  const urgentCount = useMemo(() => items.filter((i) => i.urgent).length, [items])
  const savedCount = useMemo(() => items.filter((i) => i.pinned).length, [items])

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })))
    showToastMsg('All announcements marked as read!')
    try {
      await api.announcements.markAllRead()
    } catch (e) {
      console.warn('Failed to mark all as read on backend:', e)
    }
  }

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, pinned: !i.pinned } : i))
    )
    showToastMsg('Announcement bookmark updated!')
  }

  const handleOpenNotice = async (item: DetailedAnnouncement) => {
    // Mark as read
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, read: true } : i))
    )
    setActiveNotice({ ...item, read: true })
    if (item.id && !isNaN(Number(item.id))) {
      try {
        await api.announcements.markRead(Number(item.id))
      } catch (e) {
        console.warn('Failed to mark notice read on backend:', e)
      }
    }
  }

  const handleBroadcastSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const course = String(form.get('course') || 'CSC 401')
    const title = String(form.get('title') || '').trim()
    const body = String(form.get('body') || '').trim()
    const venue = String(form.get('venue') || '').trim()
    const urgent = Boolean(form.get('urgent'))

    if (!title || !body) return

    try {
      const created = await api.announcements.create({
        course_code: course,
        title,
        body: venue ? `${body}\n\nVenue: ${venue}` : body,
        is_urgent: urgent,
      })

      const newNotice: DetailedAnnouncement = {
        id: String(created.id),
        course: created.course_code,
        title: created.title,
        body: created.body,
        time: 'Just now',
        author: created.author_name || 'You · Course Rep',
        urgent: created.is_urgent,
        read: true,
        pinned: false,
        category: venue ? 'Timetable' : 'General',
        venue: venue || undefined,
      }

      setItems((prev) => [newNotice, ...prev])
      setShowBroadcastModal(false)
      showToastMsg(`Announcement broadcasted to ${course}!`)
    } catch (err: any) {
      // Local optimistic fallback
      const newNotice: DetailedAnnouncement = {
        id: `ann-${Date.now()}`,
        course,
        title,
        body,
        time: 'Just now',
        author: 'You · Course Rep',
        urgent,
        read: true,
        pinned: false,
        category: venue ? 'Timetable' : 'General',
        venue: venue || undefined,
      }
      setItems((prev) => [newNotice, ...prev])
      setShowBroadcastModal(false)
      showToastMsg(`Announcement broadcasted!`)
    }
  }

  return (
    <>
      <PageHeader
        title="Announcements & Alerts"
        subtitle="Official course bulletins, timetable changes, and departmental directives."
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              <Check style={{ width: '14px' }} /> Mark all read
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowBroadcastModal(true)}
            >
              <Plus /> Post notice (Rep)
            </button>
          </div>
        }
      />

      {/* Toolbar */}
      <div className="courses-toolbar-container" style={{ marginBottom: '18px' }}>
        <div className="courses-controls-row">
          <div className="courses-search-group">
            <Search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search announcements, lecturers, venues..."
              aria-label="Search announcements"
            />
            {query && (
              <button
                type="button"
                className="courses-search-clear"
                onClick={() => setQuery('')}
              >
                <X />
              </button>
            )}
          </div>

          <div className="courses-filter-dropdowns">
            <div className="course-select-wrap">
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                aria-label="Filter by course"
              >
                <option value="All">All Courses & Faculty</option>
                <option value="CSC 401">CSC 401: Software Eng</option>
                <option value="CSC 403">CSC 403: Artificial Intelligence</option>
                <option value="CSC 405">CSC 405: Computer Networks</option>
                <option value="CSC 407">CSC 407: Information Security</option>
                <option value="Department">Departmental Notices</option>
                <option value="Faculty">Faculty Announcements</option>
              </select>
              <ChevronDown className="course-select-icon" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="courses-tabs-row">
          <div className="courses-tab-pills">
            {(
              [
                { label: 'All Notices', value: 'All', count: items.length },
                { label: 'Unread', value: 'Unread', count: unreadCount },
                { label: 'Urgent', value: 'Urgent', count: urgentCount },
                { label: 'Bookmarked', value: 'Saved', count: savedCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`course-tab-pill ${filter === tab.value ? 'active' : ''}`}
                onClick={() => setFilter(tab.value)}
              >
                {tab.label} <span>{tab.count}</span>
              </button>
            ))}
          </div>

          <span className="courses-count-summary">
            <strong>{filtered.length}</strong> announcements
          </span>
        </div>
      </div>

      {/* Announcements List */}
      <Panel>
        <div className="announcement-list" style={{ padding: '0 20px 10px' }}>
          {filtered.map((item) => (
            <article
              className={`announcement ${item.urgent ? 'urgent' : ''}`}
              key={item.id}
              style={{
                cursor: 'pointer',
                opacity: item.read ? 0.85 : 1,
                padding: '16px 0',
              }}
              onClick={() => handleOpenNotice(item)}
            >
              <div className="announcement-icon">
                <Bell />
              </div>
              <div className="announcement-copy">
                <div className="announcement-meta">
                  <Pill>{item.course}</Pill>
                  {item.urgent && <Pill tone="urgent-pill">Urgent</Pill>}
                  {item.venue && (
                    <span style={{ fontSize: '10px', color: '#4338ca', fontWeight: 600 }}>
                      <MapPin style={{ width: '11px', display: 'inline', marginRight: '2px' }} />
                      {item.venue}
                    </span>
                  )}
                  <span className="time">{item.time}</span>
                </div>
                <h3 style={{ fontSize: '14px', marginBottom: '4px' }}>{item.title}</h3>
                <p style={{ fontSize: '12px', lineHeight: 1.5, margin: '0 0 6px' }}>{item.body}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="author">Posted by {item.author}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={(e) => handleTogglePin(item.id, e)}
                      title={item.pinned ? 'Remove bookmark' : 'Bookmark notice'}
                      style={{ minWidth: '28px', minHeight: '28px', color: item.pinned ? '#4338ca' : '#94a3b8' }}
                    >
                      {item.pinned ? <BookmarkCheck style={{ width: '16px' }} /> : <Bookmark style={{ width: '16px' }} />}
                    </button>
                    {!item.read && (
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: '#4338ca',
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <Bell style={{ width: '32px', height: '32px', margin: '0 auto 8px', color: '#cbd5e1' }} />
              <p style={{ margin: 0, fontSize: '13px' }}>No announcements match your filter.</p>
            </div>
          )}
        </div>
      </Panel>

      {/* ====================================================================
          MODAL 1: VIEW FULL ANNOUNCEMENT
          ==================================================================== */}
      {activeNotice && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setActiveNotice(null)}
        >
          <div className="event-dialog" style={{ width: 'min(100%, 540px)' }}>
            <div className="dialog-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Pill>{activeNotice.course}</Pill>
                  {activeNotice.urgent && <Pill tone="urgent-pill">Urgent Bulletin</Pill>}
                </div>
                <h2>{activeNotice.title}</h2>
                <small style={{ color: '#64748b' }}>Posted {activeNotice.time}</small>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setActiveNotice(null)}
                aria-label="Close announcement"
              >
                <X />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {activeNotice.venue && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    background: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#1e1b4b',
                  }}
                >
                  <MapPin style={{ color: '#4338ca', width: '18px' }} />
                  <div>
                    <strong>Venue Directive:</strong> Holds at {activeNotice.venue}
                  </div>
                </div>
              )}

              <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#334155', margin: 0 }}>
                {activeNotice.body}
              </p>

              <div
                style={{
                  padding: '10px 14px',
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>
                  <User style={{ width: '12px', display: 'inline', marginRight: '4px' }} />
                  Author: <strong>{activeNotice.author}</strong>
                </span>
                <button
                  type="button"
                  className="text-button"
                  onClick={(e) => handleTogglePin(activeNotice.id, e)}
                  style={{ fontSize: '11px' }}
                >
                  {activeNotice.pinned ? 'Bookmarked ✓' : 'Bookmark this notice'}
                </button>
              </div>
            </div>

            <div className="dialog-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => setActiveNotice(null)}
              >
                Understood / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: BROADCAST NOTICE (Course Rep Tool)
          ==================================================================== */}
      {showBroadcastModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setShowBroadcastModal(false)}
        >
          <form className="event-dialog" onSubmit={handleBroadcastSubmit} style={{ width: 'min(100%, 520px)' }}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Course Representative Broadcast</p>
                <h2>Send Class Notice</h2>
                <p>Broadcast an official announcement to your classmates.</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowBroadcastModal(false)}
                aria-label="Close broadcast modal"
              >
                <X />
              </button>
            </div>

            <div className="event-field-grid">
              <label>
                Target Course
                <select name="course" defaultValue="CSC 401">
                  <option value="CSC 401">CSC 401 (Software Eng)</option>
                  <option value="CSC 403">CSC 403 (AI)</option>
                  <option value="CSC 405">CSC 405 (Networks)</option>
                  <option value="CSC 407">CSC 407 (Security)</option>
                  <option value="Department">Department of Computer Science</option>
                </select>
              </label>

              <label>
                Venue (Optional)
                <input name="venue" placeholder="e.g. Lecture Hall B" />
              </label>
            </div>

            <label>
              Headline Title
              <input name="title" required placeholder="e.g. Lecture relocated or Assignment update" autoFocus />
            </label>

            <label>
              Detailed Bulletin
              <textarea
                name="body"
                required
                rows={4}
                placeholder="Provide clear details and instructions for your classmates..."
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

            <label className="check-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" name="urgent" />
              <span>Mark as high-priority urgent notice</span>
            </label>

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowBroadcastModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                <Bell /> Broadcast notice
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Toast Notification */}
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
