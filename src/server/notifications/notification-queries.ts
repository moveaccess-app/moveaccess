// Server-side queries for notification dispatch.
//
// These candidate finders are academy-policy-aware and intentionally
// use the same runtime path for dispatch + command center. This keeps
// operational recommendations aligned with the academy's effective
// billing policy instead of relying on fixed global windows.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  dueReminderKey,
  escalationKey,
  overdueNoticeKey,
  preBlockKey,
  reactivationKey,
  subscriptionExpiringKey,
} from './notification-service';
import {
  loadAcademyRuntimePolicies,
  type AcademyRuntimePolicy,
} from './policy-runtime';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PAYMENT_LOOKBACK_DAYS = 365;
const REACTIVATION_LOOKBACK_DAYS = 365;

interface PaymentRow {
  id: string;
  academy_id: string;
  subscription_id: string;
  student_id: string;
  amount: number | string;
  due_date: string;
}

interface PaymentNotificationRow {
  paymentId: string;
  academyId: string;
  subscriptionId: string;
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  planName: string;
  amount: number;
  dueDate: string;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
}

interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
}

interface SubscriptionPlanRow {
  id: string;
  plan_id: string;
}

interface PlanRow {
  id: string;
  name: string | null;
}

interface AsaasChargeRow {
  payment_id: string;
  invoice_url: string | null;
  bank_slip_url: string | null;
}

interface ReactivationSubscriptionRow {
  id: string;
  academy_id: string;
  student_id: string;
  plan_id: string;
  status: string;
  cancelled_at: string | null;
  updated_at: string;
}

interface ActiveSubscriptionRow {
  academy_id: string;
  student_id: string;
}

interface SubscriptionExpiringRow {
  id: string;
  academy_id: string;
  student_id: string;
  plan_id: string;
  price: number | string;
  expires_at: string;
}

interface PaidPaymentRow {
  academy_id: string;
  student_id: string;
  amount: number | string;
  paid_at: string;
}

interface OverdueStudentAggregate {
  academyId: string;
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  totalOverdue: number;
  oldestDueDate: string;
  overdueCount: number;
  daysDelinquent: number;
}

// ─── Shared types ────────────────────────────────────────────

export interface DueReminderCandidate {
  paymentId: string;
  studentId: string;
  academyId: string;
  studentName: string;
  studentEmail: string;
  planName: string;
  amount: number;
  dueDate: string;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  academyName: string;
}

export interface OverdueCandidate {
  paymentId: string;
  studentId: string;
  academyId: string;
  studentName: string;
  studentEmail: string;
  planName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  academyName: string;
}

export interface PreBlockCandidate {
  studentId: string;
  academyId: string;
  studentName: string;
  studentEmail: string;
  academyName: string;
  totalOverdue: number;
  oldestDueDate: string;
  graceDays: number;
}

export interface EscalationCandidate {
  paymentId: string;
  studentId: string;
  academyId: string;
  studentName: string;
  studentEmail: string;
  planName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  academyName: string;
  totalOverdue: number;
  overdueCount: number;
}

export interface SubscriptionExpiringCandidate {
  subscriptionId: string;
  studentId: string;
  academyId: string;
  studentName: string;
  studentEmail: string;
  planName: string;
  price: number;
  expiresAt: string;
  daysRemaining: number;
  academyName: string;
}

export interface ReactivationCandidate {
  studentId: string;
  academyId: string;
  studentName: string;
  studentEmail: string;
  planName: string;
  lastSubscriptionStatus: string;
  cancelledOrExpiredAt: string;
  daysSinceLoss: number;
  lastPaidAmount: number | null;
  academyName: string;
}

export interface RegularizationCandidate {
  studentId: string;
  academyId: string;
  studentName: string;
  studentEmail: string;
  academyName: string;
  pendingActionCount: number;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function chunk<T>(values: T[], size = 200): T[][] {
  const groups: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    groups.push(values.slice(index, index + size));
  }

  return groups;
}

function toNumber(value: unknown): number {
  return Number(value || 0) || 0;
}

