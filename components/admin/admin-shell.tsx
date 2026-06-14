'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  LayoutDashboard,
  FolderTree,
  Package,
  Newspaper,
  FileText,
  MessageSquareQuote,
  Users,
  Leaf,
  Menu,
  X,
  LogOut,
  ExternalLink,
} from 'lucide-react'
import { api } from '@/lib/client-api'
import type { Permission } from '@/lib/auth/rbac'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  permission: Permission
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, permission: 'analytics:view' },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree, permission: 'categories:manage' },
  { href: '/admin/products', label: 'Products', icon: Package, permission: 'products:manage' },
  { href: '/admin/news', label: 'News', icon: Newspaper, permission: 'news:manage' },
  { href: '/admin/blogs', label: 'Blogs', icon: FileText, permission: 'blogs:manage' },
  { href: '/admin/testimonials', label: 'Testimonials', icon: MessageSquareQuote, permission: 'testimonials:manage' },
  { href: '/admin/users', label: 'Admins', icon: Users, permission: 'users:manage' },
]

export interface AdminUser {
  name: string
  email: string
  role: string
}

export function AdminShell({
  user,
  permissions,
  children,
}: {
  user: AdminUser
  permissions: Permission[]
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const items = NAV.filter((n) => permissions.includes(n.permission))

  async function logout() {
    try {
      await api.post('/api/auth/logout')
    } catch {
      /* ignore */
    }
    toast.success('Signed out')
    router.replace('/login')
    router.refresh()
  }

  const roleLabel = user.role.replace('_', ' ').toLowerCase()

  return (
    <div className="min-h-svh bg-muted/40">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-deep text-background lg:flex">
        <SidebarContent items={items} pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-deep text-background">
            <SidebarContent items={items} pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-6">
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-6 text-deep" />
          </button>

          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="hidden items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-deep sm:flex"
            >
              View site <ExternalLink className="size-3.5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium leading-tight text-deep">{user.name}</p>
                <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {roleLabel}
                </p>
              </div>
              <span className="flex size-9 items-center justify-center rounded-full bg-leaf font-mono text-sm font-semibold text-background">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <button
                type="button"
                onClick={logout}
                aria-label="Sign out"
                className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-deep hover:text-background"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

function SidebarContent({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[]
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-background/10 px-6">
        <span className="flex size-8 items-center justify-center rounded-full bg-gold text-deep">
          <Leaf className="size-4" />
        </span>
        <span className="font-serif text-lg font-semibold">Green Land</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => {
          const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-leaf text-background'
                  : 'text-background/70 hover:bg-background/10 hover:text-background'
              }`}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-background/10 p-4">
        <p className="font-mono text-[10px] uppercase tracking-wide text-background/40">
          Green Land CMS · v1.0
        </p>
      </div>
    </>
  )
}
