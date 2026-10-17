'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  Award,
  BookOpen,
  ChevronRight,
  FileText,
  GraduationCap,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { Pill } from '@/components/pill'
import { getAcademicHistory, type AcademicHistory, getDegreeClassification } from '@/lib/academic-records'
import { getUserProfile, type UserProfile, defaultUserProfile } from '@/lib/user-profile'
import { api } from '@/lib/api'

export default function InsightsPage() {
  const [history, setHistory] = useState<AcademicHistory>(() => getAcademicHistory())
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile)
  const [targetCGPA, setTargetCGPA] = useState<number>(4.52)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setHistory(getAcademicHistory())
    setProfile(getUserProfile())

    const syncBackendInsights = async () => {
      try {
        const me = await api.auth.me()
        if (me) {
          setProfile((prev) => ({
            ...prev,
            name: me.full_name,
            email: me.email,
            institution: me.institution,
            department: me.department,
            level: me.academic_level,
          }))
        }
      } catch {
        // ignore
      }

      try {
        const rec = await api.atlas.getRecord()
        if (rec) {
          setHistory((prev) => ({
            ...prev,
            cgpa: rec.cgpa,
            totalUnitsEarned: rec.completed_credits,
            totalUnitsRequired: rec.total_credits,
            overallPoints: Number((rec.cgpa * rec.completed_credits).toFixed(2)),
          }))
        }
      } catch {
        // ignore
      }
    }
    syncBackendInsights()

    const handleUpdate = () => {
      setHistory(getAcademicHistory())
      setProfile(getUserProfile())
    }
    window.addEventListener('academic-records-updated', handleUpdate)
    window.addEventListener('user-profile-updated', handleUpdate)
    return () => {
      window.removeEventListener('academic-records-updated', handleUpdate)
      window.removeEventListener('user-profile-updated', handleUpdate)
    }
  }, [])

  // Calculate remaining units and required GPA
  const targetAnalysis = useMemo(() => {
    const totalReq = history.totalUnitsRequired || 152
    const totalEarned = history.totalUnitsEarned || 118
    const remainingUnits = Math.max(0, totalReq - totalEarned)
    const currentPoints = history.overallPoints || 516.84

    const targetPoints = targetCGPA * totalReq
    const neededPoints = targetPoints - currentPoints
    const requiredGPA = remainingUnits > 0 ? neededPoints / remainingUnits : 0

    const isAchievable = requiredGPA <= 5.0 && requiredGPA >= 0
    const targetClass = getDegreeClassification(targetCGPA)

    return {
      remainingUnits,
      requiredGPA: Math.min(5.0, Math.max(0, requiredGPA)).toFixed(2),
      isAchievable,
      targetClass,
    }
  }, [history, targetCGPA])

  // Grade breakdown distribution
  const gradeStats = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 }
    let totalCourses = 0

    history.semesters.forEach((sem) => {
      sem.courses.forEach((c) => {
        if (c.grade && counts[c.grade] !== undefined) {
          counts[c.grade]++
          totalCourses++
        }
      })
    })

    if (totalCourses === 0) {
      counts.A = 18
      counts.B = 8
      counts.C = 3
      totalCourses = 29
    }

    return {
      counts,
      total: totalCourses,
      pctA: ((counts.A / totalCourses) * 100).toFixed(0),
      pctB: ((counts.B / totalCourses) * 100).toFixed(0),
      pctC: ((counts.C / totalCourses) * 100).toFixed(0),
    }
  }, [history])

  // Semesters for progression chart
  const semesterChartData = useMemo(() => {
    if (history.semesters.length > 0) {
      return history.semesters.map((sem) => ({
        label: `${sem.level.replace(' Level', 'L')} ${sem.semester === 'First Semester' ? 'S1' : 'S2'}`,
        gpa: sem.gpa || 4.2,
        cgpa: sem.cgpa || 4.38,
        units: sem.totalUnits || 18,
      }))
    }
    return [
      { label: '100L S1', gpa: 4.20, cgpa: 4.20, units: 19 },
      { label: '100L S2', gpa: 4.35, cgpa: 4.28, units: 18 },
      { label: '200L S1', gpa: 4.15, cgpa: 4.23, units: 20 },
      { label: '200L S2', gpa: 4.45, cgpa: 4.29, units: 19 },
      { label: '300L S1', gpa: 4.50, cgpa: 4.34, units: 21 },
      { label: '300L S2', gpa: 4.60, cgpa: 4.38, units: 21 },
      { label: '400L S1', gpa: 4.38, cgpa: 4.38, units: 18 },
    ]
  }, [history])

  const unitsCompletedPct = Math.min(
    100,
    Math.round(((history.totalUnitsEarned || 118) / (history.totalUnitsRequired || 152)) * 100)
  )

  return (
    <>
      <PageHeader
        title="Academic Insights & Analytics"
        subtitle="Visual performance trends, honours forecasting, and graduation progress."
        action={
          <Link
            href="/dashboard/records"
            className="secondary-button"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileText style={{ width: '15px' }} />
            <span>Academic Records &amp; Transcript</span>
            <ChevronRight style={{ width: '14px' }} />
          </Link>
        }
      />

      {/* Top 4 Key Metric Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '22px' }}>
        <div className="stat-card">
          <div className="stat-icon purple">
            <GraduationCap />
          </div>
          <div>
            <span>Current CGPA</span>
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
            <span>Graduation Progress</span>
            <strong>
              {history.totalUnitsEarned || 118}{' '}
              <small style={{ fontSize: '12px', color: '#64748b' }}>/ {history.totalUnitsRequired || 152} Units</small>
            </strong>
            <small style={{ color: '#2563eb', fontWeight: 600 }}>
              {unitsCompletedPct}% completed &bull; {targetAnalysis.remainingUnits} units left
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon emerald">
            <TrendingUp />
          </div>
          <div>
            <span>Class Standing</span>
            <strong>Top 10%</strong>
            <small style={{ color: '#059669', fontWeight: 600 }}>
              +0.96 above department avg (3.42)
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <Target />
          </div>
          <div>
            <span>Target Goal</span>
            <strong>
              {targetCGPA.toFixed(2)}{' '}
              <small style={{ fontSize: '12px', color: '#64748b' }}>/ 5.00</small>
            </strong>
            <small style={{ color: '#b45309', fontWeight: 600 }}>
              {targetAnalysis.targetClass.title}
            </small>
          </div>
        </div>
      </div>

      {/* Main Section 1: Semester GPA & CGPA Progression Trend Chart */}
      <Panel style={{ marginBottom: '22px' }}>
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp style={{ color: '#6366f1', width: '20px' }} />
              Semester GPA Performance Trend
            </h2>
            <p>Visual progression of semester GPAs from your first year to current session.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#6366f1', display: 'inline-block' }} />
              Completed Semester
            </span>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '10px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10b981', display: 'inline-block' }} />
              Current Semester
            </span>
          </div>
        </div>

        <div style={{ padding: '24px 24px 16px' }}>
          <div className="chart-bars-container">
            {semesterChartData.map((item, idx) => {
              const heightPct = Math.min(100, Math.max(15, (item.gpa / 5.0) * 100))
              const isCurrent = idx === semesterChartData.length - 1

              return (
                <div key={item.label} className="chart-bar-group">
                  <span className="chart-bar-val">{item.gpa.toFixed(2)}</span>
                  <div
                    className={`chart-bar-fill ${isCurrent ? 'active' : ''}`}
                    style={{ height: `${heightPct}%` }}
                    title={`${item.label}: ${item.gpa.toFixed(2)} GPA (${item.units} Credit Units)`}
                  />
                  <span className="chart-bar-label">{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </Panel>

      {/* Main Section 2: Simple Honours Forecaster */}
      <Panel style={{ marginBottom: '22px' }}>
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles style={{ color: '#8b5cf6', width: '20px' }} />
              Honours Degree Forecaster
            </h2>
            <p>Adjust your target CGPA to calculate the semester GPA needed to achieve your desired degree class.</p>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          <div className="insights-target-box">
            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
                  Set Target CGPA
                </span>
                <strong style={{ fontSize: '18px', color: '#6366f1' }}>
                  {targetCGPA.toFixed(2)}
                </strong>
              </div>

              <input
                type="range"
                min="3.00"
                max="5.00"
                step="0.05"
                value={targetCGPA}
                onChange={(e) => setTargetCGPA(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                <span>3.00 (2:2)</span>
                <span>3.50 (2:1 Threshold)</span>
                <span>4.50 (First Class Threshold)</span>
                <span>5.00 Max</span>
              </div>
            </div>

            <div
              style={{
                borderLeft: '1px solid var(--border)',
                paddingLeft: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                minWidth: '220px',
              }}
            >
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
                Required Average GPA
              </span>
              <strong style={{ fontSize: '26px', color: targetAnalysis.isAchievable ? '#10b981' : '#ef4444' }}>
                {targetAnalysis.isAchievable ? `${targetAnalysis.requiredGPA} GPA` : 'Exceeds 5.0'}
              </strong>
              <small style={{ color: '#64748b', fontSize: '11.5px' }}>
                across remaining {targetAnalysis.remainingUnits} credit units
              </small>
            </div>
          </div>
        </div>
      </Panel>

      {/* Main Section 3: Grade Distribution & Cohort Benchmarks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Card 1: Grade Distribution */}
        <Panel>
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award style={{ color: '#f59e0b', width: '18px' }} />
                Grade Distribution
              </h2>
              <p>Breakdown of grades across all {gradeStats.total} registered courses.</p>
            </div>
          </div>

          <div style={{ padding: '20px' }}>
            {/* Visual multi-color bar */}
            <div className="grade-dist-bar">
              <div
                className="grade-dist-segment"
                style={{ width: `${gradeStats.pctA}%`, background: '#10b981' }}
                title={`Grade A: ${gradeStats.counts.A} courses (${gradeStats.pctA}%)`}
              />
              <div
                className="grade-dist-segment"
                style={{ width: `${gradeStats.pctB}%`, background: '#6366f1' }}
                title={`Grade B: ${gradeStats.counts.B} courses (${gradeStats.pctB}%)`}
              />
              <div
                className="grade-dist-segment"
                style={{ width: `${gradeStats.pctC}%`, background: '#f59e0b' }}
                title={`Grade C: ${gradeStats.counts.C} courses (${gradeStats.pctC}%)`}
              />
            </div>

            <div className="grade-legend">
              <div className="grade-legend-item">
                <span className="grade-dot" style={{ background: '#10b981' }} />
                <div>
                  <strong>{gradeStats.counts.A} Grade A</strong>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{gradeStats.pctA}% (5.0 pts)</div>
                </div>
              </div>

              <div className="grade-legend-item">
                <span className="grade-dot" style={{ background: '#6366f1' }} />
                <div>
                  <strong>{gradeStats.counts.B} Grade B</strong>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{gradeStats.pctB}% (4.0 pts)</div>
                </div>
              </div>

              <div className="grade-legend-item">
                <span className="grade-dot" style={{ background: '#f59e0b' }} />
                <div>
                  <strong>{gradeStats.counts.C} Grade C</strong>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{gradeStats.pctC}% (3.0 pts)</div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* Card 2: Department Cohort Standing */}
        <Panel>
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users style={{ color: '#0ea5e9', width: '18px' }} />
                Department Benchmarks
              </h2>
              <p>Comparative statistics for {profile.department} cohort.</p>
            </div>
          </div>

          <div style={{ padding: '16px 20px' }}>
            <div className="benchmark-row">
              <span style={{ color: 'var(--muted-foreground)' }}>Department Cohort Size</span>
              <strong>142 Students</strong>
            </div>

            <div className="benchmark-row">
              <span style={{ color: 'var(--muted-foreground)' }}>Class Average CGPA</span>
              <strong>3.42 / 5.00</strong>
            </div>

            <div className="benchmark-row">
              <span style={{ color: 'var(--muted-foreground)' }}>First Class Honours Standing</span>
              <span style={{ color: '#10b981', fontWeight: 650 }}>14 Students (9.8%)</span>
            </div>

            <div className="benchmark-row">
              <span style={{ color: 'var(--muted-foreground)' }}>Your Department Percentile</span>
              <span style={{ color: '#6366f1', fontWeight: 700 }}>Top 10% (Rank #12)</span>
            </div>
          </div>
        </Panel>
      </div>
    </>
  )
}
