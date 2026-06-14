'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, Loader2, ArrowUpDown } from 'lucide-react'
import {
  PageHeader,
  NewButton,
  SearchInput,
  StatusBadge,
  Pagination,
  EmptyState,
  inputCls,
  useDebounced,
} from '@/components/admin/ui/bits'
import { Modal, ConfirmDialog } from '@/components/admin/ui/modal'
import { UserForm, type UserRow } from './user-form'
import { api, ApiError } from '@/lib/client-api'

interface ListResponse {
  data: UserRow[]
  meta: { page: number; totalPages: number; total: number }
}

const ROLE_LABELS: Record<UserRow['role'], string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EDITOR: 'Editor',
}
const ROLE_STYLE: Record<UserRow['role'], string> = {
  SUPER_ADMIN: 'bg-deep text-background',
  ADMIN: 'bg-leaf/15 text-leaf',
  EDITOR: 'bg-gold/20 text-soil',
}

export function UsersManager() {
  const [rows, setRows] = useState<UserRow[]>([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState('createdAt')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<UserRow | undefined>(undefined)
  const [toDelete, setToDelete] = useState<UserRow | null>(null)
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
        ...(roleFilter ? { role: roleFilter } : {}),
      })
      const res = await api.get<ListResponse>(`/api/admin/users?${params}`)
      setRows(res.data)
      setMeta(res.meta)
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to load admins')
    } finally {
      setLoading(false)
    }
  }, [page, sort, order, debouncedSearch, statusFilter, roleFilter])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, roleFilter, sort, order])

  function toggleSort(field: string) {
    if (sort === field) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    else {
      setSort(field)
      setOrder('asc')
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/users/${toDelete.id}`)
      toast.success('Admin deleted')
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
        title="Admin Users"
        subtitle="Manage who can access the dashboard and what they can do."
        action={<NewButton label="New Admin" onClick={() => { setEditing(undefined); setFormOpen(true) }} />}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={inputCls + ' sm:max-w-[180px]'}>
          <option value="">All roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin</option>
          <option value="EDITOR">Editor</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls + ' sm:max-w-[160px]'}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('fullName')}>
                  <span className="inline-flex items-center gap-1">Name <ArrowUpDown className="size-3" /></span>
                </th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('lastLogin')}>
                  <span className="inline-flex items-center gap-1">Last login <ArrowUpDown className="size-3" /></span>
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="cursor-pointer px-4 py-3" onClick={() => toggleSort('createdAt')}>
                  <span className="inline-flex items-center gap-1">Created <ArrowUpDown className="size-3" /></span>
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center"><Loader2 className="mx-auto size-6 animate-spin text-leaf" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7}><EmptyState message="No admins found." /></td></tr>
              ) : (
                rows.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-deep">{u.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${ROLE_STYLE[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => { setEditing(u); setFormOpen(true) }} aria-label="Edit" className="flex size-8 items-center justify-center rounded-lg border border-border text-deep transition-colors hover:bg-muted">
                          <Pencil className="size-3.5" />
                        </button>
                        <button type="button" onClick={() => setToDelete(u)} aria-label="Delete" className="flex size-8 items-center justify-center rounded-lg border border-border text-red-600 transition-colors hover:bg-red-50">
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit admin' : 'New admin'}>
        <UserForm initial={editing} onCancel={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); load() }} />
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete admin"
        message={`Delete "${toDelete?.fullName}" (${toDelete?.email})? This cannot be undone.`}
      />
    </div>
  )
}
