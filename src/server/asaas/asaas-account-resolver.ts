// Server-side Asaas account resolution.
//
// Uses the Supabase server client (cookie-based auth) to query
// the asaas_accounts table and apply the same priority logic
// as the client-side service (unit account > academy account).
//
// This is the server-side equivalent of resolveAsaasAccount()
// from src/lib/asaas/. It never touches localStorage or browser APIs.

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { AsaasEnvironment } from './types';

// ─── Types ───────────────────────────────────────────────────────

export interface ResolvedAccount {
  id: string;
  academyId: string;
  unitId: string | null;
  environment: AsaasEnvironment;
  apiKeyReference: string;
  asaasAccountId: string | null;
  source: 'unit' | 'academy';
  isFallbackToAcademy: boolean;
}

interface AccountRow {
  id: string;
  academy_id: string;
  unit_id: string | null;
  environment: string;
  status: string;
  api_key_reference: string | null;
  asaas_account_id: string | null;
}

// ─── Resolver ────────────────────────────────────────────────────

export async function resolveAsaasAccountServer(input: {
  academyId: string;
  unitId?: string | null;
  environment: AsaasEnvironment;
}): Promise<ResolvedAccount> {
  const supabase = await createServerSupabaseClient();

  const { data: accounts, error } = await supabase
    .from('asaas_accounts')
    .select('id, academy_id, unit_id, environment, status, api_key_reference, asaas_account_id')
    .eq('academy_id', input.academyId)
    .eq('environment', input.environment)
    .eq('status', 'active');

  if (error) {
    throw new Error(`Falha ao buscar contas Asaas: ${error.message}`);
  }

  if (!accounts || accounts.length === 0) {
    throw new Error(
      `Nenhuma conta Asaas ativa encontrada para academia ${input.academyId} ` +
      `no ambiente ${input.environment}.`
    );
  }

  const rows = accounts as unknown as AccountRow[];
  const normalizedUnitId = input.unitId?.trim() || null;

  // Priority: unit-level account > academy-level account
  let chosen: AccountRow | undefined;
  let source: 'unit' | 'academy' = 'academy';
  let isFallbackToAcademy = false;

  if (normalizedUnitId) {
    chosen = rows.find((r) => r.unit_id === normalizedUnitId);
    if (chosen) {
      source = 'unit';
    }
  }

  if (!chosen) {
    chosen = rows.find((r) => r.unit_id === null);
    source = 'academy';
    isFallbackToAcademy = Boolean(normalizedUnitId);
  }

  if (!chosen) {
    throw new Error(
      `Nenhuma conta Asaas ativa aplicável para academia ${input.academyId}` +
      (normalizedUnitId ? ` / unidade ${normalizedUnitId}` : '') +
      ` no ambiente ${input.environment}.`
    );
  }

  if (!chosen.api_key_reference) {
    throw new Error(
      `Conta Asaas "${chosen.id}" não possui api_key_reference configurada.`
    );
  }

  return {
    id: chosen.id,
    academyId: chosen.academy_id,
    unitId: chosen.unit_id,
    environment: input.environment,
    apiKeyReference: chosen.api_key_reference,
    asaasAccountId: chosen.asaas_account_id,
    source,
    isFallbackToAcademy,
  };
}
