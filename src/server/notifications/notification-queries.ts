// Server-side queries for notification dispatch.
//
// Uses admin Supabase client (bypasses RLS) to find
// candidates for each notification type across all academies.

import type { SupabaseClient } from '@supabase/supabase-js';

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

// ─── D-3: Payments due in 3 days ─────────────────────────────

export async function findDueReminderCandidates(
  supabase: SupabaseClient,
): Promise<DueReminderCandidate[]> {
  const { data, error } = await supabase.rpc('find_due_reminder_candidates');

  if (error) {
    console.error('[notifications] findDueReminderCandidates error:', error.message);
    return [];
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    paymentId: r.payment_id as string,
    studentId: r.student_id as string,
    academyId: r.academy_id as string,
    studentName: r.student_name as string,
    studentEmail: r.student_email as string,
    planName: (r.plan_name as string) || 'Plano',
    amount: Number(r.amount),
    dueDate: r.due_date as string,
    invoiceUrl: r.invoice_url as string | null,
    bankSlipUrl: r.bank_slip_url as string | null,
    academyName: r.academy_name as string,
  }));
}

// ─── D+1: Payments overdue by 1 day ─────────────────────────

export async function findOverdueCandidates(
  supabase: SupabaseClient,
): Promise<OverdueCandidate[]> {
  const { data, error } = await supabase.rpc('find_overdue_notice_candidates');

  if (error) {
    console.error('[notifications] findOverdueCandidates error:', error.message);
    return [];
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    paymentId: r.payment_id as string,
    studentId: r.student_id as string,
    academyId: r.academy_id as string,
    studentName: r.student_name as string,
    studentEmail: r.student_email as string,
    planName: (r.plan_name as string) || 'Plano',
    amount: Number(r.amount),
    dueDate: r.due_date as string,
    daysOverdue: Number(r.days_overdue),
    invoiceUrl: r.invoice_url as string | null,
    bankSlipUrl: r.bank_slip_url as string | null,
    academyName: r.academy_name as string,
  }));
}

// ─── Pre-block: Students about to lose access ───────────────

export async function findPreBlockCandidates(
  supabase: SupabaseClient,
): Promise<PreBlockCandidate[]> {
  const { data, error } = await supabase.rpc('find_pre_block_candidates');

  if (error) {
    console.error('[notifications] findPreBlockCandidates error:', error.message);
    return [];
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    studentId: r.student_id as string,
    academyId: r.academy_id as string,
    studentName: r.student_name as string,
    studentEmail: r.student_email as string,
    academyName: r.academy_name as string,
    totalOverdue: Number(r.total_overdue),
    oldestDueDate: r.oldest_due_date as string,
    graceDays: Number(r.grace_days),
  }));
}

// ─── Escalation: Persistent overdue (D+14+) ────────────────

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

export async function findEscalationCandidates(
  supabase: SupabaseClient,
): Promise<EscalationCandidate[]> {
  const { data, error } = await supabase.rpc('find_escalation_candidates');

  if (error) {
    console.error('[notifications] findEscalationCandidates error:', error.message);
    return [];
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    paymentId: r.payment_id as string,
    studentId: r.student_id as string,
    academyId: r.academy_id as string,
    studentName: r.student_name as string,
    studentEmail: r.student_email as string,
    planName: (r.plan_name as string) || 'Plano',
    amount: Number(r.amount),
    dueDate: r.due_date as string,
    daysOverdue: Number(r.days_overdue),
    invoiceUrl: r.invoice_url as string | null,
    bankSlipUrl: r.bank_slip_url as string | null,
    academyName: r.academy_name as string,
    totalOverdue: Number(r.total_overdue),
    overdueCount: Number(r.overdue_count),
  }));
}

// ─── Subscription expiring (D-7) ────────────────────────────

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

export async function findSubscriptionExpiringCandidates(
  supabase: SupabaseClient,
): Promise<SubscriptionExpiringCandidate[]> {
  const { data, error } = await supabase.rpc('find_subscription_expiring_candidates');

  if (error) {
    console.error('[notifications] findSubscriptionExpiringCandidates error:', error.message);
    return [];
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    subscriptionId: r.subscription_id as string,
    studentId: r.student_id as string,
    academyId: r.academy_id as string,
    studentName: r.student_name as string,
    studentEmail: r.student_email as string,
    planName: (r.plan_name as string) || 'Plano',
    price: Number(r.price),
    expiresAt: r.expires_at as string,
    daysRemaining: Number(r.days_remaining),
    academyName: r.academy_name as string,
  }));
}

// ─── Reactivation candidates (cancelled/expired 30-90 days) ─

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

export async function findReactivationCandidates(
  supabase: SupabaseClient,
): Promise<ReactivationCandidate[]> {
  const { data, error } = await supabase.rpc('find_reactivation_candidates');

  if (error) {
    console.error('[notifications] findReactivationCandidates error:', error.message);
    return [];
  }

  return (data || []).map((r: Record<string, unknown>) => ({
    studentId: r.student_id as string,
    academyId: r.academy_id as string,
    studentName: r.student_name as string,
    studentEmail: r.student_email as string,
    planName: (r.plan_name as string) || 'Plano',
    lastSubscriptionStatus: r.last_subscription_status as string,
    cancelledOrExpiredAt: r.cancelled_or_expired_at as string,
    daysSinceLoss: Number(r.days_since_loss),
    lastPaidAmount: r.last_paid_amount != null ? Number(r.last_paid_amount) : null,
    academyName: r.academy_name as string,
  }));
}

// ─── Regularization candidates (auto-resolve) ───────────────

export interface RegularizationCandidate {
  studentId: string;
  academyId: string;
  studentName: string;
  studentEmail: string;
  academyName: string;
  pendingActionCount: number;
}

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