function startOfUtcDay(base = new Date()): Date {
  return new Date(Date.UTC(
    base.getUTCFullYear(),
    base.getUTCMonth(),
    base.getUTCDate(),
  ));
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * MS_PER_DAY);
}

function diffCalendarDays(dateValue: string, base = new Date()): number {
  const target = new Date(dateValue);
  const targetUtc = Date.UTC(
    target.getUTCFullYear(),
    target.getUTCMonth(),
    target.getUTCDate(),
  );
  const baseUtc = Date.UTC(
    base.getUTCFullYear(),
    base.getUTCMonth(),
    base.getUTCDate(),
  );

  return Math.round((targetUtc - baseUtc) / MS_PER_DAY);
}

function getDaysUntil(dateValue: string): number {
  return Math.max(0, diffCalendarDays(dateValue));
}

function getDaysOverdue(dateValue: string): number {
  return Math.max(0, -diffCalendarDays(dateValue));
}

function studentKey(academyId: string, studentId: string): string {
  return `${academyId}:${studentId}`;
}

function hasEmail(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function academyNameFor(policy: AcademyRuntimePolicy | undefined): string {
  return policy?.academyName || 'Academia';
}

async function loadNotificationIdempotencySet(
  supabase: SupabaseClient,
  keys: string[],
): Promise<Set<string>> {
  const normalized = unique(keys.filter(Boolean));
  const sent = new Set<string>();

  for (const group of chunk(normalized, 200)) {
    const { data, error } = await supabase
      .from('notification_logs')
      .select('idempotency_key')
      .in('idempotency_key', group)
      .eq('status', 'sent');

    if (error) {
      console.error('[notifications] loadNotificationIdempotencySet error:', error.message);
      continue;
    }

    ((data || []) as Array<{ idempotency_key: string }>).forEach((row) => {
      sent.add(row.idempotency_key);
    });
  }

  return sent;
}

async function loadProfileMap(
  supabase: SupabaseClient,
  profileIds: string[],
): Promise<Map<string, ProfileRow>> {
  const map = new Map<string, ProfileRow>();
  const ids = unique(profileIds);

  for (const group of chunk(ids, 200)) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', group);

    if (error) {
      console.error('[notifications] loadProfileMap error:', error.message);
      continue;
    }

    ((data || []) as ProfileRow[]).forEach((row) => {
      map.set(row.id, row);
    });
  }

  return map;
}

async function loadPlanMap(
  supabase: SupabaseClient,
  planIds: string[],
): Promise<Map<string, PlanRow>> {
  const map = new Map<string, PlanRow>();
  const ids = unique(planIds);

  for (const group of chunk(ids, 200)) {
    const { data, error } = await supabase
      .from('plans')
      .select('id, name')
      .in('id', group);

    if (error) {
      console.error('[notifications] loadPlanMap error:', error.message);
      continue;
    }

    ((data || []) as PlanRow[]).forEach((row) => {
      map.set(row.id, row);
    });
  }

  return map;
}

async function loadSubscriptionPlanMap(
  supabase: SupabaseClient,
  subscriptionIds: string[],
): Promise<Map<string, SubscriptionPlanRow>> {
  const map = new Map<string, SubscriptionPlanRow>();
  const ids = unique(subscriptionIds);

  for (const group of chunk(ids, 200)) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, plan_id')
      .in('id', group);

    if (error) {
      console.error('[notifications] loadSubscriptionPlanMap error:', error.message);
      continue;
    }

    ((data || []) as SubscriptionPlanRow[]).forEach((row) => {
      map.set(row.id, row);
    });
  }

  return map;
}

async function loadAsaasChargeMap(
  supabase: SupabaseClient,
  paymentIds: string[],
): Promise<Map<string, AsaasChargeRow>> {
  const map = new Map<string, AsaasChargeRow>();
  const ids = unique(paymentIds);

  for (const group of chunk(ids, 200)) {
    const { data, error } = await supabase
      .from('asaas_charges')
      .select('payment_id, invoice_url, bank_slip_url')
      .in('payment_id', group);

    if (error) {
      console.error('[notifications] loadAsaasChargeMap error:', error.message);
      continue;
    }

    ((data || []) as AsaasChargeRow[]).forEach((row) => {
      if (!map.has(row.payment_id)) {
        map.set(row.payment_id, row);
      }
    });
  }

  return map;
}

