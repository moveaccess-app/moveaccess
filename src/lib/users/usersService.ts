/**
 * Users Service - Switch Layer
 * 
 * Alterna entre mock e Supabase baseado em feature flag.
 * Expõe contrato canônico da UI (sem tipos vindos de mocks).
 */

import * as mockService from '@/mocks/usersMock';
import type { User as MockUser } from '@/mocks/usersMock';
import * as supabaseService from './usersServiceSupabase';
import type {
  User,
  UserStatus,
  UsersListResult,
} from './types';

// Feature flag
// Pilot mode should prefer the real Users source unless the workspace explicitly forces mocks.
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE_USERS !== 'false';

export type * from './types';

/**
 * Busca todos os alunos
 */
export async function getUsers(): Promise<UsersListResult> {
  if (USE_SUPABASE) {
    const result = await supabaseService.getUsers();
    return {
      users: result.users.map(adaptSupabaseToMock),
      total: result.total,
    };
  }
  
  return {
    users: mockService.mockUsers.map(adaptMockToCanonical),
    total: mockService.mockUsers.length,
  };
}

/**
 * Busca um aluno pelo ID
 */
export async function getUserById(id: string): Promise<User | null> {
  if (USE_SUPABASE) {
    const user = await supabaseService.getUserById(id);
    return user ? adaptSupabaseToMock(user) : null;
  }

  const user = mockService.getUserById(id);
  return user ? adaptMockToCanonical(user) : null;
}

/**
 * Filtra alunos por status
 */
export async function filterUsersByStatus(
  status: UserStatus | 'all'
): Promise<UsersListResult> {
  if (USE_SUPABASE) {
    const result = await supabaseService.filterUsersByStatus(status);
    return {
      users: result.users.map(adaptSupabaseToMock),
      total: result.total,
    };
  }
  
  const filtered = mockService.filterUsersByStatus(mockService.mockUsers, status);
  return {
    users: filtered.map(adaptMockToCanonical),
    total: filtered.length,
  };
}

/**
 * Busca alunos por texto
 */
export async function searchUsers(query: string): Promise<UsersListResult> {
  if (USE_SUPABASE) {
    const result = await supabaseService.searchUsers(query);
    return {
      users: result.users.map(adaptSupabaseToMock),
      total: result.total,
    };
  }
  
  const found = mockService.searchUsers(mockService.mockUsers, query);
  return {
    users: found.map(adaptMockToCanonical),
    total: found.length,
  };
}

/**
 * Busca alunos com filtro combinado
 */
export async function searchAndFilterUsers(
  query: string,
  status: UserStatus | 'all'
): Promise<UsersListResult> {
  if (USE_SUPABASE) {
    const result = await supabaseService.searchAndFilterUsers(query, status);
    return {
      users: result.users.map(adaptSupabaseToMock),
      total: result.total,
    };
  }
  
  let results = mockService.mockUsers;
  
  if (status !== 'all') {
    results = mockService.filterUsersByStatus(results, status);
  }
  
  if (query.trim()) {
    results = mockService.searchUsers(results, query);
  }
  
  return {
    users: results.map(adaptMockToCanonical),
    total: results.length,
  };
}

export function formatDate(dateString: string | null): string {
  if (!dateString || dateString === '-') return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(dateTimeString: string | null): string {
  if (!dateTimeString || dateTimeString === '-') return '-';
  const date = new Date(dateTimeString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// ============================================================================
// ADAPTER: Supabase User -> Mock User (completo)
// Preenche campos faltantes com valores default para manter UI funcionando
// ============================================================================

function adaptSupabaseToMock(user: supabaseService.User): MockUser {
  const now = new Date().toISOString();
  const isAccessReleased = user.operationalStatus.access.code === 'released';
  const mappedFinancialStatus = user.operationalStatus.financial.code === 'current'
    ? 'up_to_date'
    : user.operationalStatus.financial.code === 'pending_payment'
      || user.operationalStatus.financial.code === 'no_charge'
      ? 'partial'
      : 'overdue';
  
  return {
    id: user.id,
    registrationId: user.registrationId || 'SEM-MATRICULA',
    fullName: user.fullName,
    email: user.email,
    phone: user.phone || '',
    document: user.document || '',
    userType: 'student',
    unitId: user.unitId || '',
    unitName: user.unitName || 'Sem unidade',
    registrationOrigin: user.registrationOrigin || 'app',
    createdAt: user.createdAt,
    
    status: user.status,
    statusReason: user.statusReason || undefined,
    statusSince: user.statusSince || user.createdAt,
    statusHistory: [{
      status: user.status,
      reason: user.statusReason || 'Status atual',
      changedAt: user.statusSince || user.createdAt,
      changedBy: 'system',
    }],
    
    // Access: valores default (TODO: implementar módulo Access)
    access: {
      isAllowed: isAccessReleased,
      lastCheckIn: null,
      checkInsLast7Days: 0,
      checkInsLast30Days: 0,
      digitalCard: {
        status: isAccessReleased ? 'generated' : 'pending',
        generatedAt: user.createdAt,
      },
    },
    
    // Plano: converter do formato simplificado
    currentPlan: user.currentPlan ? {
      id: 'plan-supabase',
      name: user.currentPlan.name || 'Plano',
      startDate: user.createdAt,
      endDate: user.currentPlan.expiresAt || now,
      billingType: 'monthly',
      autoRenewal: true,
      nextDueDate: user.billingSnapshot?.dueDate || user.currentPlan.expiresAt || now,
      currentValue: user.billingSnapshot?.amount || 0,
    } : null,
    
    // Contratos: valores default (TODO: implementar módulo Contracts)
    contracts: [],
    currentContractId: undefined,
    
    // Financeiro: valores default (TODO: implementar módulo Financial)
    financial: {
      status: mappedFinancialStatus,
      daysOverdue: user.operationalStatus.financial.code === 'delinquent' ? 1 : 0,
      lastPayment: user.billingSnapshot?.paidAt ? {
        id: user.billingSnapshot.id,
        date: user.billingSnapshot.paidAt,
        value: user.billingSnapshot.amount,
        method: user.billingSnapshot.method === 'card' ? 'credit_card' : user.billingSnapshot.method,
        description: 'Pagamento consolidado no financeiro real',
      } : null,
      pendingBalance: 0,
      nextDueDate: user.billingSnapshot?.dueDate || now,
      nextDueValue: user.billingSnapshot?.amount || 0,
    },
    
    // Documentos: valores default (TODO: implementar módulo Documents)
    documents: [],
  };
}

function adaptMockToCanonical(user: MockUser): User {
  return {
    ...user,
    registrationId: user.registrationId || 'SEM-MATRICULA',
    phone: user.phone || '',
    document: user.document || '',
    unitId: user.unitId || '',
    unitName: user.unitName || 'Sem unidade',
    statusSince: user.statusSince || user.createdAt,
    statusHistory: user.statusHistory || [
      {
        status: user.status,
        reason: user.statusReason || 'Status atual',
        changedAt: user.createdAt,
        changedBy: 'system',
      },
    ],
    contracts: user.contracts || [],
    documents: user.documents || [],
  };
}

