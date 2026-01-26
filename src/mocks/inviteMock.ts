// ============================================
// TIPOS DE CONVITE / LINK DE AUTO-CADASTRO
// ============================================

export type InviteStatus = 
  | 'pending'       // Link gerado, aguardando uso
  | 'started'       // Usuário iniciou o cadastro
  | 'completed'     // Cadastro finalizado
  | 'expired';      // Link expirado

export interface InviteDiscount {
  type: 'percentage' | 'fixed';
  value: number;                    // Ex: 10 (10% ou R$10)
  appliesTo: 'first_month' | 'all' | 'enrollment';
  description: string;              // Ex: "10% de desconto no primeiro mês"
}

export interface Invite {
  id: string;
  token: string;                    // Token único para URL
  academyId: string;
  unitId: string;
  unitName: string;
  status: InviteStatus;
  discount?: InviteDiscount;
  
  // Metadados
  createdAt: string;
  createdBy: string;                // ID do operador que criou
  expiresAt: string;                // Data de expiração do link
  
  // Rastreamento
  openedAt?: string;                // Quando o link foi acessado
  startedAt?: string;               // Quando o cadastro foi iniciado
  completedAt?: string;             // Quando o cadastro foi finalizado
  
  // Dados do pré-cadastro (preenchido quando usuário inicia)
  preRegistration?: {
    name?: string;
    email?: string;
    phone?: string;
    onboardingSessionId?: string;
  };
  
  // Usuário final (preenchido quando completa)
  userId?: string;
}

// ============================================
// CONSTANTES
// ============================================

export const INVITE_EXPIRATION_DAYS = 7;

export const DISCOUNT_OPTIONS: InviteDiscount[] = [
  {
    type: 'percentage',
    value: 10,
    appliesTo: 'first_month',
    description: '10% de desconto no primeiro mês',
  },
  {
    type: 'percentage',
    value: 15,
    appliesTo: 'first_month',
    description: '15% de desconto no primeiro mês',
  },
  {
    type: 'percentage',
    value: 20,
    appliesTo: 'first_month',
    description: '20% de desconto no primeiro mês',
  },
  {
    type: 'fixed',
    value: 50,
    appliesTo: 'enrollment',
    description: 'R$ 50 de desconto na matrícula',
  },
  {
    type: 'fixed',
    value: 100,
    appliesTo: 'enrollment',
    description: 'Matrícula grátis',
  },
];

// ============================================
// MOCKS DE CONVITES
// ============================================

export const mockInvites: Invite[] = [
  {
    id: 'inv-001',
    token: 'abc123xyz',
    academyId: 'academy-1',
    unitId: 'unit-1',
    unitName: 'Academia Move - Unidade Centro',
    status: 'pending',
    discount: {
      type: 'percentage',
      value: 10,
      appliesTo: 'first_month',
      description: '10% de desconto no primeiro mês',
    },
    createdAt: '2026-01-08T10:00:00',
    createdBy: 'operator-1',
    expiresAt: '2026-01-15T10:00:00',
  },
  {
    id: 'inv-002',
    token: 'def456uvw',
    academyId: 'academy-1',
    unitId: 'unit-2',
    unitName: 'Academia Move - Unidade Norte',
    status: 'started',
    createdAt: '2026-01-07T14:00:00',
    createdBy: 'operator-2',
    expiresAt: '2026-01-14T14:00:00',
    openedAt: '2026-01-07T18:30:00',
    startedAt: '2026-01-07T18:32:00',
    preRegistration: {
      name: 'Carlos Eduardo',
      email: 'carlos@email.com',
      phone: '(11) 99876-5432',
      onboardingSessionId: 'onb-pending-001',
    },
  },
  {
    id: 'inv-003',
    token: 'ghi789rst',
    academyId: 'academy-1',
    unitId: 'unit-1',
    unitName: 'Academia Move - Unidade Centro',
    status: 'completed',
    discount: {
      type: 'fixed',
      value: 100,
      appliesTo: 'enrollment',
      description: 'Matrícula grátis',
    },
    createdAt: '2026-01-03T09:00:00',
    createdBy: 'operator-1',
    expiresAt: '2026-01-10T09:00:00',
    openedAt: '2026-01-03T20:00:00',
    startedAt: '2026-01-03T20:05:00',
    completedAt: '2026-01-03T20:35:00',
    preRegistration: {
      name: 'Fernanda Lima',
      email: 'fernanda@email.com',
      phone: '(11) 98765-4321',
      onboardingSessionId: 'onb-completed-001',
    },
    userId: '10',
  },
];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

export function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function createInvite(
  unitId: string,
  unitName: string,
  academyId: string,
  createdBy: string,
  discount?: InviteDiscount
): Invite {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRATION_DAYS);

  return {
    id: `inv-${Date.now()}`,
    token: generateToken(),
    academyId,
    unitId,
    unitName,
    status: 'pending',
    discount,
    createdAt: now.toISOString(),
    createdBy,
    expiresAt: expiresAt.toISOString(),
  };
}

export function getInviteByToken(token: string): Invite | undefined {
  return mockInvites.find(inv => inv.token === token);
}

export function isInviteValid(invite: Invite): boolean {
  if (invite.status === 'expired' || invite.status === 'completed') {
    return false;
  }
  
  const now = new Date();
  const expiresAt = new Date(invite.expiresAt);
  
  if (now > expiresAt) {
    return false;
  }
  
  return true;
}

export function getInviteUrl(token: string): string {
  // Em produção: usar domínio real
  return `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/cadastro/${token}`;
}

export function getInviteStatusLabel(status: InviteStatus): string {
  const labels: Record<InviteStatus, string> = {
    pending: 'Aguardando',
    started: 'Iniciado',
    completed: 'Concluído',
    expired: 'Expirado',
  };
  return labels[status];
}

export function getInviteStatusColor(status: InviteStatus): string {
  const colors: Record<InviteStatus, string> = {
    pending: 'var(--status-alert)',
    started: 'var(--element-primary)',
    completed: 'var(--status-positive)',
    expired: 'var(--text-tertiary)',
  };
  return colors[status];
}

// Simular alerta para academia
export function notifyAcademyPreRegistration(invite: Invite): void {
  console.log(`🔔 ALERTA: Novo pré-cadastro iniciado!`);
  console.log(`   Convite: ${invite.id}`);
  console.log(`   Unidade: ${invite.unitName}`);
  console.log(`   Nome: ${invite.preRegistration?.name || 'Não informado ainda'}`);
  console.log(`   Email: ${invite.preRegistration?.email || 'Não informado ainda'}`);
  console.log(`   Telefone: ${invite.preRegistration?.phone || 'Não informado ainda'}`);
  // Em produção: enviar notificação push, email, webhook, etc.
}
