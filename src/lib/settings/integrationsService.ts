/**
 * Integrations Service — bridges Asaas account data with Settings UI.
 *
 * Uses the real asaasAccountService (Supabase REST) for all CRUD,
 * and the /api/asaas/test-connection route for connection validation.
 */

import {
  getAsaasAccounts,
  getAsaasAccountById,
  createAsaasAccount,
  updateAsaasAccount,
  type AsaasAccount,
  type AsaasEnvironment,
} from '@/lib/asaas';

// ─── Types ───────────────────────────────────────────────────────

export type AsaasConnectionStatus =
  | 'not_configured'
  | 'connected'
  | 'error';

export interface AsaasConnectionState {
  status: AsaasConnectionStatus;
  account: AsaasAccount | null;
  environment: AsaasEnvironment | null;
  hasApiKey: boolean;
}

export interface TestConnectionResult {
  success: boolean;
  error?: string;
  account?: {
    id: string | null;
    name: string | null;
    email: string | null;
    walletId: string | null;
    cpfCnpj: string | null;
  };
  environment?: string;
}

export interface SaveAsaasConfigInput {
  environment: AsaasEnvironment;
  apiKey: string;
  accountName: string;
  asaasAccountId?: string | null;
  walletId?: string | null;
}

// ─── Connection State ────────────────────────────────────────────

export async function getAsaasConnectionState(): Promise<AsaasConnectionState> {
  const accounts = await getAsaasAccounts({ includeInactive: true });

  if (accounts.length === 0) {
    return {
      status: 'not_configured',
      account: null,
      environment: null,
      hasApiKey: false,
    };
  }

  // Pick the primary (academy-level, active) account
  const active = accounts.find((a) => a.status === 'active' && !a.unitId);
  const account = active || accounts[0];

  const hasApiKey = Boolean(account.apiKeyReference);

  return {
    status: account.status === 'active' && hasApiKey ? 'connected' : 'error',
    account,
    environment: account.environment,
    hasApiKey,
  };
}

// ─── Test Connection ─────────────────────────────────────────────

export async function testAsaasConnection(
  apiKey: string,
  environment: AsaasEnvironment
): Promise<TestConnectionResult> {
  const response = await fetch('/api/asaas/test-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, environment }),
  });

  return (await response.json()) as TestConnectionResult;
}

// ─── Save Config ─────────────────────────────────────────────────

export async function saveAsaasConfig(
  input: SaveAsaasConfigInput,
  existingAccountId?: string
): Promise<{ success: boolean; error?: string }> {
  if (existingAccountId) {
    const result = await updateAsaasAccount(existingAccountId, {
      apiKeyReference: input.apiKey,
      accountName: input.accountName,
      asaasAccountId: input.asaasAccountId,
      walletId: input.walletId,
      status: 'active',
    });
    return { success: result.success, error: result.error };
  }

  const result = await createAsaasAccount({
    environment: input.environment,
    apiKeyReference: input.apiKey,
    accountName: input.accountName,
    asaasAccountId: input.asaasAccountId,
    walletId: input.walletId,
    status: 'active',
  });
  return { success: result.success, error: result.error };
}

// ─── Disconnect ──────────────────────────────────────────────────

export async function disconnectAsaas(
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await updateAsaasAccount(accountId, {
    status: 'inactive',
    apiKeyReference: null,
  });
  return { success: result.success, error: result.error };
}

// ─── Re-exports for convenience ──────────────────────────────────

export { getAsaasAccountById };
export type { AsaasAccount, AsaasEnvironment };
