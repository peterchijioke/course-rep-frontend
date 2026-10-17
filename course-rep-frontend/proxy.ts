import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE_NAME } from './lib/auth'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)
  const isAuthenticated = authCookie?.value === 'true'

  // Alias /overview to /dashboard
  if (pathname === '/overview') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')
  const isAuthRoute = pathname === '/login' || pathname === '/register'

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/overview',
    '/dashboard/:path*',
    '/onboarding',
    '/login',
    '/register',
  ],
}
