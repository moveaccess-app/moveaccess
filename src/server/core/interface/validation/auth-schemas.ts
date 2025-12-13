import { z } from 'zod';

/**
 * Schema para login com email e senha
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
});

export type LoginInput = z.infer<typeof loginSchema>;
