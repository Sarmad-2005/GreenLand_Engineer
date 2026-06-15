import { z } from 'zod'

export const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email').max(200),
})

export type SubscribeInput = z.infer<typeof subscribeSchema>
