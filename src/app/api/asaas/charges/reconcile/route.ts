import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthorizationError } from '@/server/asaas/auth';
import {
  reconcileCharge,
  ChargeNotFoundError,
} from '@/server/asaas/reconcile-charge';

export const runtime = 'nodejs';

const reconcileChargeSchema = z.object({
  chargeId: z.string().uuid('chargeId deve ser um UUID válido'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = reconcileChargeSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      );

      return NextResponse.json(
        { error: `Validação falhou: ${messages.join(', ')}` },
        { status: 400 },
      );
    }

    const result = await reconcileCharge(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof ChargeNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
