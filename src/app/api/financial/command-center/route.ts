import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthorizationError, requireStaffForAcademy } from '@/server/asaas/auth';
import { getFinancialCommandCenterData } from '@/server/financial/command-center';

export const runtime = 'nodejs';

const querySchema = z.object({
  academyId: z.string().uuid('academyId deve ser um UUID válido'),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      academyId: url.searchParams.get('academyId'),
    });

    if (!parsed.success) {
      const messages = parsed.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      );

      return NextResponse.json(
        { error: `Validação falhou: ${messages.join(', ')}` },
        { status: 400 },
      );
    }

    await requireStaffForAcademy(parsed.data.academyId);
    const result = await getFinancialCommandCenterData(parsed.data.academyId);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}