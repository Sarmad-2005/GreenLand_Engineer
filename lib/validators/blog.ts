import { z } from 'zod'

export const blogCreateSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  excerpt: z.string().min(5, 'Excerpt is required').max(500),
  content: z.string().min(10, 'Content is required'),
  featuredImage: z.string().min(1).optional().nullable(),
  tag: z.string().max(60).optional().or(z.literal('')),
  author: z.string().max(120).optional().or(z.literal('')),
  seoTitle: z.string().max(200).optional().or(z.literal('')),
  seoDescription: z.string().max(320).optional().or(z.literal('')),
  featured: z.boolean().default(false),
  publishedAt: z.coerce.date().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  images: z.array(z.string()).max(8).optional().default([]),
  slug: z.string().optional(),
})

export const blogUpdateSchema = blogCreateSchema.partial()

export type BlogCreateInput = z.infer<typeof blogCreateSchema>
