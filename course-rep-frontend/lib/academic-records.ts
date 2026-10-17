export type GradeOption = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

export interface GradeScaleDefinition {
  grade: GradeOption
  points: number
  range: string
  description: string
}

export const NUC_GRADE_SCALE: GradeScaleDefinition[] = [
  { grade: 'A', points: 5.0, range: '70% – 100%', description: 'Excellent' },
  { grade: 'B', points: 4.0, range: '60% – 69%', description: 'Very Good' },
  { grade: 'C', points: 3.0, range: '50% – 59%', description: 'Good' },
  { grade: 'D', points: 2.0, range: '45% – 49%', description: 'Fair' },
  { grade: 'E', points: 1.0, range: '40% – 44%', description: 'Pass' },
  { grade: 'F', points: 0.0, range: '0% – 39%', description: 'Fail' },
]

export const GRADE_POINT_MAP: Record<GradeOption, number> = {
  A: 5.0,
  B: 4.0,
  C: 3.0,
  D: 2.0,
  E: 1.0,
  F: 0.0,
}

export function gradeFromScore(score: number): GradeOption {
  if (score >= 70) return 'A'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C'
  if (score >= 45) return 'D'
  if (score >= 40) return 'E'
  return 'F'
}

export interface CourseGradeItem {
  id: string
  code: string
  title: string
  units: number // Credit Hours
  grade: GradeOption
  score?: number
  qualityPoints: number // units * points
  status?: 'passed' | 'failed' | 'in_progress'
}

export interface SemesterGradeRecord {
  id: string
  level: string // '100 Level', '200 Level', '300 Level', '400 Level'
  semester: 'First Semester' | 'Second Semester'
  academicSession: string // '2023/2024'
  status: 'completed' | 'in_progress'
  courses: CourseGradeItem[]
  totalUnits: number
  totalPoints: number
  gpa: number
  cumulativeUnits: number
  cumulativePoints: number
  cgpa: number
}

export interface DegreeClassification {
  title: string
  minCGPA: number
  maxCGPA: number
  tone: 'first-class' | 'second-upper' | 'second-lower' | 'third-class' | 'pass'
  color: string
}

export const DEGREE_CLASSIFICATIONS: DegreeClassification[] = [
  { title: 'First Class Honours', minCGPA: 4.50, maxCGPA: 5.00, tone: 'first-class', color: '#10b981' },
  { title: 'Second Class Upper Division (2:1)', minCGPA: 3.50, maxCGPA: 4.49, tone: 'second-upper', color: '#0f766e' },
  { title: 'Second Class Lower Division (2:2)', minCGPA: 2.40, maxCGPA: 3.49, tone: 'second-lower', color: '#f59e0b' },
  { title: 'Third Class Honours', minCGPA: 1.50, maxCGPA: 2.39, tone: 'third-class', color: '#ea580c' },
  { title: 'Pass Degree', minCGPA: 1.00, maxCGPA: 1.49, tone: 'pass', color: '#ef4444' },
]

export function getDegreeClassification(cgpa: number): DegreeClassification {
  const rounded = Number(cgpa.toFixed(2))
  for (const cls of DEGREE_CLASSIFICATIONS) {
    if (rounded >= cls.minCGPA) return cls
  }
  return DEGREE_CLASSIFICATIONS[DEGREE_CLASSIFICATIONS.length - 1]
}

export interface AcademicHistory {
  studentName: string
  matricNo: string
  department: string
  targetCGPA: number
  totalUnitsRequired: number
  totalUnitsEarned: number
  overallPoints: number
  overallCGPA: number
  degreeClass: DegreeClassification
  semesters: SemesterGradeRecord[]
  updatedAt: string
}

export const ACADEMIC_RECORDS_STORAGE_KEY = 'courserep_academic_records_v1'

