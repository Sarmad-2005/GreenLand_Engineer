import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FolderTree, Package, Newspaper, FileText, Users } from 'lucide-react'
import { getSessionClaims } from '@/lib/auth/session'
import { can } from '@/lib/auth/rbac'
import type { Role } from '@/lib/auth/jwt'
import { getDashboardData } from '@/lib/analytics'
import { ContentTrendChart, CategoryDistributionChart } from '@/components/admin/dashboard-charts'
import { NEWS_TYPE_LABELS } from '@/lib/news-types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const claims = await getSessionClaims()
  if (!claims) redirect('/login')
  const role = claims.role as Role

  // Editors have no analytics access — send them to their first workspace.
  if (!can(role, 'analytics:view')) redirect('/admin/news')

  const data = await getDashboardData({ includeUsers: can(role, 'users:manage') })
  const { totals } = data

  const cards = [
    { label: 'Categories', value: totals.categories, href: '/admin/categories', icon: FolderTree, show: can(role, 'categories:manage') },
    { label: 'Products', value: totals.products, href: '/admin/products', icon: Package, show: can(role, 'products:manage') },
    { label: 'News', value: totals.news, href: '/admin/news', icon: Newspaper, show: can(role, 'news:manage') },
    { label: 'Blogs', value: totals.blogs, href: '/admin/blogs', icon: FileText, show: can(role, 'blogs:manage') },
    { label: 'Admins', value: totals.users, href: '/admin/users', icon: Users, show: can(role, 'users:manage') },
  ].filter((c) => c.show)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-deep md:text-3xl">
          Welcome back, {claims.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">A live overview of your content.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="group rounded-2xl border border-border bg-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-deep/5"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-sage text-deep">
              <c.icon className="size-5" />
            </span>
            <p className="mt-4 font-serif text-3xl font-semibold text-deep">{c.value}</p>
            <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ContentTrendChart data={data.monthly} />
        <CategoryDistributionChart data={data.byCategory} />
      </div>

      {/* Recent activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <RecentCard title="Recent products" href="/admin/products">
          {data.recentProducts.map((p) => (
            <RecentRow key={p.id} primary={p.name} secondary={p.category?.name ?? '—'} date={p.createdAt} />
          ))}
          {data.recentProducts.length === 0 && <Empty />}
        </RecentCard>

        <RecentCard title="Recent blogs" href="/admin/blogs">
          {data.recentBlogs.map((b) => (
            <RecentRow key={b.id} primary={b.title} secondary={b.author ?? '—'} date={b.publishedAt} />
          ))}
          {data.recentBlogs.length === 0 && <Empty />}
        </RecentCard>

        <RecentCard title="Recent news" href="/admin/news">
          {data.recentNews.map((n) => (
            <RecentRow key={n.id} primary={n.title} secondary={NEWS_TYPE_LABELS[n.type]} date={n.publicationDate} />
          ))}
          {data.recentNews.length === 0 && <Empty />}
        </RecentCard>
      </div>
    </div>
  )
}

function RecentCard({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold text-deep">{title}</h3>
        <Link href={href} className="font-mono text-xs text-leaf hover:underline">
          View all
        </Link>
      </div>
      <ul className="divide-y divide-border">{children}</ul>
    </div>
  )
}

function RecentRow({ primary, secondary, date }: { primary: string; secondary: string; date: Date }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-deep">{primary}</p>
        <p className="truncate font-mono text-[11px] text-muted-foreground">{secondary}</p>
      </div>
      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
        {new Date(date).toLocaleDateString()}
      </span>
    </li>
  )
}

function Empty() {
  return <li className="py-6 text-center text-sm text-muted-foreground">Nothing yet.</li>
}
