import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { handler, ok, fail } from '@/lib/api'
import { requirePermission } from '@/lib/auth/session'
import { testimonialUpdateSchema } from '@/lib/validators/testimonial'

type Ctx = { params: Promise<{ id: string }> }

export const GET = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requirePermission('testimonials:manage')
  const { id } = await params
  const testimonial = await prisma.testimonial.findFirst({ where: { id, deletedAt: null } })
  if (!testimonial) return fail(404, 'Testimonial not found')
  return ok(testimonial)
})

export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  await requirePermission('testimonials:manage')
  const { id } = await params
  const existing = await prisma.testimonial.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return fail(404, 'Testimonial not found')

  const input = testimonialUpdateSchema.parse(await req.json().catch(() => ({})))

  const testimonial = await prisma.testimonial.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.role !== undefined ? { role: input.role || null } : {}),
      ...(input.location !== undefined ? { location: input.location || null } : {}),
      ...(input.quote !== undefined ? { quote: input.quote } : {}),
      ...(input.photo !== undefined ? { photo: input.photo || null } : {}),
      ...(input.rating !== undefined ? { rating: input.rating } : {}),
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  })

  return ok(testimonial)
})

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requirePermission('testimonials:manage')
  const { id } = await params
  const existing = await prisma.testimonial.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return fail(404, 'Testimonial not found')

  await prisma.testimonial.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } })
  return ok({ deleted: true })
})