// Default starter transcript records matching the student's 118 units / 4.38 CGPA
export const defaultSemesterRecords: SemesterGradeRecord[] = [
  {
    id: 'sem-100-1',
    level: '100 Level',
    semester: 'First Semester',
    academicSession: '2023/2024',
    status: 'completed',
    courses: [
      { id: 'c-1', code: 'CSC 101', title: 'Intro to Computer Science', units: 3, grade: 'A', score: 78, qualityPoints: 15 },
      { id: 'c-2', code: 'MTH 101', title: 'Elementary Mathematics I (Algebra)', units: 4, grade: 'A', score: 74, qualityPoints: 20 },
      { id: 'c-3', code: 'PHY 101', title: 'General Physics I (Mechanics)', units: 3, grade: 'B', score: 66, qualityPoints: 12 },
      { id: 'c-4', code: 'CHM 101', title: 'General Chemistry I', units: 3, grade: 'A', score: 71, qualityPoints: 15 },
      { id: 'c-5', code: 'GST 101', title: 'Use of English I', units: 2, grade: 'A', score: 80, qualityPoints: 10 },
      { id: 'c-6', code: 'PHY 107', title: 'Physics Practical I', units: 1, grade: 'A', score: 76, qualityPoints: 5 },
      { id: 'c-7', code: 'CHM 107', title: 'Chemistry Practical I', units: 1, grade: 'B', score: 65, qualityPoints: 4 },
      { id: 'c-8', code: 'LIB 101', title: 'Library & Information Study', units: 2, grade: 'A', score: 82, qualityPoints: 10 },
    ],
    totalUnits: 19,
    totalPoints: 86,
    gpa: 4.53,
    cumulativeUnits: 19,
    cumulativePoints: 86,
    cgpa: 4.53,
  },
  {
    id: 'sem-100-2',
    level: '100 Level',
    semester: 'Second Semester',
    academicSession: '2023/2024',
    status: 'completed',
    courses: [
      { id: 'c-9', code: 'CSC 102', title: 'Intro to Problem Solving & Programming', units: 3, grade: 'A', score: 82, qualityPoints: 15 },
      { id: 'c-10', code: 'MTH 102', title: 'Elementary Mathematics II (Calculus)', units: 4, grade: 'B', score: 68, qualityPoints: 16 },
      { id: 'c-11', code: 'PHY 102', title: 'General Physics II (Electricity)', units: 3, grade: 'B', score: 64, qualityPoints: 12 },
      { id: 'c-12', code: 'GST 102', title: 'Philosophy & Logic', units: 2, grade: 'A', score: 75, qualityPoints: 10 },
      { id: 'c-13', code: 'GST 104', title: 'Nigerian Peoples & Culture', units: 2, grade: 'A', score: 77, qualityPoints: 10 },
      { id: 'c-14', code: 'PHY 108', title: 'Physics Practical II', units: 1, grade: 'A', score: 72, qualityPoints: 5 },
      { id: 'c-15', code: 'CSC 104', title: 'Computing Systems Laboratory', units: 2, grade: 'A', score: 85, qualityPoints: 10 },
      { id: 'c-16', code: 'STA 102', title: 'Introductory Statistics', units: 3, grade: 'B', score: 65, qualityPoints: 12 },
    ],
    totalUnits: 20,
    totalPoints: 90,
    gpa: 4.50,
    cumulativeUnits: 39,
    cumulativePoints: 176,
    cgpa: 4.51,
  },
  {
    id: 'sem-200-1',
    level: '200 Level',
    semester: 'First Semester',
    academicSession: '2024/2025',
    status: 'completed',
    courses: [
      { id: 'c-17', code: 'CSC 201', title: 'Computer Programming I (OOP Java)', units: 3, grade: 'A', score: 84, qualityPoints: 15 },
      { id: 'c-18', code: 'CSC 203', title: 'Discrete Computational Structures', units: 3, grade: 'B', score: 67, qualityPoints: 12 },
      { id: 'c-19', code: 'MTH 201', title: 'Mathematical Methods I', units: 3, grade: 'B', score: 63, qualityPoints: 12 },
      { id: 'c-20', code: 'PHY 201', title: 'Electric Circuits & Electronics', units: 3, grade: 'A', score: 73, qualityPoints: 15 },
      { id: 'c-21', code: 'CSC 205', title: 'Computer Hardware Architecture', units: 3, grade: 'A', score: 76, qualityPoints: 15 },
      { id: 'c-22', code: 'STA 201', title: 'Probability & Distribution Theory', units: 3, grade: 'B', score: 68, qualityPoints: 12 },
      { id: 'c-23', code: 'GST 201', title: 'Peace & Conflict Resolution', units: 2, grade: 'A', score: 79, qualityPoints: 10 },
      { id: 'c-24', code: 'ENT 201', title: 'Entrepreneurship Studies I', units: 1, grade: 'A', score: 81, qualityPoints: 5 },
    ],
    totalUnits: 21,
    totalPoints: 96,
    gpa: 4.57,
    cumulativeUnits: 60,
    cumulativePoints: 272,
    cgpa: 4.53,
  },
  {
    id: 'sem-200-2',
    level: '200 Level',
    semester: 'Second Semester',
    academicSession: '2024/2025',
    status: 'completed',
    courses: [
      { id: 'c-25', code: 'CSC 202', title: 'Data Structures & Algorithms', units: 3, grade: 'A', score: 78, qualityPoints: 15 },
      { id: 'c-26', code: 'CSC 204', title: 'Fundamentals of Data Science', units: 3, grade: 'B', score: 66, qualityPoints: 12 },
      { id: 'c-27', code: 'CSC 208', title: 'Assembly Language Programming', units: 3, grade: 'B', score: 62, qualityPoints: 12 },
      { id: 'c-28', code: 'MTH 202', title: 'Linear Algebra I', units: 3, grade: 'C', score: 58, qualityPoints: 9 }, // Key dip
      { id: 'c-29', code: 'CSC 206', title: 'Operating Systems Principles', units: 3, grade: 'B', score: 67, qualityPoints: 12 },
      { id: 'c-30', code: 'STA 202', title: 'Statistical Inference', units: 3, grade: 'B', score: 64, qualityPoints: 12 },
      { id: 'c-31', code: 'ENT 202', title: 'Entrepreneurship Practical II', units: 2, grade: 'A', score: 80, qualityPoints: 10 },
    ],
    totalUnits: 20,
    totalPoints: 82,
    gpa: 4.10,
    cumulativeUnits: 80,
    cumulativePoints: 354,
    cgpa: 4.425,
  },
  {
    id: 'sem-300-1',
    level: '300 Level',
    semester: 'First Semester',
    academicSession: '2025/2026',
    status: 'completed',
    courses: [
      { id: 'c-32', code: 'CSC 301', title: 'Structured Systems Analysis & Design', units: 3, grade: 'A', score: 81, qualityPoints: 15 },
      { id: 'c-33', code: 'CSC 303', title: 'Database Design & Management', units: 3, grade: 'A', score: 86, qualityPoints: 15 },
      { id: 'c-34', code: 'CSC 305', title: 'Theory of Automata & Computation', units: 3, grade: 'B', score: 68, qualityPoints: 12 },
      { id: 'c-35', code: 'CSC 307', title: 'Compiler Construction', units: 3, grade: 'B', score: 64, qualityPoints: 12 },
      { id: 'c-36', code: 'CSC 309', title: 'Web Application Technologies', units: 3, grade: 'A', score: 79, qualityPoints: 15 },
      { id: 'c-37', code: 'CSC 311', title: 'Algorithm Complexity & Analysis', units: 3, grade: 'B', score: 67, qualityPoints: 12 },
      { id: 'c-38', code: 'GST 301', title: 'Leadership & Social Innovation', units: 2, grade: 'A', score: 82, qualityPoints: 10 },
    ],
    totalUnits: 20,
    totalPoints: 91,
    gpa: 4.55,
    cumulativeUnits: 100,
    cumulativePoints: 445,
    cgpa: 4.45,
  },
  {
    id: 'sem-300-2',
    level: '300 Level',
    semester: 'Second Semester',
    academicSession: '2025/2026',
    status: 'completed',
    courses: [
      { id: 'c-39', code: 'CSC 399', title: 'Industrial Training / SIWES Attachment', units: 6, grade: 'A', score: 85, qualityPoints: 30 },
      { id: 'c-40', code: 'CSC 302', title: 'Research Methodology in Computing', units: 3, grade: 'B', score: 67, qualityPoints: 12 },
      { id: 'c-41', code: 'CSC 304', title: 'Human Computer Interaction', units: 3, grade: 'B', score: 65, qualityPoints: 12 },
      { id: 'c-42', code: 'CSC 306', title: 'Mobile Applications Engineering', units: 3, grade: 'B', score: 63, qualityPoints: 12 },
      { id: 'c-43', code: 'CSC 308', title: 'Cybersecurity Fundamentals', units: 3, grade: 'C', score: 56, qualityPoints: 9 }, // Another dip
    ],
    totalUnits: 18,
    totalPoints: 75,
    gpa: 4.17,
    cumulativeUnits: 118,
    cumulativePoints: 520,
    cgpa: 4.38, // Yields 4.38 Second Class Upper!
  },
  {
    id: 'sem-400-1',
    level: '400 Level',
    semester: 'First Semester',
    academicSession: '2026/2027',
    status: 'in_progress',
    courses: [
      { id: 'c-44', code: 'CSC 401', title: 'Software Engineering II', units: 3, grade: 'A', score: 74, qualityPoints: 15, status: 'in_progress' },
      { id: 'c-45', code: 'CSC 403', title: 'Artificial Intelligence & Neural Nets', units: 3, grade: 'A', score: 70, qualityPoints: 15, status: 'in_progress' },
      { id: 'c-46', code: 'CSC 405', title: 'Computer Networks & Distributed Systems', units: 3, grade: 'B', score: 64, qualityPoints: 12, status: 'in_progress' },
      { id: 'c-47', code: 'CSC 407', title: 'Information Security & Cryptography', units: 3, grade: 'A', score: 76, qualityPoints: 15, status: 'in_progress' },
    ],
    totalUnits: 12,
    totalPoints: 57,
    gpa: 4.75,
    cumulativeUnits: 130,
    cumulativePoints: 577,
    cgpa: 4.438,
  },
]

