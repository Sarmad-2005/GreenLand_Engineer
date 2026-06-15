import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name').max(120),
  email: z.string().trim().toLowerCase().email('Please enter a valid email').max(200),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  company: z.string().trim().max(160).optional().or(z.literal('')),
  product: z.string().trim().max(80).optional().or(z.literal('')),
  message: z.string().trim().min(1, 'Please enter a message').max(4000),
})

export type ContactInput = z.infer<typeof contactSchema>
