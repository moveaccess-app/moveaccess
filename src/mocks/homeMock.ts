/**
 * Home Mock Data - MoveAccess
 * Dados para a Home com foco em alertas e atividade recente
 */

// ============================================================================
// TIPOS
// ============================================================================

export type AccessType = 'allowed' | 'denied' | 'manual_release';

export interface AccessHistoryEntry {
  id: string;
  userId: string;
  userName: string;
  type: AccessType;
  timestamp: Date;
  unitName: string;
  reason?: string; // Para acessos negados ou liberações manuais
}

export interface PriorityAlert {
  id: string;
  type: 'financial' | 'access' | 'contract' | 'system';
  title: string;
  description: string;
  severity: 'warning' | 'critical';
  actionLabel: string;
  actionHref: string;
  count?: number;
  timestamp: Date;
}

export interface HealthMetric {
  label: string;
  value: string;
  context: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface QuickAction {
  id: string;
  label: string;
  icon: 'unlock' | 'money' | 'calendar' | 'users';
  href: string;
  variant?: 'default' | 'outline';
}

export interface HomeData {
  academyName: string;
  alerts: PriorityAlert[];
  healthMetric: HealthMetric;
  recentAccesses: AccessHistoryEntry[];
  quickActions: QuickAction[];
}

// ============================================================================
// FUNÇÕES DE DADOS
// ============================================================================

/**
 * Gera alertas prioritários baseados na situação atual
 */
function generatePriorityAlerts(): PriorityAlert[] {
  const now = new Date();
  const alerts: PriorityAlert[] = [];
  
  // Simular alertas baseados em condições
  const overdueCharges = 2;
  const deniedAccessToday = 3;
  const expiringContracts = 1;
  
  if (overdueCharges > 0) {
    alerts.push({
      id: 'alert-overdue',
      type: 'financial',
      title: `${overdueCharges} cobrança${overdueCharges > 1 ? 's' : ''} vence${overdueCharges > 1 ? 'm' : ''} hoje`,
      description: 'Verifique as cobranças pendentes para evitar inadimplência.',
      severity: 'warning',
      actionLabel: 'Ver cobranças',
      actionHref: '/financial',
      count: overdueCharges,
      timestamp: now,
    });
  }
  
  if (deniedAccessToday > 0) {
    alerts.push({
      id: 'alert-access',
      type: 'access',
      title: `${deniedAccessToday} acesso${deniedAccessToday > 1 ? 's' : ''} negado${deniedAccessToday > 1 ? 's' : ''} nas últimas 24h`,
      description: 'Alunos tentaram entrar mas foram bloqueados.',
      severity: deniedAccessToday > 5 ? 'critical' : 'warning',
      actionLabel: 'Ver acessos',
      actionHref: '/access/log',
      count: deniedAccessToday,
      timestamp: now,
    });
  }
  
  if (expiringContracts > 0) {
    alerts.push({
      id: 'alert-contracts',
      type: 'contract',
      title: `${expiringContracts} contrato${expiringContracts > 1 ? 's' : ''} vence${expiringContracts > 1 ? 'm' : ''} esta semana`,
      description: 'Entre em contato para renovação.',
      severity: 'warning',
      actionLabel: 'Ver contratos',
      actionHref: '/contracts',
      count: expiringContracts,
      timestamp: now,
    });
  }
  
  // Retornar no máximo 3 alertas
  return alerts.slice(0, 3);
}

/**
 * Calcula a métrica de saúde principal
 */
function calculateHealthMetric(): HealthMetric {
  // Métrica principal: Receita recebida hoje ou Inadimplência
  const receivedToday = 2450.00;
  const overdueCount = 5;
  const overdueTotal = 1890.00;
  
  // Alternar entre métricas baseado na situação
  if (overdueCount > 3) {
    return {
      label: 'Inadimplência ativa',
      value: `R$ ${overdueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      context: `${overdueCount} alunos com pagamento atrasado`,
      trend: 'up',
    };
  }
  
  return {
    label: 'Receita recebida hoje',
    value: `R$ ${receivedToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    context: '8 pagamentos confirmados',
    trend: 'stable',
  };
}

/**
 * Gera histórico de acessos recentes (últimas 24h)
 */
function generateRecentAccesses(): AccessHistoryEntry[] {
  const now = new Date();
  const accesses: AccessHistoryEntry[] = [];
  
  const users = [
    'João Silva',
    'Maria Santos',
    'Pedro Oliveira',
    'Ana Costa',
    'Carlos Ferreira',
    'Juliana Alves',
    'Roberto Lima',
    'Fernanda Souza',
  ];
  
  const units = ['Unidade Centro', 'Unidade Zona Sul'];
  
  // Gerar entre 5-8 acessos recentes
  const accessCount = Math.floor(Math.random() * 4) + 5;
  
  for (let i = 0; i < accessCount; i++) {
    const minutesAgo = Math.floor(Math.random() * 1440); // Últimas 24h
    const timestamp = new Date(now.getTime() - minutesAgo * 60 * 1000);
    
    // 70% allowed, 20% denied, 10% manual
    const rand = Math.random();
    let type: AccessType;
    let reason: string | undefined;
    
    if (rand > 0.9) {
      type = 'manual_release';
      reason = 'Liberado pela recepção';
    } else if (rand > 0.7) {
      type = 'denied';
      const reasons = [
        'Pagamento em atraso',
        'Fora do horário permitido',
        'Plano inativo',
      ];
      reason = reasons[Math.floor(Math.random() * reasons.length)];
    } else {
      type = 'allowed';
    }
    
    accesses.push({
      id: `access-${i}`,
      userId: `user-${i}`,
      userName: users[Math.floor(Math.random() * users.length)],
      type,
      timestamp,
      unitName: units[Math.floor(Math.random() * units.length)],
      reason,
    });
  }
  
  // Ordenar por timestamp decrescente (mais recente primeiro)
  return accesses.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Define as ações rápidas disponíveis
 */
function getQuickActions(): QuickAction[] {
  return [
    {
      id: 'action-manual-access',
      label: 'Liberar acesso manual',
      icon: 'unlock',
      href: '/access/releases',
      variant: 'default',
    },
    {
      id: 'action-overdue',
      label: 'Ver inadimplência',
      icon: 'money',
      href: '/financial?filter=overdue',
      variant: 'outline',
    },
    {
      id: 'action-charges-today',
      label: 'Cobranças de hoje',
      icon: 'calendar',
      href: '/financial?filter=today',
      variant: 'outline',
    },
  ];
}

// ============================================================================
// EXPORT PRINCIPAL
// ============================================================================

/**
 * Obtém todos os dados da Home
 */
export function getHomeData(): HomeData {
  return {
    academyName: 'Academia Evolution',
    alerts: generatePriorityAlerts(),
    healthMetric: calculateHealthMetric(),
    recentAccesses: generateRecentAccesses(),
    quickActions: getQuickActions(),
  };
}

/**
 * Formata tempo relativo em português
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffMinutes < 1) return 'agora';
  if (diffMinutes < 60) return `há ${diffMinutes} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  
  return date.toLocaleDateString('pt-BR');
}

/**
 * Obtém o rótulo do tipo de acesso
 */
export function getAccessTypeLabel(type: AccessType): string {
  const labels: Record<AccessType, string> = {
    allowed: 'Acesso liberado',
    denied: 'Acesso negado',
    manual_release: 'Liberação manual',
  };
  return labels[type];
}

