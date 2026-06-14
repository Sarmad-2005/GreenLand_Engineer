import { type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { handler, ok, created, parseListQuery, paginated } from '@/lib/api'
import { requirePermission } from '@/lib/auth/session'
import { categoryCreateSchema } from '@/lib/validators/category'
import { uniqueSlug } from '@/lib/slug'

const SORTABLE = new Set(['name', 'createdAt', 'updatedAt', 'status'])

// GET /api/categories — list with search / filter / sort / pagination
export const GET = handler(async (req: NextRequest) => {
  await requirePermission('categories:manage')
  const q = parseListQuery(req)

  const where: Prisma.CategoryWhereInput = {
    deletedAt: null,
    ...(q.status ? { status: q.status as 'ACTIVE' | 'INACTIVE' } : {}),
    ...(q.search
      ? {
          OR: [
            { name: { contains: q.search, mode: 'insensitive' } },
            { description: { contains: q.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const sort = SORTABLE.has(q.sort) ? q.sort : 'createdAt'

  const [items, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: { [sort]: q.order },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      include: { _count: { select: { products: true } } },
    }),
    prisma.category.count({ where }),
  ])

  return ok(paginated(items, total, q))
})

// POST /api/categories — create
export const POST = handler(async (req: NextRequest) => {
  await requirePermission('categories:manage')
  const body = await req.json().catch(() => ({}))
  const input = categoryCreateSchema.parse(body)

  const slug = await uniqueSlug(input.slug || input.name, async (s) => {
    const found = await prisma.category.findUnique({ where: { slug: s } })
    return Boolean(found)
  })

  const category = await prisma.category.create({
    data: {
      name: input.name,
      slug,
      tagline: input.tagline || null,
      description: input.description,
      image: input.image || null,
      gallery: input.gallery ?? [],
      status: input.status,
    },
  })

  return created(category)
})
