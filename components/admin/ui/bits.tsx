'use client'

import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'

export const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-full bg-deep px-5 py-2.5 font-mono text-sm font-medium text-background transition-colors hover:bg-deep/90 disabled:opacity-60'
export const ghostBtn =
  'inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 font-mono text-sm text-deep transition-colors hover:bg-muted disabled:opacity-60'
export const inputCls =
  'w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-leaf focus:ring-2 focus:ring-leaf/30'

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-deep md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function NewButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={primaryBtn}>
      <Plus className="size-4" />
      {label}
    </button>
  )
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls + ' pl-9'}
      />
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const active = status === 'ACTIVE'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${
        active ? 'bg-leaf/15 text-leaf' : 'bg-muted text-muted-foreground'
      }`}
    >
      <span className={`size-1.5 rounded-full ${active ? 'bg-leaf' : 'bg-muted-foreground'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number
  totalPages: number
  total: number
  onPage: (p: number) => void
}) {
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <p className="font-mono text-xs text-muted-foreground">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="flex size-8 items-center justify-center rounded-lg border border-border text-deep transition-colors hover:bg-muted disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="flex size-8 items-center justify-center rounded-lg border border-border text-deep transition-colors hover:bg-muted disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-4 py-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

/** Tiny debounce hook for search inputs. */
import { useEffect, useState } from 'react'
export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
