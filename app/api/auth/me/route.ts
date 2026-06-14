import { handler, ok } from '@/lib/api'
import { requireUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { permissionsFor } from '@/lib/auth/rbac'
import type { Role } from '@/lib/auth/jwt'

export const GET = handler(async () => {
  const claims = await requireUser()
  const user = await prisma.user.findFirst({
    where: { id: claims.sub, deletedAt: null },
    select: { id: true, fullName: true, email: true, role: true, status: true, lastLogin: true },
  })
  if (!user) return ok({ user: null })
  return ok({ user, permissions: permissionsFor(user.role as Role) })
})