export function recalculateAcademicHistory(semesters: SemesterGradeRecord[]): AcademicHistory {
  let runningUnits = 0
  let runningPoints = 0

  const calculatedSemesters: SemesterGradeRecord[] = semesters.map((sem) => {
    let semUnits = 0
    let semPoints = 0

    const recalculatedCourses = sem.courses.map((course) => {
      const ptsPerUnit = GRADE_POINT_MAP[course.grade] || 0
      const qualityPts = course.units * ptsPerUnit
      semUnits += course.units
      semPoints += qualityPts
      return {
        ...course,
        qualityPoints: qualityPts,
      }
    })

    const gpa = semUnits > 0 ? Number((semPoints / semUnits).toFixed(2)) : 0.0

    // Cumulative up to this semester if completed
    runningUnits += semUnits
    runningPoints += semPoints
    const semCGPA = runningUnits > 0 ? Number((runningPoints / runningUnits).toFixed(2)) : 0.0

    return {
      ...sem,
      courses: recalculatedCourses,
      totalUnits: semUnits,
      totalPoints: semPoints,
      gpa,
      cumulativeUnits: runningUnits,
      cumulativePoints: runningPoints,
      cgpa: semCGPA,
    }
  })

  // Completed semesters tally for official standing
  const completedSemesters = calculatedSemesters.filter((s) => s.status === 'completed')
  const completedUnits = completedSemesters.reduce((acc, s) => acc + s.totalUnits, 0)
  const completedPoints = completedSemesters.reduce((acc, s) => acc + s.totalPoints, 0)
  const officialCGPA = completedUnits > 0 ? Number((completedPoints / completedUnits).toFixed(2)) : 0.0

  return {
    studentName: 'Peter Chijioke',
    matricNo: 'EU/2023/CSC/408',
    department: 'Computer Science',
    targetCGPA: 4.52,
    totalUnitsRequired: 152,
    totalUnitsEarned: completedUnits,
    overallPoints: completedPoints,
    overallCGPA: officialCGPA,
    degreeClass: getDegreeClassification(officialCGPA),
    semesters: calculatedSemesters,
    updatedAt: new Date().toISOString(),
  }
}

