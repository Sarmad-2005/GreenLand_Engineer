import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { handler, ok, fail } from '@/lib/api'
import { requirePermission } from '@/lib/auth/session'
import { newsUpdateSchema } from '@/lib/validators/news'
import { uniqueSlug } from '@/lib/slug'
import { maybeNotifyForPost } from '@/lib/email'

type Ctx = { params: Promise<{ id: string }> }

export const GET = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requirePermission('news:manage')
  const { id } = await params
  const item = await prisma.news.findFirst({
    where: { id, deletedAt: null },
    include: { images: true },
  })
  if (!item) return fail(404, 'News entry not found')
  return ok(item)
})

export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  await requirePermission('news:manage')
  const { id } = await params
  const existing = await prisma.news.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return fail(404, 'News entry not found')

  const input = newsUpdateSchema.parse(await req.json().catch(() => ({})))

  let slug = existing.slug
  if ((input.slug && input.slug !== existing.slug) || (input.title && input.title !== existing.title)) {
    slug = await uniqueSlug(input.slug || input.title || existing.title, async (s) => {
      if (s === existing.slug) return false
      return Boolean(await prisma.news.findUnique({ where: { slug: s } }))
    })
  }

  const item = await prisma.news.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      slug,
      ...(input.summary !== undefined ? { summary: input.summary } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.author !== undefined ? { author: input.author || null } : {}),
      ...(input.publicationDate !== undefined ? { publicationDate: input.publicationDate } : {}),
      ...(input.featuredImage !== undefined ? { featuredImage: input.featuredImage || null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.images !== undefined
        ? { images: { deleteMany: {}, create: input.images.map((path) => ({ path })) } }
        : {}),
    },
  })

  await maybeNotifyForPost({
    kind: 'news',
    id: item.id,
    status: item.status,
    notifiedAt: item.notifiedAt,
    title: item.title,
    summary: item.summary,
    slug: item.slug,
  })

  return ok(item)
})

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requirePermission('news:manage')
  const { id } = await params
  const existing = await prisma.news.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return fail(404, 'News entry not found')

  await prisma.news.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } })
  return ok({ deleted: true })
})
