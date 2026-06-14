import type { Role } from './jwt'

export type Permission =
  | 'categories:manage'
  | 'news:manage'
  | 'blogs:manage'
  | 'products:manage'
  | 'testimonials:manage'
  | 'analytics:view'
  | 'users:manage'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'categories:manage',
    'news:manage',
    'blogs:manage',
    'products:manage',
    'testimonials:manage',
    'analytics:view',
    'users:manage',
  ],
  ADMIN: [
    'categories:manage',
    'news:manage',
    'blogs:manage',
    'products:manage',
    'testimonials:manage',
    'analytics:view',
  ],
  // Editor: create/edit content only (news + blogs), no settings/users
  EDITOR: ['news:manage', 'blogs:manage'],
}

export function permissionsFor(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

export function can(role: Role, permission: Permission): boolean {
  return permissionsFor(role).includes(permission)
}

/** Routes (admin UI + sensitive APIs) gated by a required permission. Used by middleware + sidebar. */
export const ROUTE_PERMISSIONS: { prefix: string; permission: Permission }[] = [
  { prefix: '/admin/users', permission: 'users:manage' },
  { prefix: '/api/admin/users', permission: 'users:manage' },
  { prefix: '/admin/categories', permission: 'categories:manage' },
  { prefix: '/admin/products', permission: 'products:manage' },
  { prefix: '/admin/news', permission: 'news:manage' },
  { prefix: '/admin/blogs', permission: 'blogs:manage' },
  { prefix: '/admin/testimonials', permission: 'testimonials:manage' },
]

export function requiredPermissionForPath(pathname: string): Permission | null {
  const match = ROUTE_PERMISSIONS.find((r) => pathname.startsWith(r.prefix))
  return match ? match.permission : null
}
