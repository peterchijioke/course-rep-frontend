'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, Plus, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { Pill } from '@/components/pill'
import { api, type TimetableSlot, type Course } from '@/lib/api'

export default function CalendarPage() {
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'Week' | 'List'>('Week')
  const [selectedDay, setSelectedDay] = useState('Mon 12')
  const [events, setEvents] = useState<TimetableSlot[]>([])
  const [coursesList, setCoursesList] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const [draft, setDraft] = useState({
    title: '',
    date: 'Mon 12',
    start: '10:00',
    end: '11:00',
    location: '',
    course: 'Personal event',
  })
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    const fetchTimetableAndCourses = async () => {
      setLoading(true)
      try {
        const slots = await api.timetable.getAll()
        setEvents(slots || [])
      } catch (err) {
        console.error('Failed to load timetable:', err)
      }

      try {
        const c = await api.courses.getAll()
        setCoursesList(c || [])
      } catch (err) {
        console.error('Failed to load courses:', err)
      }
      setLoading(false)
    }

    fetchTimetableAndCourses()
  }, [])

  const visibleEvents =
    viewMode === 'List' ? events : events.filter((item) => item.date === selectedDay)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDropOnItem = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null) return
    if (draggedIndex === targetIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const itemToMove = visibleEvents[draggedIndex]
    if (!itemToMove) return

    const newVisible = [...visibleEvents]
    newVisible.splice(draggedIndex, 1)
    newVisible.splice(targetIndex, 0, itemToMove)

    if (viewMode === 'Week') {
      const otherEvents = events.filter((e) => e.date !== selectedDay)
      setEvents([...newVisible, ...otherEvents])
    } else {
      setEvents(newVisible)
    }

    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const moveEventToDay = async (day: string) => {
    if (draggedIndex === null) return
    const itemToMove = visibleEvents[draggedIndex]
    if (!itemToMove) return

    setEvents((current) =>
      current.map((item) =>
        item.id === itemToMove.id ? { ...item, date: day } : item
      )
    )
    setSelectedDay(day)
    setDraggedIndex(null)
    setDragOverIndex(null)

    if (itemToMove.id) {
      try {
        await api.timetable.updateDate(itemToMove.id, day)
      } catch (err) {
        console.warn('Failed to persist date move to backend:', err)
      }
    }
  }

  const addEvent = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.title.trim()) return

    try {
      const created = await api.timetable.create({
        title: draft.title.trim(),
        date: draft.date,
        start: draft.start,
        end: draft.end,
        location: draft.location || 'No location',
        course: draft.course,
        tone: 'amber-bar',
      })

      if (created) {
        setEvents((current) => [...current, created])
      }
    } catch (err) {
      // Local optimistic fallback
      const fallbackSlot: TimetableSlot = {
        id: Date.now(),
        title: draft.title.trim(),
        course_code: draft.course,
        date: draft.date,
        time: `${draft.start} – ${draft.end}`,
        location: draft.location || 'Campus',
        tone: 'amber-bar',
        is_personal: true,
        removable: true,
      }
      setEvents((current) => [...current, fallbackSlot])
    }

    setDraft({
      title: '',
      date: 'Mon 12',
      start: '10:00',
      end: '11:00',
      location: '',
      course: 'Personal event',
    })
    setShowForm(false)
  }

  const removeEvent = async (slotId: number) => {
    setEvents((current) => current.filter((event) => event.id !== slotId))
    try {
      await api.timetable.delete(slotId)
    } catch (err) {
      console.warn('Failed to delete event from backend:', err)
    }
  }

  return (
    <>
      <PageHeader
        title="Academic calendar"
        subtitle="Your lectures and deadlines for the active academic semester."
        action={
          <button
            type="button"
            className="primary-button"
            onClick={() => setShowForm(true)}
          >
            <Plus /> Add event
          </button>
        }
      />

      <div className="calendar-tabs">
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

      <Panel className="schedule">
        {viewMode === 'Week' && (
          <div className="week-row">
            {['Mon 12', 'Tue 13', 'Wed 14', 'Thu 15', 'Fri 16'].map((d) => (
              <button
                type="button"
                className={selectedDay === d ? 'active' : ''}
                onClick={() => setSelectedDay(d)}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                }}
                onDrop={() => moveEventToDay(d)}
                key={d}
              >
                <small>{d.split(' ')[0]}</small>
                <strong>{d.split(' ')[1]}</strong>
              </button>
            ))}
          </div>
        )}

        <div className="schedule-list">
          {visibleEvents.map((item, index) => (
            <div
              className={`schedule-item ${
                draggedIndex === index ? 'is-dragging' : ''
              } ${dragOverIndex === index ? 'is-drag-over' : ''}`}
              key={item.id || `${item.title}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOverItem(e, index)}
              onDrop={(e) => handleDropOnItem(e, index)}
              onDragEnd={() => {
                setDraggedIndex(null)
                setDragOverIndex(null)
              }}
            >
              <span className="schedule-time">
                {item.time ? item.time.split(' ')[0] : '10:00'}
                <br />
                <small>{item.time && item.time.includes('PM') ? 'PM' : 'AM'}</small>
              </span>
              <div className={`schedule-bar ${item.tone || 'blue-bar'}`}>
                <Pill>{item.course_code || 'EVENT'}</Pill>
                <strong>{item.title}</strong>
                <span>
                  {item.location} · {item.time}
                </span>
                {item.removable && (
                  <button
                    type="button"
                    className="event-remove"
                    onClick={() => removeEvent(item.id)}
                    aria-label={`Remove ${item.title}`}
                  >
                    <Trash2 /> Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {!loading && visibleEvents.length === 0 && (
          <div className="calendar-empty">
            <CalendarDays />
            <strong>No events scheduled</strong>
            <span>Select another day or add a personal event.</span>
          </div>
        )}
      </Panel>

      {showForm && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setShowForm(false)
          }
        >
          <form
            className="event-dialog"
            onSubmit={addEvent}
            aria-labelledby="event-title"
          >
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Calendar</p>
                <h2 id="event-title">Add an event</h2>
                <p>Keep a personal reminder alongside your lectures.</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowForm(false)}
                aria-label="Close dialog"
              >
                <X />
              </button>
            </div>

            <label>
              Title
              <input
                type="text"
                placeholder="Study session, assignment due..."
                value={draft.title}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
                required
              />
            </label>

            <div className="dialog-grid">
              <label>
                Day
                <select
                  value={draft.date}
                  onChange={(event) =>
                    setDraft({ ...draft, date: event.target.value })
                  }
                >
                  <option value="Mon 12">Monday 12</option>
                  <option value="Tue 13">Tuesday 13</option>
                  <option value="Wed 14">Wednesday 14</option>
                  <option value="Thu 15">Thursday 15</option>
                  <option value="Fri 16">Friday 16</option>
                </select>
              </label>

              <label>
                Category
                <select
                  value={draft.course}
                  onChange={(event) =>
                    setDraft({ ...draft, course: event.target.value })
                  }
                >
                  <option value="Personal event">Personal event</option>
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
                Start
                <input
                  type="time"
                  value={draft.start}
                  onChange={(event) =>
                    setDraft({ ...draft, start: event.target.value })
                  }
                />
              </label>
              <label>
                End
                <input
                  type="time"
                  value={draft.end}
                  onChange={(event) =>
                    setDraft({ ...draft, end: event.target.value })
                  }
                />
              </label>
            </div>

            <label>
              Location
              <input
                type="text"
                placeholder="Room, building, or link"
                value={draft.location}
                onChange={(event) =>
                  setDraft({ ...draft, location: event.target.value })
                }
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
