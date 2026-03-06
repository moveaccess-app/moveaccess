export type AccessType = 'allowed' | 'denied' | 'manual_release';

export interface AccessHistoryEntry {
  id: string;
  userId: string;
  userName: string;
  type: AccessType;
  timestamp: Date;
  unitName: string;
  reason?: string;
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

export interface HomeKpis {
  totalStudents: number;
  activeStudents: number;
  openDrafts: number;
  pendingInvites: number;
  activeUnits: number;
}

export interface HomeData {
  academyName: string;
  alerts: PriorityAlert[];
  healthMetric: HealthMetric;
  recentAccesses: AccessHistoryEntry[];
  quickActions: QuickAction[];
  kpis: HomeKpis;
  accessPlaceholder: string;
}

interface HomeOverviewRpc {
  success: boolean;
  error_code?: string;
  academy_name?: string | null;
  kpis?: {
    total_students?: number;
    active_students?: number;
    open_drafts?: number;
    pending_invites?: number;
    active_units?: number;
  };
  alerts?: Array<{
    id: string;
    type: 'financial' | 'access' | 'contract' | 'system';
    title: string;
    description: string;
    severity: 'warning' | 'critical';
    actionLabel: string;
    actionHref: string;
    count?: number;
    timestamp?: string;
  }>;
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

function fallbackData(): HomeData {
  return {
    academyName: 'Academia',
    alerts: [],
    healthMetric: {
      label: 'Alunos ativos',
      value: '0',
      context: '0 no total',
      trend: 'stable',
    },
    recentAccesses: [],
    quickActions: [
      {
        id: 'action-onboarding',
        label: 'Abrir onboarding',
        icon: 'users',
        href: '/users/onboarding',
        variant: 'default',
      },
      {
        id: 'action-users',
        label: 'Ver alunos',
        icon: 'users',
        href: '/users',
        variant: 'outline',
      },
      {
        id: 'action-units',
        label: 'Ver unidades',
        icon: 'calendar',
        href: '/settings/units',
        variant: 'outline',
      },
    ],
    kpis: {
      totalStudents: 0,
      activeStudents: 0,
      openDrafts: 0,
      pendingInvites: 0,
      activeUnits: 0,
    },
    accessPlaceholder: 'Sem dados de acesso ainda',
  };
}

async function callOverviewRpc(): Promise<HomeOverviewRpc | null> {
  const token = getAccessToken();

  if (!token || !API_URL || !API_KEY) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/rest/v1/rpc/get_home_overview`, {
      method: 'POST',
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as HomeOverviewRpc;
  } catch {
    return null;
  }
}

export async function getHomeData(): Promise<HomeData> {
  const rpc = await callOverviewRpc();

  if (!rpc || !rpc.success || !rpc.kpis) {
    return fallbackData();
  }

  const kpis: HomeKpis = {
    totalStudents: rpc.kpis.total_students ?? 0,
    activeStudents: rpc.kpis.active_students ?? 0,
    openDrafts: rpc.kpis.open_drafts ?? 0,
    pendingInvites: rpc.kpis.pending_invites ?? 0,
    activeUnits: rpc.kpis.active_units ?? 0,
  };

  return {
    ...fallbackData(),
    academyName: rpc.academy_name || 'Academia',
    alerts: (rpc.alerts || []).slice(0, 6).map((alert) => ({
      ...alert,
      timestamp: new Date(alert.timestamp || Date.now()),
    })),
    healthMetric: {
      label: 'Alunos ativos',
      value: String(kpis.activeStudents),
      context: `${kpis.totalStudents} no total • ${kpis.openDrafts} rascunhos em aberto`,
      trend: 'stable',
    },
    kpis,
  };
}

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

export function getAccessTypeLabel(type: AccessType): string {
  const labels: Record<AccessType, string> = {
    allowed: 'Acesso liberado',
    denied: 'Acesso negado',
    manual_release: 'Liberação manual',
  };
  return labels[type];
}
