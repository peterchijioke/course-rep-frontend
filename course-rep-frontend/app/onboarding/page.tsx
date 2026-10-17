'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import { Logo } from '@/components/logo'
import { Pill } from '@/components/pill'
import { getUserProfile, saveUserProfile } from '@/lib/user-profile'
import { saveEnrolledCourses } from '@/lib/data'
import { getEnlistedInstitutions, enlistInstitution } from '@/lib/institutions'
import {
  getEnlistedFaculties,
  enlistFaculty,
  getEnlistedDepartments,
  enlistDepartment,
  getEnlistedLevels,
  enlistLevel,
  getEnlistedSessions,
  enlistSession,
  getEnlistedSemesters,
  enlistSemester,
} from '@/lib/academic-data'
import { SearchableCombobox } from '@/components/ui/searchable-combobox'

export default function OnboardingPage() {
  const router = useRouter()

  // Institution & Academic Identity
  const [institution, setInstitution] = useState('Example University of Science & Technology')
  const [availableInstitutions, setAvailableInstitutions] = useState<string[]>([])

  const [faculty, setFaculty] = useState('Faculty of Natural & Applied Sciences')
  const [availableFaculties, setAvailableFaculties] = useState<string[]>([])

  const [department, setDepartment] = useState('Computer Science')
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([])

  const [level, setLevel] = useState('400 Level')
  const [availableLevels, setAvailableLevels] = useState<string[]>([])

  const [session, setSession] = useState('2026/2027 Academic Session')
  const [availableSessions, setAvailableSessions] = useState<string[]>([])

  const [semester, setSemester] = useState('First Semester')
  const [availableSemesters, setAvailableSemesters] = useState<string[]>([])

  const [matricNo, setMatricNo] = useState('EU/2023/CSC/408')

  // Load existing profile & enlisted academic catalogs
  useEffect(() => {
    setAvailableInstitutions(getEnlistedInstitutions())
    setAvailableFaculties(getEnlistedFaculties())
    setAvailableDepartments(getEnlistedDepartments())
    setAvailableLevels(getEnlistedLevels())
    setAvailableSessions(getEnlistedSessions())
    setAvailableSemesters(getEnlistedSemesters())

    const existing = getUserProfile()
    if (existing.institution) setInstitution(existing.institution)
    if (existing.faculty) setFaculty(existing.faculty)
    if (existing.department) setDepartment(existing.department)
    if (existing.level) setLevel(existing.level)
    if (existing.matricNo) setMatricNo(existing.matricNo)
    if (existing.session) setSession(existing.session)
    if (existing.semester) setSemester(existing.semester)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const finalInstitution = institution.trim() || 'Example University of Science & Technology'
    const finalFaculty = faculty.trim() || 'Faculty of Natural & Applied Sciences'
    const finalDepartment = department.trim() || 'Computer Science'
    const finalLevel = level.trim() || '400 Level'
    const finalSession = session.trim() || '2026/2027 Academic Session'
    const finalSemester = semester.trim() || 'First Semester'

    // Enlist all customized institutions and departments into persistent local records
    setAvailableInstitutions(enlistInstitution(finalInstitution))
    setAvailableFaculties(enlistFaculty(finalFaculty))
    setAvailableDepartments(enlistDepartment(finalDepartment))
    setAvailableLevels(enlistLevel(finalLevel))
    setAvailableSessions(enlistSession(finalSession))
    setAvailableSemesters(enlistSemester(finalSemester))

    // Initialize course registry as empty so the dashboard guides configuration based on level & semester
    saveEnrolledCourses([])

    saveUserProfile({
      institution: finalInstitution,
      faculty: finalFaculty,
      department: finalDepartment,
      level: finalLevel,
      matricNo: matricNo.trim() || 'EU/2023/CSC/408',
      session: finalSession,
      semester: finalSemester,
      enrolledCourses: [],
      targetCGPA: 4.52,
      notifications: {
        whatsapp: true,
        lectureReminders: true,
        announcements: true,
      },
    })

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="auth-shell">
      <aside className="auth-story">
        <div className="story-glow story-glow-one" />
        <div className="story-glow story-glow-two" />
        <div className="auth-story-brand">
          <Logo href="/" />
        </div>
        <div className="story-content">
          <span className="story-kicker">Academic Profile Setup</span>
          <h2>Set up your semester with confidence.</h2>
          <p>
            Course Rep connects your personal academic command centre to your department cohort,
            lecture schedules, class rep alerts, and NUC transcript benchmarks.
          </p>

          <div className="story-stat-row">
            <div>
              <strong>{level}</strong>
              <span>Curriculum</span>
            </div>
            <div>
              <strong>{semester.split(' ')[0]}</strong>
              <span>Semester</span>
            </div>
            <div>
              <strong>5.0 Scale</strong>
              <span>CGPA Engine</span>
            </div>
          </div>

          <div className="story-quote">
            <span>“</span>
            <p>
              Capturing your institution, faculty, and matric number connects your personal academic
              command centre to your lecture reps seamlessly.
            </p>
            <small>— Course Rep System Architecture</small>
          </div>
        </div>
      </aside>

      <section className="auth-form-side">
        <div className="auth-brand">
          <Logo href="/" />
        </div>
        <div className="auth-card onboarding-card" style={{ maxWidth: '520px' }}>
          <Pill>Academic Identity &amp; Affiliation</Pill>
          <h1 style={{ marginTop: '8px', fontSize: '24px' }}>Tell us about your studies</h1>
          <p>
            We use this to connect you to your official tertiary institution, faculty, department, and
            academic level.
          </p>

          <form onSubmit={handleSubmit}>
            <SearchableCombobox
              id="institution-input"
              label="Tertiary Institution"
              placeholder="Search or type institution name..."
              value={institution}
              onChange={setInstitution}
              options={availableInstitutions}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
              <SearchableCombobox
                id="faculty-input"
                label="Faculty / College"
                placeholder="Search or type faculty..."
                value={faculty}
                onChange={setFaculty}
                options={availableFaculties}
                required
              />

              <SearchableCombobox
                id="department-input"
                label="Academic Department"
                placeholder="Search or type department..."
                value={department}
                onChange={setDepartment}
                options={availableDepartments}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginTop: '14px' }}>
              <div>
                <label htmlFor="matric-input" style={{ display: 'block', margin: '0 0 6px', fontWeight: 600 }}>
                  Matriculation / Student Reg No.
                </label>
                <div className="institution-input-box">
                  <input
                    id="matric-input"
                    required
                    value={matricNo}
                    onChange={(e) => setMatricNo(e.target.value)}
                    placeholder="EU/2023/CSC/408"
                  />
                </div>
              </div>

              <SearchableCombobox
                id="level-input"
                label="Academic Level"
                placeholder="Search or type level..."
                value={level}
                onChange={setLevel}
                options={availableLevels}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginTop: '14px' }}>
              <SearchableCombobox
                id="session-input"
                label="Academic Session"
                placeholder="Search or type session..."
                value={session}
                onChange={setSession}
                options={availableSessions}
                required
              />

              <SearchableCombobox
                id="semester-input"
                label="Current Semester"
                placeholder="Search or type semester..."
                value={semester}
                onChange={setSemester}
                options={availableSemesters}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                type="submit"
                className="primary-button auth-submit"
                style={{ flex: 1, marginTop: 0 }}
              >
                <CheckCircle2 style={{ width: '16px' }} />
                <span>Launch Academic Command Centre</span>
                <ChevronRight style={{ width: '16px' }} />
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
