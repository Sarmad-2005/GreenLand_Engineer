import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getSessionClaims } from '@/lib/auth/session'
import { permissionsFor } from '@/lib/auth/rbac'
import type { Role } from '@/lib/auth/jwt'
import { AdminShell } from '@/components/admin/admin-shell'

export const metadata: Metadata = {
  title: 'Admin — Green Land Engineers',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const claims = await getSessionClaims()
  // Middleware normally guards this, but double-check on the server.
  if (!claims) redirect('/login?next=/admin')

  const permissions = permissionsFor(claims.role as Role)

  return (
    <AdminShell
      user={{ name: claims.name, email: claims.email, role: claims.role }}
      permissions={permissions}
    >
      {children}
    </AdminShell>
  )
}
