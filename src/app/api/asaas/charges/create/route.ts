import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCharge, AuthorizationError } from '@/server/asaas/create-charge';

const createChargeSchema = z.object({
  paymentId: z.string().uuid('paymentId deve ser um UUID válido'),
  academyId: z.string().uuid('academyId deve ser um UUID válido'),
  unitId: z.string().uuid('unitId deve ser um UUID válido').nullish(),
  environment: z.enum(['sandbox', 'production'], {
    message: 'environment deve ser "sandbox" ou "production"',
  }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createChargeSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      return NextResponse.json(
        { error: `Validação falhou: ${messages.join(', ')}` },
        { status: 400 },
      );
    }

    const { paymentId, academyId, unitId, environment } = parsed.data;

    const result = await createCharge({
      paymentId,
      academyId,
      unitId: unitId ?? null,
      environment,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 },
      );
    }

    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
