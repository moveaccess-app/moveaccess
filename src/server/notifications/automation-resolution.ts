// Automation resolution — auto-resolves pending actions when payments are received.
//
// Called from the webhook processing pipeline after a payment transitions
// to 'paid' (PAYMENT_RECEIVED event). Resolves all pending/executed
// automation actions for that payment and optionally sends a confirmation email.
//
// Also provides a bulk resolution function for student-level regularization.

import type { SupabaseClient } from '@supabase/supabase-js';
import { buildPaymentConfirmedEmail } from './email-templates';
import {
  paymentConfirmedKey,
  sendNotification,
} from './notification-service';
import { getAcademyRuntimePolicy } from './policy-runtime';

// ─── Types ───────────────────────────────────────────────────

export interface PaymentResolutionResult {
  paymentId: string;
  actionsResolved: number;
  confirmationSent: boolean;
  error?: string;
}

// ─── Payment resolution ──────────────────────────────────────

/**
 * Called when a payment is received (via webhook).
 * 1. Resolves all pending automation_actions linked to this payment
 * 2. Sends a payment confirmation email to the student
 */
export async function resolveAutomationsForPayment(
  supabase: SupabaseClient,
  paymentId: string,
): Promise<PaymentResolutionResult> {
  const result: PaymentResolutionResult = {
    paymentId,
    actionsResolved: 0,
    confirmationSent: false,
  };

  try {
    // 1. Resolve automation actions for this payment
    const { data: resolvedCount, error: resolveError } = await supabase.rpc(
      'resolve_automation_actions_for_payment',
      { p_payment_id: paymentId },
    );

    if (resolveError) {
      console.error(`[automation-resolution] RPC error for payment ${paymentId}:`, resolveError.message);
    }

    result.actionsResolved = resolvedCount ?? 0;

    // 2. Load payment + student info for confirmation email
    const { data: payment } = await supabase
      .from('payments')
      .select(`
        id,
        academy_id,
        student_id,
        amount,
        paid_at,
        subscription_id
      `)
      .eq('id', paymentId)
      .single();

    if (!payment) {
      result.error = 'Payment not found';
      return result;
    }

    const academyPolicy = await getAcademyRuntimePolicy(supabase, payment.academy_id);

    if (!academyPolicy.billing.paymentConfirmed.enabled) {
      return result;
    }

    // Load student profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', payment.student_id)
      .single();

    if (!profile?.email) {
      // No email — can't send confirmation, but resolution still happened
      return result;
    }

    // Load plan name from subscription
    let planName = 'Plano';
    if (payment.subscription_id) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_id')
        .eq('id', payment.subscription_id)
        .single();

      if (sub?.plan_id) {
        const { data: plan } = await supabase
          .from('plans')
          .select('name')
          .eq('id', sub.plan_id)
          .single();

        if (plan?.name) planName = plan.name;
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    // 3. Send confirmation email
    const idemKey = paymentConfirmedKey(paymentId);
    const email = buildPaymentConfirmedEmail({
      studentName: profile.name || 'Aluno',
      planName,
      amount: payment.amount,
      paidDate: payment.paid_at || new Date().toISOString(),
      academyName: academyPolicy.academyName || 'Academia',
      portalUrl: `${appUrl}/aluno`,
    });

    const sendResult = await sendNotification(supabase, {
      academyId: payment.academy_id,
      type: 'payment_confirmed',
      recipientEmail: profile.email,
      recipientId: payment.student_id,
      entityType: 'payment',
      entityId: paymentId,
      idempotencyKey: idemKey,
      subject: email.subject,
      html: email.html,
      metadata: { amount: payment.amount, planName },
    });

    result.confirmationSent = sendResult.success && !sendResult.skipped;

    if (sendResult.error) {
      result.error = sendResult.error;
    }
  } catch (err) {
    result.error = err instanceof Error ? err.message : 'Unknown resolution error';
    console.error(`[automation-resolution] Error for payment ${paymentId}:`, result.error);
  }

  return result;
}
