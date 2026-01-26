import { z } from 'zod';

/**
 * Schema para login com email e senha
 */
export const loginSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres').max(128, 'Senha muito longa'),
});

export type LoginInput = z.infer<typeof loginSchema>;
