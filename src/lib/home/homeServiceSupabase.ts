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

export interface ActivationChecklist {
  hasUnit: boolean;
  hasPlan: boolean;
  hasPublishedContract: boolean;
  hasStudent: boolean;
  hasSubscription: boolean;
  hasCharge: boolean;
  hasCheckin: boolean;
  hasPayment: boolean;
  hasBilling: boolean;
  hasCommandCenterCase: boolean;
  plansCount: number;
  studentsCount: number;
  subscriptionsCount: number;
  contractsCount: number;
  chargesCount: number;
  checkinsCount: number;
  paymentsCount: number;
  commandCenterCaseCount: number;
}

export interface DashboardKpis {
  pendingPayments: number;
  monthRevenue: number;
  overdueStudents: number;
  checkinsToday: number;
  newStudentsMonth: number;
}

export interface HomeData {
  academyName: string;
  setupCompleted: boolean;
  alerts: PriorityAlert[];
  healthMetric: HealthMetric;
  recentAccesses: AccessHistoryEntry[];
  quickActions: QuickAction[];
  kpis: HomeKpis;
  activation: ActivationChecklist;
  dashboard: DashboardKpis;
  accessPlaceholder: string;
}

import { getBrowserAccessToken } from '@/lib/supabase/academyScope';

interface HomeOverviewRpc {
  success: boolean;
  error_code?: string;
  academy_id?: string | null;
  academy_name?: string | null;
  setup_completed?: boolean;
  kpis?: {
    total_students?: number;
    active_students?: number;
    open_drafts?: number;
    pending_invites?: number;
    active_units?: number;
  };
  activation?: {
    has_unit?: boolean;
    has_plan?: boolean;
    has_published_contract?: boolean;
    has_student?: boolean;
    has_subscription?: boolean;
    has_charge?: boolean;
    has_checkin?: boolean;
    has_payment?: boolean;
    has_billing?: boolean;
    plans_count?: number;
    students_count?: number;
    subscriptions_count?: number;
    contracts_count?: number;
    charges_count?: number;
    checkins_count?: number;
    payments_count?: number;
  };
  dashboard?: {
    pending_payments?: number;
    month_revenue?: number;
    overdue_students?: number;
    checkins_today?: number;
    new_students_month?: number;
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

interface CommandCenterApiResponse {
  summary?: {
    caseCount?: number;
  };
}

function fallbackData(): HomeData {
  return {
    academyName: 'Academia',
    setupCompleted: true,
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
    activation: {
      hasUnit: false,
      hasPlan: false,
      hasPublishedContract: false,
      hasStudent: false,
      hasSubscription: false,
      hasCharge: false,
      hasCheckin: false,
      hasPayment: false,
      hasBilling: false,
      hasCommandCenterCase: false,
      plansCount: 0,
      studentsCount: 0,
      subscriptionsCount: 0,
      contractsCount: 0,
      chargesCount: 0,
      checkinsCount: 0,
      paymentsCount: 0,
      commandCenterCaseCount: 0,
    },
    dashboard: {
      pendingPayments: 0,
      monthRevenue: 0,
      overdueStudents: 0,
      checkinsToday: 0,
      newStudentsMonth: 0,
    },
    accessPlaceholder: 'Sem dados de acesso ainda',
  };
}

async function getCommandCenterCaseCount(
  academyId: string | null | undefined,
  hasCharge: boolean,
): Promise<number> {
  if (!academyId || !hasCharge) {
    return 0;
  }

  try {
    const response = await fetch(
      `/api/financial/command-center?academyId=${encodeURIComponent(academyId)}`,
    );

    if (!response.ok) {
      return 0;
    }

    const data = (await response.json()) as CommandCenterApiResponse;
    return data.summary?.caseCount ?? 0;
  } catch {
    return 0;
  }
}

async function callOverviewRpc(): Promise<HomeOverviewRpc | null> {
  const token = await getBrowserAccessToken();

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

  const act = rpc.activation;
  const dash = rpc.dashboard;
  const paidPaymentsCount = act?.payments_count ?? 0;
  const pendingPaymentsCount = dash?.pending_payments ?? 0;
  const chargesCount = act?.charges_count ?? (pendingPaymentsCount + paidPaymentsCount);
  const hasCharge = typeof act?.has_charge === 'boolean' ? act.has_charge : chargesCount > 0;
  const subscriptionsCount = act?.subscriptions_count ?? (hasCharge ? 1 : 0);
  const hasSubscription = typeof act?.has_subscription === 'boolean'
    ? act.has_subscription
    : subscriptionsCount > 0;
  const commandCenterCaseCount = await getCommandCenterCaseCount(rpc.academy_id, hasCharge);
  const activation: ActivationChecklist = {
    hasUnit: act?.has_unit ?? false,
    hasPlan: act?.has_plan ?? false,
    hasPublishedContract: act?.has_published_contract ?? false,
    hasStudent: act?.has_student ?? false,
    hasSubscription,
    hasCharge,
    hasCheckin: act?.has_checkin ?? false,
    hasPayment: act?.has_payment ?? false,
    hasBilling: act?.has_billing ?? false,
    hasCommandCenterCase: commandCenterCaseCount > 0,
    plansCount: act?.plans_count ?? 0,
    studentsCount: act?.students_count ?? 0,
    subscriptionsCount,
    contractsCount: act?.contracts_count ?? 0,
    chargesCount,
    checkinsCount: act?.checkins_count ?? 0,
    paymentsCount: paidPaymentsCount,
    commandCenterCaseCount,
  };

  const dashboard: DashboardKpis = {
    pendingPayments: dash?.pending_payments ?? 0,
    monthRevenue: dash?.month_revenue ?? 0,
    overdueStudents: dash?.overdue_students ?? 0,
    checkinsToday: dash?.checkins_today ?? 0,
    newStudentsMonth: dash?.new_students_month ?? 0,
  };

  return {
    ...fallbackData(),
    academyName: rpc.academy_name || 'Academia',
    setupCompleted: rpc.setup_completed ?? true,
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
    activation,
    dashboard,
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
