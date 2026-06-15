import { type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { handler, ok, created, parseListQuery, paginated } from '@/lib/api'
import { requirePermission } from '@/lib/auth/session'
import { newsCreateSchema } from '@/lib/validators/news'
import { uniqueSlug } from '@/lib/slug'
import { maybeNotifyForPost } from '@/lib/email'

const SORTABLE = new Set(['title', 'publicationDate', 'createdAt', 'status', 'type'])

export const GET = handler(async (req: NextRequest) => {
  await requirePermission('news:manage')
  const q = parseListQuery(req)

  const where: Prisma.NewsWhereInput = {
    deletedAt: null,
    ...(q.status ? { status: q.status as 'ACTIVE' | 'INACTIVE' } : {}),
    ...(q.filters.type ? { type: q.filters.type as Prisma.NewsWhereInput['type'] } : {}),
    ...(q.search
      ? {
          OR: [
            { title: { contains: q.search, mode: 'insensitive' } },
            { summary: { contains: q.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const sort = SORTABLE.has(q.sort) ? q.sort : 'publicationDate'

  const [items, total] = await Promise.all([
    prisma.news.findMany({
      where,
      orderBy: { [sort]: q.order },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.news.count({ where }),
  ])

  return ok(paginated(items, total, q))
})

export const POST = handler(async (req: NextRequest) => {
  await requirePermission('news:manage')
  const input = newsCreateSchema.parse(await req.json().catch(() => ({})))

  const slug = await uniqueSlug(input.slug || input.title, async (s) =>
    Boolean(await prisma.news.findUnique({ where: { slug: s } })),
  )

  const item = await prisma.news.create({
    data: {
      title: input.title,
      slug,
      summary: input.summary,
      type: input.type,
      author: input.author || null,
      publicationDate: input.publicationDate ?? new Date(),
      featuredImage: input.featuredImage || null,
      status: input.status,
      images: { create: (input.images ?? []).map((path) => ({ path })) },
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

  return created(item)
})