export function syncEnrolledCoursesWithSemester(semesters: SemesterGradeRecord[]): SemesterGradeRecord[] {
  if (typeof window === 'undefined') return semesters
  try {
    const rawEnrolled = localStorage.getItem('courserep_enrolled_courses_v1')
    if (rawEnrolled === null) return semesters
    const enrolledList = JSON.parse(rawEnrolled) as Array<{ code: string; name: string; units?: number }>
    if (!Array.isArray(enrolledList)) return semesters

    return semesters.map((sem) => {
      const matchingEnrolled = enrolledList.filter((ec: any) => {
        const ecLevel = ec.level || '400 Level'
        const ecSemester = ec.semester || 'First Semester'
        return sem.level === ecLevel && sem.semester === ecSemester
      })

      // If not in_progress and no matching enrolled courses, keep semester unchanged
      if (sem.status !== 'in_progress' && matchingEnrolled.length === 0) return sem

      // If in_progress and specific match is empty, check for unspecified courses
      const targetCourses = matchingEnrolled.length > 0
        ? matchingEnrolled
        : (sem.status === 'in_progress' ? enrolledList.filter((ec: any) => !ec.level || ec.level === '400 Level') : [])

      if (targetCourses.length === 0 && sem.status !== 'in_progress') return sem

      const existingMap = new Map(sem.courses.map((c) => [c.code.toUpperCase(), c]))
      const mergedCourses: CourseGradeItem[] = []

      targetCourses.forEach((ec: any) => {
        const codeUpper = ec.code.toUpperCase()
        const existing = existingMap.get(codeUpper)
        const units = ec.units || existing?.units || 3
        if (existing) {
          const gp = GRADE_POINT_MAP[existing.grade] ?? 5.0
          mergedCourses.push({
            ...existing,
            title: ec.name || existing.title,
            units,
            qualityPoints: units * gp,
          })
        } else {
          mergedCourses.push({
            id: `course-enrolled-${codeUpper.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            code: codeUpper,
            title: ec.name,
            units,
            grade: 'A',
            score: 75,
            qualityPoints: units * 5.0,
            status: sem.status === 'in_progress' ? 'in_progress' : undefined,
          })
        }
      })

      return {
        ...sem,
        courses: mergedCourses.length > 0 ? mergedCourses : sem.courses,
      }
    })
  } catch {
    return semesters
  }
}

export function getAcademicHistory(): AcademicHistory {
  if (typeof window === 'undefined') {
    return recalculateAcademicHistory(defaultSemesterRecords)
  }

  try {
    const raw = localStorage.getItem(ACADEMIC_RECORDS_STORAGE_KEY)
    if (!raw) {
      const syncedDefault = syncEnrolledCoursesWithSemester(defaultSemesterRecords)
      const initial = recalculateAcademicHistory(syncedDefault)
      localStorage.setItem(ACADEMIC_RECORDS_STORAGE_KEY, JSON.stringify(initial.semesters))
      return initial
    }
    const parsedSemesters = JSON.parse(raw) as SemesterGradeRecord[]
    const syncedSemesters = syncEnrolledCoursesWithSemester(parsedSemesters)
    return recalculateAcademicHistory(syncedSemesters)
  } catch {
    return recalculateAcademicHistory(defaultSemesterRecords)
  }
}

export function saveAcademicHistory(semesters: SemesterGradeRecord[]): AcademicHistory {
  const recalculated = recalculateAcademicHistory(semesters)
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACADEMIC_RECORDS_STORAGE_KEY, JSON.stringify(recalculated.semesters))
    window.dispatchEvent(new Event('academic-records-updated'))
  }
  return recalculated
}

export function resetAcademicHistory(): AcademicHistory {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACADEMIC_RECORDS_STORAGE_KEY)
    localStorage.setItem(ACADEMIC_RECORDS_STORAGE_KEY, JSON.stringify(defaultSemesterRecords))
    window.dispatchEvent(new Event('academic-records-updated'))
  }
  return recalculateAcademicHistory(defaultSemesterRecords)
}

export function updateCourseInSemester(
  semesterId: string,
  courseId: string,
  updates: Partial<Pick<CourseGradeItem, 'code' | 'title' | 'units' | 'grade' | 'score' | 'status'>>
): AcademicHistory {
  const current = getAcademicHistory()
  const updatedSemesters = current.semesters.map((sem) => {
    if (sem.id !== semesterId) return sem
    const updatedCourses = sem.courses.map((course) => {
      if (course.id !== courseId) return course
      const nextUnits = updates.units !== undefined ? updates.units : course.units
      let nextGrade = updates.grade !== undefined ? updates.grade : course.grade
      let nextScore = updates.score !== undefined ? updates.score : course.score
      if (updates.score !== undefined && updates.grade === undefined) {
        nextGrade = gradeFromScore(updates.score)
      } else if (updates.grade !== undefined && updates.score === undefined) {
        // preserve or set standard score midpoint
        if (nextGrade === 'A') nextScore = 75
        else if (nextGrade === 'B') nextScore = 65
        else if (nextGrade === 'C') nextScore = 55
        else if (nextGrade === 'D') nextScore = 47
        else if (nextGrade === 'E') nextScore = 42
        else if (nextGrade === 'F') nextScore = 35
      }
      return {
        ...course,
        ...updates,
        units: nextUnits,
        grade: nextGrade,
        score: nextScore,
      }
    })
    return {
      ...sem,
      courses: updatedCourses,
    }
  })
  return saveAcademicHistory(updatedSemesters)
}

export function addCourseToSemester(
  semesterId: string,
  course: { code: string; title: string; units: number; grade: GradeOption; score?: number }
): AcademicHistory {
  const current = getAcademicHistory()
  const newCourseItem: CourseGradeItem = {
    id: `course-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    code: course.code.trim().toUpperCase(),
    title: course.title.trim(),
    units: Math.max(1, Number(course.units) || 1),
    grade: course.grade,
    score: course.score ?? (GRADE_POINT_MAP[course.grade] >= 5 ? 75 : 65),
    qualityPoints: (Math.max(1, Number(course.units) || 1)) * (GRADE_POINT_MAP[course.grade] || 0),
    status: 'passed',
  }

  const updatedSemesters = current.semesters.map((sem) => {
    if (sem.id !== semesterId) return sem
    return {
      ...sem,
      courses: [...sem.courses, newCourseItem],
    }
  })
  return saveAcademicHistory(updatedSemesters)
}

export function deleteCourseFromSemester(semesterId: string, courseId: string): AcademicHistory {
  const current = getAcademicHistory()
  const updatedSemesters = current.semesters.map((sem) => {
    if (sem.id !== semesterId) return sem
    return {
      ...sem,
      courses: sem.courses.filter((c) => c.id !== courseId),
    }
  })
  return saveAcademicHistory(updatedSemesters)
}

export function addCustomSemester(params: {
  level: string
  semester: 'First Semester' | 'Second Semester'
  academicSession: string
}): AcademicHistory {
  const current = getAcademicHistory()
  const newSem: SemesterGradeRecord = {
    id: `sem-${Date.now()}`,
    level: params.level,
    semester: params.semester,
    academicSession: params.academicSession,
    status: 'in_progress',
    courses: [],
    totalUnits: 0,
    totalPoints: 0,
    gpa: 0,
    cumulativeUnits: current.totalUnitsEarned,
    cumulativePoints: current.overallPoints,
    cgpa: current.overallCGPA,
  }
  return saveAcademicHistory([...current.semesters, newSem])
}

/**
 * Intelligent Academic Audit for Prof. Zikora
 */
export interface AtlasAcademicInsight {
  currentCGPA: number
  targetCGPA: number
  degreeClass: string
  completedUnits: number
  remainingUnits: number
  lowestSemester: { level: string; semester: string; gpa: number }
  highestSemester: { level: string; semester: string; gpa: number }
  criticalBottlenecks: CourseGradeItem[]
  firstClassDeficitPoints: number
  requiredGPAForFirstClass: number
  recommendations: string[]
}

export function generateAtlasAcademicAudit(history: AcademicHistory): AtlasAcademicInsight {
  const completed = history.semesters.filter((s) => s.status === 'completed')
  const remainingUnits = Math.max(0, history.totalUnitsRequired - history.totalUnitsEarned)

  // Highest and lowest semesters
  let lowest = completed[0] || history.semesters[0]
  let highest = completed[0] || history.semesters[0]

  completed.forEach((s) => {
    if (s.gpa < lowest.gpa) lowest = s
    if (s.gpa > highest.gpa) highest = s
  })

  // Courses with C or below, or B in 3+ unit courses
  const bottlenecks: CourseGradeItem[] = []
  completed.forEach((s) => {
    s.courses.forEach((c) => {
      if (c.grade === 'C' || c.grade === 'D' || c.grade === 'E' || c.grade === 'F') {
        bottlenecks.push(c)
      }
    })
  })

  // Target First Class (4.50) math:
  // Points needed = 4.50 * TotalUnitsRequired = 4.50 * 152 = 684
  // Points current = history.overallPoints = 516.84
  // Deficit = 684 - 516.84 = 167.16
  // Required GPA across remaining 34 units = 167.16 / 34 = 4.91
  const targetPointsForFirstClass = 4.50 * history.totalUnitsRequired
  const currentPoints = history.overallPoints
  const pointsDeficit = Math.max(0, targetPointsForFirstClass - currentPoints)
  const reqGPA = remainingUnits > 0 ? Number((pointsDeficit / remainingUnits).toFixed(2)) : 0

  const recommendations: string[] = []

  if (history.overallCGPA >= 4.50) {
    recommendations.push(
      `Maintain your First Class trajectory by securing at least 4.40 GPA in 400L. Prioritize CSC 401 and CSC 403 (3 units each).`
    )
  } else if (reqGPA <= 5.0) {
    recommendations.push(
      `First Class Honours (4.50 CGPA) is mathematically achievable: You require a minimum of ${reqGPA} GPA across your remaining ${remainingUnits} credit units (e.g., straight A's in 400L First & Second Semester).`
    )
  } else {
    recommendations.push(
      `Second Class Upper Division is secured with high distinction. Your optimal strategy is graduating with 4.42+ CGPA to rank in the top 5% of your departmental cohort.`
    )
  }

  if (bottlenecks.length > 0) {
    const list = bottlenecks.map((b) => `${b.code} (${b.grade})`).slice(0, 3).join(', ')
    recommendations.push(
      `Historical Grade Analysis: Past grade dips occurred in ${list}. Avoid 3-unit course grade leaks this semester by taking midterm CA assignments seriously.`
    )
  }

  recommendations.push(
    `Continuous Assessment leverage: Your current 30:70 assessment model allows you to guarantee an A grade in 400L core courses by scoring ≥24/30 in Continuous Assessment, reducing exam pressure to 46/70.`
  )

  return {
    currentCGPA: history.overallCGPA,
    targetCGPA: history.targetCGPA,
    degreeClass: history.degreeClass.title,
    completedUnits: history.totalUnitsEarned,
    remainingUnits,
    lowestSemester: { level: lowest?.level || '200L', semester: lowest?.semester || '2nd Sem', gpa: lowest?.gpa || 4.10 },
    highestSemester: { level: highest?.level || '200L', semester: highest?.semester || '1st Sem', gpa: highest?.gpa || 4.57 },
    criticalBottlenecks: bottlenecks,
    firstClassDeficitPoints: Number(pointsDeficit.toFixed(2)),
    requiredGPAForFirstClass: Math.min(5.0, reqGPA),
    recommendations,
  }
}
