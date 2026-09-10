import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  sku: z
    .string()
    .min(2, 'SKU must be at least 2 characters')
    .regex(/^[A-Z0-9\-_]+$/i, 'SKU can only contain letters, numbers, hyphens, and underscores'),
  category: z.string().min(1, 'Category is required'),
  unitPrice: z.number().positive('Unit price must be positive'),
  currentStock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  minStockQty: z.number().int().min(0, 'Min stock must be non-negative').default(5),
  warehouseLocation: z.string().optional(),
});

export const updateProductSchema = createProductSchema
  .omit({ sku: true })
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export const stockAdjustmentSchema = z.object({
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  reason: z.string().min(1, 'Reason is required'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
