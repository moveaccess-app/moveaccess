import type {
  CommandCenterAutomationStatus,
  CommandCenterCase,
  CommandCenterCaseDetail,
  CommandCenterNotificationSummary,
  CommandCenterResponse,
  CommandCenterSyncIncident,
  CommandCenterSyncIssue,
} from '@/lib/payments/commandCenter';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  runFinancialHealthCheck,
  type FinancialHealthCheckResult,
} from '@/server/asaas/financial-health-check';
import {
  findDueReminderCandidates,
  findEscalationCandidates,
  findOverdueCandidates,
  findPreBlockCandidates,
  findRegularizationCandidates,
} from '@/server/notifications/notification-queries';

const CASE_WINDOW_DAYS = 7;
const LOOKBACK_WINDOW_DAYS = 45;

type AutomationRowStatus =
  | 'pending'
  | 'executed'
  | 'resolved'
  | 'cancelled'
  | 'failed'
  | 'skipped';

interface FinancialChargeRow {
  id: string;
  academy_id: string;
  subscription_id: string;
  student_id: string;
  amount: number | string;
  currency: string;
  status: string;
  method: string;
  reference: string | null;
  due_date: string;
  paid_at: string | null;
  created_at: string;
  student_name: string | null;
  student_email: string | null;
  student_document: string | null;
  student_registration_id: string | null;
  student_status: string | null;
  plan_name: string | null;
  subscription_status: string | null;
  asaas_charge_id: string | null;
  asaas_payment_id: string | null;
  asaas_status: string | null;
  invoice_url: string | null;
  bank_slip_url: string | null;
  charge_origin: string;
  is_asaas_managed: boolean;
  is_recurring: boolean;
}

interface DelinquencyRow {
  student_id: string;
  academy_id: string;
  overdue_count: number;
  overdue_total: number | string;
  oldest_overdue_date: string;
  days_delinquent: number;
}

interface AutomationActionRow {
  id: string;
  academy_id: string;
  student_id: string;
  entity_type: 'payment' | 'student' | 'subscription';
  entity_id: string;
  trigger_type: string;
  stage: string;
  status: AutomationRowStatus;
  channel: string;
  resolved_at: string | null;
  resolved_reason: string | null;
  executed_at: string | null;
  error_message: string | null;
  created_at: string;
  payload: Record<string, unknown> | null;
}

interface NotificationLogRow {
  id: string;
  academy_id: string;
  type: string;
  channel: string;
  recipient_email: string | null;
  recipient_id: string | null;
  entity_type: 'payment' | 'student' | 'subscription' | 'invite';
  entity_id: string;
  status: string;
  provider_id: string | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface StudentUnitAssignmentRow {
  student_id: string;
  is_primary: boolean;
  units: { name: string | null } | Array<{ name: string | null }> | null;
}

interface AcademyRow {
  trade_name: string | null;
}

interface Recommendation {
  triggerType: string;
  stage: string;
  reason: string;
}

interface CandidateSets {
  dueReminderPaymentIds: Set<string>;
  overduePaymentIds: Set<string>;
  escalationPaymentIds: Set<string>;
  preBlockStudentIds: Set<string>;
  regularizedStudentIds: Set<string>;
}

interface CommandCenterContext {
  academyName: string | null;
  payments: FinancialChargeRow[];
  delinquencyByStudent: Map<string, DelinquencyRow>;
  unitByStudent: Map<string, string | null>;
  automationByPayment: Map<string, AutomationActionRow[]>;
  automationByStudent: Map<string, AutomationActionRow[]>;
  automationBySubscription: Map<string, AutomationActionRow[]>;
  notificationByPayment: Map<string, NotificationLogRow[]>;
  notificationByStudent: Map<string, NotificationLogRow[]>;
  notificationBySubscription: Map<string, NotificationLogRow[]>;
  health: FinancialHealthCheckResult;
  healthIssuesByPayment: Map<string, CommandCenterSyncIssue[]>;
  syncIncidents: CommandCenterSyncIncident[];
  candidateSets: CandidateSets;
  automationRows: AutomationActionRow[];
  notificationRows: NotificationLogRow[];
}

function toNumber(value: unknown): number {
  return Number(value || 0) || 0;
}

function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate).getTime();
  return Math.max(0, Math.floor((Date.now() - due) / (1000 * 60 * 60 * 24)));
}

