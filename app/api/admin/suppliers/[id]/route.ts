import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { handler, ok, fail } from '@/lib/api'
import { requirePermission } from '@/lib/auth/session'
import { supplierStatusSchema } from '@/lib/validators/supplier'

type Ctx = { params: Promise<{ id: string }> }

const updateSchema = z
  .object({
    read: z.boolean().optional(),
    status: supplierStatusSchema.optional(),
  })
  .refine((v) => v.read !== undefined || v.status !== undefined, {
    message: 'Nothing to update',
  })

export const GET = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requirePermission('suppliers:manage')
  const { id } = await params
  const supplier = await prisma.supplier.findUnique({ where: { id } })
  if (!supplier) return fail(404, 'Supplier not found')
  return ok(supplier)
})

export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  await requirePermission('suppliers:manage')
  const { id } = await params
  const input = updateSchema.parse(await req.json().catch(() => ({})))
  const existing = await prisma.supplier.findUnique({ where: { id } })
  if (!existing) return fail(404, 'Supplier not found')
  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      ...(input.read !== undefined ? { read: input.read } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
  })
  return ok(supplier)
})

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requirePermission('suppliers:manage')
  const { id } = await params
  const existing = await prisma.supplier.findUnique({ where: { id } })
  if (!existing) return fail(404, 'Supplier not found')
  await prisma.supplier.delete({ where: { id } })
  return ok({ deleted: true })
})
