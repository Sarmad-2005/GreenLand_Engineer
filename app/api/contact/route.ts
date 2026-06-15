import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { handler, created, fail } from '@/lib/api'
import { rateLimit, clientIp } from '@/lib/auth/ratelimit'
import { contactSchema } from '@/lib/validators/contact'
import { sendMail, contactEmailHtml } from '@/lib/email'

const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || process.env.GMAIL_USER || ''

// Public endpoint — anyone can submit the contact form.
export const POST = handler(async (req: NextRequest) => {
  const rl = rateLimit(`contact:${clientIp(req)}`, 5, 60_000)
  if (!rl.allowed) return fail(429, 'Too many requests — please try again in a minute.')

  const input = contactSchema.parse(await req.json().catch(() => ({})))

  const saved = await prisma.contactMessage.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      company: input.company || null,
      product: input.product || null,
      message: input.message,
    },
    select: { id: true },
  })

  // Best-effort email — the message is already persisted, so a mail failure
  // must not fail the request.
  if (CONTACT_TO_EMAIL) {
    await sendMail({
      to: CONTACT_TO_EMAIL,
      subject: `New enquiry from ${input.name}`,
      html: contactEmailHtml(input),
      replyTo: input.email,
    })
  }

  return created({ id: saved.id })
})
