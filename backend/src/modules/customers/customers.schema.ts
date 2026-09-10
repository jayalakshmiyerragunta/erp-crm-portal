import { z } from 'zod';
import { CustomerType, CustomerStatus } from '@prisma/client';

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (10 digits starting with 6-9)'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  businessName: z.string().optional(),
  gstNumber: z
    .string()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      'Invalid GST number format'
    )
    .optional()
    .or(z.literal('')),
  customerType: z.nativeEnum(CustomerType),
  address: z.string().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  followUpDate: z.string().datetime().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const addFollowupSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty').max(1000, 'Note too long'),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type AddFollowupInput = z.infer<typeof addFollowupSchema>;
