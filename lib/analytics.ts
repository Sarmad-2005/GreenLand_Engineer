import { prisma } from '@/lib/db'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function lastSixMonths() {
  const months: { key: string; label: string; year: number; month: number }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: MONTH_LABELS[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth(),
    })
  }
  return months
}

function bucketByMonth(dates: Date[], months: ReturnType<typeof lastSixMonths>) {
  const counts = new Map(months.map((m) => [m.key, 0]))
  for (const d of dates) {
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return months.map((m) => counts.get(m.key) ?? 0)
}

export async function getDashboardData(opts: { includeUsers: boolean }) {
  const since = new Date()
  since.setMonth(since.getMonth() - 6)
  since.setDate(1)

  const [
    categories,
    products,
    news,
    blogs,
    users,
    recentProducts,
    recentNews,
    recentBlogs,
    productDates,
    blogDates,
    newsDates,
    categoriesWithCounts,
  ] = await Promise.all([
    prisma.category.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.news.count({ where: { deletedAt: null } }),
    prisma.blog.count({ where: { deletedAt: null } }),
    opts.includeUsers ? prisma.user.count({ where: { deletedAt: null } }) : Promise.resolve(0),
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, slug: true, createdAt: true, category: { select: { name: true } } },
    }),
    prisma.news.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, type: true, publicationDate: true },
    }),
    prisma.blog.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, slug: true, author: true, publishedAt: true },
    }),
    prisma.product.findMany({ where: { deletedAt: null, createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.blog.findMany({ where: { deletedAt: null, createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.news.findMany({ where: { deletedAt: null, createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.category.findMany({
      where: { deletedAt: null },
      select: { name: true, _count: { select: { products: { where: { deletedAt: null } } } } },
    }),
  ])

  const months = lastSixMonths()
  const productSeries = bucketByMonth(productDates.map((d) => d.createdAt), months)
  const blogSeries = bucketByMonth(blogDates.map((d) => d.createdAt), months)
  const newsSeries = bucketByMonth(newsDates.map((d) => d.createdAt), months)

  const monthly = months.map((m, i) => ({
    month: m.label,
    products: productSeries[i],
    blogs: blogSeries[i],
    news: newsSeries[i],
  }))

  const byCategory = categoriesWithCounts
    .map((c) => ({ name: c.name, value: c._count.products }))
    .sort((a, b) => b.value - a.value)

  return {
    totals: { categories, products, news, blogs, users },
    recentProducts,
    recentNews,
    recentBlogs,
    monthly,
    byCategory,
  }
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>
