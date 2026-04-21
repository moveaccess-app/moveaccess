export type CommandCenterBadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning';

export type CommandCenterQueueStatus =
  | 'due_soon'
  | 'overdue'
  | 'escalated'
  | 'pre_block'
  | 'failed'
  | 'resolved'
  | 'sync_issue';

export type CommandCenterAutomationSource = 'action' | 'recommended' | 'none';

export type CommandCenterAutomationStatus =
  | 'pending'
  | 'executed'
  | 'resolved'
  | 'cancelled'
  | 'failed'
  | 'skipped'
  | 'recommended'
  | 'none';

export interface CommandCenterSummary {
  caseCount: number;
  delinquentStudentsCount: number;
  automationPendingCount: number;
  automationExecutedCount: number;
  automationFailedCount: number;
  regularizedCount: number;
  syncIssueCount: number;
  checkedAt: string | null;
}

export interface CommandCenterSyncIssue {
  type:
    | 'stale_charge'
    | 'status_mismatch'
    | 'failed_event'
    | 'orphan_event'
    | 'pending_too_long';
  severity: 'warning' | 'destructive';
  description: string;
  paymentId?: string | null;
  chargeId?: string | null;
  eventId?: string | null;
  asaasPaymentId?: string | null;
  createdAt?: string | null;
}

export interface CommandCenterNotificationSummary {
  id: string;
  type: string;
  status: string;
  channel: string;
  recipientEmail: string | null;
  createdAt: string;
}

export interface CommandCenterAutomationSummary {
  source: CommandCenterAutomationSource;
  status: CommandCenterAutomationStatus;
  stage: string | null;
  triggerType: string | null;
  createdAt: string | null;
  executedAt: string | null;
  resolvedAt: string | null;
  resolvedReason: string | null;
  errorMessage: string | null;
  reason: string | null;
}

export interface CommandCenterCase {
  paymentId: string;
  academyId: string;
  academyName: string | null;
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  studentDocument: string | null;
  studentRegistrationId: string | null;
  studentStatus: string | null;
  unitName: string | null;
  subscriptionId: string;
  subscriptionStatus: string | null;
  planName: string | null;
  amount: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  method: string;
  reference: string | null;
  dueDate: string;
  paidAt: string | null;
  chargeOrigin: string;
  isAsaasManaged: boolean;
  isRecurring: boolean;
  asaasChargeId: string | null;
  asaasPaymentId: string | null;
  asaasStatus: string | null;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  totalOverdue: number;
  overdueCount: number;
  daysOverdue: number;
  daysUntilDue: number;
  queueStatus: CommandCenterQueueStatus;
  priority: number;
  automation: CommandCenterAutomationSummary;
  lastNotification: CommandCenterNotificationSummary | null;
  syncIssues: CommandCenterSyncIssue[];
}

export interface CommandCenterSyncIncident {
  eventId: string;
  eventType: string;
  status: 'failed' | 'orphan';
  errorMessage: string | null;
  asaasPaymentId: string | null;
  receivedAt: string;
  lastAttemptAt: string | null;
  relatedPaymentId: string | null;
  relatedStudentName: string | null;
}

export interface CommandCenterResponse {
  summary: CommandCenterSummary;
  cases: CommandCenterCase[];
  syncIncidents: CommandCenterSyncIncident[];
}

export interface CommandCenterTimelineAutomation {
  id: string;
  triggerType: string;
  stage: string;
  status: CommandCenterAutomationStatus;
  channel: string;
  createdAt: string;
  executedAt: string | null;
  resolvedAt: string | null;
  resolvedReason: string | null;
  errorMessage: string | null;
  payload: Record<string, unknown> | null;
}

