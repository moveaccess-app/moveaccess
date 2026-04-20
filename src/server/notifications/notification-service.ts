// Notification service — orchestrates sending + logging.
//
// Responsibilities:
//   1. Check idempotency (has this notification already been sent?)
//   2. Build email payload using templates
//   3. Send via email provider
//   4. Log the result in notification_logs
//
// All operations use the admin Supabase client (bypasses RLS).

import type { SupabaseClient } from '@supabase/supabase-js';
import { getEmailProvider, type SendEmailResult } from './email-provider';

// ─── Types ───────────────────────────────────────────────────

export type NotificationType =
  | 'invite'
  | 'due_reminder'
  | 'overdue_notice'
  | 'pre_block'
  | 'escalation'
  | 'subscription_expiring'
  | 'regularization'
  | 'reactivation_offer'
  | 'payment_confirmed';

export type NotificationEntityType = 'invite' | 'payment' | 'student' | 'subscription';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface SendNotificationInput {
  academyId: string;
  type: NotificationType;
  recipientEmail: string;
  recipientId: string | null;      // profiles.id, null for invite to non-users
  entityType: NotificationEntityType;
  entityId: string;
  idempotencyKey: string;
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
}

export interface SendNotificationResult {
  success: boolean;
  skipped?: boolean;               // true if already sent (idempotent)
  providerId?: string;
  error?: string;
}

// ─── Core function ───────────────────────────────────────────

export async function sendNotification(
  supabase: SupabaseClient,
  input: SendNotificationInput,
): Promise<SendNotificationResult> {

  // 1. Check idempotency — if already sent, skip silently
  const { data: existing } = await supabase
    .from('notification_logs')
    .select('id, status')
    .eq('idempotency_key', input.idempotencyKey)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'sent') {
      return { success: true, skipped: true };
    }
    // If previous attempt failed, we'll retry — delete old record
    if (existing.status === 'failed') {
      await supabase
        .from('notification_logs')
        .delete()
        .eq('id', existing.id);
    }
  }

  // 2. Insert pending log (claim the idempotency key)
  const { data: logRow, error: insertError } = await supabase
    .from('notification_logs')
    .insert({
      academy_id: input.academyId,
      type: input.type,
      channel: 'email',
      recipient_email: input.recipientEmail,
      recipient_id: input.recipientId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      idempotency_key: input.idempotencyKey,
      status: 'pending',
      metadata: input.metadata || null,
    })
    .select('id')
    .single();

  if (insertError) {
    // Unique violation = another process claimed it
    if (insertError.code === '23505') {
      return { success: true, skipped: true };
    }
    return { success: false, error: `Log insert failed: ${insertError.message}` };
  }

  // 3. Send email
  let result: SendEmailResult;
  try {
    const provider = getEmailProvider();
    result = await provider.send({
      to: input.recipientEmail,
      subject: input.subject,
      html: input.html,
      tags: [
        { name: 'type', value: input.type },
        { name: 'academy', value: input.academyId },
      ],
    });
  } catch (err) {
    result = {
      success: false,
      error: err instanceof Error ? err.message : 'Provider error',
    };
  }

  // 4. Update log with result
  await supabase
    .from('notification_logs')
    .update({
      status: result.success ? 'sent' : 'failed',
      provider_id: result.providerId || null,
      error: result.error || null,
    })
    .eq('id', logRow.id);

  return {
    success: result.success,
    providerId: result.providerId,
    error: result.error,
  };
}

// ─── Idempotency key builders ────────────────────────────────

export function inviteKey(inviteId: string): string {
  return `invite:${inviteId}`;
}

export function dueReminderKey(paymentId: string): string {
  return `due_reminder:${paymentId}`;
}

export function overdueNoticeKey(paymentId: string): string {
  return `overdue_notice:${paymentId}`;
}

export function preBlockKey(studentId: string, academyId: string): string {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  return `pre_block:${studentId}:${academyId}:${month}`;
}

export function escalationKey(paymentId: string): string {
  return `escalation:${paymentId}`;
}

export function subscriptionExpiringKey(subscriptionId: string): string {
  return `sub_expiring:${subscriptionId}`;
}

export function reactivationKey(studentId: string, academyId: string): string {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  return `reactivation:${studentId}:${academyId}:${month}`;
}

export function regularizationKey(studentId: string, academyId: string): string {
  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  return `regularization:${studentId}:${academyId}:${month}`;
}

export function paymentConfirmedKey(paymentId: string): string {
  return `payment_confirmed:${paymentId}`;
}