function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate).getTime();
  return Math.max(0, Math.ceil((due - Date.now()) / (1000 * 60 * 60 * 24)));
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractUnitName(
  units: StudentUnitAssignmentRow['units'],
): string | null {
  if (Array.isArray(units)) {
    return units.find((unit) => unit?.name)?.name || null;
  }

  return units?.name || null;
}

function pushToMap<T>(map: Map<string, T[]>, key: string | null | undefined, value: T) {
  if (!key) return;
  const current = map.get(key) || [];
  current.push(value);
  map.set(key, current);
}

function sortByCreatedAtDesc<T extends { created_at: string }>(rows: T[]): T[] {
  return [...rows].sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
}

function normalizeNotificationSummary(
  row: NotificationLogRow,
): CommandCenterNotificationSummary {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    channel: row.channel,
    recipientEmail: row.recipient_email,
    createdAt: row.created_at,
  };
}

function buildCandidateSets(
  academyId: string,
  candidates: {
    dueReminderPaymentIds: string[];
    overduePaymentIds: string[];
    escalationPaymentIds: string[];
    preBlockStudentIds: string[];
    regularizedStudentIds: string[];
  },
): CandidateSets {
  return {
    dueReminderPaymentIds: new Set(candidates.dueReminderPaymentIds.filter(Boolean)),
    overduePaymentIds: new Set(candidates.overduePaymentIds.filter(Boolean)),
    escalationPaymentIds: new Set(candidates.escalationPaymentIds.filter(Boolean)),
    preBlockStudentIds: new Set(candidates.preBlockStudentIds.filter(Boolean)),
    regularizedStudentIds: new Set(candidates.regularizedStudentIds.filter(Boolean)),
  };
}

function getRecommendedAutomation(
  payment: FinancialChargeRow,
  delinquency: DelinquencyRow | null,
  candidateSets: CandidateSets,
): Recommendation | null {
  if (candidateSets.preBlockStudentIds.has(payment.student_id)) {
    return {
      triggerType: 'pre_block_warning',
      stage: 'pre_block',
      reason: delinquency
        ? `Aluno fora da tolerância com ${delinquency.days_delinquent} dia(s) de inadimplência.`
        : 'Aluno elegível para pré-bloqueio conforme a política da academia.',
    };
  }

  if (candidateSets.escalationPaymentIds.has(payment.id)) {
    return {
      triggerType: 'payment_escalation',
      stage: 'escalation',
      reason: `Cobrança com ${getDaysOverdue(payment.due_date)} dia(s) de atraso e elegível para escalada.`,
    };
  }

  if (candidateSets.overduePaymentIds.has(payment.id)) {
    return {
      triggerType: 'payment_overdue',
      stage: 'first_notice',
      reason: `Cobrança vencida e elegível para o primeiro aviso automático.`,
    };
  }

  if (candidateSets.dueReminderPaymentIds.has(payment.id)) {
    return {
      triggerType: 'payment_due_soon',
      stage: 'reminder',
      reason: 'Cobrança dentro da janela de lembrete automático antes do vencimento.',
    };
  }

  return null;
}

