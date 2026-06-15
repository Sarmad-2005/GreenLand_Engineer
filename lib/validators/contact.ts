import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(2, 'Name is required').max(120),
  email: z.string().email('A valid email is required').max(200),
  phone: z.string().max(40).optional().or(z.literal('')),
  company: z.string().max(160).optional().or(z.literal('')),
  product: z.string().max(80).optional().or(z.literal('')),
  message: z.string().min(5, 'Message is required').max(4000),
})

export type ContactInput = z.infer<typeof contactSchema>
