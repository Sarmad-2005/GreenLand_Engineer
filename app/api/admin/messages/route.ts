import { type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { handler, ok, parseListQuery, paginated } from '@/lib/api'
import { requirePermission } from '@/lib/auth/session'

const SORTABLE = new Set(['name', 'email', 'read', 'createdAt'])

export const GET = handler(async (req: NextRequest) => {
  await requirePermission('messages:manage')
  const q = parseListQuery(req)

  const where: Prisma.ContactMessageWhereInput = {
    ...(q.status === 'unread' ? { read: false } : {}),
    ...(q.status === 'read' ? { read: true } : {}),
    ...(q.search
      ? {
          OR: [
            { name: { contains: q.search, mode: 'insensitive' } },
            { email: { contains: q.search, mode: 'insensitive' } },
            { message: { contains: q.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const sort = SORTABLE.has(q.sort) ? q.sort : 'createdAt'

  const [items, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { [sort]: q.order },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.contactMessage.count({ where }),
  ])

  return ok(paginated(items, total, q))
})
