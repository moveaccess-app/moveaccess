import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { requireStaffForAcademy } from '@/server/asaas/auth';
import { AuthorizationError } from '@/server/asaas/auth';

export const runtime = 'nodejs';

const querySchema = z.object({
  asaasPaymentId: z.string().min(1, 'asaasPaymentId é obrigatório'),
  academyId: z.string().uuid('academyId deve ser UUID'),
});

/**
 * GET /api/asaas/charges/events?asaasPaymentId=pay_...&academyId=...
 *
 * Returns recent webhook events for a given Asaas payment ID.
 * Staff-only, scoped by academy via requireStaffForAcademy.
 *
 * Used by the charge detail troubleshooting panel to show
 * event processing status without building a full timeline UI.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      asaasPaymentId: url.searchParams.get('asaasPaymentId'),
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

    // Validate staff membership in the academy
    await requireStaffForAcademy(parsed.data.academyId);

    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('asaas_webhook_events')
      .select('id, event_type, processing_status, error_message, received_at, processed_at')
      .eq('asaas_payment_id', parsed.data.asaasPaymentId)
      .order('received_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json(
        { error: `Erro ao buscar eventos: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ events: data ?? [] }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
