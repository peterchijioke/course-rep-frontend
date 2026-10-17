export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://course-rep-backend.onrender.com/api/v1'

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'https://course-rep-backend.onrender.com'

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('course-rep-token') || localStorage.getItem('course-rep-token')
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('course-rep-token', token)
    localStorage.setItem('course-rep-token', token)
    document.cookie = `course-rep-token=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
    document.cookie = `course-rep-authenticated=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('course-rep-token')
    localStorage.removeItem('course-rep-token')
    document.cookie = `course-rep-token=; path=/; max-age=0; SameSite=Lax`
    document.cookie = `course-rep-authenticated=; path=/; max-age=0; SameSite=Lax`
  }
}

export function getWebSocketUrl(): string {
  const token = getAuthToken()
  let wsBase = API_BASE_URL.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://')
  return `${wsBase}/chat/ws?token=${encodeURIComponent(token || '')}`
}

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
  const token = getAuthToken()

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

// Module-level API helpers
export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (payload: { full_name: string; email: string; password: string; role?: string }) =>
      apiRequest<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    me: () => apiRequest<User>('/auth/me'),
    updateProfile: (profile: Partial<User>) =>
      apiRequest<User>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      }),
    onboarding: (data: { institution: string; department: string; academic_level: string; academic_session: string }) =>
      apiRequest<User>('/auth/onboarding', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  courses: {
    getAll: () => apiRequest<Course[]>('/courses'),
    getMyEnrolled: () => apiRequest<Course[]>('/courses/my/enrolled'),
    join: (courseId: number) =>
      apiRequest<void>('/courses/join', {
        method: 'POST',
        body: JSON.stringify({ course_id: courseId }),
      }),
    create: (dto: CreateCourseDTO) =>
      apiRequest<Course>('/courses', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
  },
  announcements: {
    getAll: () => apiRequest<AnnouncementItem[]>('/announcements'),
    create: (dto: CreateAnnouncementDTO) =>
      apiRequest<AnnouncementItem>('/announcements', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    markRead: (id: number) =>
      apiRequest<void>(`/announcements/${id}/read`, {
        method: 'POST',
      }),
    markAllRead: () =>
      apiRequest<void>('/announcements/mark-all-read', {
        method: 'POST',
      }),
  },
  timetable: {
    getAll: () => apiRequest<TimetableSlot[]>('/timetable'),
    create: (dto: CreateEventDTO) =>
      apiRequest<TimetableSlot>('/timetable', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    delete: (id: number) =>
      apiRequest<void>(`/timetable/${id}`, {
        method: 'DELETE',
      }),
    updateDate: (id: number, date: string) =>
      apiRequest<void>(`/timetable/${id}/date`, {
        method: 'PATCH',
        body: JSON.stringify({ date }),
      }),
  },
  marketplace: {
    getAll: () => apiRequest<MarketplaceItem[]>('/marketplace'),
    create: (item: { title: string; price: string; tag: string; description: string }) =>
      apiRequest<MarketplaceItem>('/marketplace', {
        method: 'POST',
        body: JSON.stringify(item),
      }),
    delete: (id: number) =>
      apiRequest<void>(`/marketplace/${id}`, {
        method: 'DELETE',
      }),
  },
  chat: {
    getGroups: () => apiRequest<ChatGroup[]>('/chat/groups'),
    createGroup: (dto: { name: string; description?: string }) =>
      apiRequest<ChatGroup>('/chat/groups', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    getGroupMessages: (groupId: number) =>
      apiRequest<ChatMessage[]>(`/chat/groups/${groupId}/messages`),
    sendGroupMessage: (groupId: number, dto: { content: string; attachment_name?: string; attachment_url?: string; attachment_type?: string }) =>
      apiRequest<ChatMessage>(`/chat/groups/${groupId}/messages`, {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    getDirectMessages: (recipientId: number) =>
      apiRequest<ChatMessage[]>(`/chat/direct/${recipientId}/messages`),
    sendDirectMessage: (recipientId: number, dto: { content: string; attachment_name?: string; attachment_url?: string; attachment_type?: string }) =>
      apiRequest<ChatMessage>(`/chat/direct/${recipientId}/messages`, {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
  },
  atlas: {
    getRecord: () => apiRequest<AcademicRecord>('/atlas/record'),
    ask: (question: string) =>
      apiRequest<{ answer: string; confidence: number; sources: string[] }>('/atlas/ask', {
        method: 'POST',
        body: JSON.stringify({ question }),
      }),
  },
}
