import { NextResponse, type NextRequest } from 'next/server'
import { verifyAccessToken, type Role } from '@/lib/auth/jwt'
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/session'
import { can, requiredPermissionForPath } from '@/lib/auth/rbac'

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  const isApi = pathname.startsWith('/api/')
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value
  const hasRefresh = Boolean(req.cookies.get(REFRESH_COOKIE)?.value)

  // 1) Valid access token → enforce route permission, allow.
  if (accessToken) {
    try {
      const claims = await verifyAccessToken(accessToken)
      const needed = requiredPermissionForPath(pathname)
      if (needed && !can(claims.role as Role, needed)) {
        if (isApi) return json(403, 'Forbidden')
        return NextResponse.redirect(new URL('/admin?denied=1', req.url))
      }
      return NextResponse.next()
    } catch {
      // fall through to refresh handling
    }
  }

  // 2) No / expired access token.
  if (isApi) {
    // Let the client call /api/auth/refresh then retry.
    return json(401, 'Authentication required')
  }

  // 3) Admin page: bounce through refresh if a refresh cookie exists, else login.
  if (hasRefresh) {
    const url = new URL('/api/auth/refresh', req.url)
    url.searchParams.set('redirect', pathname + search)
    return NextResponse.redirect(url)
  }

  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('next', pathname + search)
  return NextResponse.redirect(loginUrl)
}

function json(status: number, message: string) {
  return new NextResponse(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
