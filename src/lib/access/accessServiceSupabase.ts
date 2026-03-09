import { getUnits, type Unit } from '@/lib/settings/settingsServiceSupabase';

export type AccessMethod = 'manual' | 'qr' | 'scanner';
export type AccessStatus = 'allowed' | 'denied';
export type DenialReason =
  | 'USER_NOT_FOUND'
  | 'STUDENT_INACTIVE'
  | 'FORBIDDEN'
  | 'UNAUTHENTICATED'
  | 'UNIT_NOT_FOUND'
  | 'INVALID_METHOD';

export interface AccessUnit {
  id: string;
  name: string;
  qrEnabled: boolean;
  qrToken?: string;
}

export interface AccessAttempt {
  id: string;
  userId?: string;
  userName?: string;
  userCpf?: string;
  unitId: string;
  unitName: string;
  method: AccessMethod;
  status: AccessStatus;
  reason?: DenialReason;
  reasonMessage?: string;
  timestamp: Date;
  notes?: string;
}

export interface CheckInResult {
  allowed: boolean;
  reason?: DenialReason;
  message: string;
  timestamp: Date;
  attemptId: string;
  user?: {
    id?: string;
    name?: string;
    document?: string;
  };
}

export interface AccessOverview {
  accessesToday: number;
  allowedToday: number;
  deniedToday: number;
  recentAccesses: AccessAttempt[];
}

export interface AccessLogFilters {
  status?: AccessStatus;
  method?: AccessMethod;
  unitId?: string;
  occurredFrom?: Date;
  occurredTo?: Date;
  search?: string;
  limit?: number;
}

interface RpcResult {
  success: boolean;
  status: AccessStatus;
  message: string;
  denial_reason?: DenialReason;
  log_id?: string;
}

interface DbAccessLogRow {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_document: string | null;
  unit_id: string;
  method: AccessMethod;
  status: AccessStatus;
  denial_reason: DenialReason | null;
  notes: string | null;
  occurred_at: string;
  unit?: {
    name?: string | null;
  } | null;
}

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

