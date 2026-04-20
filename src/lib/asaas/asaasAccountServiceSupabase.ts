import { getActiveAcademyId } from '@/lib/supabase/academyScope';

export type AsaasEnvironment = 'sandbox' | 'production';
export type AsaasAccountStatus = 'active' | 'inactive';
export type AsaasAccountScope = 'academy' | 'unit';

export interface AsaasAccount {
  id: string;
  academyId: string;
  unitId: string | null;
  environment: AsaasEnvironment;
  status: AsaasAccountStatus;
  accountName: string;
  asaasAccountId: string | null;
  walletId: string | null;
  apiKeyReference: string | null;
  externalReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AsaasAccountInput {
  environment: AsaasEnvironment;
  status?: AsaasAccountStatus;
  unitId?: string | null;
  accountName?: string;
  asaasAccountId?: string | null;
  walletId?: string | null;
  apiKeyReference?: string | null;
  externalReference?: string | null;
}

export interface AsaasAccountUpdateInput {
  status?: AsaasAccountStatus;
  unitId?: string | null;
  accountName?: string;
  asaasAccountId?: string | null;
  walletId?: string | null;
  apiKeyReference?: string | null;
  externalReference?: string | null;
}

export interface AsaasAccountListFilters {
  academyId?: string;
  environment?: AsaasEnvironment;
  includeInactive?: boolean;
  unitId?: string | null;
}

export interface ResolveAsaasAccountInput {
  academyId: string;
  unitId?: string | null;
  environment: AsaasEnvironment;
}

export interface ResolvedAsaasAccount {
  account: AsaasAccount;
  source: AsaasAccountScope;
  isFallbackToAcademy: boolean;
}

interface DbAsaasAccountRow {
  id: string;
  academy_id: string;
  unit_id: string | null;
  environment: AsaasEnvironment;
  status: AsaasAccountStatus;
  account_name: string | null;
  asaas_account_id: string | null;
  wallet_id: string | null;
  api_key_reference: string | null;
  external_reference: string | null;
  created_at: string;
  updated_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const ASAAS_ENVIRONMENT_LABELS: Record<AsaasEnvironment, string> = {
  sandbox: 'Sandbox',
  production: 'Produção',
};

export const ASAAS_ACCOUNT_STATUS_LABELS: Record<AsaasAccountStatus, string> = {
  active: 'Ativa',
  inactive: 'Inativa',
};

function getStorageKey(): string {
  const projectRef = API_URL?.split('//')[1]?.split('.')[0] || 'supabase';
  return `sb-${projectRef}-auth-token`;
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(getStorageKey());
  if (!stored) return null;

  try {
    const session = JSON.parse(stored);
    return session.access_token || null;
  } catch {
    return null;
  }
}

async function fetchSupabase<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const token = getAccessToken();

  if (!token || !API_URL || !API_KEY) {
    return { data: null, error: 'Não autenticado' };
  }

  const method = options.method ?? 'GET';
  const prefer = method === 'GET' || method === 'DELETE' ? 'return=minimal' : 'return=representation';