async function loadPendingPaymentNotificationRows(
  supabase: SupabaseClient,
  academyIds: string[],
  options: {
    dueDateFrom?: string;
    dueDateBefore?: string;
  },
): Promise<PaymentNotificationRow[]> {
  if (!academyIds.length) return [];

  let query = supabase
    .from('payments')
    .select('id, academy_id, subscription_id, student_id, amount, due_date')
    .eq('status', 'pending')
    .in('academy_id', academyIds);

  if (options.dueDateFrom) {
    query = query.gte('due_date', options.dueDateFrom);
  }

  if (options.dueDateBefore) {
    query = query.lt('due_date', options.dueDateBefore);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[notifications] loadPendingPaymentNotificationRows error:', error.message);
    return [];
  }

  const payments = (data || []) as PaymentRow[];

  if (!payments.length) return [];

  const profileMap = await loadProfileMap(
    supabase,
    payments.map((payment) => payment.student_id),
  );
  const subscriptionMap = await loadSubscriptionPlanMap(
    supabase,
    payments.map((payment) => payment.subscription_id),
  );
  const planMap = await loadPlanMap(
    supabase,
    [...subscriptionMap.values()].map((subscription) => subscription.plan_id),
  );
  const chargeMap = await loadAsaasChargeMap(
    supabase,
    payments.map((payment) => payment.id),
  );

  return payments.map((payment) => {
    const profile = profileMap.get(payment.student_id);
    const subscription = subscriptionMap.get(payment.subscription_id);
    const plan = subscription ? planMap.get(subscription.plan_id) : null;
    const charge = chargeMap.get(payment.id);

    return {
      paymentId: payment.id,
      academyId: payment.academy_id,
      subscriptionId: payment.subscription_id,
      studentId: payment.student_id,
      studentName: profile?.name || 'Aluno',
      studentEmail: profile?.email || null,
      planName: plan?.name || 'Plano',
      amount: toNumber(payment.amount),
      dueDate: payment.due_date,
      invoiceUrl: charge?.invoice_url || null,
      bankSlipUrl: charge?.bank_slip_url || null,
    };
  });
}

function buildOverdueStudentMap(
  rows: PaymentNotificationRow[],
): Map<string, OverdueStudentAggregate> {
  const map = new Map<string, OverdueStudentAggregate>();

  rows.forEach((row) => {
    const key = studentKey(row.academyId, row.studentId);
    const current = map.get(key);

    if (!current) {
      map.set(key, {
        academyId: row.academyId,
        studentId: row.studentId,
        studentName: row.studentName,
        studentEmail: row.studentEmail,
        totalOverdue: row.amount,
        oldestDueDate: row.dueDate,
        overdueCount: 1,
        daysDelinquent: getDaysOverdue(row.dueDate),
      });
      return;
    }

    current.totalOverdue += row.amount;
    current.overdueCount += 1;

    if (new Date(row.dueDate).getTime() < new Date(current.oldestDueDate).getTime()) {
      current.oldestDueDate = row.dueDate;
      current.daysDelinquent = getDaysOverdue(row.dueDate);
    }
  });

  return map;
}

// ─── D-3: Payments due in configurable days ──────────────────

