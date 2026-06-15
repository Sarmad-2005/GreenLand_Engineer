'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Loader2, ArrowUpDown, Mail, Phone, Building2 } from 'lucide-react'
import {
  PageHeader,
  SearchInput,
  Pagination,
  EmptyState,
  inputCls,
  ghostBtn,
  useDebounced,
} from '@/components/admin/ui/bits'
import { Modal, ConfirmDialog } from '@/components/admin/ui/modal'
import { api, ApiError } from '@/lib/client-api'
import { categories } from '@/lib/site-data'

interface MessageRow {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  product: string | null
  message: string
  read: boolean
  createdAt: string
}

interface ListResponse {
  data: MessageRow[]
  meta: { page: number; totalPages: number; total: number }
}

const productName = (slug?: string | null) =>
  slug ? categories.find((c) => c.slug === slug)?.name ?? slug : null

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

export function MessagesManager() {
  const [rows, setRows] = useState<MessageRow[]>([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState('createdAt')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search)

  const [viewing, setViewing] = useState<MessageRow | null>(null)
  const [toDelete, setToDelete] = useState<MessageRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '10',
        sort,
        order,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      })
      const res = await api.get<ListResponse>(`/api/admin/messages?${params}`)
      setRows(res.data)
      setMeta(res.meta)
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [page, sort, order, debouncedSearch, statusFilter])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, sort, order])

  function toggleSort(field: string) {
    if (sort === field) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    else {
      setSort(field)
      setOrder('desc')
    }
  }

  async function setRead(row: MessageRow, read: boolean) {
    try {
      await api.patch(`/api/admin/messages/${row.id}`, { read })
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, read } : r)))
      setViewing((v) => (v && v.id === row.id ? { ...v, read } : v))
    } catch (err) {
      toast.error((err as ApiError).message || 'Update failed')
    }
  }

  async function openMessage(row: MessageRow) {
    setViewing(row)
    if (!row.read) setRead(row, true)
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/messages/${toDelete.id}`)
      toast.success('Message deleted')
      if (viewing?.id === toDelete.id) setViewing(null)
      setToDelete(null)
      load()
    } catch (err) {
      toast.error((err as ApiError).message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        subtitle="Enquiries submitted through the website contact form."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, message…" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={inputCls + ' sm:max-w-[160px]'}
        >
          <option value="">All messages</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Message</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('createdAt')}>
                  <span className="inline-flex items-center gap-1">Received <ArrowUpDown className="size-3" /></span>
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-16 text-center"><Loader2 className="mx-auto size-6 animate-spin text-leaf" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5}><EmptyState message="No messages yet." /></td></tr>
              ) : (
                rows.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => openMessage(m)}
                    className={`cursor-pointer border-b border-border last:border-0 hover:bg-muted/20 ${m.read ? '' : 'bg-gold/5'}`}
                  >
                    <td className="max-w-[200px] px-4 py-3">
                      <p className="flex items-center gap-1.5 font-medium text-deep line-clamp-1">
                        {!m.read && <span className="size-2 shrink-0 rounded-full bg-gold" aria-label="Unread" />}
                        {m.name}
                      </p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{m.email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{productName(m.product) || '—'}</td>
                    <td className="max-w-xs px-4 py-3 text-muted-foreground">
                      <span className="line-clamp-1">{m.message}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(m.createdAt)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setToDelete(m)}
                          aria-label="Delete"
                          className="flex size-8 items-center justify-center rounded-lg border border-border text-red-600 transition-colors hover:bg-red-50"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && rows.length > 0 && (
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPage={setPage} />
        )}
      </div>

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title="Enquiry" size="lg">
        {viewing && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field icon={<Mail className="size-4" />} label="Email">
                <a href={`mailto:${viewing.email}`} className="text-leaf hover:underline">{viewing.email}</a>
              </Field>
              {viewing.phone && (
                <Field icon={<Phone className="size-4" />} label="Phone">
                  <a href={`tel:${viewing.phone}`} className="hover:underline">{viewing.phone}</a>
                </Field>
              )}
              {viewing.company && (
                <Field icon={<Building2 className="size-4" />} label="Company / Farm">{viewing.company}</Field>
              )}
              {productName(viewing.product) && (
                <Field label="Product of interest">{productName(viewing.product)}</Field>
              )}
              <Field label="Received">{formatDate(viewing.createdAt)}</Field>
            </div>

            <div>
              <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Message</p>
              <p className="whitespace-pre-wrap rounded-xl border border-border bg-muted/30 p-4 text-sm leading-relaxed text-foreground">
                {viewing.message}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button type="button" className={ghostBtn} onClick={() => setRead(viewing, !viewing.read)}>
                Mark as {viewing.read ? 'unread' : 'read'}
              </button>
              <a
                href={`mailto:${viewing.email}?subject=${encodeURIComponent('Re: your enquiry — Green Land Engineers')}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-deep px-5 py-2.5 font-mono text-sm font-medium text-background transition-colors hover:bg-deep/90"
              >
                <Mail className="size-4" /> Reply by email
              </a>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete message"
        message={`Delete the enquiry from "${toDelete?.name}"? This cannot be undone.`}
      />
    </div>
  )
}

function Field({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-1 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="text-sm text-foreground">{children}</p>
    </div>
  )
}
