/**
 * Integrations Service — bridges Asaas account data with Settings UI.
 *
 * Uses the /api/asaas/account route for academy-scoped persistence/state,
 * and the /api/asaas/test-connection route for connection validation.
 */

import type { AsaasAccount, AsaasEnvironment } from '@/lib/asaas';

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

interface GetAsaasConnectionStateResponse {
  success: true;
  academyId: string;
  state: AsaasConnectionState;
}

interface SaveAsaasConfigResponse {
  success: boolean;
  academyId?: string;
  environment?: AsaasEnvironment;
  accountId?: string;
  error?: string;
}

interface DisconnectAsaasResponse {
  success: boolean;
  academyId?: string;
  error?: string;
}

// ─── Connection State ────────────────────────────────────────────

export async function getAsaasConnectionState(): Promise<AsaasConnectionState> {
  const response = await fetch('/api/asaas/account', {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    return {
      status: 'not_configured',
      account: null,
      environment: null,
      hasApiKey: false,
    };
  }

  const result = (await response.json()) as GetAsaasConnectionStateResponse;
  return result.state;
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
): Promise<SaveAsaasConfigResponse> {
  const response = await fetch('/api/asaas/account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accountId: existingAccountId,
      environment: input.environment,
      apiKey: input.apiKey,
      accountName: input.accountName,
      asaasAccountId: input.asaasAccountId ?? null,
      walletId: input.walletId ?? null,
    }),
  });

  const result = (await response.json()) as SaveAsaasConfigResponse | { error?: string };

  if (!response.ok) {
    return { success: false, error: result.error || 'Não foi possível salvar a conta Asaas.' };
  }

  return result as SaveAsaasConfigResponse;
}

// ─── Disconnect ──────────────────────────────────────────────────

export async function disconnectAsaas(
  accountId: string
): Promise<DisconnectAsaasResponse> {
  const response = await fetch('/api/asaas/account', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId }),
  });

  const result = (await response.json()) as DisconnectAsaasResponse | { error?: string };

  if (!response.ok) {
    return { success: false, error: result.error || 'Não foi possível desconectar a conta Asaas.' };
  }

  return result as DisconnectAsaasResponse;
}

// ─── Re-exports for convenience ──────────────────────────────────
export type { AsaasAccount, AsaasEnvironment };
