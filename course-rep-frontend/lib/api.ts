export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL 

export interface User {
  id: number
  full_name: string
  email: string
  role: string
  institution: string
  department: string
  academic_level: string
  academic_session: string
  avatar: string
  courses?: Course[]
}

export interface Course {
  id: number
  code: string
  name: string
  color: string
  department: string
  level: string
  lecturer_name: string
  lecture_venue: string
  next_lecture: string
  unread?: number
}

export interface CreateCourseDTO {
  code: string
  name: string
  color?: string
  department?: string
  level?: string
  lecturer_name?: string
  lecture_venue?: string
  next_lecture?: string
}

export interface AnnouncementItem {
  id: number
  course_code: string
  title: string
  body: string
  author_name: string
  is_urgent: boolean
  is_read: boolean
  created_at: string
}

export interface CreateAnnouncementDTO {
  course_code: string
  title: string
  body: string
  is_urgent?: boolean
}

export interface TimetableSlot {
  id: number
  user_id?: number
  course_id?: number
  course_code: string
  title: string
  date: string
  time: string
  start_time?: string
  end_time?: string
  location: string
  tone: string
  is_personal: boolean
  removable: boolean
}

export interface CreateEventDTO {
  title: string
  course?: string
  date: string
  start?: string
  end?: string
  location?: string
  tone?: string
}

export interface MarketplaceItem {
  id: number
  seller_id: number
  seller_name: string
  title: string
  price: string
  tag: string
  description: string
  status: string
  created_at: string
}

export interface ChatGroup {
  id: number
  name: string
  description?: string
  course_id?: number
  created_by_id: number
}

export interface ChatMessage {
  id: number
  sender_id: number
  sender_name: string
  group_id?: number
  recipient_id?: number
  content: string
  attachment_name?: string
  attachment_url?: string
  attachment_type?: string
  created_at: string
}

export interface AcademicRecord {
  id: number
  user_id: number
  cgpa: number
  completed_credits: number
  total_credits: number
  academic_standing: string
  pending_assessments: number
  active_courses_count: number
  last_synced_at: string
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('course-rep-token') : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()
  if (!response.ok || !data.success) {
    throw new Error(data.message || data.error || 'API Request failed')
  }

  return data.data as T
}
