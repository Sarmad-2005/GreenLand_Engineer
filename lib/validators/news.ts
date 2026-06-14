import { z } from 'zod'

export const newsCreateSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  summary: z.string().min(5, 'Summary is required').max(2000),
  type: z.enum(['MEETING_NOTES', 'ANNOUNCEMENTS', 'EVENTS', 'PRESS']).default('ANNOUNCEMENTS'),
  author: z.string().max(120).optional().or(z.literal('')),
  publicationDate: z.coerce.date().optional(),
  featuredImage: z.string().min(1).optional().nullable(),
  images: z.array(z.string()).max(8).optional().default([]),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  slug: z.string().optional(),
})

export const newsUpdateSchema = newsCreateSchema.partial()

export type NewsCreateInput = z.infer<typeof newsCreateSchema>
