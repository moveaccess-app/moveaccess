// Invite email sender.
//
// Called after an invite is created to send the invite email.
// Uses the notification service for idempotency and logging.

import type { SupabaseClient } from '@supabase/supabase-js';
import { buildInviteEmail } from './email-templates';
import {
  inviteKey,
  sendNotification,
  type SendNotificationResult,
} from './notification-service';

// ─── Types ───────────────────────────────────────────────────

export interface SendInviteEmailInput {
  inviteId: string;
  token: string;
  academyId: string;
  academyName: string;
  recipientEmail: string;
  recipientName: string | null;
  expiresAt: string;
}

// ─── Send ────────────────────────────────────────────────────

function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export async function sendInviteEmail(
  supabase: SupabaseClient,
  input: SendInviteEmailInput,
): Promise<SendNotificationResult> {
  const inviteUrl = `${getAppUrl()}/cadastro/${input.token}`;

  const email = buildInviteEmail({
    recipientName: input.recipientName,
    academyName: input.academyName,
    inviteUrl,
    expiresAt: input.expiresAt,
  });

  return sendNotification(supabase, {
    academyId: input.academyId,
    type: 'invite',
    recipientEmail: input.recipientEmail,
    recipientId: null, // user doesn't exist yet
    entityType: 'invite',
    entityId: input.inviteId,
    idempotencyKey: inviteKey(input.inviteId),
    subject: email.subject,
    html: email.html,
    metadata: {
      recipientName: input.recipientName,
      token: input.token,
    },
  });
}
