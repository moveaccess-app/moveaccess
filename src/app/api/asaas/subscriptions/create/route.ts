import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createAsaasSubscription,
  SubscriptionNotEligibleError,
} from '@/server/asaas/create-subscription';
import { AuthorizationError } from '@/server/asaas/auth';

const createSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid('subscriptionId deve ser um UUID válido'),
  academyId: z.string().uuid('academyId deve ser um UUID válido'),
  unitId: z.string().uuid('unitId deve ser um UUID válido').nullish(),
  environment: z.enum(['sandbox', 'production'], {
    message: 'environment deve ser "sandbox" ou "production"',
  }),
  billingType: z.enum(['PIX', 'BOLETO', 'CREDIT_CARD'], {
    message: 'billingType deve ser "PIX", "BOLETO" ou "CREDIT_CARD"',
  }),
  value: z.number().positive('value deve ser positivo').optional(),
  nextDueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'nextDueDate deve estar no formato YYYY-MM-DD')
    .optional(),
  description: z.string().max(500, 'description deve ter no máximo 500 caracteres').optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate deve estar no formato YYYY-MM-DD')
    .optional(),
  maxPayments: z.number().int().positive('maxPayments deve ser inteiro positivo').optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      return NextResponse.json(
        { error: `Validação falhou: ${messages.join(', ')}` },
        { status: 400 },
      );
    }

    const result = await createAsaasSubscription({
      subscriptionId: parsed.data.subscriptionId,
      academyId: parsed.data.academyId,
      unitId: parsed.data.unitId ?? null,
      environment: parsed.data.environment,
      billingType: parsed.data.billingType,
      value: parsed.data.value,
      nextDueDate: parsed.data.nextDueDate,
      description: parsed.data.description,
      endDate: parsed.data.endDate,
      maxPayments: parsed.data.maxPayments,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof SubscriptionNotEligibleError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
