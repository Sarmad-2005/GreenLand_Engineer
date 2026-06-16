import { z } from 'zod'

// Validates the non-file fields of a "Become a Supplier" application.
export const supplierSchema = z.object({
  companyName: z.string().trim().min(1, 'Please enter your company name').max(160),
  contactName: z.string().trim().min(1, 'Please enter a contact name').max(120),
  email: z.string().trim().toLowerCase().email('Please enter a valid email').max(200),
  phone: z.string().trim().min(1, 'Please enter a phone number').max(40),
  whatsapp: z.string().trim().max(40).optional().or(z.literal('')),
  country: z.string().trim().max(80).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  website: z.string().trim().max(200).optional().or(z.literal('')),
  productTypes: z.string().trim().max(400).optional().or(z.literal('')),
  message: z.string().trim().max(4000).optional().or(z.literal('')),
})

export type SupplierInput = z.infer<typeof supplierSchema>

export const SUPPLIER_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const
export const supplierStatusSchema = z.enum(SUPPLIER_STATUSES)
