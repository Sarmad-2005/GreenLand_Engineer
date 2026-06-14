import type { NewsType } from '@prisma/client'

export const NEWS_TYPE_LABELS: Record<NewsType, string> = {
  MEETING_NOTES: 'Meeting Notes',
  ANNOUNCEMENTS: 'Announcements',
  EVENTS: 'Events',
  PRESS: 'Press',
}

export const NEWS_TYPE_OPTIONS = Object.entries(NEWS_TYPE_LABELS).map(([value, label]) => ({
  value: value as NewsType,
  label,
}))

/** Display filter labels used by the public timeline ("All" + each label). */
export const NEWS_FILTER_LABELS = ['All', ...Object.values(NEWS_TYPE_LABELS)]
