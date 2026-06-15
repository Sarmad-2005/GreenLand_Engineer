// Pull a human-friendly message out of an API JSON error body.
// Our API returns { error, details? } where `details` is Zod's fieldErrors
// (e.g. { email: ['Please enter a valid email'] }) — surface the first one.
export function apiErrorMessage(
  body: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const b = body as { error?: string; details?: Record<string, string[]> } | null
  if (b?.details && typeof b.details === 'object') {
    const first = Object.values(b.details).flat().filter(Boolean)[0]
    if (first) return first
  }
  return b?.error || fallback
}
