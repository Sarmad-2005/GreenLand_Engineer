import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { handler, created, fail } from '@/lib/api'
import { rateLimit, clientIp } from '@/lib/auth/ratelimit'
import { subscribeSchema } from '@/lib/validators/subscribe'
import { sendMail, welcomeHtml, unsubscribeUrlFor } from '@/lib/email'

// Public endpoint — newsletter signup from the footer.
export const POST = handler(async (req: NextRequest) => {
  const rl = rateLimit(`subscribe:${clientIp(req)}`, 5, 60_000)
  if (!rl.allowed) return fail(429, 'Too many requests — please try again in a minute.')

  const { email } = subscribeSchema.parse(await req.json().catch(() => ({})))
  const normalized = email.toLowerCase().trim()

  // Upsert: a returning/previously-unsubscribed email is re-activated.
  const sub = await prisma.subscriber.upsert({
    where: { email: normalized },
    update: { unsubscribedAt: null },
    create: { email: normalized },
    select: { token: true },
  })

  await sendMail({
    to: normalized,
    subject: 'Welcome to Green Land Engineers updates',
    html: welcomeHtml(unsubscribeUrlFor(sub.token)),
  })

  return created({ subscribed: true })
})
