import { type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { handler, ok, created, parseListQuery, paginated } from '@/lib/api'
import { requirePermission } from '@/lib/auth/session'
import { testimonialCreateSchema } from '@/lib/validators/testimonial'

const SORTABLE = new Set(['name', 'rating', 'createdAt', 'status'])

export const GET = handler(async (req: NextRequest) => {
  await requirePermission('testimonials:manage')
  const q = parseListQuery(req)

  const where: Prisma.TestimonialWhereInput = {
    deletedAt: null,
    ...(q.status ? { status: q.status as 'ACTIVE' | 'INACTIVE' } : {}),
    ...(q.filters.featured ? { featured: q.filters.featured === 'true' } : {}),
    ...(q.search
      ? {
          OR: [
            { name: { contains: q.search, mode: 'insensitive' } },
            { quote: { contains: q.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const sort = SORTABLE.has(q.sort) ? q.sort : 'createdAt'

  const [items, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      orderBy: { [sort]: q.order },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      select: {
        id: true, name: true, role: true, location: true, quote: true, photo: true,
        rating: true, featured: true, status: true, createdAt: true,
      },
    }),
    prisma.testimonial.count({ where }),
  ])

  return ok(paginated(items, total, q))
})

export const POST = handler(async (req: NextRequest) => {
  await requirePermission('testimonials:manage')
  const input = testimonialCreateSchema.parse(await req.json().catch(() => ({})))

  const testimonial = await prisma.testimonial.create({
    data: {
      name: input.name,
      role: input.role || null,
      location: input.location || null,
      quote: input.quote,
      photo: input.photo || null,
      rating: input.rating,
      featured: input.featured,
      status: input.status,
    },
  })

  return created(testimonial)
})
