import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AuthError } from '@/lib/auth/session'

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init)
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 })
}

export function fail(status: number, message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status })
}

/** Wrap a route handler; turns thrown AuthError / ZodError / unknown into clean JSON. */
export function handler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<NextResponse>,
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await fn(...args)
    } catch (err) {
      if (err instanceof AuthError) return fail(err.status, err.message)
      if (err instanceof ZodError) {
        return fail(422, 'Validation failed', err.flatten().fieldErrors)
      }
      // Prisma unique-constraint
      if (typeof err === 'object' && err && 'code' in err && (err as { code: string }).code === 'P2002') {
        return fail(409, 'A record with that value already exists')
      }
      console.error('[API error]', err)
      return fail(500, 'Internal server error')
    }
  }
}

export interface ListQuery {
  page: number
  pageSize: number
  search: string
  sort: string
  order: 'asc' | 'desc'
  status?: string
  filters: Record<string, string>
}

export function parseListQuery(req: Request): ListQuery {
  const url = new URL(req.url)
  const q = url.searchParams
  const page = Math.max(1, Number(q.get('page') || 1))
  const pageSize = Math.min(100, Math.max(1, Number(q.get('pageSize') || 10)))
  const order = q.get('order') === 'asc' ? 'asc' : 'desc'
  const filters: Record<string, string> = {}
  for (const key of ['category', 'type', 'tag', 'role', 'featured']) {
    const v = q.get(key)
    if (v) filters[key] = v
  }
  return {
    page,
    pageSize,
    search: q.get('search')?.trim() || '',
    sort: q.get('sort') || 'createdAt',
    order,
    status: q.get('status') || undefined,
    filters,
  }
}

export function paginated<T>(items: T[], total: number, q: ListQuery) {
  return {
    data: items,
    meta: {
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    },
  }
}
