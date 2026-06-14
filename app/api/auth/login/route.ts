import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { handler, fail, ok } from '@/lib/api'
import { loginSchema } from '@/lib/validators/auth'
import { verifyPassword } from '@/lib/auth/password'
import { issueSession } from '@/lib/auth/tokens'
import { setAuthCookies } from '@/lib/auth/session'
import { rateLimit, clientIp } from '@/lib/auth/ratelimit'
import type { Role } from '@/lib/auth/jwt'

const MAX_FAILED = 5
const LOCK_MINUTES = 15

export const POST = handler(async (req: NextRequest) => {
  // Per-IP throttle to slow brute force.
  const ip = clientIp(req)
  const rl = rateLimit(`login:${ip}`, 10, 60_000)
  if (!rl.allowed) {
    return fail(429, `Too many attempts. Try again in ${rl.retryAfterSeconds}s.`)
  }

  const body = await req.json().catch(() => ({}))
  const { email, password, remember } = loginSchema.parse(body)

  const user = await prisma.user.findFirst({ where: { email: email.toLowerCase(), deletedAt: null } })

  // Generic failure message to avoid user enumeration.
  const invalid = () => fail(401, 'Invalid email or password')

  if (!user) {
    await verifyPassword(password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinv') // timing parity
    return invalid()
  }

  if (user.status !== 'ACTIVE') {
    return fail(403, 'This account is inactive. Contact an administrator.')
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
    return fail(423, `Account locked due to failed attempts. Try again in ${mins} minute(s).`)
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    const attempts = user.failedAttempts + 1
    const lock = attempts >= MAX_FAILED
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: lock ? 0 : attempts,
        lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    })
    if (lock) {
      return fail(423, `Account locked for ${LOCK_MINUTES} minutes after ${MAX_FAILED} failed attempts.`)
    }
    return invalid()
  }

  // Success — reset counters, stamp login.
  await prisma.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLogin: new Date() },
  })

  const session = await issueSession(
    { id: user.id, email: user.email, role: user.role as Role, fullName: user.fullName },
    remember,
  )

  const res = ok({
    user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
  })
  setAuthCookies(res, session.accessToken, session.refreshToken, session.refreshTtlDays)
  return res
})
