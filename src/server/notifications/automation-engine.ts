// Automation engine — evaluates and executes automation stages.
//
// Extends the existing dispatch cycle with new automation stages:
//   1. Escalation (D+14+): persistent overdue payments
//   2. Subscription expiring (D-7): subscriptions about to expire
//   3. Reactivation: win-back for cancelled/expired students
//   4. Regularization: auto-resolve + confirmation email
//   5. Payment confirmed: receipt email on payment received
//
// Each stage follows the same pattern:
//   find candidates → build email → send notification → log automation action
//
// All sends are idempotent (notification_logs + automation_actions).
// Designed to be called alongside the existing dispatch cycle.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildEscalationEmail,
  buildSubscriptionExpiringEmail,
  buildReactivationEmail,
  buildRegularizationEmail,
} from './email-templates';
import {
  findEscalationCandidates,
  findSubscriptionExpiringCandidates,
  findReactivationCandidates,
  findRegularizationCandidates,
} from './notification-queries';
import {
  escalationKey,
  subscriptionExpiringKey,
  reactivationKey,
  regularizationKey,
  sendNotification,
  type SendNotificationResult,
} from './notification-service';

// ─── Types ───────────────────────────────────────────────────

export interface AutomationSummary {
  escalations: AutomationBucket;
  subscriptionExpiring: AutomationBucket;
  reactivations: AutomationBucket;
  regularizations: AutomationBucket;
  errors: string[];
}

export interface AutomationBucket {
  attempted: number;
  sent: number;
  skipped: number;
  failed: number;
  resolved: number;
}

function emptyBucket(): AutomationBucket {
  return { attempted: 0, sent: 0, skipped: 0, failed: 0, resolved: 0 };
}

function tally(bucket: AutomationBucket, result: SendNotificationResult) {
  bucket.attempted++;
  if (result.skipped) bucket.skipped++;
  else if (result.success) bucket.sent++;
  else bucket.failed++;
}

// ─── Action logger ───────────────────────────────────────────

interface LogActionInput {
  academyId: string;
  studentId: string;
  triggerType: string;
  entityType: string;
  entityId: string;
  stage: string;
  status: string;
  channel: string;
  idempotencyKey: string;
  notificationLogId?: string;
  payload?: Record<string, unknown>;
  executedAt?: string;
  errorMessage?: string;
}

async function logAutomationAction(
  supabase: SupabaseClient,
  input: LogActionInput,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('automation_actions')
    .insert({
      academy_id: input.academyId,
      student_id: input.studentId,
      trigger_type: input.triggerType,
      entity_type: input.entityType,
      entity_id: input.entityId,
      stage: input.stage,
      status: input.status,
      channel: input.channel,
      idempotency_key: input.idempotencyKey,
      notification_log_id: input.notificationLogId || null,
      payload: input.payload || null,
      executed_at: input.executedAt || null,
      error_message: input.errorMessage || null,
    })
    .select('id')
    .single();

  if (error) {
    // Unique violation = already logged (idempotent)
    if (error.code === '23505') return null;
    console.error('[automation] logAction error:', error.message);
    return null;
  }

  return data?.id ?? null;
}

// ─── Notification log ID lookup ──────────────────────────────

async function findNotificationLogId(
  supabase: SupabaseClient,
  idempotencyKey: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('notification_logs')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .eq('status', 'sent')
    .maybeSingle();

  return data?.id ?? null;
}

// ─── App URL ─────────────────────────────────────────────────

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
}

// ─── Main automation evaluation ──────────────────────────────

