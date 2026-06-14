import { type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { handler, ok, created, fail, parseListQuery, paginated } from '@/lib/api'
import { requirePermission } from '@/lib/auth/session'
import { userCreateSchema } from '@/lib/validators/user'
import { hashPassword } from '@/lib/auth/password'

const SORTABLE = new Set(['fullName', 'email', 'role', 'status', 'lastLogin', 'createdAt'])

const publicSelect = {
  id: true, fullName: true, email: true, role: true, status: true,
  lastLogin: true, createdAt: true,
}

export const GET = handler(async (req: NextRequest) => {
  await requirePermission('users:manage')
  const q = parseListQuery(req)

  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(q.status ? { status: q.status as 'ACTIVE' | 'INACTIVE' } : {}),
    ...(q.filters.role ? { role: q.filters.role as Prisma.UserWhereInput['role'] } : {}),
    ...(q.search
      ? {
          OR: [
            { fullName: { contains: q.search, mode: 'insensitive' } },
            { email: { contains: q.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const sort = SORTABLE.has(q.sort) ? q.sort : 'createdAt'

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { [sort]: q.order },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      select: publicSelect,
    }),
    prisma.user.count({ where }),
  ])

  return ok(paginated(items, total, q))
})

export const POST = handler(async (req: NextRequest) => {
  await requirePermission('users:manage')
  const input = userCreateSchema.parse(await req.json().catch(() => ({})))

  const exists = await prisma.user.findFirst({ where: { email: input.email.toLowerCase() } })
  if (exists) return fail(409, 'A user with that email already exists')

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      passwordHash: await hashPassword(input.password),
      role: input.role,
      status: input.status,
    },
    select: publicSelect,
  })

  return created(user)
})
