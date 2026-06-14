export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Ensure a slug is unique against an async existence check, appending -2, -3, … */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || 'item'
  let candidate = root
  let n = 2
  while (await exists(candidate)) {
    candidate = `${root}-${n++}`
  }
  return candidate
}
