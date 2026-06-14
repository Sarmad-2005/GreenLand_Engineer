import { type NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/db'
import { handler, ok, fail } from '@/lib/api'
import { forgotPasswordSchema } from '@/lib/validators/auth'
import { sha256 } from '@/lib/auth/tokens'
import { rateLimit, clientIp } from '@/lib/auth/ratelimit'

const RESET_TTL_MINUTES = 30

export const POST = handler(async (req: NextRequest) => {
  const rl = rateLimit(`forgot:${clientIp(req)}`, 5, 60_000)
  if (!rl.allowed) return fail(429, `Too many requests. Try again in ${rl.retryAfterSeconds}s.`)

  const body = await req.json().catch(() => ({}))
  const { email } = forgotPasswordSchema.parse(body)

  const user = await prisma.user.findFirst({ where: { email: email.toLowerCase(), deletedAt: null } })

  // Always respond success to avoid email enumeration.
  const generic = ok({ message: 'If that email exists, a reset link has been sent.' })

  if (!user) return generic

  const rawToken = randomBytes(32).toString('hex')
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: sha256(rawToken),
      resetTokenExpiry: new Date(Date.now() + RESET_TTL_MINUTES * 60_000),
    },
  })

  const link = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`

  // DEV: no SMTP configured — log the link and (in non-production) return it for convenience.
  console.log(`[password-reset] ${user.email} → ${link}`)

  if (process.env.NODE_ENV !== 'production') {
    return ok({ message: 'Reset link generated (dev mode).', devResetLink: link })
  }
  return generic
})
