import { createHash, randomUUID } from 'crypto'
import { prisma } from '@/lib/db'
import { signAccessToken, signRefreshToken, verifyRefreshToken, type Role } from './jwt'

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function refreshTtlDays(remember: boolean): number {
  const base = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7)
  const remembered = Number(process.env.REMEMBER_ME_TTL_DAYS || 30)
  return remember ? remembered : base
}

type SessionUser = { id: string; email: string; role: Role; fullName: string }

export interface IssuedSession {
  accessToken: string
  refreshToken: string
  refreshTtlDays: number
}

/** Create a fresh access token + a persisted refresh token for a user. */
export async function issueSession(user: SessionUser, remember = false): Promise<IssuedSession> {
  const ttlDays = refreshTtlDays(remember)
  const jti = randomUUID()
  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.fullName,
  })
  const refreshToken = await signRefreshToken(user.id, jti, ttlDays)

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
    },
  })

  return { accessToken, refreshToken, refreshTtlDays: ttlDays }
}

/**
 * Rotate a refresh token: validate signature + DB record, revoke the old one,
 * and issue a new access + refresh pair. Returns null if invalid/expired/revoked.
 */
export async function rotateSession(oldToken: string, remember = false): Promise<IssuedSession | null> {
  let sub: string
  try {
    const v = await verifyRefreshToken(oldToken)
    sub = v.sub
  } catch {
    return null
  }

  const record = await prisma.refreshToken.findUnique({ where: { tokenHash: sha256(oldToken) } })
  if (!record || record.revoked || record.expiresAt < new Date()) {
    // Possible reuse of a revoked token → revoke all sessions for safety.
    if (record?.revoked) {
      await prisma.refreshToken.updateMany({ where: { userId: sub }, data: { revoked: true } })
    }
    return null
  }

  const user = await prisma.user.findFirst({
    where: { id: sub, deletedAt: null, status: 'ACTIVE' },
  })
  if (!user) return null

  // Revoke the consumed token (rotation).
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revoked: true } })

  return issueSession(
    { id: user.id, email: user.email, role: user.role as Role, fullName: user.fullName },
    remember,
  )
}

/** Revoke a single refresh token (logout). */
export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: sha256(token) },
    data: { revoked: true },
  })
}

/** Revoke every active session for a user (logout-all / password reset). */
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } })
}
