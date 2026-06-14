import { z } from 'zod'

export const testimonialCreateSchema = z.object({
  name: z.string().min(2, 'Name is required').max(120),
  role: z.string().max(160).optional().or(z.literal('')),
  location: z.string().max(120).optional().or(z.literal('')),
  quote: z.string().min(5, 'Review is required').max(800),
  photo: z.string().min(1).optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  featured: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export const testimonialUpdateSchema = testimonialCreateSchema.partial()

export type TestimonialCreateInput = z.infer<typeof testimonialCreateSchema>
