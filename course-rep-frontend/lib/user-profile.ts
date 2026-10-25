export interface UserProfile {
  name: string
  email: string
  phone: string
  role: 'student' | 'rep'
  institution: string
  faculty: string
  department: string
  level: string
  matricNo: string
  session: string
  semester: string
  targetCGPA: number
  enrolledCourses: string[]
  notifications: {
    whatsapp: boolean
    lectureReminders: boolean
    announcements: boolean
  }
  bio: string
  avatar?: string
  avatar_url?: string
  createdAt: string
}

export const USER_PROFILE_STORAGE_KEY = 'course_rep_user_profile'

export const defaultUserProfile: UserProfile = {
  name: 'Peter Chijioke',
  email: 'peter.chijioke@example.edu.ng',
  phone: '+234 812 345 6789',
  role: 'student',
  institution: 'Example University of Science & Technology',
  faculty: 'Faculty of Natural & Applied Sciences',
  department: 'Computer Science',
  level: '400 Level',
  matricNo: 'EU/2023/CSC/408',
  session: '2026/2027 Academic Session',
  semester: 'First Semester',
  targetCGPA: 4.52,
  enrolledCourses: ['CSC 401', 'CSC 403', 'CSC 405', 'CSC 407'],
  notifications: {
    whatsapp: true,
    lectureReminders: true,
    announcements: true,
  },
  bio: 'Aspiring Full-Stack Software Engineer & Distributed Systems Enthusiast.',
  createdAt: new Date().toISOString(),
}

export function getUserProfile(): UserProfile {
  if (typeof window === 'undefined') return defaultUserProfile
  try {
    const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY)
    if (!raw) return defaultUserProfile
    return { ...defaultUserProfile, ...JSON.parse(raw) }
  } catch {
    return defaultUserProfile
  }
}

export function saveUserProfile(updates: Partial<UserProfile>): UserProfile {
  if (typeof window === 'undefined') return defaultUserProfile
  try {
    const current = getUserProfile()
    const updated = { ...current, ...updates }
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('user-profile-updated'))
    return updated
  } catch {
    return defaultUserProfile
  }
}
