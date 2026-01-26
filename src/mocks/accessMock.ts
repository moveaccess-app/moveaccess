/**
 * Access Mock Data - REFATORADO
 * Sistema completo de controle de acesso por QR Code
 *
 * FLUXO DE CHECK-IN:
 * 1. Usuário acessa /acesso/checkin?unit=<unitId>
 * 2. Se autenticado -> tenta check-in direto
 * 3. Se não -> mostra formulário identificador + PIN
 * 4. Se novo dispositivo -> step-up OTP
 * 5. Regras: existe? assinatura ativa? financeiro ok? horário ok? limite diário ok?
 * 6. Retorna allowed: true/false + reason code
 * 7. Sempre loga tentativa
 */

// ============================================================================
// TIPOS
// ============================================================================

export type UserType = 'aluno' | 'personal' | 'admin' | 'visitante';
export type PlanStatus = 'active' | 'expired' | 'pending' | 'cancelled';
export type AccessMethod = 'qr_code' | 'pin' | 'manual' | 'biometria';
export type AccessStatus = 'allowed' | 'denied' | 'pending';

export type DenialReason =
  | 'user_not_found'
  | 'subscription_inactive'
  | 'financial_pending'
  | 'time_not_allowed'
  | 'daily_limit_exceeded'
  | 'unit_not_allowed'
  | 'plan_expired'
  | 'account_blocked'
  | 'invalid_pin'
  | 'otp_required'
  | 'otp_invalid'
  | 'device_not_trusted';

export interface AccessUser {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  type: UserType;
  planId?: string;
  planName?: string;
  planStatus: PlanStatus;
  allowedTimeStart?: string; // "06:00"
  allowedTimeEnd?: string; // "22:00"
  allowedDays?: number[]; // 0-6 (dom-sab)
  dailyLimit?: number;
  photoUrl?: string;
  createdAt: Date;
}

export interface AccessUnit {
  id: string;
  name: string;
  address: string;
  qrEnabled: boolean;
  qrToken: string;
  timezone: string;
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
  deviceId?: string;
  ip?: string;
  releasedBy?: string; // admin que liberou manualmente
  releaseReason?: string; // motivo da liberação manual
}

export interface CheckInResult {
  allowed: boolean;
  reason?: DenialReason;
  message: string;
  user?: AccessUser;
  timestamp: Date;
  attemptId: string;
}

export interface AccessKPIs {
  accessesToday: number;
  blockedToday: number;
  activeNow: number;
  avgDailyAccesses: number;
  peakHour: string;
  mostActiveDay: string;
}

export interface QRConfig {
  unitId: string;
  unitName: string;
  qrEnabled: boolean;
  qrToken: string;
  generatedAt: Date;
  expiresAt?: Date;
}

// ============================================================================
// MOCK DATA
// ============================================================================

// Unidades/Academias
export const mockUnits: AccessUnit[] = [
  {
    id: 'unit_001',
    name: 'MoveAccess - Unidade Centro',
    address: 'Rua das Flores, 123 - Centro',
    qrEnabled: true,
    qrToken: 'QR-UNIT001-2025',
    timezone: 'America/Sao_Paulo',
  },
  {
    id: 'unit_002',
    name: 'MoveAccess - Unidade Norte',
    address: 'Av. Brasil, 456 - Zona Norte',
    qrEnabled: true,
    qrToken: 'QR-UNIT002-2025',
    timezone: 'America/Sao_Paulo',
  },
  {
    id: 'unit_003',
    name: 'MoveAccess - Unidade Sul',
    address: 'Rua do Comércio, 789 - Zona Sul',
    qrEnabled: false,
    qrToken: 'QR-UNIT003-2025',
    timezone: 'America/Sao_Paulo',
  },
];

