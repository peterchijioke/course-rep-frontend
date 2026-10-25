'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Grid,
  List as ListIcon,
  MapPin,
  Plus,
  Trash2,
  X,
  BookOpen,
  Calendar as CalendarIcon,
  Sparkles,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { Pill } from '@/components/pill'
import { api, type TimetableSlot, type Course } from '@/lib/api'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

export default function CalendarPage() {
  const [today] = useState<Date>(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())
  const [viewDate, setViewDate] = useState<Date>(() => new Date())
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'List'>('Month')
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('All')

  const [showForm, setShowForm] = useState(false)
  const [events, setEvents] = useState<TimetableSlot[]>([])
  const [coursesList, setCoursesList] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const [draft, setDraft] = useState({
    title: '',
    date: formatISODate(new Date()),
    start: '10:00',
    end: '12:00',
    location: '',
    course: 'Personal event',
    isRecurring: false,
  })

  // Load backend timetable slots and enrolled courses
  useEffect(() => {
    let isMounted = true
    const fetchTimetableAndCourses = async () => {
      setLoading(true)
      try {
        const slots = await api.timetable.getAll()
        if (isMounted) setEvents(slots || [])
      } catch (err: any) {
        if (!err?.message?.includes('expired') && !err?.message?.includes('token')) {
          console.error('Failed to load timetable:', err)
        }
      }

      try {
        const c = await api.courses.getMyEnrolled()
        const all = Array.isArray(c) && c.length > 0 ? c : await api.courses.getAll()
        if (isMounted) setCoursesList(all || [])
      } catch (err: any) {
        if (!err?.message?.includes('expired') && !err?.message?.includes('token')) {
          console.error('Failed to load courses:', err)
        }
      }
      if (isMounted) setLoading(false)
    }

    fetchTimetableAndCourses()
    return () => {
      isMounted = false
    }
  }, [])

  // Month navigation helpers
  const currentYear = viewDate.getFullYear()
  const currentMonth = viewDate.getMonth()

  const handlePrev = () => {
    if (viewMode === 'Month') {
      setViewDate(new Date(currentYear, currentMonth - 1, 1))
    } else if (viewMode === 'Week') {
      const nextDate = new Date(selectedDate)
      nextDate.setDate(selectedDate.getDate() - 7)
      setSelectedDate(nextDate)
      setViewDate(nextDate)
    } else {
      const nextDate = new Date(selectedDate)
      nextDate.setDate(selectedDate.getDate() - 1)
      setSelectedDate(nextDate)
      setViewDate(nextDate)
    }
  }

  const handleNext = () => {
    if (viewMode === 'Month') {
      setViewDate(new Date(currentYear, currentMonth + 1, 1))
    } else if (viewMode === 'Week') {
      const nextDate = new Date(selectedDate)
      nextDate.setDate(selectedDate.getDate() + 7)
      setSelectedDate(nextDate)
      setViewDate(nextDate)
    } else {
      const nextDate = new Date(selectedDate)
      nextDate.setDate(selectedDate.getDate() + 1)
      setSelectedDate(nextDate)
      setViewDate(nextDate)
    }
  }

  const handleToday = () => {
    const now = new Date()
    setSelectedDate(now)
    setViewDate(now)
  }

  const handleMonthChange = (newMonth: number) => {
    setViewDate(new Date(currentYear, newMonth, 1))
  }

  const handleYearChange = (newYear: number) => {
    setViewDate(new Date(newYear, currentMonth, 1))
  }

  // Week days calculation around selectedDate (Sunday to Saturday)
  const currentWeekDays = useMemo(() => {
    const center = new Date(selectedDate)
    const dayOfWeek = center.getDay() // 0 = Sun, 1 = Mon ...
    const sunday = new Date(center)
    sunday.setDate(center.getDate() - dayOfWeek)

    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday)
      d.setDate(sunday.getDate() + i)
      days.push(d)
    }
    return days
  }, [selectedDate])

  // Month days grid calculation (with previous/next month filler days)
  const monthCalendarGrid = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay() // 0 = Sun
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate()

    const cells: { date: Date; isCurrentMonth: boolean }[] = []

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        date: new Date(currentYear, currentMonth - 1, prevMonthDays - i),
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        date: new Date(currentYear, currentMonth, day),
        isCurrentMonth: true,
      })
    }

    // Next month padding to fill out 35 or 42 grid cells
    const remaining = (7 - (cells.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        date: new Date(currentYear, currentMonth + 1, i),
        isCurrentMonth: false,
      })
    }

    return cells
  }, [currentYear, currentMonth])

  // Match events to a specific date
  const getEventsForDate = (targetDate: Date) => {
    const targetISO = formatISODate(targetDate)
    const targetDayShort = DAY_NAMES_SHORT[targetDate.getDay()] // 'Sun', 'Mon'
    const targetDayNumber = targetDate.getDate()

    // 1. Explicit timetable slots saved in DB
    const matchingCustom = events.filter((ev) => {
      if (selectedCourseFilter !== 'All' && ev.course_code !== selectedCourseFilter) return false

      if (!ev.date) return false

      // Match explicit ISO date 'YYYY-MM-DD'
      if (ev.date === targetISO) return true

      // Match weekday name 'Mon', 'Monday'
      if (ev.date.toLowerCase().startsWith(targetDayShort.toLowerCase())) return true

      // Match legacy 'Mon 12' style
      const parts = ev.date.split(' ')
      if (parts.length >= 2) {
        if (parts[0].toLowerCase().startsWith(targetDayShort.toLowerCase())) return true
        if (Number(parts[1]) === targetDayNumber) return true
      }

      return false
    })

    // 2. Automatically populate enrolled courses that have weekly lecture schedules
    const courseWeeklyLectures: TimetableSlot[] = []
    coursesList.forEach((c) => {
      if (selectedCourseFilter !== 'All' && c.code !== selectedCourseFilter) return
      if (!c.next_lecture) return

      // Example c.next_lecture format: "Mon, 10:00 AM" or "Tue, 12:00 PM"
      const dayPrefix = c.next_lecture.slice(0, 3).toLowerCase()
      if (dayPrefix === targetDayShort.toLowerCase()) {
        const timePart = c.next_lecture.includes(',') ? c.next_lecture.split(',')[1].trim() : '10:00 AM'
        
        // Avoid duplicate if custom slot already exists for this course
        const alreadyInSlot = matchingCustom.some((s) => s.course_code === c.code)
        if (!alreadyInSlot) {
          courseWeeklyLectures.push({
            id: -(c.id || Math.floor(Math.random() * 1000)),
            course_code: c.code,
            title: `${c.name} Lecture`,
            date: targetISO,
            time: `${timePart} – ${addHours(timePart, 2)}`,
            location: c.lecture_venue || 'Department Lecture Hall',
            tone: c.color ? `${c.color}-bar` : 'indigo-bar',
            is_personal: false,
            removable: false,
          })
        }
      }
    })

    return [...matchingCustom, ...courseWeeklyLectures]
  }

  function addHours(timeStr: string, hoursToAdd: number): string {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i)
    if (!match) return '12:00 PM'
    let h = parseInt(match[1], 10)
    const m = match[2]
    const ampm = match[3] ? match[3].toUpperCase() : 'AM'
    if (ampm === 'PM' && h < 12) h += 12
    if (ampm === 'AM' && h === 12) h = 0
    h = (h + hoursToAdd) % 24
    const newAmpm = h >= 12 ? 'PM' : 'AM'
    const newH = h % 12 || 12
    return `${newH}:${m} ${newAmpm}`
  }

  const selectedDateEvents = useMemo(() => {
    return getEventsForDate(selectedDate)
  }, [selectedDate, events, coursesList, selectedCourseFilter])

  // Adding a new event
  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.title.trim()) return

    try {
      const created = await api.timetable.create({
        title: draft.title.trim(),
        date: draft.date,
        start: draft.start,
        end: draft.end,
        location: draft.location || 'Lecture Hall / Online',
        course: draft.course,
        tone: 'indigo-bar',
      })

      if (created) {
        setEvents((prev) => [...prev, created])
      }
    } catch (err) {
      // Local fallback
      const fallbackSlot: TimetableSlot = {
        id: Date.now(),
        title: draft.title.trim(),
        course_code: draft.course,
        date: draft.date,
        time: `${draft.start} – ${draft.end}`,
        location: draft.location || 'Campus Workspace',
        tone: 'indigo-bar',
        is_personal: true,
        removable: true,
      }
      setEvents((prev) => [...prev, fallbackSlot])
    }

    setShowForm(false)
    setDraft({
      title: '',
      date: formatISODate(selectedDate),
      start: '10:00',
      end: '12:00',
      location: '',
      course: 'Personal event',
      isRecurring: false,
    })
  }

  const removeEvent = async (slotId: number) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== slotId))
    try {
      if (slotId > 0) {
        await api.timetable.delete(slotId)
      }
    } catch (err) {
      console.warn('Failed to delete event:', err)
    }
  }

  return (
    <>
      <PageHeader
        title="Academic Calendar"
        subtitle="Full interactive university calendar, course lecture schedules, and deadlines."
        action={
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setDraft((prev) => ({ ...prev, date: formatISODate(selectedDate) }))
              setShowForm(true)
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus style={{ width: '15px' }} /> Add event
          </button>
        }
      />

      {/* Calendar Controls & Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {/* Left: View Mode Tabs */}
        <div className="calendar-tabs" style={{ margin: 0 }}>
          <button
            type="button"
            className={viewMode === 'Month' ? 'active' : ''}
            onClick={() => setViewMode('Month')}
          >
            Month
          </button>
          <button
            type="button"
            className={viewMode === 'Week' ? 'active' : ''}
            onClick={() => setViewMode('Week')}
          >
            Week
          </button>
          <button
            type="button"
            className={viewMode === 'List' ? 'active' : ''}
            onClick={() => setViewMode('List')}
          >
            List
          </button>
        </div>

        {/* Center / Right: Month & Year Selector + Navigation Arrows */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={handleToday}
            style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 650 }}
          >
            Today
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={handlePrev}
              title="Previous"
              style={{ padding: '6px 10px', display: 'grid', placeItems: 'center' }}
            >
              <ChevronLeft style={{ width: '15px' }} />
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={handleNext}
              title="Next"
              style={{ padding: '6px 10px', display: 'grid', placeItems: 'center' }}
            >
              <ChevronRight style={{ width: '15px' }} />
            </button>
          </div>

          {/* Month Selector Dropdown */}
          <select
            value={currentMonth}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--foreground)',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx}>
                {m}
              </option>
            ))}
          </select>

          {/* Year Selector Dropdown */}
          <select
            value={currentYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--foreground)',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Course Filter */}
          {coursesList.length > 0 && (
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--foreground)',
                fontSize: '12px',
              }}
            >
              <option value="All">All Courses</option>
              {coursesList.map((c) => (
                <option key={c.id || c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: FULL MONTH GRID */}
      {viewMode === 'Month' && (
        <Panel style={{ padding: '0', overflow: 'hidden', marginBottom: '22px' }}>
          {/* Day of Week Headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              borderBottom: '1px solid var(--border)',
              background: 'rgba(255, 255, 255, 0.02)',
              textAlign: 'center',
              fontWeight: 650,
              fontSize: '12px',
              color: 'var(--muted-foreground)',
              padding: '10px 0',
            }}
          >
            {DAY_NAMES_SHORT.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          {/* Calendar Month Cells */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              background: 'var(--border)',
              gap: '1px',
            }}
          >
            {monthCalendarGrid.map(({ date, isCurrentMonth }, idx) => {
              const dayEvents = getEventsForDate(date)
              const isToday = isSameDay(date, today)
              const isSelected = isSameDay(date, selectedDate)

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(date)}
                  style={{
                    minHeight: '96px',
                    padding: '8px',
                    background: isSelected
                      ? 'rgba(99, 102, 241, 0.12)'
                      : isCurrentMonth
                      ? 'var(--card)'
                      : 'rgba(15, 23, 42, 0.03)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    border: isSelected ? '1px solid #6366f1' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: isToday ? 800 : 600,
                        width: '24px',
                        height: '24px',
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '50%',
                        background: isToday ? '#6366f1' : undefined,
                        color: isToday
                          ? '#fff'
                          : isCurrentMonth
                          ? 'var(--foreground)'
                          : 'var(--muted-foreground)',
                      }}
                    >
                      {date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: '#6366f1',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '8px',
                          background: 'rgba(99, 102, 241, 0.12)',
                        }}
                      >
                        {dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Preview Event Badges inside cell */}
                  <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                    {dayEvents.slice(0, 2).map((ev, eIdx) => (
                      <div
                        key={eIdx}
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: ev.tone === 'amber-bar' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                          color: ev.tone === 'amber-bar' ? '#d97706' : '#6366f1',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={`${ev.course_code}: ${ev.title}`}
                      >
                        {ev.course_code} {ev.time ? ev.time.split('–')[0].trim() : ''}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span style={{ fontSize: '9px', color: 'var(--muted-foreground)' }}>
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      )}

      {/* VIEW MODE 2: DYNAMIC 7-DAY WEEK ROW */}
      {viewMode === 'Week' && (
        <Panel className="schedule" style={{ marginBottom: '22px' }}>
          <div
            className="week-row"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {currentWeekDays.map((d) => {
              const dayStr = DAY_NAMES_SHORT[d.getDay()]
              const isSelected = isSameDay(d, selectedDate)
              const isToday = isSameDay(d, today)
              const dayEventCount = getEventsForDate(d).length

              return (
                <button
                  type="button"
                  key={d.toISOString()}
                  className={isSelected ? 'active' : ''}
                  onClick={() => setSelectedDate(d)}
                  style={{
                    border: 0,
                    padding: '16px 8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--card)' : 'transparent',
                    borderBottom: isSelected ? '3px solid #6366f1' : '3px solid transparent',
                  }}
                >
                  <small style={{ display: 'block', fontSize: '11px', color: 'var(--muted-foreground)' }}>
                    {dayStr}
                  </small>
                  <strong
                    style={{
                      display: 'inline-block',
                      fontSize: '18px',
                      marginTop: '4px',
                      padding: '2px 8px',
                      borderRadius: '50%',
                      background: isToday ? '#6366f1' : undefined,
                      color: isToday ? '#fff' : isSelected ? '#6366f1' : 'var(--foreground)',
                    }}
                  >
                    {d.getDate()}
                  </strong>
                  {dayEventCount > 0 && (
                    <span
                      style={{
                        display: 'block',
                        fontSize: '10px',
                        marginTop: '4px',
                        color: isSelected ? '#6366f1' : '#94a3b8',
                        fontWeight: 650,
                      }}
                    >
                      {dayEventCount} {dayEventCount === 1 ? 'lecture' : 'lectures'}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Panel>
      )}

      {/* DAY SCHEDULE & EVENT LIST (for Selected Date or Full List) */}
      <Panel>
        <div
          className="panel-header"
          style={{
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays style={{ color: '#6366f1', width: '18px' }} />
              {viewMode === 'List'
                ? `Upcoming Semester Schedule (${MONTH_NAMES[currentMonth]} ${currentYear})`
                : `${DAY_NAMES_FULL[selectedDate.getDay()]}, ${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`}
            </h2>
            <p>
              {viewMode === 'List'
                ? 'All lectures, lab sessions, and test dates across your enrolled courses.'
                : isSameDay(selectedDate, today)
                ? 'Today’s active lectures and deadlines.'
                : 'Scheduled academic events for this selected day.'}
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setDraft((prev) => ({ ...prev, date: formatISODate(selectedDate) }))
              setShowForm(true)
            }}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <Plus style={{ width: '14px' }} /> Add to this date
          </button>
        </div>

        <div className="schedule-list">
          {selectedDateEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '42px 16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#6366f1',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <CalendarIcon style={{ width: '22px', height: '22px' }} />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 650 }}>
                No events scheduled for {DAY_NAMES_FULL[selectedDate.getDay()]}, {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getDate()}
              </h3>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', margin: '0 auto 16px', maxWidth: '420px' }}>
                You have no lecture timetable or assignment deadlines on this date. You can add personal study blocks or test reminders anytime.
              </p>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setDraft((prev) => ({ ...prev, date: formatISODate(selectedDate) }))
                  setShowForm(true)
                }}
                style={{ fontSize: '12px' }}
              >
                <Plus style={{ width: '14px' }} /> Add an event for this date
              </button>
            </div>
          ) : (
            selectedDateEvents.map((item, index) => (
              <div className="schedule-item" key={item.id || index}>
                <span className="schedule-time">
                  {item.time ? item.time.split('–')[0].trim() : '10:00'}
                  <br />
                  <small>{item.time && item.time.includes('PM') ? 'PM' : 'AM'}</small>
                </span>
                <div className={`schedule-bar ${item.tone || 'blue-bar'}`} style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <Pill>{item.course_code || 'EVENT'}</Pill>
                    {item.removable && (
                      <button
                        type="button"
                        className="event-remove"
                        onClick={() => removeEvent(Number(item.id))}
                        title="Delete event"
                      >
                        <Trash2 /> Remove
                      </button>
                    )}
                  </div>
                  <strong>{item.title}</strong>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <MapPin style={{ width: '12px' }} /> {item.location} &bull; <Clock style={{ width: '12px' }} /> {item.time}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>

      {/* ADD EVENT MODAL */}
      {showForm && (
        <div className="dialog-backdrop">
          <form className="dialog-card" onSubmit={addEvent} style={{ maxWidth: '480px' }}>
            <div className="dialog-header">
              <div>
                <h2>Add Academic Event</h2>
                <p>Add a lecture, test, assignment deadline, or personal study block.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowForm(false)}
              >
                <X />
              </button>
            </div>

            <label>
              Event Title *
              <input
                type="text"
                placeholder="e.g. CSC 401 Tutorial, Mid-Semester CA Test"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                required
                autoFocus
              />
            </label>

            <div className="dialog-grid">
              <label>
                Date *
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  required
                />
              </label>

              <label>
                Course / Category
                <select
                  value={draft.course}
                  onChange={(e) => setDraft({ ...draft, course: e.target.value })}
                >
                  <option value="Personal event">Personal Study / Task</option>
                  {coursesList.map((c) => (
                    <option key={c.id || c.code} value={c.code}>
                      {c.code} · {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="dialog-grid">
              <label>
                Start Time
                <input
                  type="time"
                  value={draft.start}
                  onChange={(e) => setDraft({ ...draft, start: e.target.value })}
                />
              </label>
              <label>
                End Time
                <input
                  type="time"
                  value={draft.end}
                  onChange={(e) => setDraft({ ...draft, end: e.target.value })}
                />
              </label>
            </div>

            <label>
              Location / Venue
              <input
                type="text"
                placeholder="e.g. Lecture Hall B, ICT Lab 1, Library"
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              />
            </label>

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                Add to calendar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
