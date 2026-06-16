'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Trash2,
  Loader2,
  ArrowUpDown,
  Mail,
  Phone,
  MessageCircle,
  Building2,
  Globe,
  MapPin,
  FileText,
  Check,
  X,
} from 'lucide-react'
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

type SupplierStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

interface SupplierDoc {
  path: string
  name: string
  bytes: number
}

interface SupplierRow {
  id: string
  companyName: string
  contactName: string
  email: string
  phone: string
  whatsapp: string | null
  country: string | null
  city: string | null
  website: string | null
  productTypes: string | null
  message: string | null
  documents: SupplierDoc[]
  status: SupplierStatus
  read: boolean
  createdAt: string
}

interface ListResponse {
  data: SupplierRow[]
  meta: { page: number; totalPages: number; total: number }
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

const STATUS_STYLES: Record<SupplierStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-leaf/10 text-leaf border-leaf/40',
  REJECTED: 'bg-red-50 text-red-600 border-red-200',
}

function StatusBadge({ status }: { status: SupplierStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${STATUS_STYLES[status]}`}
    >
      {status.toLowerCase()}
    </span>
  )
}

// Strip everything but digits for a tel:/wa.me link.
const digits = (s: string) => s.replace(/[^\d]/g, '')

export function SuppliersManager() {
  const [rows, setRows] = useState<SupplierRow[]>([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState('createdAt')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search)

  const [viewing, setViewing] = useState<SupplierRow | null>(null)
  const [toDelete, setToDelete] = useState<SupplierRow | null>(null)
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
      const res = await api.get<ListResponse>(`/api/admin/suppliers?${params}`)
      setRows(res.data)
      setMeta(res.meta)
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to load suppliers')
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

  async function patch(row: SupplierRow, data: Partial<Pick<SupplierRow, 'read' | 'status'>>) {
    try {
      await api.patch(`/api/admin/suppliers/${row.id}`, data)
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, ...data } : r)))
      setViewing((v) => (v && v.id === row.id ? { ...v, ...data } : v))
    } catch (err) {
      toast.error((err as ApiError).message || 'Update failed')
    }
  }

  async function setStatus(row: SupplierRow, status: SupplierStatus) {
    await patch(row, { status })
    toast.success(`Marked ${status.toLowerCase()}`)
  }

  function openSupplier(row: SupplierRow) {
    setViewing(row)
    if (!row.read) patch(row, { read: true })
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/suppliers/${toDelete.id}`)
      toast.success('Application deleted')
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
        title="Suppliers"
        subtitle="Applications submitted through the “Become a Supplier” form."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search company, contact, email…" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={inputCls + ' sm:max-w-[170px]'}
        >
          <option value="">All applications</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Supplies</th>
                <th className="px-4 py-3">Status</th>
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
                <tr><td colSpan={5}><EmptyState message="No supplier applications yet." /></td></tr>
              ) : (
                rows.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => openSupplier(s)}
                    className={`cursor-pointer border-b border-border last:border-0 hover:bg-muted/20 ${s.read ? '' : 'bg-gold/5'}`}
                  >
                    <td className="max-w-[220px] px-4 py-3">
                      <p className="flex items-center gap-1.5 font-medium text-deep line-clamp-1">
                        {!s.read && <span className="size-2 shrink-0 rounded-full bg-gold" aria-label="Unread" />}
                        {s.companyName}
                      </p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{s.contactName} · {s.email}</p>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-muted-foreground">
                      <span className="line-clamp-1">{s.productTypes || '—'}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setToDelete(s)}
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

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title="Supplier application" size="lg">
        {viewing && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-xl font-semibold text-deep">{viewing.companyName}</h3>
                <p className="text-sm text-muted-foreground">{viewing.contactName}</p>
              </div>
              <StatusBadge status={viewing.status} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field icon={<Mail className="size-4" />} label="Email">
                <a href={`mailto:${viewing.email}`} className="text-leaf hover:underline">{viewing.email}</a>
              </Field>
              <Field icon={<Phone className="size-4" />} label="Phone">
                <a href={`tel:${viewing.phone}`} className="hover:underline">{viewing.phone}</a>
              </Field>
              {viewing.whatsapp && (
                <Field icon={<MessageCircle className="size-4" />} label="WhatsApp">{viewing.whatsapp}</Field>
              )}
              {(viewing.city || viewing.country) && (
                <Field icon={<MapPin className="size-4" />} label="Location">
                  {[viewing.city, viewing.country].filter(Boolean).join(', ')}
                </Field>
              )}
              {viewing.website && (
                <Field icon={<Globe className="size-4" />} label="Website">
                  <a href={viewing.website} target="_blank" rel="noopener noreferrer" className="text-leaf hover:underline">
                    {viewing.website}
                  </a>
                </Field>
              )}
              {viewing.productTypes && (
                <Field icon={<Building2 className="size-4" />} label="Supplies">{viewing.productTypes}</Field>
              )}
              <Field label="Received">{formatDate(viewing.createdAt)}</Field>
            </div>

            {viewing.message && (
              <div>
                <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Message</p>
                <p className="whitespace-pre-wrap rounded-xl border border-border bg-muted/30 p-4 text-sm leading-relaxed text-foreground">
                  {viewing.message}
                </p>
              </div>
            )}

            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                Documents ({viewing.documents.length})
              </p>
              {viewing.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents attached.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {viewing.documents.map((doc) => (
                    <li key={doc.path}>
                      <a
                        href={doc.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:bg-muted/30"
                      >
                        <FileText className="size-4 shrink-0 text-leaf" />
                        <span className="line-clamp-1 flex-1 text-foreground">{doc.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {(doc.bytes / 1024).toFixed(0)} KB
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Contact + decision actions */}
            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <a
                href={`mailto:${viewing.email}?subject=${encodeURIComponent('Your supplier application — Green Land Engineers')}`}
                className="inline-flex items-center gap-2 rounded-full bg-deep px-4 py-2.5 font-mono text-xs font-medium text-background transition-colors hover:bg-deep/90"
              >
                <Mail className="size-4" /> Email
              </a>
              <a
                href={`tel:${viewing.phone}`}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 font-mono text-xs font-medium text-deep transition-colors hover:bg-muted/30"
              >
                <Phone className="size-4" /> Call
              </a>
              <a
                href={`https://wa.me/${digits(viewing.whatsapp || viewing.phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-leaf/40 bg-leaf/10 px-4 py-2.5 font-mono text-xs font-medium text-leaf transition-colors hover:bg-leaf/20"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Decision:</span>
              <button
                type="button"
                onClick={() => setStatus(viewing, 'APPROVED')}
                disabled={viewing.status === 'APPROVED'}
                className="inline-flex items-center gap-1.5 rounded-full border border-leaf/40 bg-leaf/10 px-4 py-2 font-mono text-xs font-medium text-leaf transition-colors hover:bg-leaf/20 disabled:opacity-50"
              >
                <Check className="size-3.5" /> Approve
              </button>
              <button
                type="button"
                onClick={() => setStatus(viewing, 'REJECTED')}
                disabled={viewing.status === 'REJECTED'}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 font-mono text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                <X className="size-3.5" /> Reject
              </button>
              {viewing.status !== 'PENDING' && (
                <button type="button" className={ghostBtn} onClick={() => setStatus(viewing, 'PENDING')}>
                  Reset to pending
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete application"
        message={`Delete the application from "${toDelete?.companyName}"? This cannot be undone.`}
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