export async function evaluateAndExecuteAutomations(
  supabase: SupabaseClient,
): Promise<AutomationSummary> {
  const summary: AutomationSummary = {
    escalations: emptyBucket(),
    subscriptionExpiring: emptyBucket(),
    reactivations: emptyBucket(),
    regularizations: emptyBucket(),
    errors: [],
  };

  const appUrl = getAppUrl();

  // ── 1. Escalation (D+14+) ────────────────────────────────

  try {
    const candidates = await findEscalationCandidates(supabase);

    for (const c of candidates) {
      const idemKey = escalationKey(c.paymentId);
      const email = buildEscalationEmail({
        studentName: c.studentName,
        planName: c.planName,
        amount: c.amount,
        dueDate: c.dueDate,
        daysOverdue: c.daysOverdue,
        totalOverdue: c.totalOverdue,
        overdueCount: c.overdueCount,
        paymentLink: c.invoiceUrl || c.bankSlipUrl || null,
        academyName: c.academyName,
      });

      const result = await sendNotification(supabase, {
        academyId: c.academyId,
        type: 'escalation',
        recipientEmail: c.studentEmail,
        recipientId: c.studentId,
        entityType: 'payment',
        entityId: c.paymentId,
        idempotencyKey: idemKey,
        subject: email.subject,
        html: email.html,
        metadata: {
          planName: c.planName,
          amount: c.amount,
          dueDate: c.dueDate,
          daysOverdue: c.daysOverdue,
          totalOverdue: c.totalOverdue,
        },
      });

      tally(summary.escalations, result);

      if (!result.skipped) {
        const notifLogId = result.success ? await findNotificationLogId(supabase, idemKey) : null;

        await logAutomationAction(supabase, {
          academyId: c.academyId,
          studentId: c.studentId,
          triggerType: 'payment_escalation',
          entityType: 'payment',
          entityId: c.paymentId,
          stage: 'escalation',
          status: result.success ? 'executed' : 'failed',
          channel: 'email',
          idempotencyKey: idemKey,
          notificationLogId: notifLogId ?? undefined,
          payload: { planName: c.planName, amount: c.amount, daysOverdue: c.daysOverdue },
          executedAt: result.success ? new Date().toISOString() : undefined,
          errorMessage: result.error,
        });
      }

      if (result.error) {
        summary.errors.push(`escalation ${c.paymentId}: ${result.error}`);
      }
    }
  } catch (err) {
    summary.errors.push(`escalation batch error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── 2. Subscription expiring (D-7) ────────────────────────

  try {
    const candidates = await findSubscriptionExpiringCandidates(supabase);

    for (const c of candidates) {
      const idemKey = subscriptionExpiringKey(c.subscriptionId);
      const email = buildSubscriptionExpiringEmail({
        studentName: c.studentName,
        planName: c.planName,
        price: c.price,
        expiresAt: c.expiresAt,
        daysRemaining: c.daysRemaining,
        academyName: c.academyName,
        portalUrl: `${appUrl}/aluno`,
      });

      const result = await sendNotification(supabase, {
        academyId: c.academyId,
        type: 'subscription_expiring',
        recipientEmail: c.studentEmail,
        recipientId: c.studentId,
        entityType: 'subscription',
        entityId: c.subscriptionId,
        idempotencyKey: idemKey,
        subject: email.subject,
        html: email.html,
        metadata: {
          planName: c.planName,
          price: c.price,
          expiresAt: c.expiresAt,
          daysRemaining: c.daysRemaining,
        },
      });

      tally(summary.subscriptionExpiring, result);

      if (!result.skipped) {
        const notifLogId = result.success ? await findNotificationLogId(supabase, idemKey) : null;

        await logAutomationAction(supabase, {
          academyId: c.academyId,
          studentId: c.studentId,
          triggerType: 'subscription_expiring',
          entityType: 'subscription',
          entityId: c.subscriptionId,
          stage: 'reminder',
          status: result.success ? 'executed' : 'failed',
          channel: 'email',
          idempotencyKey: idemKey,
          notificationLogId: notifLogId ?? undefined,
          payload: { planName: c.planName, price: c.price, expiresAt: c.expiresAt },
          executedAt: result.success ? new Date().toISOString() : undefined,
          errorMessage: result.error,
        });
      }

      if (result.error) {
        summary.errors.push(`subscription_expiring ${c.subscriptionId}: ${result.error}`);
      }
    }
  } catch (err) {
    summary.errors.push(`subscription_expiring batch error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── 3. Reactivation (win-back) ────────────────────────────

  try {
    const candidates = await findReactivationCandidates(supabase);

    for (const c of candidates) {
      const idemKey = reactivationKey(c.studentId, c.academyId);
      const email = buildReactivationEmail({
        studentName: c.studentName,
        planName: c.planName,
        lastPaidAmount: c.lastPaidAmount,
        academyName: c.academyName,
        daysSinceLoss: c.daysSinceLoss,
        portalUrl: `${appUrl}/aluno`,
      });

      const result = await sendNotification(supabase, {
        academyId: c.academyId,
        type: 'reactivation_offer',
        recipientEmail: c.studentEmail,
        recipientId: c.studentId,
        entityType: 'student',
        entityId: c.studentId,
        idempotencyKey: idemKey,
        subject: email.subject,
        html: email.html,
        metadata: {
          planName: c.planName,
          daysSinceLoss: c.daysSinceLoss,
          lastSubscriptionStatus: c.lastSubscriptionStatus,
        },
      });

      tally(summary.reactivations, result);

      if (!result.skipped) {
        const notifLogId = result.success ? await findNotificationLogId(supabase, idemKey) : null;

        await logAutomationAction(supabase, {
          academyId: c.academyId,
          studentId: c.studentId,
          triggerType: 'reactivation',
          entityType: 'student',
          entityId: c.studentId,
          stage: 'reactivation',
          status: result.success ? 'executed' : 'failed',
          channel: 'email',
          idempotencyKey: idemKey,
          notificationLogId: notifLogId ?? undefined,
          payload: { planName: c.planName, daysSinceLoss: c.daysSinceLoss },
          executedAt: result.success ? new Date().toISOString() : undefined,
          errorMessage: result.error,
        });
      }

      if (result.error) {
        summary.errors.push(`reactivation ${c.studentId}: ${result.error}`);
      }
    }
  } catch (err) {
    summary.errors.push(`reactivation batch error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── 4. Regularization (auto-resolve) ──────────────────────

  try {
    const candidates = await findRegularizationCandidates(supabase);

    for (const c of candidates) {
      // First, resolve all pending automation actions for this student
      const { data: resolvedCount } = await supabase.rpc(
        'resolve_automation_actions_for_student',
        { p_student_id: c.studentId, p_academy_id: c.academyId },
      );

      summary.regularizations.resolved += resolvedCount ?? 0;

      // Then send regularization confirmation email
      const idemKey = regularizationKey(c.studentId, c.academyId);
      const email = buildRegularizationEmail({
        studentName: c.studentName,
        academyName: c.academyName,
        portalUrl: `${appUrl}/aluno`,
      });

      const result = await sendNotification(supabase, {
        academyId: c.academyId,
        type: 'regularization',
        recipientEmail: c.studentEmail,
        recipientId: c.studentId,
        entityType: 'student',
        entityId: c.studentId,
        idempotencyKey: idemKey,
        subject: email.subject,
        html: email.html,
        metadata: { resolvedActionCount: resolvedCount ?? 0 },
      });

      tally(summary.regularizations, result);

      if (!result.skipped) {
        const notifLogId = result.success ? await findNotificationLogId(supabase, idemKey) : null;

        await logAutomationAction(supabase, {
          academyId: c.academyId,
          studentId: c.studentId,
          triggerType: 'regularization',
          entityType: 'student',
          entityId: c.studentId,
          stage: 'resolved',
          status: result.success ? 'executed' : 'failed',
          channel: 'email',
          idempotencyKey: idemKey,
          notificationLogId: notifLogId ?? undefined,
          payload: { resolvedActionCount: resolvedCount ?? 0 },
          executedAt: result.success ? new Date().toISOString() : undefined,
          errorMessage: result.error,
        });
      }

      if (result.error) {
        summary.errors.push(`regularization ${c.studentId}: ${result.error}`);
      }
    }
  } catch (err) {
    summary.errors.push(`regularization batch error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return summary;
}
