import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { handler, ok, fail } from '@/lib/api'
import { resetPasswordSchema } from '@/lib/validators/auth'
import { hashPassword } from '@/lib/auth/password'
import { sha256, revokeAllSessions } from '@/lib/auth/tokens'

export const POST = handler(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}))
  const { token, password } = resetPasswordSchema.parse(body)

  const user = await prisma.user.findFirst({
    where: {
      resetToken: sha256(token),
      resetTokenExpiry: { gt: new Date() },
      deletedAt: null,
    },
  })

  if (!user) return fail(400, 'This reset link is invalid or has expired.')

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      resetToken: null,
      resetTokenExpiry: null,
      failedAttempts: 0,
      lockedUntil: null,
    },
  })

  // Invalidate all existing sessions after a password change.
  await revokeAllSessions(user.id)

  return ok({ message: 'Password updated. You can now sign in.' })
})
