import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { AsaasAccount, AsaasEnvironment } from '@/lib/asaas';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AuthorizationError, requireStaffSession } from '@/server/asaas/auth';

export const runtime = 'nodejs';

interface DbAsaasAccountRow {
  id: string;
  academy_id: string;
  unit_id: string | null;
  environment: AsaasEnvironment;
  status: 'active' | 'inactive';
  account_name: string;
  asaas_account_id: string | null;
  wallet_id: string | null;
  api_key_reference: string | null;
  external_reference: string | null;
  created_at: string;
  updated_at: string;
}

interface ConnectionStateResponse {
  success: true;
  academyId: string;
  state: {
    status: 'not_configured' | 'connected' | 'error';
    account: AsaasAccount | null;
    environment: AsaasEnvironment | null;
    hasApiKey: boolean;
  };
}

interface ConnectResponse {
  success: true;
  academyId: string;
  environment: AsaasEnvironment;
  accountId: string;
}

const connectSchema = z.object({
  accountId: z.string().uuid('accountId deve ser um UUID válido').optional(),
  environment: z.enum(['sandbox', 'production']),
  apiKey: z.string().min(10, 'API Key inválida'),
  accountName: z.string().trim().min(1, 'Nome da conta é obrigatório').max(120, 'Nome da conta é muito longo'),
  asaasAccountId: z.string().trim().min(1).max(120).nullable().optional(),
  walletId: z.string().trim().min(1).max(120).nullable().optional(),
});

const disconnectSchema = z.object({
  accountId: z.string().uuid('accountId deve ser um UUID válido'),
});

function mapAccount(row: DbAsaasAccountRow): AsaasAccount {
  return {
    id: row.id,
    academyId: row.academy_id,
    unitId: row.unit_id,
    environment: row.environment,
    status: row.status,
    accountName: row.account_name,
    asaasAccountId: row.asaas_account_id,
    walletId: row.wallet_id,
    apiKeyReference: row.api_key_reference,
    externalReference: row.external_reference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadAccounts(academyId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('asaas_accounts')
    .select('*')
    .eq('academy_id', academyId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Falha ao carregar configuração Asaas: ${error.message}`);
  }

  return (data ?? []) as DbAsaasAccountRow[];
}

function pickPrimaryAccount(rows: DbAsaasAccountRow[]) {
  const activeAcademyAccount = rows.find((row) => row.status === 'active' && row.unit_id === null);
  return activeAcademyAccount ?? rows[0] ?? null;
}

function buildConnectionState(academyId: string, rows: DbAsaasAccountRow[]): ConnectionStateResponse {
  const primary = pickPrimaryAccount(rows);

  if (!primary) {
    return {
      success: true,
      academyId,
      state: {
        status: 'not_configured',
        account: null,
        environment: null,
        hasApiKey: false,
      },
    };
  }

  const hasApiKey = Boolean(primary.api_key_reference);

  return {
    success: true,
    academyId,
    state: {
      status: primary.status === 'active' && hasApiKey ? 'connected' : 'error',
      account: mapAccount(primary),
      environment: primary.environment,
      hasApiKey,
    },
  };
}

export async function GET() {
  try {
    const { academyId } = await requireStaffSession();
    const rows = await loadAccounts(academyId);

    return NextResponse.json(buildConnectionState(academyId, rows), { status: 200 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = connectSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Dados inválidos';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { academyId } = await requireStaffSession();
    const supabase = await createServerSupabaseClient();
    const now = new Date().toISOString();
    const normalizedAccountName = parsed.data.accountName.trim();
    const normalizedAsaasAccountId = parsed.data.asaasAccountId?.trim() || null;
    const normalizedWalletId = parsed.data.walletId?.trim() || null;

    let targetId = parsed.data.accountId ?? null;

    if (targetId) {
      const { data: existing, error: existingError } = await supabase
        .from('asaas_accounts')
        .select('id, academy_id')
        .eq('id', targetId)
        .maybeSingle();

      if (existingError) {
        throw new Error(`Falha ao localizar conta Asaas existente: ${existingError.message}`);
      }

      if (!existing || existing.academy_id !== academyId) {
        return NextResponse.json({ error: 'Conta Asaas não encontrada para a academia autenticada.' }, { status: 404 });
      }
    }

    if (!targetId) {
      const { data: existingByEnvironment, error: existingByEnvironmentError } = await supabase
        .from('asaas_accounts')
        .select('id')
        .eq('academy_id', academyId)
        .is('unit_id', null)
        .eq('environment', parsed.data.environment)
        .maybeSingle();

      if (existingByEnvironmentError) {
        throw new Error(`Falha ao localizar conta Asaas por ambiente: ${existingByEnvironmentError.message}`);
      }

      targetId = existingByEnvironment?.id ?? null;
    }

    const payload = {
      academy_id: academyId,
      unit_id: null,
      environment: parsed.data.environment,
      status: 'active' as const,
      account_name: normalizedAccountName,
      asaas_account_id: normalizedAsaasAccountId,
      wallet_id: normalizedWalletId,
      api_key_reference: parsed.data.apiKey.trim(),
      updated_at: now,
    };

    let saved: DbAsaasAccountRow | null = null;
    let saveError: string | null = null;

    if (targetId) {
      const { data, error } = await supabase
        .from('asaas_accounts')
        .update(payload)
        .eq('id', targetId)
        .select('*')
        .single();

      saved = (data ?? null) as DbAsaasAccountRow | null;
      saveError = error?.message ?? null;
    } else {
      const { data, error } = await supabase
        .from('asaas_accounts')
        .insert({
          ...payload,
          created_at: now,
        })
        .select('*')
        .single();

      saved = (data ?? null) as DbAsaasAccountRow | null;
      saveError = error?.message ?? null;
    }

    if (!saved || saveError) {
      const message = saveError?.includes('duplicate key')
        ? `Já existe uma conta Asaas configurada para o ambiente ${parsed.data.environment}.`
        : saveError || 'Não foi possível salvar a configuração Asaas.';

      return NextResponse.json({ error: message }, { status: 409 });
    }

    const response: ConnectResponse = {
      success: true,
      academyId,
      environment: saved.environment,
      accountId: saved.id,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = disconnectSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Dados inválidos';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { academyId } = await requireStaffSession();
    const supabase = await createServerSupabaseClient();

    const { data: existing, error: existingError } = await supabase
      .from('asaas_accounts')
      .select('id, academy_id')
      .eq('id', parsed.data.accountId)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Falha ao localizar conta Asaas: ${existingError.message}`);
    }

    if (!existing || existing.academy_id !== academyId) {
      return NextResponse.json({ error: 'Conta Asaas não encontrada para a academia autenticada.' }, { status: 404 });
    }

    const { error } = await supabase
      .from('asaas_accounts')
      .update({
        status: 'inactive',
        api_key_reference: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.accountId);

    if (error) {
      throw new Error(`Falha ao desconectar conta Asaas: ${error.message}`);
    }

    return NextResponse.json({ success: true, academyId }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}