function summarizeAutomation(
  relatedActions: AutomationActionRow[],
  recommendation: Recommendation | null,
): CommandCenterCase['automation'] {
  const activeAction = relatedActions.find((action) =>
    ['pending', 'executed', 'failed'].includes(action.status),
  );
  const latestAction = activeAction || relatedActions[0] || null;

  if (activeAction) {
    return {
      source: 'action',
      status: activeAction.status,
      stage: activeAction.stage,
      triggerType: activeAction.trigger_type,
      createdAt: activeAction.created_at,
      executedAt: activeAction.executed_at,
      resolvedAt: activeAction.resolved_at,
      resolvedReason: activeAction.resolved_reason,
      errorMessage: activeAction.error_message,
      reason: isObjectRecord(activeAction.payload)
        ? typeof activeAction.payload.reason === 'string'
          ? activeAction.payload.reason
          : null
        : null,
    };
  }

  if (recommendation) {
    return {
      source: 'recommended',
      status: 'recommended',
      stage: recommendation.stage,
      triggerType: recommendation.triggerType,
      createdAt: null,
      executedAt: null,
      resolvedAt: null,
      resolvedReason: null,
      errorMessage: null,
      reason: recommendation.reason,
    };
  }

  if (latestAction) {
    return {
      source: 'action',
      status: latestAction.status,
      stage: latestAction.stage,
      triggerType: latestAction.trigger_type,
      createdAt: latestAction.created_at,
      executedAt: latestAction.executed_at,
      resolvedAt: latestAction.resolved_at,
      resolvedReason: latestAction.resolved_reason,
      errorMessage: latestAction.error_message,
      reason: isObjectRecord(latestAction.payload)
        ? typeof latestAction.payload.reason === 'string'
          ? latestAction.payload.reason
          : null
        : null,
    };
  }

  return {
    source: 'none',
    status: 'none',
    stage: null,
    triggerType: null,
    createdAt: null,
    executedAt: null,
    resolvedAt: null,
    resolvedReason: null,
    errorMessage: null,
    reason: null,
  };
}

function getQueueStatus(input: {
  payment: FinancialChargeRow;
  automation: CommandCenterCase['automation'];
  syncIssues: CommandCenterSyncIssue[];
  daysOverdue: number;
  daysUntilDue: number;
}): CommandCenterCase['queueStatus'] {
  const { payment, automation, syncIssues, daysOverdue, daysUntilDue } = input;

  if (payment.status === 'failed') {
    return 'failed';
  }

  if (automation.stage === 'pre_block') {
    return 'pre_block';
  }

  if (automation.stage === 'escalation') {
    return 'escalated';
  }

  if (daysOverdue > 0) {
    return 'overdue';
  }

  if (syncIssues.length > 0 && daysUntilDue > CASE_WINDOW_DAYS) {
    return 'sync_issue';
  }

  return 'due_soon';
}

function getPriority(input: {
  queueStatus: CommandCenterCase['queueStatus'];
  syncIssues: CommandCenterSyncIssue[];
  daysOverdue: number;
  automationStatus: CommandCenterAutomationStatus;
}): number {
  const { queueStatus, syncIssues, daysOverdue, automationStatus } = input;
  let priority = 0;

  switch (queueStatus) {
    case 'pre_block':
      priority += 120;
      break;
    case 'escalated':
      priority += 100;
      break;
    case 'failed':
      priority += 95;
      break;
    case 'overdue':
      priority += 70;
      break;
    case 'sync_issue':
      priority += 55;
      break;
    case 'due_soon':
      priority += 25;
      break;
    default:
      break;
  }

  priority += Math.min(daysOverdue, 60);

  if (automationStatus === 'failed') {
    priority += 25;
  }

  if (automationStatus === 'pending') {
    priority += 10;
  }

  priority += syncIssues.length * 8;

  return priority;
}

function shouldIncludeCase(input: {
  payment: FinancialChargeRow;
  automation: CommandCenterCase['automation'];
  syncIssues: CommandCenterSyncIssue[];
  daysOverdue: number;
  daysUntilDue: number;
}): boolean {
  const { payment, automation, syncIssues, daysOverdue, daysUntilDue } = input;

  return (
    payment.status === 'failed'
    || daysOverdue > 0
    || daysUntilDue <= CASE_WINDOW_DAYS
    || automation.source !== 'none'
    || syncIssues.length > 0
  );
}

