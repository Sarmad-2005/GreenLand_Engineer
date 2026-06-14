import { NextResponse, type NextRequest } from 'next/server'
import { handler, ok, fail } from '@/lib/api'
import { rotateSession } from '@/lib/auth/tokens'
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from '@/lib/auth/session'

/**
 * GET  → used by middleware redirect bounce: rotates and redirects back to `redirect`.
 * POST → used by client fetch interceptor: rotates and returns JSON.
 */
export const GET = handler(async (req: NextRequest) => {
  const redirect = req.nextUrl.searchParams.get('redirect') || '/admin'
  const token = req.cookies.get(REFRESH_COOKIE)?.value

  if (!token) return redirectToLogin(req, redirect)

  const session = await rotateSession(token)
  if (!session) {
    const res = redirectToLogin(req, redirect)
    clearAuthCookies(res)
    return res
  }

  const res = NextResponse.redirect(new URL(redirect, req.url))
  setAuthCookies(res, session.accessToken, session.refreshToken, session.refreshTtlDays)
  return res
})

export const POST = handler(async (req: NextRequest) => {
  const token = req.cookies.get(REFRESH_COOKIE)?.value
  if (!token) return fail(401, 'No refresh token')

  const session = await rotateSession(token)
  if (!session) {
    const res = fail(401, 'Session expired')
    clearAuthCookies(res)
    return res
  }

  const res = ok({ refreshed: true })
  setAuthCookies(res, session.accessToken, session.refreshToken, session.refreshTtlDays)
  return res
})

function redirectToLogin(req: NextRequest, next: string) {
  const url = new URL('/login', req.url)
  url.searchParams.set('next', next)
  return NextResponse.redirect(url)
}
