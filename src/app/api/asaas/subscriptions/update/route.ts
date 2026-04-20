import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  updateAsaasSubscription,
  SubscriptionUpdateError,
} from '@/server/asaas/update-subscription';
import { AuthorizationError } from '@/server/asaas/auth';

const updateSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid('subscriptionId deve ser um UUID válido'),
  academyId: z.string().uuid('academyId deve ser um UUID válido'),
  value: z.number().positive('value deve ser positivo').optional(),
  description: z.string().max(500, 'description deve ter no máximo 500 caracteres').optional(),
  nextDueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'nextDueDate deve estar no formato YYYY-MM-DD')
    .optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = updateSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      return NextResponse.json(
        { error: `Validação falhou: ${messages.join(', ')}` },
        { status: 400 },
      );
    }

    const result = await updateAsaasSubscription({
      subscriptionId: parsed.data.subscriptionId,
      academyId: parsed.data.academyId,
      value: parsed.data.value,
      description: parsed.data.description,
      nextDueDate: parsed.data.nextDueDate,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof SubscriptionUpdateError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
