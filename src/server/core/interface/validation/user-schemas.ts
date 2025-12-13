// Interface Layer - Validation Schemas (Zod)
// Define schemas de validação para entrada de dados

import { z } from 'zod';

/**
 * Schema para validação de User ID
 */
export const userIdSchema = z.object({
  // Removida a restrição de UUID para permitir identificadores flexíveis
  userId: z.string().min(1, 'User ID is required'),
});

/**
 * Schema para criação de usuário
 */
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
});

/**
 * Schema para atualização de usuário
 */
export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  email: z.string().email('Invalid email format').optional(),
});

/**
 * Helper para validar dados com Zod e retornar erros amigáveis
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${messages}`);
    }
    throw error;
  }
}