export async function findDueReminderCandidates(
  supabase: SupabaseClient,
): Promise<DueReminderCandidate[]> {
  const policyMap = await loadAcademyRuntimePolicies(supabase);
  const enabledAcademies = [...policyMap.values()].filter(
    (policy) => policy.billing.dueReminder.enabled,
  );

  if (!enabledAcademies.length) {
    return [];
  }

  const todayStart = startOfUtcDay();
  const maxDaysBeforeDue = Math.max(
    ...enabledAcademies.map((policy) => policy.billing.dueReminder.daysBeforeDue),
  );

  const rows = await loadPendingPaymentNotificationRows(
    supabase,
    enabledAcademies.map((policy) => policy.academyId),
    {
      dueDateFrom: todayStart.toISOString(),
      dueDateBefore: addDays(todayStart, maxDaysBeforeDue + 1).toISOString(),
    },
  );

  const candidates = rows.filter((row) => {
    const policy = policyMap.get(row.academyId);

    if (!policy || !hasEmail(row.studentEmail)) {
      return false;
    }

    return getDaysUntil(row.dueDate) === policy.billing.dueReminder.daysBeforeDue;
  });

  const sentKeys = await loadNotificationIdempotencySet(
    supabase,
    candidates.map((candidate) => dueReminderKey(candidate.paymentId)),
  );

  return candidates
    .filter((candidate) => !sentKeys.has(dueReminderKey(candidate.paymentId)))
    .map((candidate) => ({
      paymentId: candidate.paymentId,
      studentId: candidate.studentId,
      academyId: candidate.academyId,
      studentName: candidate.studentName,
      studentEmail: candidate.studentEmail as string,
      planName: candidate.planName,
      amount: candidate.amount,
      dueDate: candidate.dueDate,
      invoiceUrl: candidate.invoiceUrl,
      bankSlipUrl: candidate.bankSlipUrl,
      academyName: academyNameFor(policyMap.get(candidate.academyId)),
    }));
}

// ─── D+X: Payments overdue by academy policy ─────────────────

export async function findOverdueCandidates(
  supabase: SupabaseClient,
): Promise<OverdueCandidate[]> {
  const policyMap = await loadAcademyRuntimePolicies(supabase);
  const enabledAcademies = [...policyMap.values()].filter(
    (policy) => policy.billing.overdueNotice.enabled,
  );

  if (!enabledAcademies.length) {
    return [];
  }

  const todayStart = startOfUtcDay();
  const rows = await loadPendingPaymentNotificationRows(
    supabase,
    enabledAcademies.map((policy) => policy.academyId),
    {
      dueDateFrom: addDays(todayStart, -PAYMENT_LOOKBACK_DAYS).toISOString(),
      dueDateBefore: todayStart.toISOString(),
    },
  );

  const candidates = rows
    .map((row) => ({
      row,
      daysOverdue: getDaysOverdue(row.dueDate),
      policy: policyMap.get(row.academyId),
    }))
    .filter(({ row, daysOverdue, policy }) => {
      if (!policy || !hasEmail(row.studentEmail)) {
        return false;
      }

      if (daysOverdue < policy.billing.overdueNotice.daysAfterDue) {
        return false;
      }

      if (
        policy.billing.escalation.enabled
        && daysOverdue >= policy.billing.escalation.daysOverdue
      ) {
        return false;
      }

      return true;
    });

  const sentKeys = await loadNotificationIdempotencySet(
    supabase,
    candidates.map(({ row }) => overdueNoticeKey(row.paymentId)),
  );

  return candidates
    .filter(({ row }) => !sentKeys.has(overdueNoticeKey(row.paymentId)))
    .map(({ row, daysOverdue, policy }) => ({
      paymentId: row.paymentId,
      studentId: row.studentId,
      academyId: row.academyId,
      studentName: row.studentName,
      studentEmail: row.studentEmail as string,
      planName: row.planName,
      amount: row.amount,
      dueDate: row.dueDate,
      daysOverdue,
      invoiceUrl: row.invoiceUrl,
      bankSlipUrl: row.bankSlipUrl,
      academyName: academyNameFor(policy),
    }));
}

// ─── Pre-block: Students about to lose access ───────────────

