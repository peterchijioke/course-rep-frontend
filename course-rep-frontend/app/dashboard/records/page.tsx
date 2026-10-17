'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  Layers,
  LineChart,
  Percent,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { Pill } from '@/components/pill'
import { nigerianTertiaryData, getEnrolledCourses, type Course } from '@/lib/data'
import {
  getAcademicHistory,
  saveAcademicHistory,
  resetAcademicHistory,
  updateCourseInSemester,
  addCourseToSemester,
  deleteCourseFromSemester,
  addCustomSemester,
  NUC_GRADE_SCALE,
  GRADE_POINT_MAP,
  type AcademicHistory,
  type SemesterGradeRecord,
  type CourseGradeItem,
  type GradeOption,
} from '@/lib/academic-records'

export default function AcademicRecordsPage() {
  const [history, setHistory] = useState<AcademicHistory>(() => getAcademicHistory())
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>(() => getEnrolledCourses())
  const [activeSemesterId, setActiveSemesterId] = useState<string>('sem-400-1')
  const [targetCGPA, setTargetCGPA] = useState<number>(4.52)
  const [showTranscriptModal, setShowTranscriptModal] = useState<boolean>(false)
  const [showAddCourseModal, setShowAddCourseModal] = useState<boolean>(false)
  const [showAddSemesterModal, setShowAddSemesterModal] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false)

  // New course form state
  const [newCourseCode, setNewCourseCode] = useState('')
  const [newCourseTitle, setNewCourseTitle] = useState('')
  const [newCourseUnits, setNewCourseUnits] = useState(3)
  const [newCourseGrade, setNewCourseGrade] = useState<GradeOption>('A')
  const [newCourseScore, setNewCourseScore] = useState(75)

  // New semester form state
  const [newSemLevel, setNewSemLevel] = useState('400 Level')
  const [newSemSemester, setNewSemSemester] = useState<'First Semester' | 'Second Semester'>('Second Semester')
  const [newSemSession, setNewSemSession] = useState('2026/2027')

  // Listen to external updates from other tabs/pages
  useEffect(() => {
    const handleUpdate = () => {
      setHistory(getAcademicHistory())
      setEnrolledCourses(getEnrolledCourses())
    }
    window.addEventListener('academic-records-updated', handleUpdate)
    window.addEventListener('enrolled-courses-updated', handleUpdate)
    return () => {
      window.removeEventListener('academic-records-updated', handleUpdate)
      window.removeEventListener('enrolled-courses-updated', handleUpdate)
    }
  }, [])

  const handleSelectEnrolledCourse = (val: string) => {
    if (val === 'custom') {
      setIsCustomMode(true)
      setNewCourseCode('')
      setNewCourseTitle('')
      setNewCourseUnits(3)
      return
    }
    setIsCustomMode(false)
    const found = enrolledCourses.find((c) => c.code === val)
    if (found) {
      setNewCourseCode(found.code)
      setNewCourseTitle(found.name)
      setNewCourseUnits(found.units || 3)
    } else {
      setNewCourseCode('')
      setNewCourseTitle('')
      setNewCourseUnits(3)
    }
  }

  const handleSyncEnrolledCourses = () => {
    const updated = getAcademicHistory()
    setHistory(updated)
    triggerToast('All registered courses from My Courses synchronized into your records!')
  }

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Active semester record
  const activeSemester = useMemo(() => {
    return history.semesters.find((s) => s.id === activeSemesterId) || history.semesters[0]
  }, [history, activeSemesterId])

  // Target CGPA calculation & required GPA across remaining credit hours
  const targetAnalysis = useMemo(() => {
    const totalRequiredUnits = history.totalUnitsRequired // 152
    const currentCompletedUnits = history.totalUnitsEarned // 118
    const currentPoints = history.overallPoints // 520
    const remainingUnits = Math.max(0, totalRequiredUnits - currentCompletedUnits)

    const pointsNeededForTarget = targetCGPA * totalRequiredUnits
    const deficitPoints = Math.max(0, pointsNeededForTarget - currentPoints)
    const requiredGPA = remainingUnits > 0 ? deficitPoints / remainingUnits : 0

    const isAchievable = requiredGPA <= 5.0

    return {
      totalRequiredUnits,
      currentCompletedUnits,
      currentPoints,
      remainingUnits,
      targetPoints: pointsNeededForTarget,
      deficitPoints: Number(deficitPoints.toFixed(2)),
      requiredGPA: Number(requiredGPA.toFixed(2)),
      isAchievable,
    }
  }, [history, targetCGPA])

  // Update course inline (Units, Grade, Score)
  const handleUpdateUnits = (semesterId: string, courseId: string, newUnits: number) => {
    const validUnits = Math.max(1, Math.min(10, newUnits))
    const updated = updateCourseInSemester(semesterId, courseId, { units: validUnits })
    setHistory(updated)
    triggerToast(`Updated credit hours to ${validUnits} units`)
  }

  const handleUpdateGrade = (semesterId: string, courseId: string, newGrade: GradeOption) => {
    const updated = updateCourseInSemester(semesterId, courseId, { grade: newGrade })
    setHistory(updated)
    triggerToast(`Updated grade to '${newGrade}' (${GRADE_POINT_MAP[newGrade]} pts/unit)`)
  }

  const handleUpdateScore = (semesterId: string, courseId: string, scoreVal: number) => {
    const validScore = Math.max(0, Math.min(100, scoreVal))
    const updated = updateCourseInSemester(semesterId, courseId, { score: validScore })
    setHistory(updated)
  }

  const handleDeleteCourse = (semesterId: string, courseId: string) => {
    const updated = deleteCourseFromSemester(semesterId, courseId)
    setHistory(updated)
    triggerToast('Course removed from semester records')
  }

  const handleAddCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCourseCode || !newCourseTitle) return
    const targetSem = activeSemesterId === 'all' ? history.semesters[history.semesters.length - 1].id : activeSemesterId

    const updated = addCourseToSemester(targetSem, {
      code: newCourseCode,
      title: newCourseTitle,
      units: newCourseUnits,
      grade: newCourseGrade,
      score: newCourseScore,
    })
    setHistory(updated)
    setShowAddCourseModal(false)
    setNewCourseCode('')
    setNewCourseTitle('')
    setNewCourseUnits(3)
    triggerToast(`Added ${newCourseCode} (${newCourseUnits} Credit Units) successfully!`)
  }

  const handleAddSemesterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const updated = addCustomSemester({
      level: newSemLevel,
      semester: newSemSemester,
      academicSession: newSemSession,
    })
    setHistory(updated)
    const newestSem = updated.semesters[updated.semesters.length - 1]
    if (newestSem) setActiveSemesterId(newestSem.id)
    setShowAddSemesterModal(false)
    triggerToast(`Created ${newSemLevel} ${newSemSemester} session!`)
  }

  const handleReset = () => {
    if (window.confirm('Reset all semester courses, credit units, and grades to standard curriculum records?')) {
      const reset = resetAcademicHistory()
      setHistory(reset)
      setActiveSemesterId('sem-400-1')
      triggerToast('Academic records reset to default curriculum transcript.')
    }
  }

  // If no courses are enrolled, show an informative locked state guiding the student to My Courses
  if (enrolledCourses.length === 0) {
    return (
      <>
        <PageHeader
          title="Academic Records & CGPA Portal"
          subtitle="Official NUC 5.0 academic transcript, credit hours accounting, semester grade points, and honours forecasting."
        />
        <Panel style={{ padding: '60px 30px', textAlign: 'center', maxWidth: '640px', margin: '40px auto' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(67, 56, 202, 0.1)',
              color: '#4338ca',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 20px',
            }}
          >
            <GraduationCap style={{ width: '32px', height: '32px' }} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 750, color: 'var(--foreground)', marginBottom: '10px' }}>
            Academic Records Inactive
          </h2>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            To view and calculate your semester GPA, credit units, and graduation honours, you must first enroll the courses you offer. Academic Records automatically reuses your registered courses from <strong>My Courses</strong> with zero duplicated data entry.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link
              href="/dashboard/courses?prompt=enroll-first"
              className="primary-button"
              style={{ fontSize: '13px', padding: '12px 20px' }}
            >
              <BookOpen style={{ width: '16px' }} /> Go to My Courses to Enroll Courses
            </Link>
          </div>
        </Panel>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Academic Records & CGPA Portal"
        subtitle="Official NUC 5.0 academic transcript, credit hours accounting, semester grade points, and honours forecasting."
        action={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="text-button"
              onClick={handleReset}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <RotateCcw style={{ width: '14px' }} /> Reset defaults
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowTranscriptModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Printer style={{ width: '15px' }} /> View &amp; Print Official Transcript
            </button>
          </div>
        }
      />

      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#1e1b4b',
            color: '#fff',
            padding: '12px 18px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 600,
            border: '1px solid #4338ca',
          }}
        >
          <CheckCircle2 style={{ color: '#10b981', width: '18px' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tertiary Institution & Student Identity Header Strip */}
      <div className="insights-institution-strip">
        <div className="insights-inst-logo">EU</div>
        <div>
          <strong style={{ fontSize: '13px' }}>
            {nigerianTertiaryData.institution} · {history.studentName} ({history.matricNo})
          </strong>
          <span>
            {nigerianTertiaryData.faculty} · Department of {history.department} · {nigerianTertiaryData.level} (Final Year)
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Pill tone="verified-pill">
            <ShieldCheck style={{ width: '13px', display: 'inline', marginRight: '4px' }} />
            Official NUC 5.0 Transcript
          </Pill>
        </div>
      </div>

      {/* Top 4 Cumulative Performance Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '22px' }}>
        <div className="stat-card">
          <div className="stat-icon purple">
            <GraduationCap />
          </div>
          <div>
            <span>Cumulative GPA (CGPA)</span>
            <strong>
              {history.overallCGPA.toFixed(2)}{' '}
              <small style={{ fontSize: '12px', color: '#64748b' }}>/ 5.00</small>
            </strong>
            <small style={{ color: history.degreeClass.color, fontWeight: 700 }}>
              {history.degreeClass.title}
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <BookOpen />
          </div>
          <div>
            <span>Total Credit Hours / Units</span>
            <strong>
              {history.totalUnitsEarned}{' '}
              <small style={{ fontSize: '12px', color: '#64748b' }}>/ {history.totalUnitsRequired} Units</small>
            </strong>
            <small style={{ color: '#2563eb' }}>
              {targetAnalysis.remainingUnits} Credit Units remaining to graduate
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon emerald">
            <Award />
          </div>
          <div>
            <span>Total Quality Points (TCP)</span>
            <strong>
              {history.overallPoints.toFixed(1)}{' '}
              <small style={{ fontSize: '12px', color: '#64748b' }}>Points</small>
            </strong>
            <small style={{ color: '#059669' }}>
              Avg {(history.overallPoints / (history.totalUnitsEarned || 1)).toFixed(2)} pts/credit hour
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <Target />
          </div>
          <div>
            <span>Target CGPA Goal</span>
            <strong>
              {targetCGPA.toFixed(2)}{' '}
              <small style={{ fontSize: '12px', color: '#64748b' }}>/ 5.00</small>
            </strong>
            <small style={{ color: targetAnalysis.isAchievable ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              {targetAnalysis.isAchievable
                ? `Requires ${targetAnalysis.requiredGPA} GPA in 400L`
                : 'Deficit exceeds 5.0 max GPA'}
            </small>
          </div>
        </div>
      </div>

      {/* SEMESTER-BY-SEMESTER CREDIT HOURS & CGPA BREAKDOWN */}
      <Panel style={{ marginBottom: '24px' }}>
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers style={{ color: '#4338ca', width: '20px' }} />
              Semester Credit Hours &amp; CGPA Computation Hub
            </h2>
            <p>
              Inspect, customize, and calculate the exact credit hours, grade points, and semester GPAs
              required to attain your target degree classification.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="outline-button"
              onClick={handleSyncEnrolledCourses}
              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Ensure all courses enrolled on My Courses page are in this semester"
            >
              <RotateCcw style={{ width: '13px' }} /> Sync from My Courses
            </button>
            <button
              type="button"
              className="outline-button"
              onClick={() => setShowAddSemesterModal(true)}
              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus style={{ width: '14px' }} /> Add Semester
            </button>
            <Link
              href="/dashboard/courses"
              className="primary-button"
              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Add or remove official courses in My Courses"
            >
              <BookOpen style={{ width: '14px' }} /> Manage Courses in My Courses
            </Link>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Semester Selector Bar */}
          <div className="semester-tabs-bar">
            {history.semesters.map((sem) => (
              <button
                key={sem.id}
                type="button"
                className={`semester-tab-btn ${activeSemesterId === sem.id ? 'active' : ''}`}
                onClick={() => setActiveSemesterId(sem.id)}
              >
                <span>
                  {sem.level} · {sem.semester.replace(' Semester', '')}
                </span>
                <span className="semester-tab-badge">
                  {sem.totalUnits} Units · {sem.gpa.toFixed(2)} GPA
                </span>
              </button>
            ))}

            <button
              type="button"
              className={`semester-tab-btn ${activeSemesterId === 'all' ? 'active' : ''}`}
              onClick={() => setActiveSemesterId('all')}
            >
              <span>Full Transcript (All Semesters)</span>
              <span className="semester-tab-badge">{history.totalUnitsEarned} Total Units</span>
            </button>
          </div>

          {/* ACTIVE SEMESTER METRICS STRIP */}
          {activeSemesterId !== 'all' ? (
            !activeSemester ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--card)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                <GraduationCap style={{ width: '40px', height: '40px', color: '#6366f1', margin: '0 auto 12px', opacity: 0.8 }} />
                <h3 style={{ margin: '0 0 6px', fontSize: '15px', color: 'var(--foreground)' }}>No Semester Records Yet</h3>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', margin: '0 0 16px', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto' }}>
                  Click &quot;+ Add Semester Session&quot; above to log your verified course results and compute your live CGPA.
                </p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setShowAddSemesterModal(true)}
                  style={{ fontSize: '12px', padding: '8px 16px' }}
                >
                  <Plus style={{ width: '13px', marginRight: '6px' }} /> Add First Semester Record
                </button>
              </div>
            ) : (
            <div>
              <div className="sem-metrics-banner">
                <div className="sem-metric-box purple">
                  <span className="sem-metric-label">Semester Total Units (TNU)</span>
                  <div className="sem-metric-val">
                    {activeSemester.totalUnits}{' '}
                    <small style={{ fontSize: '13px', color: '#64748b' }}>Credit Hours</small>
                  </div>
                  <span className="sem-metric-sub">{activeSemester.courses.length} Courses Registered</span>
                </div>

                <div className="sem-metric-box emerald">
                  <span className="sem-metric-label">Semester Total Points (TCP)</span>
                  <div className="sem-metric-val">
                    {activeSemester.totalPoints.toFixed(1)}{' '}
                    <small style={{ fontSize: '13px', color: '#64748b' }}>Quality Pts</small>
                  </div>
                  <span className="sem-metric-sub">Sum of (Units × Grade Points)</span>
                </div>

                <div className="sem-metric-box indigo">
                  <span className="sem-metric-label">Semester GPA (SGPA)</span>
                  <div className="sem-metric-val" style={{ color: '#4338ca' }}>
                    {activeSemester.gpa.toFixed(2)}{' '}
                    <small style={{ fontSize: '13px', color: '#64748b' }}>/ 5.00</small>
                  </div>
                  <span className="sem-metric-sub">Formula: TCP ÷ TNU ({activeSemester.totalPoints} ÷ {activeSemester.totalUnits})</span>
                </div>

                <div className="sem-metric-box blue">
                  <span className="sem-metric-label">Cumulative Units (CTNU)</span>
                  <div className="sem-metric-val">
                    {activeSemester.cumulativeUnits}{' '}
                    <small style={{ fontSize: '13px', color: '#64748b' }}>Total Units</small>
                  </div>
                  <span className="sem-metric-sub">Through this semester</span>
                </div>

                <div className="sem-metric-box amber">
                  <span className="sem-metric-label">Progressive CGPA</span>
                  <div className="sem-metric-val" style={{ color: '#b45309' }}>
                    {activeSemester.cgpa.toFixed(2)}{' '}
                    <small style={{ fontSize: '13px', color: '#64748b' }}>/ 5.00</small>
                  </div>
                  <span className="sem-metric-sub">
                    {activeSemester.status === 'in_progress' ? 'Simulated CGPA' : 'Approved CGPA'}
                  </span>
                </div>
              </div>

              {/* SINGLE SOURCE OF TRUTH BANNER */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(67, 56, 202, 0.06)',
                  border: '1px solid rgba(67, 56, 202, 0.18)',
                  borderRadius: '10px',
                  marginBottom: '16px',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
                  <Sparkles style={{ width: '18px', height: '18px', color: '#4338ca', flexShrink: 0 }} />
                  <div style={{ fontSize: '12px', color: 'var(--foreground)', lineHeight: 1.5 }}>
                    <strong>Unified Course Registration:</strong> All courses below are drawn directly from your enrolled courses in <strong>My Courses</strong>. Enter your score (0–100), CA/Exam breakdown, or letter grade (A–F) to calculate your Grade Points and Semester GPA without duplicated effort.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleSyncEnrolledCourses}
                    className="outline-button"
                    style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <RotateCcw style={{ width: '12px' }} /> Sync My Courses
                  </button>
                  <Link
                    href="/dashboard/courses"
                    className="primary-button"
                    style={{ fontSize: '11px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <BookOpen style={{ width: '12px' }} /> Edit Courses
                  </Link>
                </div>
              </div>

              {/* COURSE-BY-COURSE CREDIT HOURS & QUALITY POINTS DATA TABLE */}
              <div className="cgpa-table-wrap">
                <table className="cgpa-table">
                  <thead>
                    <tr>
                      <th style={{ width: '110px' }}>Course Code</th>
                      <th>Course Title</th>
                      <th style={{ width: '130px', textAlign: 'center' }}>Credit Hours (Units)</th>
                      <th style={{ width: '110px', textAlign: 'center' }}>Score (100)</th>
                      <th style={{ width: '110px', textAlign: 'center' }}>Grade</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Grade Point</th>
                      <th style={{ width: '140px', textAlign: 'center' }}>Quality Points (QP)</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Status</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSemester.courses.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted-foreground)' }}>
                          No courses in this semester yet. Click &quot;Add Course to Semester&quot; above to register courses.
                        </td>
                      </tr>
                    ) : (
                      activeSemester.courses.map((course) => {
                        const gp = GRADE_POINT_MAP[course.grade] || 0
                        const qp = course.units * gp

                        return (
                          <tr key={course.id}>
                            <td>
                              <strong>{course.code}</strong>
                            </td>
                            <td>
                              <span>{course.title}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {/* Editable Credit Hours / Units */}
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: 'var(--accent)',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border)',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleUpdateUnits(activeSemester.id, course.id, course.units - 1)}
                                  disabled={course.units <= 1}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    padding: '0 4px',
                                    color: course.units <= 1 ? '#cbd5e1' : '#334155',
                                  }}
                                  title="Decrease credit hours"
                                >
                                  -
                                </button>
                                <span className="cgpa-unit-badge">{course.units} Units</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateUnits(activeSemester.id, course.id, course.units + 1)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    padding: '0 4px',
                                    color: '#334155',
                                  }}
                                  title="Increase credit hours"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={course.score ?? 70}
                                onChange={(e) =>
                                  handleUpdateScore(activeSemester.id, course.id, Number(e.target.value))
                                }
                                style={{
                                  width: '58px',
                                  textAlign: 'center',
                                  padding: '4px',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border)',
                                  background: 'var(--background)',
                                  color: 'var(--foreground)',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                }}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <select
                                value={course.grade}
                                onChange={(e) =>
                                  handleUpdateGrade(activeSemester.id, course.id, e.target.value as GradeOption)
                                }
                                className={`cgpa-grade-pill grade-${course.grade.toLowerCase()}`}
                                style={{ cursor: 'pointer', border: 'none', outline: 'none' }}
                              >
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                                <option value="E">E</option>
                                <option value="F">F</option>
                              </select>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>
                              {gp.toFixed(1)} pts
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="cgpa-qp-tag">
                                {qp.toFixed(1)} QP
                              </span>
                              <span style={{ display: 'block', fontSize: '9px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                                ({course.units}u × {gp.toFixed(1)})
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span
                                className="course-pill"
                                style={{
                                  fontSize: '10px',
                                  background:
                                    course.grade === 'F'
                                      ? 'rgba(239, 68, 68, 0.12)'
                                      : course.status === 'in_progress'
                                      ? 'rgba(99, 102, 241, 0.12)'
                                      : 'rgba(16, 185, 129, 0.12)',
                                  color:
                                    course.grade === 'F'
                                      ? '#ef4444'
                                      : course.status === 'in_progress'
                                      ? '#6366f1'
                                      : '#10b981',
                                }}
                              >
                                {course.grade === 'F' ? 'Carryover' : course.status === 'in_progress' ? 'Current' : 'Passed'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleDeleteCourse(activeSemester.id, course.id)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#ef4444',
                                  padding: '4px',
                                  borderRadius: '4px',
                                }}
                                title="Remove course"
                              >
                                <Trash2 style={{ width: '14px' }} />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                  {activeSemester.courses.length > 0 && (
                    <tfoot>
                      <tr style={{ background: 'var(--accent)', fontWeight: 800 }}>
                        <td colSpan={2}>
                          SEMESTER SUMMARY TOTALS ({activeSemester.level} · {activeSemester.semester})
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="cgpa-unit-badge" style={{ background: '#3b82f6', color: '#fff' }}>
                            {activeSemester.totalUnits} Units
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>—</td>
                        <td style={{ textAlign: 'center' }}>—</td>
                        <td style={{ textAlign: 'center' }}>—</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="cgpa-qp-tag" style={{ background: '#4338ca', color: '#fff' }}>
                            {activeSemester.totalPoints.toFixed(1)} QP
                          </span>
                        </td>
                        <td colSpan={2} style={{ textAlign: 'center', color: '#4338ca', fontSize: '13px' }}>
                          GPA: {activeSemester.gpa.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
            )
          ) : (
            /* ALL SEMESTERS FULL ACADEMIC TRANSCRIPT VIEW */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {history.semesters.map((sem) => (
                <div
                  key={sem.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '16px',
                    background: 'var(--card)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                      borderBottom: '1px solid var(--border)',
                      paddingBottom: '8px',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '14px', color: '#4338ca' }}>
                        {sem.level} — {sem.semester} ({sem.academicSession})
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', display: 'block' }}>
                        Status: {sem.status === 'completed' ? 'Senate Approved' : 'In Progress / Current'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span className="course-unit-pill">{sem.totalUnits} Credit Units</span>
                      <span className="cgpa-qp-tag">{sem.totalPoints.toFixed(1)} Quality Pts</span>
                      <span
                        className="course-pill"
                        style={{ background: '#4338ca', color: '#fff', fontWeight: 800, fontSize: '12px' }}
                      >
                        GPA: {sem.gpa.toFixed(2)}
                      </span>
                      <span
                        className="course-pill"
                        style={{ background: '#f59e0b', color: '#fff', fontWeight: 800, fontSize: '12px' }}
                      >
                        CGPA: {sem.cgpa.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <table className="cgpa-table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: '100px' }}>Code</th>
                        <th>Title</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Credit Units</th>
                        <th style={{ width: '70px', textAlign: 'center' }}>Grade</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Points</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Quality Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sem.courses.map((c) => (
                        <tr key={c.id}>
                          <td><strong>{c.code}</strong></td>
                          <td>{c.title}</td>
                          <td style={{ textAlign: 'center' }}><span className="cgpa-unit-badge">{c.units}u</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`cgpa-grade-pill grade-${c.grade.toLowerCase()}`}>{c.grade}</span>
                          </td>
                          <td style={{ textAlign: 'center' }}>{GRADE_POINT_MAP[c.grade].toFixed(1)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <strong style={{ color: '#4338ca' }}>{(c.units * GRADE_POINT_MAP[c.grade]).toFixed(1)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* NUC FORMULA CALLOUT & DATA EXPLAINER */}
          <div className="cgpa-formula-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles style={{ width: '18px', color: '#4338ca' }} />
              <strong style={{ fontSize: '13px' }}>
                How Credit Hours and Quality Points Determine Your NUC CGPA
              </strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '6px 0 0' }}>
              In the Nigerian University System (NUC Benchmark), cumulative performance is weighted
              directly by course credit units. Higher credit-hour courses (such as 3-unit, 4-unit, or 6-unit
              SIWES attachments) contribute proportionally more points to your degree classification than 1-unit or 2-unit courses.
            </p>

            <div className="formula-grid">
              <div className="formula-card">
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                  1. COURSE QUALITY POINTS (QP)
                </span>
                <code className="formula-math">QP = Credit Units × Grade Point</code>
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                  E.g., 3 Units × &apos;A&apos; (5.0) = 15.0 Points. A 4-unit course with an &apos;A&apos; yields 20.0 points.
                </span>
              </div>

              <div className="formula-card">
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                  2. SEMESTER GRADE POINT AVERAGE (SGPA)
                </span>
                <code className="formula-math">SGPA = Total QP (TCP) ÷ Total Units (TNU)</code>
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                  Sum of all quality points earned in that semester divided by total credit hours registered.
                </span>
              </div>

              <div className="formula-card">
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                  3. CUMULATIVE GPA (CGPA)
                </span>
                <code className="formula-math">CGPA = Cumulative TCP ÷ Cumulative TNU</code>
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                  Sum of quality points across ALL completed semesters divided by total registered credit hours.
                </span>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* TARGET CGPA GOAL FORECASTER & PROGRESSION */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1.3fr 1fr', gap: '22px', marginBottom: '24px' }}>
        {/* Panel 1: Target Honours Forecaster */}
        <Panel>
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target style={{ color: '#4338ca', width: '18px' }} /> Degree Honours &amp; Credit Hour Deficit Forecaster
              </h2>
              <p>Simulate the exact GPA needed across your remaining credit hours to hit your graduating target.</p>
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                background: 'var(--card)',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block' }}>
                  Target Graduating CGPA (out of 5.0)
                </label>
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                  First Class cutoff is 4.50 · 2:1 cutoff is 3.50
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="range"
                  min={3.50}
                  max={5.00}
                  step={0.01}
                  value={targetCGPA}
                  onChange={(e) => setTargetCGPA(Number(e.target.value))}
                  style={{ width: '140px', cursor: 'pointer' }}
                />
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#4338ca',
                    minWidth: '50px',
                    textAlign: 'right',
                  }}
                >
                  {targetCGPA.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Target Outcome banner */}
            <div
              style={{
                background: targetAnalysis.isAchievable ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${targetAnalysis.isAchievable ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                borderRadius: '10px',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Remaining Credit Units
                </span>
                <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px' }}>
                  {targetAnalysis.remainingUnits} Units
                </div>
                <small style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
                  (152 total - {targetAnalysis.currentCompletedUnits} earned)
                </small>
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Quality Points Deficit
                </span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#4338ca', marginTop: '2px' }}>
                  {targetAnalysis.deficitPoints} QP
                </div>
                <small style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
                  Required to reach {targetCGPA.toFixed(2)}
                </small>
              </div>

              <div>
                <span style={{ fontSize: '10px', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Required Remaining GPA
                </span>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: targetAnalysis.isAchievable ? '#059669' : '#dc2626',
                    marginTop: '2px',
                  }}
                >
                  {targetAnalysis.requiredGPA.toFixed(2)}
                </div>
                <small
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: targetAnalysis.isAchievable ? '#059669' : '#dc2626',
                  }}
                >
                  {targetAnalysis.isAchievable ? 'Achievable with Focus' : 'Mathematically impossible (> 5.0)'}
                </small>
              </div>
            </div>

            <div style={{ fontSize: '12px', lineHeight: 1.6, color: 'var(--foreground)' }}>
              <strong>Prof. Zikora Strategic Recommendation:</strong>
              <p style={{ margin: '4px 0 0', color: 'var(--muted-foreground)' }}>
                {targetAnalysis.isAchievable
                  ? `To achieve your target of ${targetCGPA.toFixed(2)} CGPA, you must average a minimum of ${targetAnalysis.requiredGPA.toFixed(2)} GPA across your remaining ${targetAnalysis.remainingUnits} credit hours in 400L. Prioritize your 3-unit courses (CSC 401, CSC 403, CSC 405, and CSC 407) and guarantee high scores in the Continuous Assessment (30%) component.`
                  : `A target of ${targetCGPA.toFixed(2)} requires more quality points than can be earned in the remaining ${targetAnalysis.remainingUnits} credit hours. However, maintaining straight A's (5.0 GPA) will elevate your final CGPA to ${(
                      (targetAnalysis.currentPoints + targetAnalysis.remainingUnits * 5.0) /
                      targetAnalysis.totalRequiredUnits
                    ).toFixed(2)}, firmly cementing your Second Class Upper honours with high distinction.`}
              </p>
            </div>
          </div>
        </Panel>

        {/* Panel 2: Semester CGPA Progression Trajectory */}
        <Panel>
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp style={{ color: '#059669', width: '18px' }} /> CGPA Progression Curve
              </h2>
              <p>Historical semester GPAs vs Cumulative CGPA trajectory.</p>
            </div>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {history.semesters.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 1fr 60px',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '11px',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--muted-foreground)' }}>
                  {s.level.split(' ')[0]}-{s.semester.startsWith('First') ? '1' : '2'}
                </span>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      marginBottom: '3px',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    <span>GPA: <strong>{s.gpa.toFixed(2)}</strong></span>
                    <span>CGPA: <strong>{s.cgpa.toFixed(2)}</strong> ({s.totalUnits}u)</span>
                  </div>
                  <div className="course-progress-track" style={{ height: '7px' }}>
                    <div
                      className="course-progress-fill"
                      style={{
                        width: `${(s.cgpa / 5.0) * 100}%`,
                        background:
                          s.cgpa >= 4.5
                            ? '#10b981'
                            : s.cgpa >= 3.5
                            ? '#4338ca'
                            : '#f59e0b',
                      }}
                    />
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontWeight: 800 }}>
                  {s.cgpa.toFixed(2)}
                </div>
              </div>
            ))}

            <div
              style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: 'var(--muted-foreground)',
              }}
            >
              <span>• Green: First Class (&ge;4.50)</span>
              <span>• Indigo: Second Class Upper (&ge;3.50)</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* MODAL 1: ADD COURSE TO SEMESTER */}
      {showAddCourseModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Add Course to Semester Record</h3>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--muted-foreground)' }}>
                  Adding to {activeSemester.level} · {activeSemester.semester}
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowAddCourseModal(false)}
              >
                <X style={{ width: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleAddCourseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, margin: 0 }}>
                    Select Course from My Courses (Single Source of Truth) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(!isCustomMode)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#4338ca',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    {isCustomMode ? '← Pick from Enrolled Courses' : '✏️ Or enter custom past course code'}
                  </button>
                </div>

                {!isCustomMode ? (
                  <select
                    value={newCourseCode}
                    onChange={(e) => handleSelectEnrolledCourse(e.target.value)}
                    className="insights-grade-select"
                    style={{ width: '100%', padding: '10px 12px', fontSize: '13px' }}
                    required
                  >
                    <option value="">-- Choose one of your registered courses --</option>
                    {enrolledCourses.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name} ({c.units || 3} Credit Units)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                        Course Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CSC 301"
                        value={newCourseCode}
                        onChange={(e) => setNewCourseCode(e.target.value.toUpperCase())}
                        className="search-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                        Course Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Structured Systems Analysis"
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        className="search-input"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {!isCustomMode && newCourseCode && (
                <div
                  style={{
                    background: 'var(--accent)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13px', color: '#4338ca' }}>{newCourseCode}</strong>
                    <span style={{ fontSize: '11px', display: 'block', color: 'var(--foreground)' }}>
                      {newCourseTitle}
                    </span>
                  </div>
                  <span className="cgpa-unit-badge">{newCourseUnits} Units</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Credit Hours (Units) *
                  </label>
                  <select
                    value={newCourseUnits}
                    onChange={(e) => setNewCourseUnits(Number(e.target.value))}
                    className="insights-grade-select"
                    style={{ width: '100%' }}
                  >
                    <option value={1}>1 Credit Unit (Practical/Seminar)</option>
                    <option value={2}>2 Credit Units (Standard Lecture)</option>
                    <option value={3}>3 Credit Units (Core Course)</option>
                    <option value={4}>4 Credit Units (Heavy Lab / Math)</option>
                    <option value={6}>6 Credit Units (SIWES / Project)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Grade Earned / Target *
                  </label>
                  <select
                    value={newCourseGrade}
                    onChange={(e) => setNewCourseGrade(e.target.value as GradeOption)}
                    className="insights-grade-select"
                    style={{ width: '100%' }}
                  >
                    <option value="A">A (5.0 pts · 70%+)</option>
                    <option value="B">B (4.0 pts · 60–69%)</option>
                    <option value="C">C (3.0 pts · 50–59%)</option>
                    <option value="D">D (2.0 pts · 45–49%)</option>
                    <option value="E">E (1.0 pt · 40–44%)</option>
                    <option value="F">F (0.0 pt · Fail)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Total Score (CA + Exam)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={newCourseScore}
                  onChange={(e) => setNewCourseScore(Number(e.target.value))}
                  className="search-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setShowAddCourseModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save to Transcript
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CUSTOM SEMESTER */}
      {showAddSemesterModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Add Academic Semester</h3>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--muted-foreground)' }}>
                  Create a new semester block for course registration &amp; CGPA audit.
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowAddSemesterModal(false)}
              >
                <X style={{ width: '16px' }} />
              </button>
            </div>

            <form onSubmit={handleAddSemesterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Academic Level *
                </label>
                <select
                  value={newSemLevel}
                  onChange={(e) => setNewSemLevel(e.target.value)}
                  className="insights-grade-select"
                  style={{ width: '100%' }}
                >
                  <option value="100 Level">100 Level</option>
                  <option value="200 Level">200 Level</option>
                  <option value="300 Level">300 Level</option>
                  <option value="400 Level">400 Level</option>
                  <option value="500 Level">500 Level</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Semester *
                </label>
                <select
                  value={newSemSemester}
                  onChange={(e) => setNewSemSemester(e.target.value as 'First Semester' | 'Second Semester')}
                  className="insights-grade-select"
                  style={{ width: '100%' }}
                >
                  <option value="First Semester">First Semester</option>
                  <option value="Second Semester">Second Semester</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Academic Session *
                </label>
                <input
                  type="text"
                  required
                  placeholder="2026/2027"
                  value={newSemSession}
                  onChange={(e) => setNewSemSession(e.target.value)}
                  className="search-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="outline-button"
                  onClick={() => setShowAddSemesterModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Create Semester
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: OFFICIAL PRINTABLE ACADEMIC TRANSCRIPT / STATEMENT OF RESULTS */}
      {showTranscriptModal && (
        <div className="modal-backdrop">
          <div
            className="modal-card"
            style={{
              maxWidth: '850px',
              width: '95%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '30px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.15em', fontWeight: 700, color: '#4338ca' }}>
                  FEDERAL REPUBLIC OF NIGERIA
                </div>
                <h2 style={{ margin: '4px 0 2px', fontSize: '20px', letterSpacing: '0.04em' }}>
                  {nigerianTertiaryData.institution.toUpperCase()}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                  OFFICE OF THE REGISTRAR · ACADEMIC AFFAIRS DIVISION
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '8px', textDecoration: 'underline' }}>
                  OFFICIAL STATEMENT OF ACADEMIC RESULTS / TRANSCRIPT AUDIT
                </div>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowTranscriptModal(false)}
                style={{ position: 'absolute', right: '20px', top: '20px' }}
              >
                <X style={{ width: '18px' }} />
              </button>
            </div>

            {/* Student Biodata Box */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                background: 'var(--muted)',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '11px',
                marginBottom: '20px',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <span>STUDENT NAME:</span>
                <strong style={{ display: 'block', fontSize: '13px' }}>{history.studentName.toUpperCase()}</strong>
              </div>
              <div>
                <span>MATRICULATION NO:</span>
                <strong style={{ display: 'block', fontSize: '13px' }}>{history.matricNo}</strong>
              </div>
              <div>
                <span>FACULTY / DEPARTMENT:</span>
                <strong style={{ display: 'block', fontSize: '12px' }}>NATURAL &amp; APPLIED SCIENCES / COMPUTER SCIENCE</strong>
              </div>
              <div>
                <span>PROGRAMME:</span>
                <strong>B.SC. COMPUTER SCIENCE (4 YEARS)</strong>
              </div>
              <div>
                <span>CURRENT STANDING:</span>
                <strong>{nigerianTertiaryData.level} (FINAL YEAR)</strong>
              </div>
              <div>
                <span>DEGREE CLASSIFICATION:</span>
                <strong style={{ color: history.degreeClass.color }}>{history.degreeClass.title.toUpperCase()}</strong>
              </div>
            </div>

            {/* Semester-by-semester slips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {history.semesters.map((sem) => (
                <div key={sem.id} style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div
                    style={{
                      background: 'var(--muted)',
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    <span>
                      {sem.level.toUpperCase()} — {sem.semester.toUpperCase()} ({sem.academicSession})
                    </span>
                    <span>
                      TNU: {sem.totalUnits} Units | TCP: {sem.totalPoints.toFixed(1)} Pts | GPA: {sem.gpa.toFixed(2)} | CGPA: {sem.cgpa.toFixed(2)}
                    </span>
                  </div>

                  <table className="slip-table" style={{ margin: 0, fontSize: '11px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '90px' }}>Course Code</th>
                        <th>Course Title</th>
                        <th style={{ width: '60px', textAlign: 'center' }}>Units</th>
                        <th style={{ width: '60px', textAlign: 'center' }}>Score</th>
                        <th style={{ width: '60px', textAlign: 'center' }}>Grade</th>
                        <th style={{ width: '70px', textAlign: 'center' }}>Grade Pt</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Quality Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sem.courses.map((c) => (
                        <tr key={c.id}>
                          <td><strong>{c.code}</strong></td>
                          <td>{c.title}</td>
                          <td style={{ textAlign: 'center' }}>{c.units}</td>
                          <td style={{ textAlign: 'center' }}>{c.score ?? '—'}</td>
                          <td style={{ textAlign: 'center' }}><strong>{c.grade}</strong></td>
                          <td style={{ textAlign: 'center' }}>{GRADE_POINT_MAP[c.grade].toFixed(1)}</td>
                          <td style={{ textAlign: 'center' }}>{(c.units * GRADE_POINT_MAP[c.grade]).toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Final Grand Summary Box */}
            <div
              style={{
                marginTop: '22px',
                padding: '16px',
                border: '2px solid #4338ca',
                borderRadius: '8px',
                background: 'rgba(67, 56, 202, 0.04)',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                textAlign: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>TOTAL UNITS EARNED</span>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{history.totalUnitsEarned} / {history.totalUnitsRequired}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>TOTAL QUALITY POINTS</span>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{history.overallPoints.toFixed(1)}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>CUMULATIVE GPA (CGPA)</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#4338ca' }}>{history.overallCGPA.toFixed(2)}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>SENATE CLASSIFICATION</span>
                <div style={{ fontSize: '12px', fontWeight: 800, color: history.degreeClass.color, marginTop: '4px' }}>
                  {history.degreeClass.title}
                </div>
              </div>
            </div>

            {/* Footer with Registrar endorsement */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '30px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border)',
                fontSize: '11px',
                color: 'var(--muted-foreground)',
              }}
            >
              <div>
                Date Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
                Security Hash: EU-TRANSCRIPT-NUC-2026-OK-408
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', marginBottom: '20px', fontStyle: 'italic' }}>
                  Electronically Endorsed
                </span>
                <strong>Dr. O. A. Balogun</strong><br />
                Academic Secretary / Registrar
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                className="outline-button"
                onClick={() => setShowTranscriptModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Printer style={{ width: '15px' }} /> Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
