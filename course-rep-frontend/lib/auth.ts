import { setAuthToken, clearAuthToken, getAuthToken } from './api'

export const AUTH_COOKIE_NAME = 'course-rep-authenticated'

export function loginUser(token?: string) {
  if (token) {
    setAuthToken(token)
  }
  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_COOKIE_NAME}=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
    try {
      sessionStorage.setItem(AUTH_COOKIE_NAME, 'true')
    } catch {
      // ignore storage errors
    }
  }
}

export function logoutUser() {
  clearAuthToken()
  if (typeof document !== 'undefined') {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
    try {
      sessionStorage.removeItem(AUTH_COOKIE_NAME)
    } catch {
      // ignore storage errors
    }
  }
}

export function checkIsAuthenticated(): boolean {
  if (typeof document === 'undefined') return false
  const token = getAuthToken()
  if (token) return true

  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === AUTH_COOKIE_NAME && value === 'true') {
      return true
    }
  }
  try {
    return sessionStorage.getItem(AUTH_COOKIE_NAME) === 'true'
  } catch {
    return false
  }
}
