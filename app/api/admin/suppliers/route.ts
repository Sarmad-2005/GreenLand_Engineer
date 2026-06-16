import { type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { handler, ok, parseListQuery, paginated } from '@/lib/api'
import { requirePermission } from '@/lib/auth/session'
import { SUPPLIER_STATUSES } from '@/lib/validators/supplier'

const SORTABLE = new Set(['companyName', 'contactName', 'email', 'status', 'createdAt'])

export const GET = handler(async (req: NextRequest) => {
  await requirePermission('suppliers:manage')
  const q = parseListQuery(req)

  const statusFilter =
    q.status && (SUPPLIER_STATUSES as readonly string[]).includes(q.status)
      ? (q.status as (typeof SUPPLIER_STATUSES)[number])
      : undefined

  const where: Prisma.SupplierWhereInput = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(q.search
      ? {
          OR: [
            { companyName: { contains: q.search, mode: 'insensitive' } },
            { contactName: { contains: q.search, mode: 'insensitive' } },
            { email: { contains: q.search, mode: 'insensitive' } },
            { productTypes: { contains: q.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const sort = SORTABLE.has(q.sort) ? q.sort : 'createdAt'

  const [items, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { [sort]: q.order },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.supplier.count({ where }),
  ])

  return ok(paginated(items, total, q))
})
