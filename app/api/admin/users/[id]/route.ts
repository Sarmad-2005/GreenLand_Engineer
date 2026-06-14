import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { handler, ok, fail } from '@/lib/api'
import { requirePermission } from '@/lib/auth/session'
import { userUpdateSchema } from '@/lib/validators/user'
import { hashPassword } from '@/lib/auth/password'
import { revokeAllSessions } from '@/lib/auth/tokens'

type Ctx = { params: Promise<{ id: string }> }

const publicSelect = {
  id: true, fullName: true, email: true, role: true, status: true,
  lastLogin: true, createdAt: true,
}

async function countActiveSuperAdmins(excludeId?: string) {
  return prisma.user.count({
    where: { role: 'SUPER_ADMIN', status: 'ACTIVE', deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
  })
}

export const GET = handler(async (_req: NextRequest, { params }: Ctx) => {
  await requirePermission('users:manage')
  const { id } = await params
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: publicSelect })
  if (!user) return fail(404, 'User not found')
  return ok(user)
})

export const PATCH = handler(async (req: NextRequest, { params }: Ctx) => {
  await requirePermission('users:manage')
  const { id } = await params
  const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return fail(404, 'User not found')

  const input = userUpdateSchema.parse(await req.json().catch(() => ({})))

  // Guard: don't allow removing the last active super admin (by demotion or deactivation).
  const losingSuperPower =
    existing.role === 'SUPER_ADMIN' &&
    ((input.role && input.role !== 'SUPER_ADMIN') || input.status === 'INACTIVE')
  if (losingSuperPower && (await countActiveSuperAdmins(existing.id)) === 0) {
    return fail(409, 'You cannot remove the last active Super Admin.')
  }

  if (input.email && input.email.toLowerCase() !== existing.email) {
    const taken = await prisma.user.findFirst({ where: { email: input.email.toLowerCase(), id: { not: id } } })
    if (taken) return fail(409, 'That email is already in use')
  }

  const changingPassword = Boolean(input.password)

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
      ...(input.email !== undefined ? { email: input.email.toLowerCase() } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(changingPassword ? { passwordHash: await hashPassword(input.password as string) } : {}),
    },
    select: publicSelect,
  })

  // Force re-login if password changed or the account was deactivated.
  if (changingPassword || input.status === 'INACTIVE') {
    await revokeAllSessions(id)
  }

  return ok(user)
})

export const DELETE = handler(async (_req: NextRequest, { params }: Ctx) => {
  const claims = await requirePermission('users:manage')
  const { id } = await params

  if (id === claims.sub) return fail(409, 'You cannot delete your own account.')

  const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } })
  if (!existing) return fail(404, 'User not found')

  if (existing.role === 'SUPER_ADMIN' && (await countActiveSuperAdmins(existing.id)) === 0) {
    return fail(409, 'You cannot delete the last active Super Admin.')
  }

  await prisma.user.update({ where: { id }, data: { deletedAt: new Date(), status: 'INACTIVE' } })
  await revokeAllSessions(id)
  return ok({ deleted: true })
})
