import { z } from 'zod'

export const subscribeSchema = z.object({
  email: z.string().email('A valid email is required').max(200),
})

export type SubscribeInput = z.infer<typeof subscribeSchema>