function buildHealthMaps(
  health: FinancialHealthCheckResult,
  payments: FinancialChargeRow[],
): {
  healthIssuesByPayment: Map<string, CommandCenterSyncIssue[]>;
  syncIncidents: CommandCenterSyncIncident[];
} {
  const issuesByPayment = new Map<string, CommandCenterSyncIssue[]>();
  const paymentIdByAsaasPaymentId = new Map<string, string>();
  const studentNameByPaymentId = new Map<string, string>();

  payments.forEach((payment) => {
    if (payment.asaas_payment_id) {
      paymentIdByAsaasPaymentId.set(payment.asaas_payment_id, payment.id);
    }

    studentNameByPaymentId.set(payment.id, payment.student_name || 'Aluno sem nome');
  });

  const addIssue = (paymentId: string | null | undefined, issue: CommandCenterSyncIssue) => {
    if (!paymentId) return;
    const current = issuesByPayment.get(paymentId) || [];
    current.push(issue);
    issuesByPayment.set(paymentId, current);
  };

  health.staleCharges.forEach((charge) => {
    addIssue(charge.paymentId, {
      type: 'stale_charge',
      severity: 'warning',
      description: `Cobrança sem sincronizar há ${charge.daysSinceSync} dia(s).`,
      paymentId: charge.paymentId,
      chargeId: charge.chargeId,
      asaasPaymentId: charge.asaasPaymentId,
      createdAt: charge.lastSyncedAt,
    });
  });

  health.statusMismatches.forEach((mismatch) => {
    addIssue(mismatch.paymentId, {
      type: 'status_mismatch',
      severity: 'destructive',
      description: `Local ${mismatch.localPaymentStatus} x Asaas ${mismatch.asaasStatus}.`,
      paymentId: mismatch.paymentId,
      chargeId: mismatch.chargeId,
      asaasPaymentId: mismatch.asaasPaymentId,
      createdAt: mismatch.dueDate,
    });
  });

  health.pendingTooLong.forEach((payment) => {
    addIssue(payment.paymentId, {
      type: 'pending_too_long',
      severity: 'warning',
      description: `Cobrança pendente há ${payment.daysOverdue} dia(s).`,
      paymentId: payment.paymentId,
      chargeId: payment.asaasChargeId,
      createdAt: payment.dueDate,
    });
  });

  const syncIncidents: CommandCenterSyncIncident[] = [];

  health.failedEvents.forEach((event) => {
    const relatedPaymentId = event.asaasPaymentId
      ? paymentIdByAsaasPaymentId.get(event.asaasPaymentId) || null
      : null;

    addIssue(relatedPaymentId, {
      type: 'failed_event',
      severity: 'destructive',
      description: event.errorMessage || `Evento ${event.eventType} falhou ao processar.`,
      paymentId: relatedPaymentId,
      eventId: event.eventId,
      asaasPaymentId: event.asaasPaymentId,
      createdAt: event.receivedAt,
    });

    syncIncidents.push({
      eventId: event.eventId,
      eventType: event.eventType,
      status: 'failed',
      errorMessage: event.errorMessage,
      asaasPaymentId: event.asaasPaymentId,
      receivedAt: event.receivedAt,
      lastAttemptAt: event.lastAttemptAt,
      relatedPaymentId,
      relatedStudentName: relatedPaymentId
        ? studentNameByPaymentId.get(relatedPaymentId) || null
        : null,
    });
  });

  health.orphanEvents.forEach((event) => {
    const relatedPaymentId = event.asaasPaymentId
      ? paymentIdByAsaasPaymentId.get(event.asaasPaymentId) || null
      : null;

    addIssue(relatedPaymentId, {
      type: 'orphan_event',
      severity: 'warning',
      description: event.errorMessage || `Evento ${event.eventType} chegou sem vínculo local.`,
      paymentId: relatedPaymentId,
      eventId: event.eventId,
      asaasPaymentId: event.asaasPaymentId,
      createdAt: event.receivedAt,
    });

    syncIncidents.push({
      eventId: event.eventId,
      eventType: event.eventType,
      status: 'orphan',
      errorMessage: event.errorMessage,
      asaasPaymentId: event.asaasPaymentId,
      receivedAt: event.receivedAt,
      lastAttemptAt: null,
      relatedPaymentId,
      relatedStudentName: relatedPaymentId
        ? studentNameByPaymentId.get(relatedPaymentId) || null
        : null,
    });
  });

  return {
    healthIssuesByPayment: issuesByPayment,
    syncIncidents: syncIncidents.sort(
      (left, right) =>
        new Date(right.receivedAt).getTime() - new Date(left.receivedAt).getTime(),
    ),
  };
}

