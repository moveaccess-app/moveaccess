/**
 * Settings Mock Data - MoveAccess
 * Módulo de Configurações do Tenant (Academia)
 *
 * Estruturas:
 * - Academy (dados da academia)
 * - Units (unidades)
 * - Staff Users (equipe)
 * - Roles & Permissions
 * - Policies (políticas operacionais)
 * - Integrations (integrações)
 * - Audit Logs (trilha de auditoria)
 */

// ============================================================================
// TIPOS BASE
// ============================================================================

export type UnitStatus = 'active' | 'inactive' | 'maintenance';
export type StaffStatus = 'active' | 'inactive' | 'pending';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';
export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'permission_change'
  | 'status_change'
  | 'manual_release'
  | 'payment_manual'
  | 'contract_publish'
  | 'config_change';

// Roles padrão do sistema
export type RoleId = 'admin' | 'manager' | 'receptionist' | 'financial' | 'readonly';

// Módulos do sistema
export type ModuleId = 'access' | 'users' | 'plans' | 'subscriptions' | 'contracts' | 'financial' | 'settings';

// Ações por módulo
export type ModuleAction =
  // Acesso
  | 'access:view_log'
  | 'access:manual_release'
  | 'access:export'
  | 'access:configure_qr'
  // Usuários
  | 'users:view'
  | 'users:create'
  | 'users:edit'
  | 'users:block'
  | 'users:delete'
  // Planos
  | 'plans:view'
  | 'plans:create'
  | 'plans:edit'
  | 'plans:deactivate'
  // Assinaturas
  | 'subscriptions:view'
  | 'subscriptions:create'
  | 'subscriptions:edit'
  | 'subscriptions:cancel'
  // Contratos
  | 'contracts:view'
  | 'contracts:create'
  | 'contracts:edit'
  | 'contracts:publish'
  | 'contracts:archive'
  // Financeiro
  | 'financial:view'
  | 'financial:mark_paid'
  | 'financial:exempt'
  | 'financial:export'
  | 'financial:refund'
  // Configurações
  | 'settings:view'
  | 'settings:edit_academy'
  | 'settings:manage_units'
  | 'settings:manage_team'
  | 'settings:manage_policies'
  | 'settings:manage_integrations'
  | 'settings:view_audit';

// ============================================================================
// INTERFACES
// ============================================================================

