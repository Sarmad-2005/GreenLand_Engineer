import { type NextRequest } from 'next/server'
import { handler, ok } from '@/lib/api'
import { revokeRefreshToken } from '@/lib/auth/tokens'
import { clearAuthCookies, REFRESH_COOKIE } from '@/lib/auth/session'

export const POST = handler(async (req: NextRequest) => {
  const token = req.cookies.get(REFRESH_COOKIE)?.value
  if (token) await revokeRefreshToken(token)

  const res = ok({ loggedOut: true })
  clearAuthCookies(res)
  return res
})
