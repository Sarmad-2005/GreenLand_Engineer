import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { handler, ok, fail } from '@/lib/api'
import { requirePermission } from '@/lib/auth/session'
import { blogUpdateSchema } from '@/lib/validators/blog'
import { uniqueSlug } from '@/lib/slug'
import { maybeNotifyForPost } from '@/lib/email'

type Ctx = { params: Promise<{ id: string }> }

export const GET = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requirePermission('blogs:manage')
  const { id } = await params
  const blog = await prisma.blog.findFirst({ where: { id, deletedAt: null }, include: { images: true } })
  if (!blog) return fail(404, 'Blog not found')
  return ok(blog)
})

export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  await requirePermission('blogs:manage')
  const { id } = await params
  const existing = await prisma.blog.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return fail(404, 'Blog not found')

  const input = blogUpdateSchema.parse(await req.json().catch(() => ({})))

  let slug = existing.slug
  if ((input.slug && input.slug !== existing.slug) || (input.title && input.title !== existing.title)) {
    slug = await uniqueSlug(input.slug || input.title || existing.title, async (s) => {
      if (s === existing.slug) return false
      return Boolean(await prisma.blog.findUnique({ where: { slug: s } }))
    })
  }

  const blog = await prisma.blog.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      slug,
      ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.featuredImage !== undefined ? { featuredImage: input.featuredImage || null } : {}),
      ...(input.tag !== undefined ? { tag: input.tag || null } : {}),
      ...(input.author !== undefined ? { author: input.author || null } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle || null } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription || null } : {}),
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(input.publishedAt !== undefined ? { publishedAt: input.publishedAt } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.images !== undefined
        ? { images: { deleteMany: {}, create: input.images.map((path) => ({ path })) } }
        : {}),
    },
  })

  await maybeNotifyForPost({
    kind: 'blog',
    id: blog.id,
    status: blog.status,
    notifiedAt: blog.notifiedAt,
    title: blog.title,
    summary: blog.excerpt,
    slug: blog.slug,
  })

  return ok(blog)
})

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requirePermission('blogs:manage')
  const { id } = await params
  const existing = await prisma.blog.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return fail(404, 'Blog not found')

  await prisma.blog.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } })
  return ok({ deleted: true })
})