export async function findPreBlockCandidates(
  supabase: SupabaseClient,
): Promise<PreBlockCandidate[]> {
  const policyMap = await loadAcademyRuntimePolicies(supabase);
  const enabledAcademies = [...policyMap.values()].filter(
    (policy) => policy.delinquency.blockAccess && policy.billing.preBlock.enabled,
  );

  if (!enabledAcademies.length) {
    return [];
  }

  const todayStart = startOfUtcDay();
  const overdueRows = await loadPendingPaymentNotificationRows(
    supabase,
    enabledAcademies.map((policy) => policy.academyId),
    {
      dueDateFrom: addDays(todayStart, -PAYMENT_LOOKBACK_DAYS).toISOString(),
      dueDateBefore: todayStart.toISOString(),
    },
  );

  const aggregates = [...buildOverdueStudentMap(overdueRows).values()].filter((aggregate) => {
    const policy = policyMap.get(aggregate.academyId);

    if (!policy || !hasEmail(aggregate.studentEmail)) {
      return false;
    }

    const triggerDays = Math.max(
      policy.delinquency.graceDays - policy.billing.preBlock.daysBeforeBlock,
      0,
    );

    return aggregate.daysDelinquent >= triggerDays;
  });

  const sentKeys = await loadNotificationIdempotencySet(
    supabase,
    aggregates.map((aggregate) => preBlockKey(aggregate.studentId, aggregate.academyId)),
  );

  return aggregates
    .filter((aggregate) => !sentKeys.has(preBlockKey(aggregate.studentId, aggregate.academyId)))
    .map((aggregate) => ({
      studentId: aggregate.studentId,
      academyId: aggregate.academyId,
      studentName: aggregate.studentName,
      studentEmail: aggregate.studentEmail as string,
      academyName: academyNameFor(policyMap.get(aggregate.academyId)),
      totalOverdue: aggregate.totalOverdue,
      oldestDueDate: aggregate.oldestDueDate,
      graceDays: policyMap.get(aggregate.academyId)?.delinquency.graceDays || 0,
    }));
}

// ─── Escalation: Persistent overdue by academy policy ───────

export async function findEscalationCandidates(
  supabase: SupabaseClient,
): Promise<EscalationCandidate[]> {
  const policyMap = await loadAcademyRuntimePolicies(supabase);
  const enabledAcademies = [...policyMap.values()].filter(
    (policy) => policy.billing.escalation.enabled,
  );

  if (!enabledAcademies.length) {
    return [];
  }

  const todayStart = startOfUtcDay();
  const overdueRows = await loadPendingPaymentNotificationRows(
    supabase,
    enabledAcademies.map((policy) => policy.academyId),
    {
      dueDateFrom: addDays(todayStart, -PAYMENT_LOOKBACK_DAYS).toISOString(),
      dueDateBefore: todayStart.toISOString(),
    },
  );

  const overdueByStudent = buildOverdueStudentMap(overdueRows);
  const candidates = overdueRows
    .map((row) => ({
      row,
      daysOverdue: getDaysOverdue(row.dueDate),
      policy: policyMap.get(row.academyId),
      aggregate: overdueByStudent.get(studentKey(row.academyId, row.studentId)),
    }))
    .filter(({ row, daysOverdue, policy }) => {
      if (!policy || !hasEmail(row.studentEmail)) {
        return false;
      }

      return daysOverdue >= policy.billing.escalation.daysOverdue;
    });

  const sentKeys = await loadNotificationIdempotencySet(
    supabase,
    candidates.map(({ row }) => escalationKey(row.paymentId)),
  );

  return candidates
    .filter(({ row }) => !sentKeys.has(escalationKey(row.paymentId)))
    .map(({ row, daysOverdue, policy, aggregate }) => ({
      paymentId: row.paymentId,
      studentId: row.studentId,
      academyId: row.academyId,
      studentName: row.studentName,
      studentEmail: row.studentEmail as string,
      planName: row.planName,
      amount: row.amount,
      dueDate: row.dueDate,
      daysOverdue,
      invoiceUrl: row.invoiceUrl,
      bankSlipUrl: row.bankSlipUrl,
      academyName: academyNameFor(policy),
      totalOverdue: aggregate?.totalOverdue ?? row.amount,
      overdueCount: aggregate?.overdueCount ?? 1,
    }));
}

// ─── Subscription expiring (D-X by academy policy) ──────────

