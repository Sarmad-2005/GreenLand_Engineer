import { redirect } from 'next/navigation'
import { getSessionClaims } from '@/lib/auth/session'
import { can } from '@/lib/auth/rbac'
import type { Role } from '@/lib/auth/jwt'
import { UsersManager } from '@/components/admin/users/users-manager'

export default async function AdminUsersPage() {
  const claims = await getSessionClaims()
  if (!claims) redirect('/login')
  if (!can(claims.role as Role, 'users:manage')) redirect('/admin')

  return <UsersManager />
}
