// Camada de Interface - Schemas de Validação (Zod)
// Define schemas de validação para entrada de dados

import { z } from 'zod';

/**
 * Schema para validação de ID de Usuário
 */
export const userIdSchema = z.object({
  // Removida a restrição de UUID para permitir identificadores flexíveis
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
});

/**
 * Schema para criação de usuário
 */
export const createUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  email: z.string().email('Formato de email inválido'),
});

/**
 * Schema para atualização de usuário
 */
export const updateUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').optional(),
  email: z.string().email('Formato de email inválido').optional(),
});

/**
 * Helper para validar dados com Zod e retornar erros amigáveis
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validação falhou: ${messages}`);
    }
    throw error;
  }
}
