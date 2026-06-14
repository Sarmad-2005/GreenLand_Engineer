'use client'

// Browser fetch wrapper for the admin app.
// On a 401, it attempts a one-time silent token refresh, then retries.

export class ApiError extends Error {
  status: number
  details?: unknown
  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

async function raw(input: string, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    credentials: 'same-origin',
  })
}

export async function apiFetch<T = unknown>(
  input: string,
  init?: RequestInit,
  _retried = false,
): Promise<T> {
  const res = await raw(input, init)

  if (res.status === 401 && !_retried) {
    const refreshed = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
    })
    if (refreshed.ok) return apiFetch<T>(input, init, true)
    // Refresh failed → bounce to login.
    if (typeof window !== 'undefined') {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`
    }
    throw new ApiError(401, 'Session expired')
  }

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await res.json().catch(() => null) : null

  if (!res.ok) {
    throw new ApiError(res.status, payload?.error || res.statusText, payload?.details)
  }
  return (payload?.data ?? payload) as T
}

/** Human-friendly message from an ApiError — surfaces the first field validation error. */
export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.details && typeof err.details === 'object') {
      const first = Object.values(err.details as Record<string, string[]>)
        .flat()
        .find(Boolean)
      if (first) return first
    }
    return err.message || 'Something went wrong'
  }
  return (err as Error)?.message || 'Something went wrong'
}

export const api = {
  get: <T>(url: string) => apiFetch<T>(url),
  post: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string) => apiFetch<T>(url, { method: 'DELETE' }),
}
