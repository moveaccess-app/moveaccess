import { NextResponse } from 'next/server';
import { z } from 'zod';
import { syncCustomer } from '@/server/asaas/sync-customer';

const syncCustomerSchema = z.object({
  studentId: z.string().min(1, 'studentId é obrigatório'),
  academyId: z.string().min(1, 'academyId é obrigatório'),
  unitId: z.string().nullish(),
  environment: z.enum(['sandbox', 'production'], {
    message: 'environment deve ser "sandbox" ou "production"',
  }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = syncCustomerSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      return NextResponse.json(
        { error: `Validação falhou: ${messages.join(', ')}` },
        { status: 400 },
      );
    }

    const { studentId, academyId, unitId, environment } = parsed.data;

    const result = await syncCustomer({
      studentId,
      academyId,
      unitId: unitId ?? null,
      environment,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