export async function findSubscriptionExpiringCandidates(
  supabase: SupabaseClient,
): Promise<SubscriptionExpiringCandidate[]> {
  const policyMap = await loadAcademyRuntimePolicies(supabase);
  const enabledAcademies = [...policyMap.values()].filter(
    (policy) => policy.billing.subscriptionExpiring.enabled,
  );

  if (!enabledAcademies.length) {
    return [];
  }

  const todayStart = startOfUtcDay();
  const maxDays = Math.max(
    ...enabledAcademies.map((policy) => policy.billing.subscriptionExpiring.daysBeforeExpiry),
  );

  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, academy_id, student_id, plan_id, price, expires_at')
    .eq('status', 'active')
    .in('academy_id', enabledAcademies.map((policy) => policy.academyId))
    .not('expires_at', 'is', null)
    .gt('expires_at', todayStart.toISOString())
    .lt('expires_at', addDays(todayStart, maxDays + 1).toISOString());

  if (error) {
    console.error('[notifications] findSubscriptionExpiringCandidates error:', error.message);
    return [];
  }

  const rows = (data || []) as SubscriptionExpiringRow[];
  if (!rows.length) return [];

  const profileMap = await loadProfileMap(
    supabase,
    rows.map((row) => row.student_id),
  );
  const planMap = await loadPlanMap(
    supabase,
    rows.map((row) => row.plan_id),
  );

  const candidates = rows
    .map((row) => ({
      row,
      daysRemaining: getDaysUntil(row.expires_at),
      policy: policyMap.get(row.academy_id),
      profile: profileMap.get(row.student_id),
      plan: planMap.get(row.plan_id),
    }))
    .filter(({ daysRemaining, policy, profile }) => {
      if (!policy || !profile || !hasEmail(profile.email)) {
        return false;
      }

      return daysRemaining > 0 && daysRemaining <= policy.billing.subscriptionExpiring.daysBeforeExpiry;
    });

  const sentKeys = await loadNotificationIdempotencySet(
    supabase,
    candidates.map(({ row }) => subscriptionExpiringKey(row.id)),
  );

  return candidates
    .filter(({ row }) => !sentKeys.has(subscriptionExpiringKey(row.id)))
    .map(({ row, daysRemaining, policy, profile, plan }) => ({
      subscriptionId: row.id,
      studentId: row.student_id,
      academyId: row.academy_id,
      studentName: profile?.name || 'Aluno',
      studentEmail: profile?.email as string,
      planName: plan?.name || 'Plano',
      price: toNumber(row.price),
      expiresAt: row.expires_at,
      daysRemaining,
      academyName: academyNameFor(policy),
    }));
}

// ─── Reactivation candidates (academy-configurable window) ──

