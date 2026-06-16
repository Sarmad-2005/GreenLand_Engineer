import { type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { handler, ok, created, parseListQuery, paginated } from '@/lib/api'
import { requirePermission } from '@/lib/auth/session'
import { productCreateSchema } from '@/lib/validators/product'
import { uniqueSlug } from '@/lib/slug'

const SORTABLE = new Set(['name', 'price', 'stock', 'createdAt', 'updatedAt', 'status'])

export const GET = handler(async (req: NextRequest) => {
  await requirePermission('products:manage')
  const q = parseListQuery(req)

  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(q.status ? { status: q.status as 'ACTIVE' | 'INACTIVE' } : {}),
    ...(q.filters.category ? { category: { slug: q.filters.category } } : {}),
    ...(q.filters.featured ? { featured: q.filters.featured === 'true' } : {}),
    ...(q.search
      ? {
          OR: [
            { name: { contains: q.search, mode: 'insensitive' } },
            { sku: { contains: q.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const sort = SORTABLE.has(q.sort) ? q.sort : 'createdAt'

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { [sort]: q.order },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      include: {
        category: { select: { name: true, slug: true } },
        images: { orderBy: { position: 'asc' }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
  ])

  // serialize Decimal price
  const data = items.map((p) => ({ ...p, price: p.price ? p.price.toString() : null }))
  return ok(paginated(data, total, q))
})

export const POST = handler(async (req: NextRequest) => {
  await requirePermission('products:manage')
  const input = productCreateSchema.parse(await req.json().catch(() => ({})))

  const slug = await uniqueSlug(input.slug || input.name, async (s) =>
    Boolean(await prisma.product.findUnique({ where: { slug: s } })),
  )

  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      price: input.price ?? null,
      sku: input.sku || null,
      stock: input.stock,
      categoryId: input.categoryId,
      featured: input.featured,
      status: input.status,
      specifications: (input.specifications ?? []) as Prisma.InputJsonValue,
      videos: (input.videos ?? []) as Prisma.InputJsonValue,
      images: {
        create: (input.images ?? []).map((path, position) => ({ path, position })),
      },
    },
    include: { images: true },
  })

  return created({ ...product, price: product.price ? product.price.toString() : null })
})
