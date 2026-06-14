import { type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { handler, ok, created, parseListQuery, paginated } from '@/lib/api'
import { requirePermission } from '@/lib/auth/session'
import { blogCreateSchema } from '@/lib/validators/blog'
import { uniqueSlug } from '@/lib/slug'

const SORTABLE = new Set(['title', 'publishedAt', 'createdAt', 'status', 'tag'])

export const GET = handler(async (req: NextRequest) => {
  await requirePermission('blogs:manage')
  const q = parseListQuery(req)

  const where: Prisma.BlogWhereInput = {
    deletedAt: null,
    ...(q.status ? { status: q.status as 'ACTIVE' | 'INACTIVE' } : {}),
    ...(q.filters.tag ? { tag: q.filters.tag } : {}),
    ...(q.filters.featured ? { featured: q.filters.featured === 'true' } : {}),
    ...(q.search
      ? {
          OR: [
            { title: { contains: q.search, mode: 'insensitive' } },
            { excerpt: { contains: q.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const sort = SORTABLE.has(q.sort) ? q.sort : 'publishedAt'

  const [items, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      orderBy: { [sort]: q.order },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      select: {
        id: true, title: true, slug: true, excerpt: true, featuredImage: true,
        tag: true, author: true, featured: true, status: true, publishedAt: true, createdAt: true,
      },
    }),
    prisma.blog.count({ where }),
  ])

  return ok(paginated(items, total, q))
})

export const POST = handler(async (req: NextRequest) => {
  await requirePermission('blogs:manage')
  const input = blogCreateSchema.parse(await req.json().catch(() => ({})))

  const slug = await uniqueSlug(input.slug || input.title, async (s) =>
    Boolean(await prisma.blog.findUnique({ where: { slug: s } })),
  )

  const blog = await prisma.blog.create({
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      content: input.content,
      featuredImage: input.featuredImage || null,
      tag: input.tag || null,
      author: input.author || null,
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
      featured: input.featured,
      publishedAt: input.publishedAt ?? new Date(),
      status: input.status,
      images: { create: (input.images ?? []).map((path) => ({ path })) },
    },
  })

  return created(blog)
})
