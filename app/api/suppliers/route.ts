import { type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { handler, created, fail } from '@/lib/api'
import { rateLimit, clientIp } from '@/lib/auth/ratelimit'
import { supplierSchema } from '@/lib/validators/supplier'
import { saveDocument, UploadError, type SavedDocument } from '@/lib/storage'
import { sendMail, supplierEmailHtml } from '@/lib/email'

export const runtime = 'nodejs'

const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || process.env.GMAIL_USER || ''
const MAX_DOCUMENTS = 5

// Public endpoint — anyone can apply to become a supplier. Accepts
// multipart/form-data: text fields + one or more `document` files (proof of
// authenticity). Files are stored on Vercel Blob; their URLs are kept on the row.
export const POST = handler(async (req: NextRequest) => {
  const rl = rateLimit(`supplier:${clientIp(req)}`, 3, 60_000)
  if (!rl.allowed) return fail(429, 'Too many requests — please try again in a minute.')

  const form = await req.formData().catch(() => null)
  if (!form) return fail(400, 'Expected multipart/form-data.')

  const input = supplierSchema.parse({
    companyName: form.get('companyName') ?? '',
    contactName: form.get('contactName') ?? '',
    email: form.get('email') ?? '',
    phone: form.get('phone') ?? '',
    whatsapp: form.get('whatsapp') ?? '',
    country: form.get('country') ?? '',
    city: form.get('city') ?? '',
    website: form.get('website') ?? '',
    productTypes: form.get('productTypes') ?? '',
    message: form.get('message') ?? '',
  })

  const files = form.getAll('document').filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length === 0) {
    return fail(422, 'Please attach at least one document proving your business is authentic.')
  }
  if (files.length > MAX_DOCUMENTS) {
    return fail(422, `Please attach at most ${MAX_DOCUMENTS} documents.`)
  }

  let documents: SavedDocument[]
  try {
    documents = await Promise.all(files.map(saveDocument))
  } catch (err) {
    if (err instanceof UploadError) return fail(422, err.message)
    throw err
  }

  const saved = await prisma.supplier.create({
    data: {
      companyName: input.companyName,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      whatsapp: input.whatsapp || null,
      country: input.country || null,
      city: input.city || null,
      website: input.website || null,
      productTypes: input.productTypes || null,
      message: input.message || null,
      documents: documents as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  })

  // Best-effort notification — the application is already persisted.
  if (CONTACT_TO_EMAIL) {
    await sendMail({
      to: CONTACT_TO_EMAIL,
      subject: `New supplier application — ${input.companyName}`,
      html: supplierEmailHtml({ ...input, documentCount: documents.length }),
      replyTo: input.email,
    })
  }

  return created({ id: saved.id })
})
