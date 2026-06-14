import { z } from 'zod'

const passwordRules = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[0-9]/, 'Include a number')

export const userCreateSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(120),
  email: z.string().email('Enter a valid email'),
  password: passwordRules,
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR']).default('ADMIN'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export const userUpdateSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  password: passwordRules.optional().or(z.literal('')),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export type UserCreateInput = z.infer<typeof userCreateSchema>