  try {
    const response = await fetch(`${API_URL}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: prefer,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { data: null, error: errorData.message || `Erro ${response.status}` };
    }

    if (response.status === 204) {
      return { data: null, error: null };
    }

    const data = (await response.json()) as T;
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function rowToAsaasAccount(row: DbAsaasAccountRow): AsaasAccount {
  return {
    id: row.id,
    academyId: row.academy_id,
    unitId: row.unit_id,
    environment: row.environment,
    status: row.status,
    accountName: row.account_name || '',
    asaasAccountId: row.asaas_account_id,
    walletId: row.wallet_id,
    apiKeyReference: row.api_key_reference,
    externalReference: row.external_reference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializeAsaasAccountInput(
  input: Partial<AsaasAccountInput & AsaasAccountUpdateInput> & { academyId?: string }
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (input.academyId) payload.academy_id = input.academyId;
  if (Object.prototype.hasOwnProperty.call(input, 'unitId')) payload.unit_id = input.unitId || null;
  if (input.environment !== undefined) payload.environment = input.environment;
  if (input.status !== undefined) payload.status = input.status;
  if (Object.prototype.hasOwnProperty.call(input, 'accountName')) payload.account_name = input.accountName?.trim() || '';
  if (Object.prototype.hasOwnProperty.call(input, 'asaasAccountId')) payload.asaas_account_id = normalizeOptionalText(input.asaasAccountId);
  if (Object.prototype.hasOwnProperty.call(input, 'walletId')) payload.wallet_id = normalizeOptionalText(input.walletId);
  if (Object.prototype.hasOwnProperty.call(input, 'apiKeyReference')) payload.api_key_reference = normalizeOptionalText(input.apiKeyReference);
  if (Object.prototype.hasOwnProperty.call(input, 'externalReference')) payload.external_reference = normalizeOptionalText(input.externalReference);
  payload.updated_at = new Date().toISOString();

  return payload;
}

function buildAsaasAccountsQuery(academyId: string, filters: Omit<AsaasAccountListFilters, 'academyId'> = {}): string {
  const parts = ['select=*', 'academy_id=eq.' + academyId, 'order=updated_at.desc'];

  if (filters.environment) {
    parts.push(`environment=eq.${filters.environment}`);
  }

  if (!filters.includeInactive) {
    parts.push('status=eq.active');
  }

  if (Object.prototype.hasOwnProperty.call(filters, 'unitId')) {
    if (filters.unitId) {
      parts.push(`unit_id=eq.${filters.unitId}`);
    } else {
      parts.push('unit_id=is.null');
    }
  }

  return `asaas_accounts?${parts.join('&')}`;
}

export function getAsaasAccountScope(account: Pick<AsaasAccount, 'unitId'>): AsaasAccountScope {
  return account.unitId ? 'unit' : 'academy';
}

export function pickResolvedAsaasAccount(
  accounts: AsaasAccount[],
  unitId?: string | null
): ResolvedAsaasAccount | null {
  const normalizedUnitId = unitId?.trim() || null;

  if (normalizedUnitId) {
    const unitAccount = accounts.find((account) => account.status === 'active' && account.unitId === normalizedUnitId);

    if (unitAccount) {
      return {
        account: unitAccount,
        source: 'unit',
        isFallbackToAcademy: false,
      };
    }
  }

  const academyAccount = accounts.find((account) => account.status === 'active' && account.unitId === null);

  if (!academyAccount) {
    return null;
  }

  return {
    account: academyAccount,
    source: 'academy',
    isFallbackToAcademy: Boolean(normalizedUnitId),
  };
}

export async function getAsaasAccounts(filters: AsaasAccountListFilters = {}): Promise<AsaasAccount[]> {
  const academyId = filters.academyId || (await getActiveAcademyId());

  if (!academyId) {
    return [];
  }

  const { data, error } = await fetchSupabase<DbAsaasAccountRow[]>(
    buildAsaasAccountsQuery(academyId, {
      environment: filters.environment,
      includeInactive: filters.includeInactive,
      unitId: filters.unitId,
    })
  );

  if (error || !data) {
    return [];
  }

  return data.map(rowToAsaasAccount);
}

export async function getAsaasAccountById(id: string): Promise<AsaasAccount | null> {
  const { data, error } = await fetchSupabase<DbAsaasAccountRow[]>(
    `asaas_accounts?id=eq.${id}&select=*&limit=1`
  );

  if (error || !data?.[0]) {
    return null;
  }

  return rowToAsaasAccount(data[0]);
}

export async function createAsaasAccount(
  input: AsaasAccountInput
): Promise<{ success: boolean; account?: AsaasAccount; error?: string }> {
  const academyId = await getActiveAcademyId();

  if (!academyId) {
    return { success: false, error: 'Academia não encontrada para o usuário logado.' };
  }

  const payload = {
    ...serializeAsaasAccountInput(input),
    academy_id: academyId,
    status: input.status ?? 'active',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await fetchSupabase<DbAsaasAccountRow[]>(
    'asaas_accounts?select=*',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  if (error || !data?.[0]) {
    return { success: false, error: error || 'Não foi possível criar a conta Asaas.' };
  }

  return { success: true, account: rowToAsaasAccount(data[0]) };
}

export async function updateAsaasAccount(
  id: string,
  input: AsaasAccountUpdateInput
): Promise<{ success: boolean; account?: AsaasAccount; error?: string }> {
  const payload = serializeAsaasAccountInput(input);

  const { data, error } = await fetchSupabase<DbAsaasAccountRow[]>(
    `asaas_accounts?id=eq.${id}&select=*`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );

  if (error || !data?.[0]) {
    return { success: false, error: error || 'Não foi possível atualizar a conta Asaas.' };
  }

  return { success: true, account: rowToAsaasAccount(data[0]) };
}

export async function resolveAsaasAccount(
  input: ResolveAsaasAccountInput
): Promise<{ success: boolean; resolved?: ResolvedAsaasAccount; error?: string }> {
  const accounts = await getAsaasAccounts({
    academyId: input.academyId,
    environment: input.environment,
    includeInactive: false,
  });

  const resolved = pickResolvedAsaasAccount(accounts, input.unitId);

  if (!resolved) {
    return {
      success: false,
      error: 'Nenhuma conta Asaas ativa encontrada para a academia/unidade e ambiente informados.',
    };
  }

  return {
    success: true,
    resolved,
  };
}

export function getAsaasEnvironmentLabel(environment: AsaasEnvironment): string {
  return ASAAS_ENVIRONMENT_LABELS[environment];
}

export function getAsaasAccountStatusLabel(status: AsaasAccountStatus): string {
  return ASAAS_ACCOUNT_STATUS_LABELS[status];
}