export async function findReactivationCandidates(
  supabase: SupabaseClient,
): Promise<ReactivationCandidate[]> {
  const policyMap = await loadAcademyRuntimePolicies(supabase);
  const enabledAcademies = [...policyMap.values()].filter(
    (policy) => policy.billing.reactivation.enabled,
  );

  if (!enabledAcademies.length) {
    return [];
  }

  const academyIds = enabledAcademies.map((policy) => policy.academyId);
  const lookbackDate = addDays(startOfUtcDay(), -REACTIVATION_LOOKBACK_DAYS).toISOString();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, academy_id, student_id, plan_id, status, cancelled_at, updated_at')
    .in('academy_id', academyIds)
    .in('status', ['cancelled', 'expired'])
    .gte('updated_at', lookbackDate)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[notifications] findReactivationCandidates error:', error.message);
    return [];
  }

  const rows = (data || []) as ReactivationSubscriptionRow[];
  if (!rows.length) return [];

  const latestByStudent = new Map<string, ReactivationSubscriptionRow>();

  rows.forEach((row) => {
    const key = studentKey(row.academy_id, row.student_id);
    const lossDate = row.cancelled_at || row.updated_at;
    const current = latestByStudent.get(key);

    if (!current) {
      latestByStudent.set(key, row);
      return;
    }

    const currentLossDate = current.cancelled_at || current.updated_at;

    if (new Date(lossDate).getTime() > new Date(currentLossDate).getTime()) {
      latestByStudent.set(key, row);
    }
  });

  const selectedRows = [...latestByStudent.values()];
  if (!selectedRows.length) return [];

  const { data: activeSubscriptions, error: activeError } = await supabase
    .from('subscriptions')
    .select('academy_id, student_id')
    .in('academy_id', academyIds)
    .in('student_id', selectedRows.map((row) => row.student_id))
    .in('status', ['active', 'paused']);

  if (activeError) {
    console.error('[notifications] findReactivationCandidates active check error:', activeError.message);
    return [];
  }

  const activePairs = new Set(
    ((activeSubscriptions || []) as ActiveSubscriptionRow[]).map((row) => studentKey(row.academy_id, row.student_id)),
  );

  const profileMap = await loadProfileMap(
    supabase,
    selectedRows.map((row) => row.student_id),
  );
  const planMap = await loadPlanMap(
    supabase,
    selectedRows.map((row) => row.plan_id),
  );

  const { data: paidPayments, error: paidPaymentsError } = await supabase
    .from('payments')
    .select('academy_id, student_id, amount, paid_at')
    .eq('status', 'paid')
    .in('academy_id', academyIds)
    .in('student_id', selectedRows.map((row) => row.student_id))
    .order('paid_at', { ascending: false });

  if (paidPaymentsError) {
    console.error('[notifications] findReactivationCandidates paid lookup error:', paidPaymentsError.message);
    return [];
  }

  const lastPaidByStudent = new Map<string, number>();

  ((paidPayments || []) as PaidPaymentRow[]).forEach((row) => {
    const key = studentKey(row.academy_id, row.student_id);

    if (!lastPaidByStudent.has(key)) {
      lastPaidByStudent.set(key, toNumber(row.amount));
    }
  });

  const candidates = selectedRows
    .map((row) => {
      const policy = policyMap.get(row.academy_id);
      const lossDate = row.cancelled_at || row.updated_at;
      const daysSinceLoss = getDaysOverdue(lossDate);

      return {
        row,
        policy,
        profile: profileMap.get(row.student_id),
        plan: planMap.get(row.plan_id),
        lossDate,
        daysSinceLoss,
      };
    })
    .filter(({ row, policy, profile, daysSinceLoss }) => {
      if (!policy || !profile || !hasEmail(profile.email)) {
        return false;
      }

      if (activePairs.has(studentKey(row.academy_id, row.student_id))) {
        return false;
      }

      return (
        daysSinceLoss >= policy.billing.reactivation.minDaysSinceLoss
        && daysSinceLoss <= policy.billing.reactivation.maxDaysSinceLoss
      );
    });

  const sentKeys = await loadNotificationIdempotencySet(
    supabase,
    candidates.map(({ row }) => reactivationKey(row.student_id, row.academy_id)),
  );

  return candidates
    .filter(({ row }) => !sentKeys.has(reactivationKey(row.student_id, row.academy_id)))
    .map(({ row, policy, profile, plan, lossDate, daysSinceLoss }) => ({
      studentId: row.student_id,
      academyId: row.academy_id,
      studentName: profile?.name || 'Aluno',
      studentEmail: profile?.email as string,
      planName: plan?.name || 'Plano',
      lastSubscriptionStatus: row.status,
      cancelledOrExpiredAt: lossDate,
      daysSinceLoss,
      lastPaidAmount: lastPaidByStudent.get(studentKey(row.academy_id, row.student_id)) ?? null,
      academyName: academyNameFor(policy),
    }));
}

// ─── Regularization candidates (auto-resolve) ───────────────

export async function findRegularizationCandidates(
  supabase: SupabaseClient,
): Promise<RegularizationCandidate[]> {
  const { data, error } = await supabase.rpc('find_recently_regularized_students');

  if (error) {
    console.error('[notifications] findRegularizationCandidates error:', error.message);
    return [];
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    studentId: r.student_id as string,
    academyId: r.academy_id as string,
    studentName: r.student_name as string,
    studentEmail: r.student_email as string,
    academyName: r.academy_name as string,
    pendingActionCount: Number(r.pending_action_count),
  }));
}