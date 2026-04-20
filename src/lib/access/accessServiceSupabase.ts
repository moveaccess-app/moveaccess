import { createClient } from '@/lib/supabase/client';
import { getUnits, type Unit } from '@/lib/settings/settingsServiceSupabase';

export type AccessMethod = 'manual' | 'qr' | 'scanner';
export type AccessStatus = 'allowed' | 'denied';
export type AccessFlow = 'entry' | 'exit' | 'auto';
export type DenialReason =
  | 'ACCESS_GRANTED'
  | 'USER_NOT_FOUND'
  | 'STUDENT_INACTIVE'
  | 'SUBSCRIPTION_INACTIVE'
  | 'SUBSCRIPTION_EXPIRED'
  | 'UNIT_NOT_ALLOWED'
  | 'TIME_NOT_ALLOWED'
  | 'FORBIDDEN'
  | 'UNAUTHENTICATED'
  | 'UNIT_NOT_FOUND'
  | 'INVALID_METHOD'
  | 'QR_EXPIRED'
  | 'QR_ALREADY_USED'
  | 'INVALID_QR_SIGNATURE'
  | 'INVALID_QR_PAYLOAD'
  | 'ACADEMY_MISMATCH'
  | 'CONFIGURATION_ERROR'
  | 'ALREADY_INSIDE'
  | 'EXIT_WITHOUT_ENTRY'
  | 'PAYMENT_OVERDUE';

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
  eventType?: 'entry' | 'exit';
  presenceAfter?: boolean;
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
  eventType?: 'entry' | 'exit';
  unitName?: string;
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
  reason?: DenialReason;
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
  access_event: 'entry' | 'exit' | null;
  presence_after: boolean | null;
  denial_reason: DenialReason | null;
  notes: string | null;
  occurred_at: string;
  unit?: {
    name?: string | null;
  } | null;
}

// Supabase client is now used via createClient() — no manual token management

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
    ACCESS_GRANTED: 'Acesso liberado',
    USER_NOT_FOUND: 'Usuário não encontrado',
    STUDENT_INACTIVE: 'Aluno sem acesso ativo',
    SUBSCRIPTION_INACTIVE: 'Aluno não possui assinatura ativa',
    SUBSCRIPTION_EXPIRED: 'Assinatura expirada',
    UNIT_NOT_ALLOWED: 'Plano não permite acesso a esta unidade',
    TIME_NOT_ALLOWED: 'Plano não permite acesso neste horário',
    FORBIDDEN: 'Operador sem acesso à unidade',
    UNAUTHENTICATED: 'Operador não autenticado',
    UNIT_NOT_FOUND: 'Unidade não encontrada',
    INVALID_METHOD: 'Método inválido',
    QR_EXPIRED: 'QR expirado',
    QR_ALREADY_USED: 'QR já utilizado',
    INVALID_QR_SIGNATURE: 'QR inválido ou adulterado',
    INVALID_QR_PAYLOAD: 'QR com formato inválido',
    ACADEMY_MISMATCH: 'QR gerado para outra academia',
    CONFIGURATION_ERROR: 'Erro de configuração do servidor',
    ALREADY_INSIDE: 'Aluno já está dentro da academia',
    EXIT_WITHOUT_ENTRY: 'Não há entrada aberta para registrar saída',
    PAYMENT_OVERDUE: 'Acesso bloqueado por inadimplência financeira',
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
    eventType: row.access_event || undefined,
    presenceAfter: row.presence_after ?? undefined,
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
  const supabase = createClient();

  let query = supabase
    .from('access_logs')
    .select('id,user_id,user_name,user_document,unit_id,method,status,access_event,presence_after,denial_reason,notes,occurred_at,unit:units(name)')
    .order('occurred_at', { ascending: false })
    .limit(filters.limit ?? 100);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.method) query = query.eq('method', filters.method);
  if (filters.unitId) query = query.eq('unit_id', filters.unitId);
  if (filters.occurredFrom) query = query.gte('occurred_at', filters.occurredFrom.toISOString());
  if (filters.occurredTo) query = query.lte('occurred_at', filters.occurredTo.toISOString());
  if (filters.search) {
    const search = filters.search.trim();
    const cleanDigits = search.replace(/\D/g, '');
    if (cleanDigits.length >= 3) {
      query = query.or(`user_name.ilike.%${search}%,user_document.ilike.%${cleanDigits}%`);
    } else {
      query = query.ilike('user_name', `%${search}%`);
    }
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return (data as unknown as DbAccessLogRow[]).map(mapLog);
}

async function getAccessLogById(id: string): Promise<AccessAttempt | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('access_logs')
    .select('id,user_id,user_name,user_document,unit_id,method,status,access_event,presence_after,denial_reason,notes,occurred_at,unit:units(name)')
    .eq('id', id)
    .limit(1)
    .single();

  if (error || !data) return null;

  return mapLog(data as unknown as DbAccessLogRow);
}

export async function processCheckin(params: {
  identifier: string;
  unitId: string;
  method: AccessMethod;
  flow?: AccessFlow;
  notes?: string;
}): Promise<CheckInResult> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('process_checkin_by_identifier', {
      p_identifier: params.identifier,
      p_unit_id: params.unitId,
      p_method: params.method,
      p_flow: params.flow ?? 'entry',
      p_notes: params.notes ?? undefined,
    });

    const result = data as unknown as RpcResult | null;

    if (error || !result) {
      return {
        allowed: false,
        reason: 'UNAUTHENTICATED',
        message: error?.message || 'Não foi possível registrar o check-in.',
        timestamp: new Date(),
        attemptId: '',
      };
    }

    let log: AccessAttempt | null = null;

    if (result.log_id) {
      try {
        log = await getAccessLogById(result.log_id);
      } catch {
        log = null;
      }
    }

    return {
      allowed: result.status === 'allowed',
      reason: result.reason ?? result.denial_reason,
      message: result.message,
      timestamp: log?.timestamp || new Date(),
      attemptId: result.log_id || '',
      eventType: log?.eventType,
      unitName: log?.unitName,
      user: log
        ? {
            id: log.userId,
            name: log.userName,
            document: log.userCpf,
          }
        : undefined,
    };
  } catch {
    return {
      allowed: false,
      reason: 'UNAUTHENTICATED',
      message: 'Não foi possível registrar o check-in.',
      timestamp: new Date(),
      attemptId: '',
    };
  }
}

export async function getAccessOverview(): Promise<AccessOverview> {
  const supabase = createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Single query for today's logs + derive KPIs, separate for recent
  const [todayResult, recentResult] = await Promise.all([
    supabase
      .from('access_logs')
      .select('status')
      .gte('occurred_at', todayStart.toISOString())
      .limit(1000),
    getAccessLogs({ limit: 8 }),
  ]);

  const todayLogs = todayResult.data ?? [];

  return {
    accessesToday: todayLogs.length,
    allowedToday: todayLogs.filter((l) => l.status === 'allowed').length,
    deniedToday: todayLogs.filter((l) => l.status === 'denied').length,
    recentAccesses: recentResult,
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
