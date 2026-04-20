import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthorizationError } from '@/server/asaas/auth';
import { runFinancialHealthCheck } from '@/server/asaas/financial-health-check';

export const runtime = 'nodejs';

const healthCheckSchema = z.object({
  academyId: z.string().uuid('academyId deve ser um UUID válido'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = healthCheckSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      );

      return NextResponse.json(
        { error: `Validação falhou: ${messages.join(', ')}` },
        { status: 400 },
      );
    }

    const result = await runFinancialHealthCheck(parsed.data.academyId);

    if (result.error) {
      const status = result.error === 'UNAUTHORIZED' ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
