import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { handler, ok, fail } from '@/lib/api'
import { requirePermission } from '@/lib/auth/session'

type Ctx = { params: Promise<{ id: string }> }

const updateSchema = z.object({ read: z.boolean() })

export const GET = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requirePermission('messages:manage')
  const { id } = await params
  const msg = await prisma.contactMessage.findUnique({ where: { id } })
  if (!msg) return fail(404, 'Message not found')
  return ok(msg)
})

export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  await requirePermission('messages:manage')
  const { id } = await params
  const input = updateSchema.parse(await req.json().catch(() => ({})))
  const existing = await prisma.contactMessage.findUnique({ where: { id } })
  if (!existing) return fail(404, 'Message not found')
  const msg = await prisma.contactMessage.update({ where: { id }, data: { read: input.read } })
  return ok(msg)
})

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requirePermission('messages:manage')
  const { id } = await params
  const existing = await prisma.contactMessage.findUnique({ where: { id } })
  if (!existing) return fail(404, 'Message not found')
  await prisma.contactMessage.delete({ where: { id } })
  return ok({ deleted: true })
})