export interface CommandCenterTimelineNotification {
  id: string;
  type: string;
  status: string;
  channel: string;
  recipientEmail: string | null;
  providerId: string | null;
  error: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export interface CommandCenterCaseDetail {
  case: CommandCenterCase;
  studentDelinquency: {
    overdueCount: number;
    overdueTotal: number;
    daysDelinquent: number;
    oldestOverdueDate: string | null;
  } | null;
  recommendedAutomation: {
    triggerType: string;
    stage: string;
    reason: string;
  } | null;
  automationTimeline: CommandCenterTimelineAutomation[];
  notificationTimeline: CommandCenterTimelineNotification[];
  syncIssues: CommandCenterSyncIssue[];
  syncIncidents: CommandCenterSyncIncident[];
}

const QUEUE_LABELS: Record<CommandCenterQueueStatus, string> = {
  due_soon: 'A vencer',
  overdue: 'Em atraso',
  escalated: 'Escalada',
  pre_block: 'Pré-bloqueio',
  failed: 'Falha local',
  resolved: 'Regularizado',
  sync_issue: 'Sync issue',
};

const QUEUE_VARIANTS: Record<CommandCenterQueueStatus, CommandCenterBadgeVariant> = {
  due_soon: 'warning',
  overdue: 'destructive',
  escalated: 'destructive',
  pre_block: 'destructive',
  failed: 'destructive',
  resolved: 'success',
  sync_issue: 'warning',
};

const AUTOMATION_STAGE_LABELS: Record<string, string> = {
  reminder: 'Lembrete',
  first_notice: '1o aviso',
  escalation: 'Escalada',
  pre_block: 'Pré-bloqueio',
  resolved: 'Regularização',
  reactivation: 'Reativação',
  confirmation: 'Confirmação',
};

const AUTOMATION_STATUS_LABELS: Record<CommandCenterAutomationStatus, string> = {
  pending: 'Pendente',
  executed: 'Executada',
  resolved: 'Resolvida',
  cancelled: 'Cancelada',
  failed: 'Falhou',
  skipped: 'Ignorada',
  recommended: 'Sugerida',
  none: 'Sem automação',
};

const AUTOMATION_STATUS_VARIANTS: Record<CommandCenterAutomationStatus, CommandCenterBadgeVariant> = {
  pending: 'warning',
  executed: 'default',
  resolved: 'success',
  cancelled: 'secondary',
  failed: 'destructive',
  skipped: 'secondary',
  recommended: 'outline',
  none: 'secondary',
};

const AUTOMATION_TRIGGER_LABELS: Record<string, string> = {
  payment_due_soon: 'Cobrança a vencer',
  payment_overdue: 'Cobrança vencida',
  payment_escalation: 'Escalada de cobrança',
  pre_block_warning: 'Pré-bloqueio',
  subscription_expiring: 'Assinatura expirada',
  regularization: 'Regularização',
  reactivation: 'Reativação',
  payment_confirmed: 'Pagamento confirmado',
};

const SYNC_ISSUE_LABELS: Record<CommandCenterSyncIssue['type'], string> = {
  stale_charge: 'Cobrança desatualizada',
  status_mismatch: 'Status divergente',
  failed_event: 'Webhook falhou',
  orphan_event: 'Webhook órfão',
  pending_too_long: 'Pendente há muito tempo',
};

export function getCommandCenterQueueLabel(status: CommandCenterQueueStatus): string {
  return QUEUE_LABELS[status] || status;
}

export function getCommandCenterQueueVariant(
  status: CommandCenterQueueStatus,
): CommandCenterBadgeVariant {
  return QUEUE_VARIANTS[status] || 'secondary';
}

export function getAutomationStageLabel(stage: string | null): string {
  if (!stage) return 'Sem stage';
  return AUTOMATION_STAGE_LABELS[stage] || stage;
}

export function getAutomationStatusLabel(
  status: CommandCenterAutomationStatus,
): string {
  return AUTOMATION_STATUS_LABELS[status] || status;
}

export function getAutomationStatusVariant(
  status: CommandCenterAutomationStatus,
): CommandCenterBadgeVariant {
  return AUTOMATION_STATUS_VARIANTS[status] || 'secondary';
}

export function getAutomationTriggerLabel(triggerType: string | null): string {
  if (!triggerType) return 'Sem trigger';
  return AUTOMATION_TRIGGER_LABELS[triggerType] || triggerType;
}

export function getSyncIssueLabel(type: CommandCenterSyncIssue['type']): string {
  return SYNC_ISSUE_LABELS[type] || type;
}

export function getSyncIssueVariant(
  severity: CommandCenterSyncIssue['severity'],
): CommandCenterBadgeVariant {
  return severity === 'destructive' ? 'destructive' : 'warning';
}