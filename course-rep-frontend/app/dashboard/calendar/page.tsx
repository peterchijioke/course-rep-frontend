'use client'

import { useState } from 'react'
import { CalendarDays, Plus, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { Pill } from '@/components/pill'
import { courses, initialCalendarEvents, type CalendarEvent } from '@/lib/data'

export default function CalendarPage() {
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState<'Week' | 'List'>('Week')
  const [selectedDay, setSelectedDay] = useState('Mon 12')
  const [events, setEvents] = useState<CalendarEvent[]>(initialCalendarEvents)
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

    // Reorder visible events by inserting at target index
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

  const moveEventToDay = (day: string) => {
    if (draggedIndex === null) return
    const itemToMove = visibleEvents[draggedIndex]
    if (!itemToMove) return

    setEvents((current) =>
      current.map((item) =>
        item === itemToMove ? { ...item, date: day } : item
      )
    )
    setSelectedDay(day)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const addEvent = (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.title.trim()) return
    setEvents((current) => [
      ...current,
      {
        title: draft.title.trim(),
        course: draft.course,
        date: draft.date,
        time: `${draft.start} – ${draft.end}`,
        location: draft.location || 'No location',
        tone: 'amber-bar',
        removable: true,
      },
    ])
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

  return (
    <>
      <PageHeader
        title="Academic calendar"
        subtitle="Your lectures and deadlines for the week of October 12–18, 2026."
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
              key={`${item.title}-${index}`}
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
                {item.time.split(' ')[0]}
                <br />
                <small>{item.time.includes('PM') ? 'PM' : 'AM'}</small>
              </span>
              <div className={`schedule-bar ${item.tone}`}>
                <Pill>{item.course}</Pill>
                <strong>{item.title}</strong>
                <span>
                  {item.location} · {item.time}
                </span>
                {item.removable && (
                  <button
                    type="button"
                    className="event-remove"
                    onClick={() =>
                      setEvents((current) =>
                        current.filter((event) => event !== item)
                      )
                    }
                    aria-label={`Remove ${item.title}`}
                  >
                    <Trash2 /> Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {visibleEvents.length === 0 && (
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
                aria-label="Close add event form"
              >
                <X />
              </button>
            </div>

            <label>
              Event title
              <input
                required
                autoFocus
                value={draft.title}
                onChange={(event) =>
                  setDraft({ ...draft, title: event.target.value })
                }
                placeholder="e.g. Study group"
              />
            </label>

            <div className="event-field-grid">
              <label>
                Date
                <select
                  value={draft.date}
                  onChange={(event) =>
                    setDraft({ ...draft, date: event.target.value })
                  }
                >
                  {['Mon 12', 'Tue 13', 'Wed 14', 'Thu 15', 'Fri 16'].map(
                    (day) => (
                      <option key={day}>{day}</option>
                    )
                  )}
                </select>
              </label>

              <label>
                Course
                <select
                  value={draft.course}
                  onChange={(event) =>
                    setDraft({ ...draft, course: event.target.value })
                  }
                >
                  <option>Personal event</option>
                  {courses.map((course) => (
                    <option key={course.code}>{course.code}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="event-field-grid">
              <label>
                Start time
                <input
                  type="time"
                  value={draft.start}
                  onChange={(event) =>
                    setDraft({ ...draft, start: event.target.value })
                  }
                />
              </label>

              <label>
                End time
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
                value={draft.location}
                onChange={(event) =>
                  setDraft({ ...draft, location: event.target.value })
                }
                placeholder="Optional"
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
                <Plus /> Save event
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
