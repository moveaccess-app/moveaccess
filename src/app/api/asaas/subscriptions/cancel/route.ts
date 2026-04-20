import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  cancelAsaasSubscription,
  SubscriptionCancelError,
} from '@/server/asaas/cancel-subscription';
import { AuthorizationError } from '@/server/asaas/auth';

const cancelSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid('subscriptionId deve ser um UUID válido'),
  academyId: z.string().uuid('academyId deve ser um UUID válido'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = cancelSubscriptionSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      return NextResponse.json(
        { error: `Validação falhou: ${messages.join(', ')}` },
        { status: 400 },
      );
    }

    const result = await cancelAsaasSubscription({
      subscriptionId: parsed.data.subscriptionId,
      academyId: parsed.data.academyId,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof SubscriptionCancelError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
