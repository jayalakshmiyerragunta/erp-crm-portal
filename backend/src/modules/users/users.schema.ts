import { z } from 'zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Must have an uppercase letter')
    .regex(/[0-9]/, 'Must have a number'),
  role: z.nativeEnum(Role),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