function buildCase(
  payment: FinancialChargeRow,
  context: CommandCenterContext,
): CommandCenterCase | null {
  const delinquency = context.delinquencyByStudent.get(payment.student_id) || null;
  const recommendation = getRecommendedAutomation(payment, delinquency, context.candidateSets);

  const relatedActions = sortByCreatedAtDesc([
    ...(context.automationByPayment.get(payment.id) || []),
    ...(context.automationByStudent.get(payment.student_id) || []),
    ...(context.automationBySubscription.get(payment.subscription_id) || []),
  ]);

  const relatedNotifications = sortByCreatedAtDesc([
    ...(context.notificationByPayment.get(payment.id) || []),
    ...(context.notificationByStudent.get(payment.student_id) || []),
    ...(context.notificationBySubscription.get(payment.subscription_id) || []),
  ]);

  const automation = summarizeAutomation(relatedActions, recommendation);
  const syncIssues = context.healthIssuesByPayment.get(payment.id) || [];
  const daysOverdue = getDaysOverdue(payment.due_date);
  const daysUntilDue = getDaysUntilDue(payment.due_date);

  if (!shouldIncludeCase({
    payment,
    automation,
    syncIssues,
    daysOverdue,
    daysUntilDue,
  })) {
    return null;
  }

  const queueStatus = getQueueStatus({
    payment,
    automation,
    syncIssues,
    daysOverdue,
    daysUntilDue,
  });

  return {
    paymentId: payment.id,
    academyId: payment.academy_id,
    academyName: context.academyName,
    studentId: payment.student_id,
    studentName: payment.student_name || 'Aluno sem nome',
    studentEmail: payment.student_email,
    studentDocument: payment.student_document,
    studentRegistrationId: payment.student_registration_id,
    studentStatus: payment.student_status,
    unitName: context.unitByStudent.get(payment.student_id) || null,
    subscriptionId: payment.subscription_id,
    subscriptionStatus: payment.subscription_status,
    planName: payment.plan_name,
    amount: toNumber(payment.amount),
    currency: payment.currency,
    paymentStatus: payment.status as CommandCenterCase['paymentStatus'],
    method: payment.method,
    reference: payment.reference,
    dueDate: payment.due_date,
    paidAt: payment.paid_at,
    chargeOrigin: payment.charge_origin,
    isAsaasManaged: payment.is_asaas_managed,
    isRecurring: payment.is_recurring,
    asaasChargeId: payment.asaas_charge_id,
    asaasPaymentId: payment.asaas_payment_id,
    asaasStatus: payment.asaas_status,
    invoiceUrl: payment.invoice_url,
    bankSlipUrl: payment.bank_slip_url,
    totalOverdue: delinquency ? toNumber(delinquency.overdue_total) : daysOverdue > 0 ? toNumber(payment.amount) : 0,
    overdueCount: delinquency?.overdue_count || (daysOverdue > 0 ? 1 : 0),
    daysOverdue,
    daysUntilDue,
    queueStatus,
    priority: getPriority({
      queueStatus,
      syncIssues,
      daysOverdue,
      automationStatus: automation.status,
    }),
    automation,
    lastNotification: relatedNotifications[0]
      ? normalizeNotificationSummary(relatedNotifications[0])
      : null,
    syncIssues,
  };
}

