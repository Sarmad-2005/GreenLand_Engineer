import { type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { handler, ok, fail } from '@/lib/api'
import { requirePermission } from '@/lib/auth/session'
import { productUpdateSchema } from '@/lib/validators/product'
import { uniqueSlug } from '@/lib/slug'

type Ctx = { params: Promise<{ id: string }> }

export const GET = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requirePermission('products:manage')
  const { id } = await params
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: { images: { orderBy: { position: 'asc' } }, category: { select: { name: true } } },
  })
  if (!product) return fail(404, 'Product not found')
  return ok({ ...product, price: product.price ? product.price.toString() : null })
})

export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  await requirePermission('products:manage')
  const { id } = await params
  const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return fail(404, 'Product not found')

  const input = productUpdateSchema.parse(await req.json().catch(() => ({})))

  let slug = existing.slug
  if ((input.slug && input.slug !== existing.slug) || (input.name && input.name !== existing.name)) {
    slug = await uniqueSlug(input.slug || input.name || existing.name, async (s) => {
      if (s === existing.slug) return false
      return Boolean(await prisma.product.findUnique({ where: { slug: s } }))
    })
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      slug,
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.price !== undefined ? { price: input.price ?? null } : {}),
      ...(input.sku !== undefined ? { sku: input.sku || null } : {}),
      ...(input.stock !== undefined ? { stock: input.stock } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.specifications !== undefined
        ? { specifications: input.specifications as Prisma.InputJsonValue }
        : {}),
      ...(input.videos !== undefined
        ? { videos: input.videos as Prisma.InputJsonValue }
        : {}),
      ...(input.images !== undefined
        ? { images: { deleteMany: {}, create: input.images.map((path, position) => ({ path, position })) } }
        : {}),
    },
    include: { images: { orderBy: { position: 'asc' } } },
  })

  return ok({ ...product, price: product.price ? product.price.toString() : null })
})

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requirePermission('products:manage')
  const { id } = await params
  const existing = await prisma.product.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return fail(404, 'Product not found')

  await prisma.product.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } })
  return ok({ deleted: true })
})