// Usuários com planos
export const mockAccessUsers: AccessUser[] = [
  {
    id: 'usr_001',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    cpf: '12345678900',
    phone: '11999998888',
    type: 'aluno',
    planId: 'plan_mensal',
    planName: 'Plano Mensal',
    planStatus: 'active',
    allowedTimeStart: '06:00',
    allowedTimeEnd: '22:00',
    allowedDays: [1, 2, 3, 4, 5, 6], // seg-sab
    dailyLimit: 1,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'usr_002',
    name: 'Maria Santos',
    email: 'maria.santos@email.com',
    cpf: '98765432100',
    phone: '11988887777',
    type: 'personal',
    planId: 'plan_personal',
    planName: 'Personal Trainer',
    planStatus: 'active',
    allowedTimeStart: '05:00',
    allowedTimeEnd: '23:00',
    allowedDays: [0, 1, 2, 3, 4, 5, 6],
    dailyLimit: 5,
    createdAt: new Date('2023-06-20'),
  },
  {
    id: 'usr_003',
    name: 'Carlos Oliveira',
    email: 'carlos.o@email.com',
    cpf: '45678912300',
    phone: '11977776666',
    type: 'aluno',
    planId: 'plan_trimestral',
    planName: 'Plano Trimestral',
    planStatus: 'expired',
    allowedTimeStart: '06:00',
    allowedTimeEnd: '22:00',
    allowedDays: [1, 2, 3, 4, 5],
    dailyLimit: 1,
    createdAt: new Date('2024-03-10'),
  },
  {
    id: 'usr_004',
    name: 'Ana Costa',
    email: 'ana.costa@email.com',
    cpf: '32165498700',
    phone: '11966665555',
    type: 'aluno',
    planId: 'plan_anual',
    planName: 'Plano Anual',
    planStatus: 'active',
    allowedTimeStart: '00:00',
    allowedTimeEnd: '23:59',
    allowedDays: [0, 1, 2, 3, 4, 5, 6],
    dailyLimit: 2,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'usr_005',
    name: 'Pedro Mendes',
    email: 'pedro.m@email.com',
    cpf: '78912345600',
    phone: '11955554444',
    type: 'aluno',
    planId: 'plan_mensal',
    planName: 'Plano Mensal',
    planStatus: 'pending', // financeiro pendente
    allowedTimeStart: '06:00',
    allowedTimeEnd: '22:00',
    allowedDays: [1, 2, 3, 4, 5, 6],
    dailyLimit: 1,
    createdAt: new Date('2024-05-15'),
  },
];

