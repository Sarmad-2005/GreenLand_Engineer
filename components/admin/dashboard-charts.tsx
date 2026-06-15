'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { DashboardData } from '@/lib/analytics'

const PIE_COLORS = ['#226b3a', '#38a05c', '#f1df1d', '#6b4226', '#9bb38e', '#dce8dc', '#20251f']

export function ContentTrendChart({ data }: { data: DashboardData['monthly'] }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <h3 className="font-serif text-lg font-semibold text-deep">Content published — last 6 months</h3>
      <p className="mb-4 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        Products · Blogs · News per month
      </p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d8d2c2" vertical={false} />
            <XAxis dataKey="month" stroke="#5b6157" fontSize={12} tickLine={false} />
            <YAxis stroke="#5b6157" fontSize={12} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #d8d2c2',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="products" fill="#38a05c" radius={[4, 4, 0, 0]} />
            <Bar dataKey="blogs" fill="#f1df1d" radius={[4, 4, 0, 0]} />
            <Bar dataKey="news" fill="#6b4226" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function CategoryDistributionChart({ data }: { data: DashboardData['byCategory'] }) {
  const hasData = data.some((d) => d.value > 0)
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <h3 className="font-serif text-lg font-semibold text-deep">Products by category</h3>
      <p className="mb-4 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        Content distribution
      </p>
      <div className="h-72">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #d8d2c2',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No products yet.
          </div>
        )}
      </div>
    </div>
  )
}
