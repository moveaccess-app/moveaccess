// Scheduled dispatch logic for transactional notifications.
//
// Finds candidates for each notification type, builds emails,
// and sends them via the notification service (with idempotency).
//
// Designed to be called by a cron job via API route.
// Safe to call multiple times — idempotency prevents duplicates.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildDueReminderEmail,
  buildOverdueNoticeEmail,
  buildPreBlockEmail,
} from './email-templates';
import {
  findDueReminderCandidates,
  findOverdueCandidates,
  findPreBlockCandidates,
} from './notification-queries';
import {
  dueReminderKey,
  overdueNoticeKey,
  preBlockKey,
  sendNotification,
  type SendNotificationResult,
} from './notification-service';
import {
  evaluateAndExecuteAutomations,
  type AutomationSummary,
} from './automation-engine';

// ─── Types ───────────────────────────────────────────────────

export interface DispatchSummary {
  dueReminders: { attempted: number; sent: number; skipped: number; failed: number };
  overdueNotices: { attempted: number; sent: number; skipped: number; failed: number };
  preBlockWarnings: { attempted: number; sent: number; skipped: number; failed: number };
  automations: AutomationSummary | null;
  errors: string[];
}

function emptyBucket() {
  return { attempted: 0, sent: 0, skipped: 0, failed: 0 };
}

function tally(bucket: ReturnType<typeof emptyBucket>, result: SendNotificationResult) {
  bucket.attempted++;
  if (result.skipped) bucket.skipped++;
  else if (result.success) bucket.sent++;
  else bucket.failed++;
}

// ─── App URL ─────────────────────────────────────────────────

function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
}

// ─── Main dispatch ───────────────────────────────────────────

export async function dispatchScheduledNotifications(
  supabase: SupabaseClient,
): Promise<DispatchSummary> {
  const summary: DispatchSummary = {
    dueReminders: emptyBucket(),
    overdueNotices: emptyBucket(),
    preBlockWarnings: emptyBucket(),
    automations: null,
    errors: [],
  };

  const appUrl = getAppUrl();

  // ── 1. Due reminders (D-3) ────────────────────────────────

  try {
    const candidates = await findDueReminderCandidates(supabase);

    for (const c of candidates) {
      const email = buildDueReminderEmail({
        studentName: c.studentName,
        planName: c.planName,
        amount: c.amount,
        dueDate: c.dueDate,
        paymentLink: c.invoiceUrl || c.bankSlipUrl || null,
        academyName: c.academyName,
      });

      const result = await sendNotification(supabase, {
        academyId: c.academyId,
        type: 'due_reminder',
        recipientEmail: c.studentEmail,
        recipientId: c.studentId,
        entityType: 'payment',
        entityId: c.paymentId,
        idempotencyKey: dueReminderKey(c.paymentId),
        subject: email.subject,
        html: email.html,
        metadata: { planName: c.planName, amount: c.amount, dueDate: c.dueDate },
      });

      tally(summary.dueReminders, result);
      if (result.error) {
        summary.errors.push(`due_reminder ${c.paymentId}: ${result.error}`);
      }
    }
  } catch (err) {
    summary.errors.push(`due_reminder batch error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── 2. Overdue notices (D+1) ──────────────────────────────

  try {
    const candidates = await findOverdueCandidates(supabase);

    for (const c of candidates) {
      const email = buildOverdueNoticeEmail({
        studentName: c.studentName,
        planName: c.planName,
        amount: c.amount,
        dueDate: c.dueDate,
        daysOverdue: c.daysOverdue,
        paymentLink: c.invoiceUrl || c.bankSlipUrl || null,
        academyName: c.academyName,
      });

      const result = await sendNotification(supabase, {
        academyId: c.academyId,
        type: 'overdue_notice',
        recipientEmail: c.studentEmail,
        recipientId: c.studentId,
        entityType: 'payment',
        entityId: c.paymentId,
        idempotencyKey: overdueNoticeKey(c.paymentId),
        subject: email.subject,
        html: email.html,
        metadata: { planName: c.planName, amount: c.amount, dueDate: c.dueDate, daysOverdue: c.daysOverdue },
      });

      tally(summary.overdueNotices, result);
      if (result.error) {
        summary.errors.push(`overdue_notice ${c.paymentId}: ${result.error}`);
      }
    }
  } catch (err) {
    summary.errors.push(`overdue_notice batch error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── 3. Pre-block warnings ─────────────────────────────────

  try {
    const candidates = await findPreBlockCandidates(supabase);

    for (const c of candidates) {
      const email = buildPreBlockEmail({
        studentName: c.studentName,
        academyName: c.academyName,
        totalOverdue: c.totalOverdue,
        oldestDueDate: c.oldestDueDate,
        graceDays: c.graceDays,
        portalUrl: `${appUrl}/aluno`,
      });

      const result = await sendNotification(supabase, {
        academyId: c.academyId,
        type: 'pre_block',
        recipientEmail: c.studentEmail,
        recipientId: c.studentId,
        entityType: 'student',
        entityId: c.studentId,
        idempotencyKey: preBlockKey(c.studentId, c.academyId),
        subject: email.subject,
        html: email.html,
        metadata: { totalOverdue: c.totalOverdue, graceDays: c.graceDays },
      });

      tally(summary.preBlockWarnings, result);
      if (result.error) {
        summary.errors.push(`pre_block ${c.studentId}: ${result.error}`);
      }
    }
  } catch (err) {
    summary.errors.push(`pre_block batch error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── 4. Premium automations (escalation, sub expiring, reactivation, regularization)

  try {
    const automationResult = await evaluateAndExecuteAutomations(supabase);
    summary.automations = automationResult;

    // Merge automation errors into main errors list
    if (automationResult.errors.length > 0) {
      summary.errors.push(...automationResult.errors);
    }
  } catch (err) {
    summary.errors.push(`automations batch error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return summary;
}