async function fetchSupabase<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T | null; error: string | null }> {
  const token = getAccessToken();

  if (!token || !API_URL || !API_KEY) {
    return { data: null, error: 'Não autenticado' };
  }

  try {
    const response = await fetch(`${API_URL}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: options.method === 'POST' ? 'return=representation' : 'return=minimal',
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

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

function mapUnit(unit: Unit): AccessUnit {
  return {
    id: unit.id,
    name: unit.name,
    qrEnabled: unit.accessConfig.qrEnabled,
    qrToken: unit.qrToken,
  };
}

function toReasonMessage(reason?: DenialReason): string | undefined {
  if (!reason) return undefined;

  const messages: Record<DenialReason, string> = {
    USER_NOT_FOUND: 'Usuário não encontrado',
    STUDENT_INACTIVE: 'Aluno sem acesso ativo',
    FORBIDDEN: 'Operador sem acesso à unidade',
    UNAUTHENTICATED: 'Operador não autenticado',
    UNIT_NOT_FOUND: 'Unidade não encontrada',
    INVALID_METHOD: 'Método inválido',
  };

  return messages[reason] || reason;
}

function mapLog(row: DbAccessLogRow): AccessAttempt {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    userName: row.user_name || undefined,
    userCpf: row.user_document || undefined,
    unitId: row.unit_id,
    unitName: row.unit?.name || 'Unidade',
    method: row.method,
    status: row.status,
    reason: row.denial_reason || undefined,
    reasonMessage: toReasonMessage(row.denial_reason || undefined),
    timestamp: new Date(row.occurred_at),
    notes: row.notes || undefined,
  };
}

export async function getAccessUnits(): Promise<AccessUnit[]> {
  const units = await getUnits();
  return units.map(mapUnit);
}

export async function getAccessLogs(filters: AccessLogFilters = {}): Promise<AccessAttempt[]> {
  const params = new URLSearchParams();
  params.set('select', 'id,user_id,user_name,user_document,unit_id,method,status,denial_reason,notes,occurred_at,unit:units(name)');
  params.set('order', 'occurred_at.desc');
  params.set('limit', String(filters.limit ?? 100));

  if (filters.status) params.set('status', `eq.${filters.status}`);
  if (filters.method) params.set('method', `eq.${filters.method}`);
  if (filters.unitId) params.set('unit_id', `eq.${filters.unitId}`);
  if (filters.occurredFrom) params.set('occurred_at', `gte.${filters.occurredFrom.toISOString()}`);
  if (filters.occurredTo) params.append('occurred_at', `lte.${filters.occurredTo.toISOString()}`);

  const { data, error } = await fetchSupabase<DbAccessLogRow[]>(`access_logs?${params.toString()}`);

  if (error || !data) {
    return [];
  }

  let logs = data.map(mapLog);

  if (filters.search) {
    const search = filters.search.toLowerCase();
    logs = logs.filter((log) =>
      log.userName?.toLowerCase().includes(search) ||
      log.userCpf?.replace(/\D/g, '').includes(filters.search!.replace(/\D/g, ''))
    );
  }

  if (filters.occurredFrom) {
    logs = logs.filter((log) => log.timestamp >= filters.occurredFrom!);
  }

  if (filters.occurredTo) {
    logs = logs.filter((log) => log.timestamp <= filters.occurredTo!);
  }

  return logs;
}

async function getAccessLogById(id: string): Promise<AccessAttempt | null> {
  const { data, error } = await fetchSupabase<DbAccessLogRow[]>(
    `access_logs?id=eq.${id}&select=id,user_id,user_name,user_document,unit_id,method,status,denial_reason,notes,occurred_at,unit:units(name)&limit=1`
  );

  if (error || !data?.[0]) {
    return null;
  }

  return mapLog(data[0]);
}

export async function processCheckin(params: {
  identifier: string;
  unitId: string;
  method: AccessMethod;
  notes?: string;
}): Promise<CheckInResult> {
  const { data, error } = await fetchSupabase<RpcResult>(
    'rpc/process_checkin_by_identifier',
    {
      method: 'POST',
      body: JSON.stringify({
        p_identifier: params.identifier,
        p_unit_id: params.unitId,
        p_method: params.method,
        p_notes: params.notes ?? null,
      }),
    }
  );

  if (error || !data) {
    return {
      allowed: false,
      reason: 'UNAUTHENTICATED',
      message: error || 'Não foi possível registrar o check-in.',
      timestamp: new Date(),
      attemptId: '',
    };
  }

  const log = data.log_id ? await getAccessLogById(data.log_id) : null;

  return {
    allowed: data.status === 'allowed',
    reason: data.denial_reason,
    message: data.message,
    timestamp: log?.timestamp || new Date(),
    attemptId: data.log_id || '',
    user: log
      ? {
          id: log.userId,
          name: log.userName,
          document: log.userCpf,
        }
      : undefined,
  };
}

export async function getAccessOverview(): Promise<AccessOverview> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayLogs, recentAccesses] = await Promise.all([
    getAccessLogs({ occurredFrom: todayStart, limit: 500 }),
    getAccessLogs({ limit: 8 }),
  ]);

  return {
    accessesToday: todayLogs.length,
    allowedToday: todayLogs.filter((log) => log.status === 'allowed').length,
    deniedToday: todayLogs.filter((log) => log.status === 'denied').length,
    recentAccesses,
  };
}

export function formatCpfMasked(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf || '—';
  return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`;
}

export function formatAccessTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatAccessDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getAccessMethodLabel(method: AccessMethod): string {
  const labels: Record<AccessMethod, string> = {
    manual: 'Manual',
    qr: 'QR',
    scanner: 'Scanner',
  };
  return labels[method];
}

export function getAccessStatusLabel(status: AccessStatus): string {
  return status === 'allowed' ? 'Liberado' : 'Negado';
}

export function getDenialReasonMessage(reason: DenialReason): string {
  return toReasonMessage(reason) || reason;
}