export interface Academy {
  id: string;
  tradeName: string; // Nome fantasia
  legalName: string; // Razão social
  cnpj: string;
  email: string;
  phone: string;
  whatsapp?: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  logoUrl?: string;
  preferences: {
    language: string;
    timezone: string;
    currency: string;
    dateFormat: string;
  };
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface Unit {
  id: string;
  name: string;
  status: UnitStatus;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone?: string;
  email?: string;
  operatingHours: {
    dayOfWeek: number; // 0-6 (dom-sab)
    openTime: string; // "06:00"
    closeTime: string; // "22:00"
    isOpen: boolean;
  }[];
  accessConfig: {
    qrEnabled: boolean;
    qrToken: string;
    qrUrl: string;
    dailyLimitDefault?: number;
    requireOtpNewDevice: boolean;
    toleranceMinutes: number; // tolerância antes/depois do horário
  };
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface Role {
  id: RoleId;
  name: string;
  description: string;
  permissions: ModuleAction[];
  isSystem: boolean; // roles do sistema não podem ser deletadas
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone?: string;
  roleId: RoleId;
  status: StaffStatus;
  unitIds: string[]; // unidades que pode acessar (vazio = todas)
  lastLoginAt?: Date;
  lastLoginIp?: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface Policies {
  id: string;
  // Política de inadimplência
  delinquency: {
    blockAccess: boolean; // bloquear acesso quando inadimplente
    toleranceDays: number; // dias de tolerância antes de bloquear
    notifyBeforeBlock: boolean;
    notifyDaysBefore: number;
  };
  // Política de cobrança
  billing: {
    defaultDueDay: number; // dia do vencimento padrão (1-28)
    lateFeePercentage: number; // multa por atraso (%)
    dailyInterestPercentage: number; // juros diários (%)
    gracePeriodDays: number; // dias de carência antes de aplicar multa
  };
  // Política de reativação
  reactivation: {
    allowAfterCancellation: boolean;
    requireNewContract: boolean;
    clearPendingDebts: boolean; // exigir quitação de débitos
  };
  // Política de check-in
  checkIn: {
    maxDeniedAttemptsAlert: number; // alertar após X tentativas negadas
    allowMultipleCheckInsDay: boolean; // permitir múltiplos check-ins no dia
    logAllAttempts: boolean;
  };
  updatedAt: Date;
  updatedBy: string;
}

export interface Integration {
  id: string;
  type: 'payment' | 'notification' | 'accounting' | 'other';
  provider: string;
  name: string;
  description: string;
  status: IntegrationStatus;
  config: {
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    environment?: 'sandbox' | 'production';
    [key: string]: string | undefined;
  };
  lastSyncAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  module: ModuleId | 'auth';
  userId: string;
  userName: string;
  userRole: RoleId;
  targetType?: string; // ex: 'user', 'unit', 'plan'
  targetId?: string;
  targetName?: string;
  description: string;
  changes?: {
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }[];
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// ============================================================================
// DADOS MOCKADOS
// ============================================================================

export const mockAcademy: Academy = {
  id: 'academy_001',
  tradeName: 'Move Fitness',
  legalName: 'Move Academia e Fitness LTDA',
  cnpj: '12.345.678/0001-90',
  email: 'contato@movefitness.com.br',
  phone: '(11) 3456-7890',
  whatsapp: '(11) 98765-4321',
  address: {
    street: 'Av. Paulista',
    number: '1000',
    complement: 'Sala 201',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100',
  },
  logoUrl: '/logo-placeholder.png',
  preferences: {
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
    dateFormat: 'DD/MM/YYYY',
  },
  createdAt: new Date('2023-01-15'),
  updatedAt: new Date('2025-12-10'),
  updatedBy: 'staff_001',
};

export const mockUnits: Unit[] = [
  {
    id: 'unit_001',
    name: 'Unidade Centro',
    status: 'active',
    address: {
      street: 'Av. Paulista',
      number: '1000',
      complement: 'Térreo',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
    },
    phone: '(11) 3456-7890',
    email: 'centro@movefitness.com.br',
    operatingHours: [
      { dayOfWeek: 0, openTime: '08:00', closeTime: '14:00', isOpen: true },
      { dayOfWeek: 1, openTime: '06:00', closeTime: '23:00', isOpen: true },
      { dayOfWeek: 2, openTime: '06:00', closeTime: '23:00', isOpen: true },
      { dayOfWeek: 3, openTime: '06:00', closeTime: '23:00', isOpen: true },
      { dayOfWeek: 4, openTime: '06:00', closeTime: '23:00', isOpen: true },
      { dayOfWeek: 5, openTime: '06:00', closeTime: '23:00', isOpen: true },
      { dayOfWeek: 6, openTime: '08:00', closeTime: '18:00', isOpen: true },
    ],
    accessConfig: {
      qrEnabled: true,
      qrToken: 'qr_tk_centro_abc123',
      qrUrl: 'https://app.moveaccess.com/checkin?unit=unit_001',
      dailyLimitDefault: 1,
      requireOtpNewDevice: true,
      toleranceMinutes: 15,
    },
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2025-11-20'),
    updatedBy: 'staff_001',
  },
  {
    id: 'unit_002',
    name: 'Unidade Jardins',
    status: 'active',
    address: {
      street: 'Rua Oscar Freire',
      number: '500',
      neighborhood: 'Jardins',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01426-001',
    },
    phone: '(11) 3456-7891',
    email: 'jardins@movefitness.com.br',
    operatingHours: [
      { dayOfWeek: 0, openTime: '08:00', closeTime: '14:00', isOpen: true },
      { dayOfWeek: 1, openTime: '05:30', closeTime: '23:30', isOpen: true },
      { dayOfWeek: 2, openTime: '05:30', closeTime: '23:30', isOpen: true },
      { dayOfWeek: 3, openTime: '05:30', closeTime: '23:30', isOpen: true },
      { dayOfWeek: 4, openTime: '05:30', closeTime: '23:30', isOpen: true },
      { dayOfWeek: 5, openTime: '05:30', closeTime: '23:30', isOpen: true },
      { dayOfWeek: 6, openTime: '07:00', closeTime: '20:00', isOpen: true },
    ],
    accessConfig: {
      qrEnabled: true,
      qrToken: 'qr_tk_jardins_def456',
      qrUrl: 'https://app.moveaccess.com/checkin?unit=unit_002',
      dailyLimitDefault: 2,
      requireOtpNewDevice: true,
      toleranceMinutes: 10,
    },
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2025-12-05'),
    updatedBy: 'staff_001',
  },
  {
    id: 'unit_003',
    name: 'Unidade Moema',
    status: 'inactive',
    address: {
      street: 'Av. Ibirapuera',
      number: '2500',
      neighborhood: 'Moema',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04028-001',
    },
    phone: '(11) 3456-7892',
    operatingHours: [
      { dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', isOpen: false },
      { dayOfWeek: 1, openTime: '00:00', closeTime: '00:00', isOpen: false },
      { dayOfWeek: 2, openTime: '00:00', closeTime: '00:00', isOpen: false },
      { dayOfWeek: 3, openTime: '00:00', closeTime: '00:00', isOpen: false },
      { dayOfWeek: 4, openTime: '00:00', closeTime: '00:00', isOpen: false },
      { dayOfWeek: 5, openTime: '00:00', closeTime: '00:00', isOpen: false },
      { dayOfWeek: 6, openTime: '00:00', closeTime: '00:00', isOpen: false },
    ],
    accessConfig: {
      qrEnabled: false,
      qrToken: 'qr_tk_moema_ghi789',
      qrUrl: 'https://app.moveaccess.com/checkin?unit=unit_003',
      requireOtpNewDevice: true,
      toleranceMinutes: 15,
    },
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2025-10-01'),
    updatedBy: 'staff_002',
  },
];

export const mockRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acesso total ao sistema, incluindo configurações e gestão de equipe',
    isSystem: true,
    permissions: [
      // Acesso
      'access:view_log',
      'access:manual_release',
      'access:export',
      'access:configure_qr',
      // Usuários
      'users:view',
      'users:create',
      'users:edit',
      'users:block',
      'users:delete',
      // Planos
      'plans:view',
      'plans:create',
      'plans:edit',
      'plans:deactivate',
      // Assinaturas
      'subscriptions:view',
      'subscriptions:create',
      'subscriptions:edit',
      'subscriptions:cancel',
      // Contratos
      'contracts:view',
      'contracts:create',
      'contracts:edit',
      'contracts:publish',
      'contracts:archive',
      // Financeiro
      'financial:view',
      'financial:mark_paid',
      'financial:exempt',
      'financial:export',
      'financial:refund',
      // Configurações
      'settings:view',
      'settings:edit_academy',
      'settings:manage_units',
      'settings:manage_team',
      'settings:manage_policies',
      'settings:manage_integrations',
      'settings:view_audit',
    ],
  },
  {
    id: 'manager',
    name: 'Gestor',
    description: 'Gestão operacional completa, sem acesso a configurações sensíveis',
    isSystem: true,
    permissions: [
      'access:view_log',
      'access:manual_release',
      'access:export',
      'access:configure_qr',
      'users:view',
      'users:create',
      'users:edit',
      'users:block',
      'plans:view',
      'plans:create',
      'plans:edit',
      'subscriptions:view',
      'subscriptions:create',
      'subscriptions:edit',
      'subscriptions:cancel',
      'contracts:view',
      'contracts:create',
      'contracts:edit',
      'contracts:publish',
      'financial:view',
      'financial:mark_paid',
      'financial:export',
      'settings:view',
      'settings:manage_units',
      'settings:view_audit',
    ],
  },
  {
    id: 'receptionist',
    name: 'Recepção',
    description: 'Atendimento ao cliente, check-in e cadastros básicos',
    isSystem: true,
    permissions: [
      'access:view_log',
      'access:manual_release',
      'users:view',
      'users:create',
      'users:edit',
      'plans:view',
      'subscriptions:view',
      'subscriptions:create',
      'contracts:view',
      'financial:view',
      'settings:view',
    ],
  },
  {
    id: 'financial',
    name: 'Financeiro',
    description: 'Gestão financeira, cobranças e relatórios',
    isSystem: true,
    permissions: [
      'access:view_log',
      'users:view',
      'plans:view',
      'subscriptions:view',
      'contracts:view',
      'financial:view',
      'financial:mark_paid',
      'financial:exempt',
      'financial:export',
      'financial:refund',
      'settings:view',
      'settings:view_audit',
    ],
  },
  {
    id: 'readonly',
    name: 'Somente Leitura',
    description: 'Visualização de informações sem permissão de alteração',
    isSystem: true,
    permissions: [
      'access:view_log',
      'users:view',
      'plans:view',
      'subscriptions:view',
      'contracts:view',
      'financial:view',
      'settings:view',
    ],
  },
];

export const mockStaffUsers: StaffUser[] = [
  {
    id: 'staff_001',
    name: 'Carlos Silva',
    email: 'carlos.silva@movefitness.com.br',
    cpf: '111.222.333-44',
    phone: '(11) 99999-0001',
    roleId: 'admin',
    status: 'active',
    unitIds: [], // acesso a todas
    lastLoginAt: new Date('2026-01-12T08:30:00'),
    lastLoginIp: '192.168.1.100',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2025-12-01'),
    updatedBy: 'staff_001',
  },
  {
    id: 'staff_002',
    name: 'Ana Oliveira',
    email: 'ana.oliveira@movefitness.com.br',
    cpf: '222.333.444-55',
    phone: '(11) 99999-0002',
    roleId: 'manager',
    status: 'active',
    unitIds: ['unit_001', 'unit_002'],
    lastLoginAt: new Date('2026-01-12T09:15:00'),
    lastLoginIp: '192.168.1.101',
    createdAt: new Date('2023-03-20'),
    updatedAt: new Date('2025-11-15'),
    updatedBy: 'staff_001',
  },
  {
    id: 'staff_003',
    name: 'Juliana Santos',
    email: 'juliana.santos@movefitness.com.br',
    cpf: '333.444.555-66',
    phone: '(11) 99999-0003',
    roleId: 'receptionist',
    status: 'active',
    unitIds: ['unit_001'],
    lastLoginAt: new Date('2026-01-12T07:00:00'),
    lastLoginIp: '192.168.1.102',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2025-10-20'),
    updatedBy: 'staff_002',
  },
  {
    id: 'staff_004',
    name: 'Roberto Almeida',
    email: 'roberto.almeida@movefitness.com.br',
    cpf: '444.555.666-77',
    phone: '(11) 99999-0004',
    roleId: 'financial',
    status: 'active',
    unitIds: [],
    lastLoginAt: new Date('2026-01-11T16:45:00'),
    lastLoginIp: '192.168.1.103',
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2025-09-10'),
    updatedBy: 'staff_001',
  },
  {
    id: 'staff_005',
    name: 'Mariana Costa',
    email: 'mariana.costa@movefitness.com.br',
    cpf: '555.666.777-88',
    roleId: 'receptionist',
    status: 'inactive',
    unitIds: ['unit_002'],
    createdAt: new Date('2024-08-15'),
    updatedAt: new Date('2025-12-01'),
    updatedBy: 'staff_002',
  },
];

export const mockPolicies: Policies = {
  id: 'policies_001',
  delinquency: {
    blockAccess: true,
    toleranceDays: 5,
    notifyBeforeBlock: true,
    notifyDaysBefore: 3,
  },
  billing: {
    defaultDueDay: 10,
    lateFeePercentage: 2,
    dailyInterestPercentage: 0.033,
    gracePeriodDays: 3,
  },
  reactivation: {
    allowAfterCancellation: true,
    requireNewContract: true,
    clearPendingDebts: true,
  },
  checkIn: {
    maxDeniedAttemptsAlert: 3,
    allowMultipleCheckInsDay: false,
    logAllAttempts: true,
  },
  updatedAt: new Date('2025-12-05'),
  updatedBy: 'staff_001',
};

export const mockIntegrations: Integration[] = [
  {
    id: 'int_001',
    type: 'payment',
    provider: 'stripe',
    name: 'Stripe',
    description: 'Pagamentos via cartão de crédito e débito',
    status: 'connected',
    config: {
      apiKey: 'sk_live_****************************1234',
      webhookUrl: 'https://api.moveaccess.com/webhooks/stripe',
      environment: 'production',
    },
    lastSyncAt: new Date('2026-01-12T10:00:00'),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2025-11-01'),
    updatedBy: 'staff_001',
  },
  {
    id: 'int_002',
    type: 'payment',
    provider: 'pix',
    name: 'Pix (Banco Inter)',
    description: 'Pagamentos instantâneos via Pix',
    status: 'connected',
    config: {
      apiKey: 'pix_****************************5678',
      environment: 'production',
    },
    lastSyncAt: new Date('2026-01-12T09:30:00'),
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2025-10-15'),
    updatedBy: 'staff_001',
  },
  {
    id: 'int_003',
    type: 'notification',
    provider: 'twilio',
    name: 'Twilio (SMS/WhatsApp)',
    description: 'Envio de notificações via SMS e WhatsApp',
    status: 'error',
    config: {
      apiKey: 'twilio_****************************9012',
      secretKey: 'twilio_sec_************************3456',
    },
    errorMessage: 'Créditos de SMS esgotados. Recarregue sua conta.',
    lastSyncAt: new Date('2026-01-10T14:00:00'),
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2025-12-08'),
    updatedBy: 'staff_001',
  },
  {
    id: 'int_004',
    type: 'notification',
    provider: 'sendgrid',
    name: 'SendGrid (E-mail)',
    description: 'Envio de e-mails transacionais e marketing',
    status: 'connected',
    config: {
      apiKey: 'sg_****************************7890',
    },
    lastSyncAt: new Date('2026-01-12T08:00:00'),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2025-09-20'),
    updatedBy: 'staff_001',
  },
  {
    id: 'int_005',
    type: 'accounting',
    provider: 'nfe',
    name: 'Nota Fiscal Eletrônica',
    description: 'Emissão automática de NF-e',
    status: 'disconnected',
    config: {},
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    updatedBy: 'staff_001',
  },
];

// Gerar logs de auditoria mockados
function generateMockAuditLogs(): AuditLog[] {
  const logs: AuditLog[] = [];
  const actions: { action: AuditAction; module: ModuleId | 'auth'; descriptions: string[] }[] = [
    {
      action: 'login',
      module: 'auth',
      descriptions: ['Login realizado com sucesso'],
    },
    {
      action: 'logout',
      module: 'auth',
      descriptions: ['Logout realizado'],
    },
    {
      action: 'create',
      module: 'users',
      descriptions: ['Novo usuário cadastrado', 'Aluno cadastrado via recepção'],
    },
    {
      action: 'update',
      module: 'users',
      descriptions: ['Dados do usuário atualizados', 'Plano do usuário alterado'],
    },
    {
      action: 'status_change',
      module: 'users',
      descriptions: ['Usuário bloqueado por inadimplência', 'Usuário reativado'],
    },
    {
      action: 'manual_release',
      module: 'access',
      descriptions: ['Liberação manual de acesso', 'Check-in manual autorizado'],
    },
    {
      action: 'config_change',
      module: 'settings',
      descriptions: ['Política de inadimplência alterada', 'Horário de funcionamento atualizado'],
    },
    {
      action: 'payment_manual',
      module: 'financial',
      descriptions: ['Pagamento marcado manualmente', 'Cobrança isentada'],
    },
    {
      action: 'contract_publish',
      module: 'contracts',
      descriptions: ['Template de contrato publicado', 'Nova versão do contrato ativada'],
    },
    {
      action: 'permission_change',
      module: 'settings',
      descriptions: ['Permissões do funcionário alteradas', 'Novo papel atribuído'],
    },
  ];

  const users = [
    { id: 'staff_001', name: 'Carlos Silva', role: 'admin' as RoleId },
    { id: 'staff_002', name: 'Ana Oliveira', role: 'manager' as RoleId },
    { id: 'staff_003', name: 'Juliana Santos', role: 'receptionist' as RoleId },
    { id: 'staff_004', name: 'Roberto Almeida', role: 'financial' as RoleId },
  ];

  const targets = [
    { type: 'user', id: 'user_001', name: 'João Silva' },
    { type: 'user', id: 'user_002', name: 'Maria Santos' },
    { type: 'unit', id: 'unit_001', name: 'Unidade Centro' },
    { type: 'plan', id: 'plan_001', name: 'Plano Básico' },
    { type: 'contract', id: 'contract_001', name: 'Contrato Padrão v2' },
  ];

  // Gerar 50 logs
  for (let i = 0; i < 50; i++) {
    const actionData = actions[Math.floor(Math.random() * actions.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const target = Math.random() > 0.3 ? targets[Math.floor(Math.random() * targets.length)] : undefined;
    const description = actionData.descriptions[Math.floor(Math.random() * actionData.descriptions.length)];

    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - daysAgo);
    timestamp.setHours(timestamp.getHours() - hoursAgo);

    logs.push({
      id: `audit_${String(i + 1).padStart(3, '0')}`,
      action: actionData.action,
      module: actionData.module,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetType: target?.type,
      targetId: target?.id,
      targetName: target?.name,
      description,
      ipAddress: `192.168.1.${100 + Math.floor(Math.random() * 50)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      timestamp,
    });
  }

  // Ordenar por data (mais recente primeiro)
  return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export const mockAuditLogs: AuditLog[] = generateMockAuditLogs();

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

export function getAcademy(): Academy {
  return mockAcademy;
}

export function updateAcademy(updates: Partial<Academy>, updatedBy: string): Academy {
  Object.assign(mockAcademy, updates, { updatedAt: new Date(), updatedBy });
  addAuditLog({
    action: 'update',
    module: 'settings',
    userId: updatedBy,
    userName: getStaffUserById(updatedBy)?.name || 'Sistema',
    userRole: getStaffUserById(updatedBy)?.roleId || 'admin',
    targetType: 'academy',
    targetId: mockAcademy.id,
    targetName: mockAcademy.tradeName,
    description: 'Dados da academia atualizados',
  });
  return mockAcademy;
}

export function getUnits(): Unit[] {
  return [...mockUnits];
}

export function getUnitById(id: string): Unit | undefined {
  return mockUnits.find((u) => u.id === id);
}

export function createUnit(unit: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Unit {
  const newUnit: Unit = {
    ...unit,
    id: `unit_${String(mockUnits.length + 1).padStart(3, '0')}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: createdBy,
  };
  mockUnits.push(newUnit);
  addAuditLog({
    action: 'create',
    module: 'settings',
    userId: createdBy,
    userName: getStaffUserById(createdBy)?.name || 'Sistema',
    userRole: getStaffUserById(createdBy)?.roleId || 'admin',
    targetType: 'unit',
    targetId: newUnit.id,
    targetName: newUnit.name,
    description: `Nova unidade criada: ${newUnit.name}`,
  });
  return newUnit;
}

export function updateUnit(id: string, updates: Partial<Unit>, updatedBy: string): Unit | undefined {
  const unit = mockUnits.find((u) => u.id === id);
  if (unit) {
    Object.assign(unit, updates, { updatedAt: new Date(), updatedBy });
    addAuditLog({
      action: 'update',
      module: 'settings',
      userId: updatedBy,
      userName: getStaffUserById(updatedBy)?.name || 'Sistema',
      userRole: getStaffUserById(updatedBy)?.roleId || 'admin',
      targetType: 'unit',
      targetId: unit.id,
      targetName: unit.name,
      description: `Unidade atualizada: ${unit.name}`,
    });
  }
  return unit;
}

export function deleteUnit(id: string, deletedBy: string): boolean {
  const index = mockUnits.findIndex((u) => u.id === id);
  if (index > -1) {
    const unit = mockUnits[index];
    mockUnits.splice(index, 1);
    addAuditLog({
      action: 'delete',
      module: 'settings',
      userId: deletedBy,
      userName: getStaffUserById(deletedBy)?.name || 'Sistema',
      userRole: getStaffUserById(deletedBy)?.roleId || 'admin',
      targetType: 'unit',
      targetId: id,
      targetName: unit.name,
      description: `Unidade removida: ${unit.name}`,
    });
    return true;
  }
  return false;
}

export function getStaffUsers(): StaffUser[] {
  return [...mockStaffUsers];
}

export function getStaffUserById(id: string): StaffUser | undefined {
  return mockStaffUsers.find((s) => s.id === id);
}

export function createStaffUser(staff: Omit<StaffUser, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): StaffUser {
  const newStaff: StaffUser = {
    ...staff,
    id: `staff_${String(mockStaffUsers.length + 1).padStart(3, '0')}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: createdBy,
  };
  mockStaffUsers.push(newStaff);
  addAuditLog({
    action: 'create',
    module: 'settings',
    userId: createdBy,
    userName: getStaffUserById(createdBy)?.name || 'Sistema',
    userRole: getStaffUserById(createdBy)?.roleId || 'admin',
    targetType: 'staff',
    targetId: newStaff.id,
    targetName: newStaff.name,
    description: `Novo funcionário cadastrado: ${newStaff.name}`,
  });
  return newStaff;
}

export function updateStaffUser(id: string, updates: Partial<StaffUser>, updatedBy: string): StaffUser | undefined {
  const staff = mockStaffUsers.find((s) => s.id === id);
  if (staff) {
    const oldRole = staff.roleId;
    Object.assign(staff, updates, { updatedAt: new Date(), updatedBy });
    
    const action: AuditAction = updates.roleId && updates.roleId !== oldRole ? 'permission_change' : 'update';
    addAuditLog({
      action,
      module: 'settings',
      userId: updatedBy,
      userName: getStaffUserById(updatedBy)?.name || 'Sistema',
      userRole: getStaffUserById(updatedBy)?.roleId || 'admin',
      targetType: 'staff',
      targetId: staff.id,
      targetName: staff.name,
      description: action === 'permission_change' 
        ? `Papel alterado de ${oldRole} para ${updates.roleId}` 
        : `Funcionário atualizado: ${staff.name}`,
      changes: updates.roleId && updates.roleId !== oldRole 
        ? [{ field: 'roleId', oldValue: oldRole, newValue: updates.roleId }]
        : undefined,
    });
  }
  return staff;
}

export function deleteStaffUser(id: string, deletedBy: string): boolean {
  const index = mockStaffUsers.findIndex((s) => s.id === id);
  if (index > -1) {
    const staff = mockStaffUsers[index];
    mockStaffUsers.splice(index, 1);
    addAuditLog({
      action: 'delete',
      module: 'settings',
      userId: deletedBy,
      userName: getStaffUserById(deletedBy)?.name || 'Sistema',
      userRole: getStaffUserById(deletedBy)?.roleId || 'admin',
      targetType: 'staff',
      targetId: id,
      targetName: staff.name,
      description: `Funcionário removido: ${staff.name}`,
    });
    return true;
  }
  return false;
}

export function getRoles(): Role[] {
  return [...mockRoles];
}

export function getRoleById(id: RoleId): Role | undefined {
  return mockRoles.find((r) => r.id === id);
}

export function getPolicies(): Policies {
  return { ...mockPolicies };
}

export function updatePolicies(updates: Partial<Policies>, updatedBy: string): Policies {
  Object.assign(mockPolicies, updates, { updatedAt: new Date(), updatedBy });
  addAuditLog({
    action: 'config_change',
    module: 'settings',
    userId: updatedBy,
    userName: getStaffUserById(updatedBy)?.name || 'Sistema',
    userRole: getStaffUserById(updatedBy)?.roleId || 'admin',
    description: 'Políticas operacionais atualizadas',
  });
  return mockPolicies;
}

export function getIntegrations(): Integration[] {
  return [...mockIntegrations];
}

export function getIntegrationById(id: string): Integration | undefined {
  return mockIntegrations.find((i) => i.id === id);
}

export function updateIntegration(id: string, updates: Partial<Integration>, updatedBy: string): Integration | undefined {
  const integration = mockIntegrations.find((i) => i.id === id);
  if (integration) {
    Object.assign(integration, updates, { updatedAt: new Date(), updatedBy });
    addAuditLog({
      action: 'config_change',
      module: 'settings',
      userId: updatedBy,
      userName: getStaffUserById(updatedBy)?.name || 'Sistema',
      userRole: getStaffUserById(updatedBy)?.roleId || 'admin',
      targetType: 'integration',
      targetId: integration.id,
      targetName: integration.name,
      description: `Integração atualizada: ${integration.name}`,
    });
  }
  return integration;
}

export function getAuditLogs(filters?: {
  action?: AuditAction;
  module?: ModuleId | 'auth';
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}): AuditLog[] {
  let logs = [...mockAuditLogs];

  if (filters?.action) {
    logs = logs.filter((l) => l.action === filters.action);
  }
  if (filters?.module) {
    logs = logs.filter((l) => l.module === filters.module);
  }
  if (filters?.userId) {
    logs = logs.filter((l) => l.userId === filters.userId);
  }
  if (filters?.startDate) {
    logs = logs.filter((l) => l.timestamp >= filters.startDate!);
  }
  if (filters?.endDate) {
    logs = logs.filter((l) => l.timestamp <= filters.endDate!);
  }

  return logs;
}

export function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp' | 'ipAddress' | 'userAgent'>): void {
  mockAuditLogs.unshift({
    ...log,
    id: `audit_${String(mockAuditLogs.length + 1).padStart(3, '0')}`,
    timestamp: new Date(),
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
  });
}

// ============================================================================
// HELPERS PARA INTEGRAÇÕES COM OUTROS MÓDULOS
// ============================================================================

/**
 * Retorna as variáveis disponíveis para templates de contrato
 * Consumido pelo módulo de Contratos
 */
export function getContractVariables(): Record<string, string> {
  const academy = getAcademy();
  return {
    '{{academia.nome_fantasia}}': academy.tradeName,
    '{{academia.razao_social}}': academy.legalName,
    '{{academia.cnpj}}': academy.cnpj,
    '{{academia.endereco}}': `${academy.address.street}, ${academy.address.number}${academy.address.complement ? ` - ${academy.address.complement}` : ''}, ${academy.address.neighborhood}, ${academy.address.city}/${academy.address.state} - CEP: ${academy.address.zipCode}`,
    '{{academia.telefone}}': academy.phone,
    '{{academia.email}}': academy.email,
  };
}

/**
 * Verifica se o acesso deve ser bloqueado por inadimplência
 * Consumido pelo módulo de Acesso
 */
export function shouldBlockAccessForDelinquency(daysOverdue: number): boolean {
  const policies = getPolicies();
  if (!policies.delinquency.blockAccess) return false;
  return daysOverdue > policies.delinquency.toleranceDays;
}

/**
 * Retorna configuração de QR por unidade
 * Consumido pelo módulo de Acesso
 */
export function getUnitQRConfig(unitId: string): Unit['accessConfig'] | undefined {
  const unit = getUnitById(unitId);
  return unit?.accessConfig;
}

/**
 * Verifica se usuário tem permissão para ação
 * Consumido por todos os módulos
 */
export function hasPermission(roleId: RoleId, action: ModuleAction): boolean {
  const role = getRoleById(roleId);
  return role?.permissions.includes(action) ?? false;
}

/**
 * Retorna configurações de cobrança
 * Consumido pelo módulo Financeiro
 */
export function getBillingSettings(): Policies['billing'] {
  return getPolicies().billing;
}
