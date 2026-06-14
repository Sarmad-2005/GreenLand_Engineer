import { z } from 'zod'

export const specRowSchema = z.object({
  label: z.string().min(1, 'Label is required').max(120),
  value: z.string().min(1, 'Value is required').max(500),
})

export const productCreateSchema = z.object({
  name: z.string().min(2, 'Name is required').max(160),
  description: z.string().min(5, 'Description is required').max(4000),
  price: z.coerce.number().nonnegative('Price must be positive').optional().nullable(),
  sku: z.string().max(60).optional().or(z.literal('')),
  stock: z.coerce.number().int().min(0).default(0),
  categoryId: z.string().min(1, 'Choose a category'),
  featured: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  images: z.array(z.string()).max(10).optional().default([]),
  specifications: z.array(specRowSchema).max(80).optional().default([]),
  slug: z.string().optional(),
})

export const productUpdateSchema = productCreateSchema.partial()

export type SpecRow = z.infer<typeof specRowSchema>
export type ProductCreateInput = z.infer<typeof productCreateSchema>