// Histórico de acessos (últimas 24h simuladas)
function generateMockAccessHistory(): AccessAttempt[] {
  const attempts: AccessAttempt[] = [];
  const now = new Date();
  const users = mockAccessUsers;
  const unit = mockUnits[0];

  // Gera 50 acessos nas últimas 24h
  for (let i = 0; i < 50; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    const timestamp = new Date(now.getTime() - hoursAgo * 3600000 - minutesAgo * 60000);

    const isAllowed = Math.random() > 0.15; // 85% liberado
    const methods: AccessMethod[] = ['qr_code', 'pin', 'manual', 'biometria'];
    const method = methods[Math.floor(Math.random() * methods.length)];

    const denialReasons: DenialReason[] = [
      'subscription_inactive',
      'financial_pending',
      'time_not_allowed',
      'daily_limit_exceeded',
    ];

    attempts.push({
      id: `att_${String(i).padStart(3, '0')}`,
      userId: randomUser.id,
      userName: randomUser.name,
      userCpf: randomUser.cpf,
      unitId: unit.id,
      unitName: unit.name,
      method,
      status: isAllowed ? 'allowed' : 'denied',
      reason: isAllowed
        ? undefined
        : denialReasons[Math.floor(Math.random() * denialReasons.length)],
      timestamp,
    });
  }

  // Ordena por timestamp desc
  return attempts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export const mockAccessHistory = generateMockAccessHistory();

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Formata CPF para exibição
 */
export function formatCpf(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
}

/**
 * Formata CPF mascarado
 */
export function formatCpfMasked(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return '***.***.***-**';
  return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`;
}

/**
 * Formata timestamp para exibição
 */
export function formatAccessTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata data para exibição
 */
export function formatAccessDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formata data e hora para exibição
 */
export function formatAccessDateTime(date: Date): string {
  return `${formatAccessDate(date)} ${formatAccessTime(date)}`;
}

/**
 * Retorna label do tipo de usuário
 */
export function getUserTypeLabel(type: UserType): string {
  const labels: Record<UserType, string> = {
    aluno: 'Aluno',
    personal: 'Personal Trainer',
    admin: 'Administrador',
    visitante: 'Visitante',
  };
  return labels[type] || type;
}

/**
 * Retorna label do método de acesso
 */
export function getAccessMethodLabel(method: AccessMethod): string {
  const labels: Record<AccessMethod, string> = {
    qr_code: 'QR Code',
    pin: 'PIN',
    manual: 'Manual',
    biometria: 'Biometria',
  };
  return labels[method] || method;
}

/**
 * Retorna label do status de acesso
 */
export function getAccessStatusLabel(status: AccessStatus): string {
  const labels: Record<AccessStatus, string> = {
    allowed: 'Liberado',
    denied: 'Negado',
    pending: 'Pendente',
  };
  return labels[status] || status;
}

/**
 * Retorna mensagem amigável para o motivo de negação
 */
export function getDenialReasonMessage(reason: DenialReason): string {
  const messages: Record<DenialReason, string> = {
    user_not_found: 'Usuário não encontrado',
    subscription_inactive: 'Assinatura inativa',
    financial_pending: 'Pagamento pendente',
    time_not_allowed: 'Fora do horário permitido',
    daily_limit_exceeded: 'Limite diário excedido',
    unit_not_allowed: 'Unidade não permitida',
    plan_expired: 'Plano expirado',
    account_blocked: 'Conta bloqueada',
    invalid_pin: 'PIN inválido',
    otp_required: 'Verificação OTP necessária',
    otp_invalid: 'Código OTP inválido',
    device_not_trusted: 'Dispositivo não confiável',
  };
  return messages[reason] || reason;
}

/**
 * Retorna cor para status de acesso
 */
export function getAccessStatusColor(status: AccessStatus): string {
  const colors: Record<AccessStatus, string> = {
    allowed: 'var(--status-positive)',
    denied: 'var(--status-negative)',
    pending: 'var(--status-alert)',
  };
  return colors[status];
}

// ============================================================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================================================

/**
 * Busca usuário por identificador (CPF, email ou telefone)
 */
export function findUserByIdentifier(identifier: string): AccessUser | null {
  const clean = identifier.replace(/\D/g, '');

  return (
    mockAccessUsers.find(
      (u) =>
        u.cpf === clean ||
        u.email.toLowerCase() === identifier.toLowerCase() ||
        u.phone?.replace(/\D/g, '') === clean
    ) || null
  );
}

/**
 * Valida PIN do usuário (mock - qualquer PIN de 4 dígitos é válido)
 */
export function validateUserPin(userId: string, pin: string): boolean {
  // Mock: aceita qualquer PIN de 4 dígitos
  return /^\d{4}$/.test(pin) && mockAccessUsers.some((u) => u.id === userId);
}

/**
 * Valida OTP (mock - aceita "123456")
 */
export function validateOtp(userId: string, otp: string): boolean {
  // Mock: aceita código "123456"
  return otp === '123456' && mockAccessUsers.some((u) => u.id === userId);
}

/**
 * Verifica se dispositivo é confiável (mock - sempre true)
 */
export function isDeviceTrusted(_userId: string, _deviceId: string): boolean {
  // Mock: sempre considera confiável
  return true;
}

/**
 * Conta acessos do usuário no dia atual
 */
export function getUserDailyAccessCount(userId: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return mockAccessHistory.filter(
    (a) =>
      a.userId === userId &&
      a.status === 'allowed' &&
      a.timestamp >= today
  ).length;
}

/**
 * Valida regras de acesso do usuário
 */
export function validateAccessRules(
  user: AccessUser,
  _unitId: string
): CheckInResult {
  const now = new Date();
  const attemptId = `att_${Date.now()}`;

  // 1. Verifica status da assinatura
  if (user.planStatus === 'expired') {
    return {
      allowed: false,
      reason: 'plan_expired',
      message: 'Seu plano expirou. Renove para acessar.',
      user,
      timestamp: now,
      attemptId,
    };
  }

  if (user.planStatus === 'pending') {
    return {
      allowed: false,
      reason: 'financial_pending',
      message: 'Pagamento pendente. Regularize sua situação.',
      user,
      timestamp: now,
      attemptId,
    };
  }

  if (user.planStatus === 'cancelled') {
    return {
      allowed: false,
      reason: 'subscription_inactive',
      message: 'Assinatura cancelada.',
      user,
      timestamp: now,
      attemptId,
    };
  }

  // 2. Verifica horário permitido
  if (user.allowedTimeStart && user.allowedTimeEnd) {
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (currentTime < user.allowedTimeStart || currentTime > user.allowedTimeEnd) {
      return {
        allowed: false,
        reason: 'time_not_allowed',
        message: `Acesso permitido apenas das ${user.allowedTimeStart} às ${user.allowedTimeEnd}.`,
        user,
        timestamp: now,
        attemptId,
      };
    }
  }

  // 3. Verifica dia da semana
  if (user.allowedDays && !user.allowedDays.includes(now.getDay())) {
    const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    return {
      allowed: false,
      reason: 'time_not_allowed',
      message: `Acesso não permitido às ${dayNames[now.getDay()]}s.`,
      user,
      timestamp: now,
      attemptId,
    };
  }

  // 4. Verifica limite diário
  if (user.dailyLimit) {
    const todayCount = getUserDailyAccessCount(user.id);
    if (todayCount >= user.dailyLimit) {
      return {
        allowed: false,
        reason: 'daily_limit_exceeded',
        message: `Limite diário de ${user.dailyLimit} acesso(s) atingido.`,
        user,
        timestamp: now,
        attemptId,
      };
    }
  }

  // Tudo ok!
  return {
    allowed: true,
    message: 'Acesso liberado! Bom treino!',
    user,
    timestamp: now,
    attemptId,
  };
}

/**
 * Processa check-in completo
 */
export function processCheckIn(
  identifier: string,
  pin: string,
  unitId: string,
  deviceId?: string
): CheckInResult {
  const now = new Date();
  const attemptId = `att_${Date.now()}`;

  // 1. Busca usuário
  const user = findUserByIdentifier(identifier);
  if (!user) {
    return {
      allowed: false,
      reason: 'user_not_found',
      message: 'Usuário não encontrado.',
      timestamp: now,
      attemptId,
    };
  }

  // 2. Valida PIN
  if (!validateUserPin(user.id, pin)) {
    return {
      allowed: false,
      reason: 'invalid_pin',
      message: 'PIN inválido.',
      user,
      timestamp: now,
      attemptId,
    };
  }

  // 3. Verifica dispositivo (se novo, requer OTP)
  if (deviceId && !isDeviceTrusted(user.id, deviceId)) {
    return {
      allowed: false,
      reason: 'otp_required',
      message: 'Novo dispositivo detectado. Insira o código enviado por SMS.',
      user,
      timestamp: now,
      attemptId,
    };
  }

  // 4. Valida regras de acesso
  return validateAccessRules(user, unitId);
}

/**
 * Libera acesso manualmente (admin)
 */
export function manualAccessRelease(
  userId: string,
  _unitId: string,
  _adminId: string,
  _reason: string
): CheckInResult {
  const now = new Date();
  const attemptId = `att_${Date.now()}`;

  const user = mockAccessUsers.find((u) => u.id === userId);
  if (!user) {
    return {
      allowed: false,
      reason: 'user_not_found',
      message: 'Usuário não encontrado.',
      timestamp: now,
      attemptId,
    };
  }

  // Liberação manual sempre permite (com registro)
  return {
    allowed: true,
    message: 'Acesso liberado manualmente.',
    user,
    timestamp: now,
    attemptId,
  };
}

// ============================================================================
// FUNÇÕES DE RELATÓRIO/KPIs
// ============================================================================

/**
 * Calcula KPIs de acesso
 */
export function getAccessKPIs(): AccessKPIs {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const todayAttempts = mockAccessHistory.filter((a) => a.timestamp >= todayStart);

  const accessesToday = todayAttempts.filter((a) => a.status === 'allowed').length;
  const blockedToday = todayAttempts.filter((a) => a.status === 'denied').length;

  // Simula "ativos agora" (quem acessou na última hora e não saiu)
  const oneHourAgo = new Date(now.getTime() - 3600000);
  const activeNow = mockAccessHistory.filter(
    (a) => a.status === 'allowed' && a.timestamp >= oneHourAgo
  ).length;

  // Média diária (mock)
  const avgDailyAccesses = 42;

  // Horário de pico (mock)
  const peakHour = '18:00';

  // Dia mais ativo (mock)
  const mostActiveDay = 'Segunda-feira';

  return {
    accessesToday,
    blockedToday,
    activeNow,
    avgDailyAccesses,
    peakHour,
    mostActiveDay,
  };
}

/**
 * Filtra histórico de acessos
 */
export function filterAccessHistory(filters: {
  status?: AccessStatus;
  method?: AccessMethod;
  unitId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}): AccessAttempt[] {
  let result = [...mockAccessHistory];

  if (filters.status) {
    result = result.filter((a) => a.status === filters.status);
  }

  if (filters.method) {
    result = result.filter((a) => a.method === filters.method);
  }

  if (filters.unitId) {
    result = result.filter((a) => a.unitId === filters.unitId);
  }

  if (filters.dateFrom) {
    result = result.filter((a) => a.timestamp >= filters.dateFrom!);
  }

  if (filters.dateTo) {
    result = result.filter((a) => a.timestamp <= filters.dateTo!);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(
      (a) =>
        a.userName?.toLowerCase().includes(searchLower) ||
        a.userCpf?.includes(filters.search!)
    );
  }

  return result;
}

/**
 * Obtém configuração do QR Code de uma unidade
 */
export function getUnitQRConfig(unitId: string): QRConfig | null {
  const unit = mockUnits.find((u) => u.id === unitId);
  if (!unit) return null;

  return {
    unitId: unit.id,
    unitName: unit.name,
    qrEnabled: unit.qrEnabled,
    qrToken: unit.qrToken,
    generatedAt: new Date(),
  };
}

/**
 * Alterna status do QR Code de uma unidade
 */
export function toggleUnitQR(unitId: string): boolean {
  const unit = mockUnits.find((u) => u.id === unitId);
  if (!unit) return false;

  unit.qrEnabled = !unit.qrEnabled;
  return unit.qrEnabled;
}

/**
 * Gera novo token QR para unidade
 */
export function regenerateUnitQR(unitId: string): string | null {
  const unit = mockUnits.find((u) => u.id === unitId);
  if (!unit) return null;

  const timestamp = Date.now().toString(36).toUpperCase();
  unit.qrToken = `QR-${unitId.toUpperCase()}-${timestamp}`;
  return unit.qrToken;
}

// ============================================================================
// EXPORTS LEGADOS (compatibilidade)
// ============================================================================

export type MockUserPayload = AccessUser;

export const currentMockUser: AccessUser = mockAccessUsers[0];

export const mockAcademyQr = {
  id: mockUnits[0].id,
  academyName: mockUnits[0].name,
  location: mockUnits[0].address,
  token: mockUnits[0].qrToken,
  generatedAt: new Date(),
};

export function mockValidateUserAccess(
  academyToken: string,
  user: AccessUser
): { success: boolean; message: string; user: AccessUser; timestamp: Date } {
  const result = validateAccessRules(user, mockUnits[0].id);
  return {
    success: result.allowed,
    message: result.message,
    user: result.user!,
    timestamp: result.timestamp,
  };
}

export function mockSearchUserByCpf(cpf: string): AccessUser | null {
  return findUserByIdentifier(cpf);
}

export function mockValidateLogin(cpf: string, password: string): AccessUser | null {
  if (password.length < 4) return null;
  return findUserByIdentifier(cpf);
}

export function getUserTypeBadgeVariant(
  type: UserType
): 'default' | 'secondary' | 'outline' {
  const variants: Record<UserType, 'default' | 'secondary' | 'outline'> = {
    aluno: 'default',
    personal: 'secondary',
    admin: 'default',
    visitante: 'outline',
  };
  return variants[type] || 'outline';
}
