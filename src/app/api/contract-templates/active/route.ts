// GET /api/contract-templates/active?academyId=<uuid>
//
// Returns the currently published contract template for an academy.
// Used by both staff onboarding and public signup (anon) flows.
// Calls the RPC get_active_contract_template which is granted to anon+authenticated.

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface ActiveTemplateResponse {
  found: boolean;
  template?: {
    id: string;
    name: string;
    description: string;
    content: string;
    version: number;
    publishedAt: string;
  };
  reason?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest): Promise<NextResponse<ActiveTemplateResponse | { error: string }>> {
  const academyId = request.nextUrl.searchParams.get('academyId');

  if (!academyId || !UUID_RE.test(academyId)) {
    return NextResponse.json(
      { error: 'academyId query param is required and must be a valid UUID' },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_active_contract_template', {
    p_academy_id: academyId,
  });

  if (error) {
    console.error('[contract-templates/active] RPC error:', error.message);
    return NextResponse.json(
      { error: 'Erro ao buscar template de contrato' },
      { status: 500 }
    );
  }

  const result = data as ActiveTemplateResponse;
  return NextResponse.json(result);
}
