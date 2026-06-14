import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'
import { verifyAccessToken, type AccessClaims, type Role } from './jwt'
import { can, type Permission } from './rbac'

export const ACCESS_COOKIE = 'gl_access'
export const REFRESH_COOKIE = 'gl_refresh'

const isProd = process.env.NODE_ENV === 'production'

type CookieOpts = {
  httpOnly: true
  secure: boolean
  sameSite: 'strict'
  path: string
  maxAge: number
}

function baseCookie(maxAgeSeconds: number): CookieOpts {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: maxAgeSeconds,
  }
}

/** Attach access + refresh cookies to a NextResponse (login / refresh routes). */
export function setAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
  refreshTtlDays: number,
) {
  // access cookie ~ matches access TTL; we keep it short and rely on /refresh
  res.cookies.set(ACCESS_COOKIE, accessToken, baseCookie(60 * 60)) // 1h cap; token itself expires sooner
  res.cookies.set(REFRESH_COOKIE, refreshToken, baseCookie(60 * 60 * 24 * refreshTtlDays))
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, '', { ...baseCookie(0), maxAge: 0 })
  res.cookies.set(REFRESH_COOKIE, '', { ...baseCookie(0), maxAge: 0 })
}

/** Read + verify the access token from cookies. Returns null if missing/invalid/expired. */
export async function getSessionClaims(): Promise<AccessClaims | null> {
  const store = await cookies()
  const token = store.get(ACCESS_COOKIE)?.value
  if (!token) return null
  try {
    return await verifyAccessToken(token)
  } catch {
    return null
  }
}

/** Guard for API route handlers: returns claims or throws an HttpError-shaped object. */
export class AuthError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function requireUser(): Promise<AccessClaims> {
  const claims = await getSessionClaims()
  if (!claims) throw new AuthError(401, 'Authentication required')
  return claims
}

export async function requirePermission(permission: Permission): Promise<AccessClaims> {
  const claims = await requireUser()
  if (!can(claims.role as Role, permission)) {
    throw new AuthError(403, 'You do not have permission to perform this action')
  }
  return claims
}