async function loadContext(
  academyId: string,
  options?: { paymentIds?: string[] },
): Promise<CommandCenterContext> {
  const staffSupabase = await createServerSupabaseClient();
  const adminSupabase = createAdminSupabaseClient();
  const lookbackDate = new Date(Date.now() - LOOKBACK_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    .toISOString();

  const paymentsQuery = staffSupabase
    .from('financial_charges_view')
    .select(
      'id, academy_id, subscription_id, student_id, amount, currency, status, method, reference, due_date, paid_at, created_at, student_name, student_email, student_document, student_registration_id, student_status, plan_name, subscription_status, asaas_charge_id, asaas_payment_id, asaas_status, invoice_url, bank_slip_url, charge_origin, is_asaas_managed, is_recurring',
    )
    .eq('academy_id', academyId)
    .order('due_date', { ascending: true });

  const paymentsRequest = options?.paymentIds?.length
    ? paymentsQuery.in('id', options.paymentIds)
    : paymentsQuery.in('status', ['pending', 'failed', 'paid']);

  const [
    paymentsResult,
    delinquencyResult,
    automationResult,
    notificationResult,
    academyResult,
    dueReminderCandidates,
    overdueCandidates,
    escalationCandidates,
    preBlockCandidates,
    regularizationCandidates,
    health,
  ] = await Promise.all([
    paymentsRequest,
    staffSupabase
      .from('student_delinquency_view')
      .select('student_id, academy_id, overdue_count, overdue_total, oldest_overdue_date, days_delinquent')
      .eq('academy_id', academyId),
    adminSupabase
      .from('automation_actions')
      .select('id, academy_id, student_id, entity_type, entity_id, trigger_type, stage, status, channel, resolved_at, resolved_reason, executed_at, error_message, created_at, payload')
      .eq('academy_id', academyId)
      .gte('created_at', lookbackDate)
      .order('created_at', { ascending: false }),
    adminSupabase
      .from('notification_logs')
      .select('id, academy_id, type, channel, recipient_email, recipient_id, entity_type, entity_id, status, provider_id, error, metadata, created_at')
      .eq('academy_id', academyId)
      .gte('created_at', lookbackDate)
      .order('created_at', { ascending: false }),
    adminSupabase
      .from('academies')
      .select('trade_name')
      .eq('id', academyId)
      .maybeSingle(),
    findDueReminderCandidates(adminSupabase),
    findOverdueCandidates(adminSupabase),
    findEscalationCandidates(adminSupabase),
    findPreBlockCandidates(adminSupabase),
    findRegularizationCandidates(adminSupabase),
    runFinancialHealthCheck(academyId),
  ]);

  if (paymentsResult.error) {
    throw new Error(`Erro ao carregar cobranças do command center: ${paymentsResult.error.message}`);
  }

  if (delinquencyResult.error) {
    throw new Error(`Erro ao carregar inadimplência: ${delinquencyResult.error.message}`);
  }

  if (automationResult.error) {
    throw new Error(`Erro ao carregar automações: ${automationResult.error.message}`);
  }

  if (notificationResult.error) {
    throw new Error(`Erro ao carregar notificações: ${notificationResult.error.message}`);
  }

  if (academyResult.error) {
    throw new Error(`Erro ao carregar academia: ${academyResult.error.message}`);
  }

  if (health.error) {
    throw new Error(health.error);
  }

  const payments = (paymentsResult.data || []) as FinancialChargeRow[];
  const studentIds = [...new Set(payments.map((payment) => payment.student_id))];

  const unitAssignmentsResult = studentIds.length > 0
    ? await adminSupabase
        .from('student_unit_assignments')
        .select('student_id, is_primary, units(name)')
        .in('student_id', studentIds)
        .order('is_primary', { ascending: false })
    : { data: [], error: null };

  if (unitAssignmentsResult.error) {
    throw new Error(`Erro ao carregar unidades do aluno: ${unitAssignmentsResult.error.message}`);
  }

  const delinquencyByStudent = new Map<string, DelinquencyRow>();
  ((delinquencyResult.data || []) as DelinquencyRow[]).forEach((row) => {
    delinquencyByStudent.set(row.student_id, row);
  });

  const unitByStudent = new Map<string, string | null>();
  ((unitAssignmentsResult.data || []) as StudentUnitAssignmentRow[]).forEach((row) => {
    if (!unitByStudent.has(row.student_id)) {
      unitByStudent.set(row.student_id, extractUnitName(row.units));
    }
  });

  const automationByPayment = new Map<string, AutomationActionRow[]>();
  const automationByStudent = new Map<string, AutomationActionRow[]>();
  const automationBySubscription = new Map<string, AutomationActionRow[]>();
  const automationRows = (automationResult.data || []) as AutomationActionRow[];

  automationRows.forEach((row) => {
    if (row.entity_type === 'payment') {
      pushToMap(automationByPayment, row.entity_id, row);
    }

    if (row.entity_type === 'student') {
      pushToMap(automationByStudent, row.entity_id, row);
    }

    if (row.entity_type === 'subscription') {
      pushToMap(automationBySubscription, row.entity_id, row);
    }
  });

  const notificationByPayment = new Map<string, NotificationLogRow[]>();
  const notificationByStudent = new Map<string, NotificationLogRow[]>();
  const notificationBySubscription = new Map<string, NotificationLogRow[]>();
  const notificationRows = (notificationResult.data || []) as NotificationLogRow[];

  notificationRows.forEach((row) => {
    if (row.entity_type === 'payment') {
      pushToMap(notificationByPayment, row.entity_id, row);
    }

    if (row.entity_type === 'student') {
      pushToMap(notificationByStudent, row.entity_id, row);
    }

    if (row.entity_type === 'subscription') {
      pushToMap(notificationBySubscription, row.entity_id, row);
    }
  });

  const candidateSets = buildCandidateSets(academyId, {
    dueReminderPaymentIds: dueReminderCandidates
      .filter((candidate) => candidate.academyId === academyId)
      .map((candidate) => candidate.paymentId),
    overduePaymentIds: overdueCandidates
      .filter((candidate) => candidate.academyId === academyId)
      .map((candidate) => candidate.paymentId),
    escalationPaymentIds: escalationCandidates
      .filter((candidate) => candidate.academyId === academyId)
      .map((candidate) => candidate.paymentId),
    preBlockStudentIds: preBlockCandidates
      .filter((candidate) => candidate.academyId === academyId)
      .map((candidate) => candidate.studentId),
    regularizedStudentIds: regularizationCandidates
      .filter((candidate) => candidate.academyId === academyId)
      .map((candidate) => candidate.studentId),
  });

  const { healthIssuesByPayment, syncIncidents } = buildHealthMaps(health, payments);

  return {
    academyName: ((academyResult.data as AcademyRow | null)?.trade_name) || null,
    payments,
    delinquencyByStudent,
    unitByStudent,
    automationByPayment,
    automationByStudent,
    automationBySubscription,
    notificationByPayment,
    notificationByStudent,
    notificationBySubscription,
    health,
    healthIssuesByPayment,
    syncIncidents,
    candidateSets,
    automationRows,
    notificationRows,
  };
}

export async function getFinancialCommandCenterData(
  academyId: string,
): Promise<CommandCenterResponse> {
  const context = await loadContext(academyId);

  const cases = context.payments
    .map((payment) => buildCase(payment, context))
    .filter((payment): payment is CommandCenterCase => Boolean(payment))
    .filter((payment) => payment.paymentStatus !== 'paid')
    .sort((left, right) => {
      if (right.priority !== left.priority) {
        return right.priority - left.priority;
      }

      return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
    });

  const delinquentStudentsCount = context.delinquencyByStudent.size;

  const automationPendingCases = new Set<string>();
  const automationExecutedCases = new Set<string>();
  const automationFailedCases = new Set<string>();
  const regularizedStudents = new Set<string>(context.candidateSets.regularizedStudentIds);

  context.automationRows.forEach((row) => {
    const caseKey = `${row.entity_type}:${row.entity_id}`;

    if (row.status === 'pending') {
      automationPendingCases.add(caseKey);
    }

    if (row.status === 'executed') {
      automationExecutedCases.add(caseKey);
    }

    if (row.status === 'failed') {
      automationFailedCases.add(caseKey);
    }

    if (
      row.trigger_type === 'regularization'
      || row.resolved_reason === 'payment_received'
      || row.resolved_reason === 'student_regularized'
    ) {
      regularizedStudents.add(row.student_id);
    }
  });

  return {
    summary: {
      caseCount: cases.length,
      delinquentStudentsCount,
      automationPendingCount: automationPendingCases.size,
      automationExecutedCount: automationExecutedCases.size,
      automationFailedCount: automationFailedCases.size,
      regularizedCount: regularizedStudents.size,
      syncIssueCount: context.health.issueCount,
      checkedAt: context.health.stats.checkedAt,
    },
    cases,
    syncIncidents: context.syncIncidents,
  };
}

export async function getFinancialCommandCenterCaseDetail(
  academyId: string,
  paymentId: string,
): Promise<CommandCenterCaseDetail> {
  const context = await loadContext(academyId, { paymentIds: [paymentId] });
  const payment = context.payments.find((item) => item.id === paymentId);

  if (!payment) {
    throw new Error('Cobrança não encontrada no command center.');
  }

  const caseItem = buildCase(payment, context);

  if (!caseItem) {
    throw new Error('Cobrança fora do escopo operacional do command center.');
  }

  const studentDelinquency = context.delinquencyByStudent.get(payment.student_id) || null;
  const recommendation = getRecommendedAutomation(
    payment,
    studentDelinquency,
    context.candidateSets,
  );

  const automationTimeline = sortByCreatedAtDesc([
    ...(context.automationByPayment.get(payment.id) || []),
    ...(context.automationByStudent.get(payment.student_id) || []),
    ...(context.automationBySubscription.get(payment.subscription_id) || []),
  ]).map((row) => ({
    id: row.id,
    triggerType: row.trigger_type,
    stage: row.stage,
    status: row.status,
    channel: row.channel,
    createdAt: row.created_at,
    executedAt: row.executed_at,
    resolvedAt: row.resolved_at,
    resolvedReason: row.resolved_reason,
    errorMessage: row.error_message,
    payload: row.payload,
  }));

  const notificationTimeline = sortByCreatedAtDesc([
    ...(context.notificationByPayment.get(payment.id) || []),
    ...(context.notificationByStudent.get(payment.student_id) || []),
    ...(context.notificationBySubscription.get(payment.subscription_id) || []),
  ]).map((row) => ({
    id: row.id,
    type: row.type,
    status: row.status,
    channel: row.channel,
    recipientEmail: row.recipient_email,
    providerId: row.provider_id,
    error: row.error,
    createdAt: row.created_at,
    metadata: row.metadata,
  }));

  const syncIncidents = context.syncIncidents.filter(
    (incident) => incident.relatedPaymentId === payment.id,
  );

  return {
    case: caseItem,
    studentDelinquency: studentDelinquency
      ? {
          overdueCount: studentDelinquency.overdue_count,
          overdueTotal: toNumber(studentDelinquency.overdue_total),
          daysDelinquent: studentDelinquency.days_delinquent,
          oldestOverdueDate: studentDelinquency.oldest_overdue_date,
        }
      : null,
    recommendedAutomation: recommendation,
    automationTimeline,
    notificationTimeline,
    syncIssues: context.healthIssuesByPayment.get(payment.id) || [],
    syncIncidents,
  };
}