// POST /api/billing/activate
//
// Activates external billing (Asaas) after a local commercial activation
// (subscription + payment created by the onboarding/public signup RPCs).
//
// Auth: accepts both staff (for onboarding path) and student (for public
// signup path, only for their own subscription). Uses admin client for
// data access after auth validation.

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import {
  activateExternalBilling,
  type ActivateExternalBillingResult,
} from '@/server/asaas/activate-external-billing';

interface RequestBody {
  subscriptionId: string;
  paymentId: string;
}

function isValidUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

export async function POST(request: Request): Promise<NextResponse<ActivateExternalBillingResult | { error: string }>> {
  // 1. Parse & validate input
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { subscriptionId, paymentId } = body;

  if (!subscriptionId || !paymentId) {
    return NextResponse.json(
      { error: 'subscriptionId and paymentId are required' },
      { status: 400 },
    );
  }

  if (!isValidUuid(subscriptionId) || !isValidUuid(paymentId)) {
    return NextResponse.json(
      { error: 'subscriptionId and paymentId must be valid UUIDs' },
      { status: 400 },
    );
  }

  // 2. Auth: get current user
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // 3. Load subscription to validate access
  const adminClient = createAdminSupabaseClient();
  const { data: subscription, error: subError } = await adminClient
    .from('subscriptions')
    .select('id, academy_id, student_id')
    .eq('id', subscriptionId)
    .single();

  if (subError || !subscription) {
    return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
  }

  const sub = subscription as { id: string; academy_id: string; student_id: string };

  // 4. Authorize: student who owns the subscription OR staff for the academy
  const isOwner = user.id === sub.student_id;

  if (!isOwner) {
    // Check staff membership
    const { data: membership } = await adminClient
      .from('academy_memberships')
      .select('profile_id')
      .eq('profile_id', user.id)
      .eq('academy_id', sub.academy_id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Sem permissão para esta operação' }, { status: 403 });
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || (profile as { user_type: string }).user_type !== 'staff') {
      return NextResponse.json({ error: 'Sem permissão para esta operação' }, { status: 403 });
    }
  }

  // 5. Activate external billing
  try {
    const result = await activateExternalBilling({ subscriptionId, paymentId });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('[billing/activate] Unexpected error:', message);
    return NextResponse.json(
      {
        status: 'failed_external_billing' as const,
        billingPath: null,
        reason: `INTERNAL_ERROR: ${message}`,
      },
      { status: 500 },
    );
  }
}
