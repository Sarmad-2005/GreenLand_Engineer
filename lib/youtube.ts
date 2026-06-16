// Helpers for turning the YouTube links admins paste into embeddable players.
// Accepts the common share/watch/embed/shorts shapes (and a bare 11-char id),
// ignoring any extra query params (playlist, start time, etc.).

const ID = '([A-Za-z0-9_-]{11})'
const PATTERNS = [
  new RegExp(`youtube\\.com/watch\\?(?:.*&)?v=${ID}`),
  new RegExp(`youtu\\.be/${ID}`),
  new RegExp(`youtube\\.com/embed/${ID}`),
  new RegExp(`youtube\\.com/shorts/${ID}`),
  new RegExp(`youtube\\.com/v/${ID}`),
  new RegExp(`youtube\\.com/live/${ID}`),
]

/** Extract the 11-character video id from any common YouTube URL, or null. */
export function youtubeId(input: string): string | null {
  const url = (input ?? '').trim()
  if (!url) return null
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url
  for (const re of PATTERNS) {
    const m = url.match(re)
    if (m) return m[1]
  }
  return null
}

/** Build the privacy-friendly embed URL for a YouTube link, or null if invalid. */
export function youtubeEmbedUrl(input: string): string | null {
  const id = youtubeId(input)
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
}
