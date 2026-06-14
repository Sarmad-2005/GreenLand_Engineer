import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { handler, ok, fail } from '@/lib/api'
import { requirePermission } from '@/lib/auth/session'
import { categoryUpdateSchema } from '@/lib/validators/category'
import { uniqueSlug } from '@/lib/slug'

type Ctx = { params: Promise<{ id: string }> }

// GET /api/categories/:id
export const GET = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requirePermission('categories:manage')
  const { id } = await params
  const category = await prisma.category.findFirst({
    where: { id, deletedAt: null },
    include: { _count: { select: { products: true } } },
  })
  if (!category) return fail(404, 'Category not found')
  return ok(category)
})

// PATCH /api/categories/:id
export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  await requirePermission('categories:manage')
  const { id } = await params
  const existing = await prisma.category.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return fail(404, 'Category not found')

  const input = categoryUpdateSchema.parse(await req.json().catch(() => ({})))

  let slug = existing.slug
  if ((input.slug && input.slug !== existing.slug) || (input.name && input.name !== existing.name)) {
    slug = await uniqueSlug(input.slug || input.name || existing.name, async (s) => {
      if (s === existing.slug) return false
      const found = await prisma.category.findUnique({ where: { slug: s } })
      return Boolean(found)
    })
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      slug,
      ...(input.tagline !== undefined ? { tagline: input.tagline || null } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.image !== undefined ? { image: input.image || null } : {}),
      ...(input.gallery !== undefined ? { gallery: input.gallery } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  })

  return ok(category)
})

// DELETE /api/categories/:id — soft delete
export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requirePermission('categories:manage')
  const { id } = await params
  const existing = await prisma.category.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return fail(404, 'Category not found')

  // Cascade: soft-delete the products in this category too (recoverable in the DB).
  const { count } = await prisma.product.updateMany({
    where: { categoryId: id, deletedAt: null },
    data: { deletedAt: new Date(), status: 'INACTIVE' },
  })

  await prisma.category.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } })
  return ok({ deleted: true, productsRemoved: count })
})
