import { z } from 'zod'

export const categoryCreateSchema = z.object({
  name: z.string().min(2, 'Name is required').max(120),
  tagline: z.string().max(160).optional().or(z.literal('')),
  description: z.string().min(5, 'Description is required').max(2000),
  image: z.string().min(1).optional().nullable(),
  gallery: z.array(z.string()).max(8).optional().default([]),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  slug: z.string().optional(),
})

export const categoryUpdateSchema = categoryCreateSchema.partial()

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>
