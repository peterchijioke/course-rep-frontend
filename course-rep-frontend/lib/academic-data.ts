export const DEFAULT_FACULTIES: string[] = [
  'Faculty of Natural & Applied Sciences',
  'Faculty of Engineering & Technology',
  'College of Medicine & Health Sciences',
  'Faculty of Management Sciences',
  'Faculty of Social Sciences',
  'Faculty of Arts & Humanities',
  'Faculty of Law',
  'Faculty of Environmental Sciences',
  'Faculty of Agriculture',
  'Faculty of Education',
  'Faculty of Pharmacy',
]

export const DEFAULT_DEPARTMENTS: string[] = [
  'Computer Science',
  'Software Engineering',
  'Information Technology',
  'Electrical & Electronics Eng.',
  'Cyber Security',
  'Mechanical Engineering',
  'Civil Engineering',
  'Petroleum & Gas Engineering',
  'Chemical Engineering',
  'Accounting',
  'Business Administration',
  'Economics',
  'Mass Communication',
  'Medicine & Surgery (MBBS)',
  'Nursing Science',
  'Pharmacy',
  'Medical Laboratory Science',
  'Law',
  'Architecture',
  'Microbiology',
  'Biochemistry',
]

export const DEFAULT_LEVELS: string[] = [
  '100 Level',
  '200 Level',
  '300 Level',
  '400 Level',
  '500 Level',
  '600 Level',
  'Postgraduate Diploma (PGD)',
  'Masters (M.Sc)',
  'Doctorate (Ph.D)',
]

export const DEFAULT_SESSIONS: string[] = [
  '2026/2027 Academic Session',
  '2025/2026 Academic Session',
  '2024/2025 Academic Session',
  '2023/2024 Academic Session',
]

export const DEFAULT_SEMESTERS: string[] = [
  'First Semester',
  'Second Semester',
  'Alpha Semester',
  'Omega Semester',
  'Harmattan Semester',
  'Rain Semester',
  'Summer Session',
]

function getStoredList(key: string, defaultList: string[]): string[] {
  if (typeof window === 'undefined') return defaultList
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return defaultList
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      const merged = [...defaultList]
      for (const item of parsed) {
        if (typeof item === 'string' && item.trim()) {
          const trimmed = item.trim()
          if (!merged.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
            merged.push(trimmed)
          }
        }
      }
      return merged
    }
    return defaultList
  } catch {
    return defaultList
  }
}

function enlistItem(key: string, name: string, defaultList: string[]): string[] {
  if (typeof window === 'undefined') return defaultList
  const trimmed = name.trim()
  if (!trimmed) return getStoredList(key, defaultList)

  try {
    const list = getStoredList(key, defaultList)
    const exists = list.some((item) => item.toLowerCase() === trimmed.toLowerCase())
    if (!exists) {
      const updated = [...list, trimmed]
      const customOnly = updated.filter(
        (item) => !defaultList.some((d) => d.toLowerCase() === item.toLowerCase())
      )
      localStorage.setItem(key, JSON.stringify(customOnly))
      return updated
    }
    return list
  } catch {
    return getStoredList(key, defaultList)
  }
}

export function getEnlistedFaculties(): string[] {
  return getStoredList('course_rep_enlisted_faculties', DEFAULT_FACULTIES)
}

export function enlistFaculty(name: string): string[] {
  return enlistItem('course_rep_enlisted_faculties', name, DEFAULT_FACULTIES)
}

export function getEnlistedDepartments(): string[] {
  return getStoredList('course_rep_enlisted_departments', DEFAULT_DEPARTMENTS)
}

export function enlistDepartment(name: string): string[] {
  return enlistItem('course_rep_enlisted_departments', name, DEFAULT_DEPARTMENTS)
}

export function getEnlistedLevels(): string[] {
  return getStoredList('course_rep_enlisted_levels', DEFAULT_LEVELS)
}

export function enlistLevel(name: string): string[] {
  return enlistItem('course_rep_enlisted_levels', name, DEFAULT_LEVELS)
}

export function getEnlistedSessions(): string[] {
  return getStoredList('course_rep_enlisted_sessions', DEFAULT_SESSIONS)
}

export function enlistSession(name: string): string[] {
  return enlistItem('course_rep_enlisted_sessions', name, DEFAULT_SESSIONS)
}

export function getEnlistedSemesters(): string[] {
  return getStoredList('course_rep_enlisted_semesters', DEFAULT_SEMESTERS)
}

export function enlistSemester(name: string): string[] {
  return enlistItem('course_rep_enlisted_semesters', name, DEFAULT_SEMESTERS)
}
