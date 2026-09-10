import { z } from 'zod';
import { ChallanStatus } from '@prisma/client';

export const challanItemSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
});

export const createChallanSchema = z.object({
  customerId: z.string().cuid('Invalid customer ID'),
  items: z
    .array(challanItemSchema)
    .min(1, 'At least one product is required')
    .max(50, 'Too many items'),
  status: z.enum(['DRAFT', 'CONFIRMED']).default('DRAFT'),
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
