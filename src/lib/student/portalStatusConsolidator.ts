/**
 * Portal Status Consolidator
 *
 * Pure presentation logic that takes existing portal data and derives
 * the student's consolidated status, dominant reason, and CTA.
 *
 * Does NOT make API calls — operates entirely on data already fetched
 * by getStudentPortalData() and the CurrentUser profile.
 */

import type {
  StudentPortalData,
  StudentPortalPayment,
  StudentPortalDelinquency,
  StudentPortalSubscription,
  StudentPortalContract,
} from './studentPortalService';

// ─── Types ───────────────────────────────────────────────────────

export type PortalStatus = 'active' | 'attention' | 'blocked';

export type BlockReason =
  | 'delinquent'
  | 'subscription_expired'
  | 'subscription_inactive'
  | 'no_subscription'
  | 'plan_inactive';

export type AttentionReason =
  | 'payment_due_soon'
  | 'payment_overdue_mild'
  | 'no_contract'
  | 'subscription_expiring_soon';

export interface PortalStatusResult {
  status: PortalStatus;
  title: string;
  subtitle: string;
  dominantReason: BlockReason | AttentionReason | null;
  ctaLabel: string | null;
  ctaAction: 'pay' | 'contact' | 'qr' | 'contract' | null;
  nextPayment: StudentPortalPayment | null;
  hasPaymentLink: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────

function getNextPendingPayment(payments: StudentPortalPayment[]): StudentPortalPayment | null {
  const pending = payments
    .filter((p) => p.status === 'pending')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return pending[0] || null;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function hasPaymentLink(payment: StudentPortalPayment | null): boolean {
  if (!payment) return false;
  return !!(payment.invoiceUrl || payment.bankSlipUrl);
}

/**
 * Detect when Asaas says a payment was received but local status is still pending.
 * This means a webhook failed to sync — the student shouldn't be penalized.
 */
function hasAsaasPaidButLocalPending(payments: StudentPortalPayment[]): boolean {
  const ASAAS_PAID_STATUSES = ['RECEIVED', 'RECEIVED_IN_CASH', 'CONFIRMED'];

  return payments.some(
    (p) =>
      p.status === 'pending'
      && p.asaasStatus !== null
      && ASAAS_PAID_STATUSES.includes(p.asaasStatus),
  );
}

/**
 * If delinquency is flagged but we detect Asaas-paid-but-local-pending payments,
 * it's likely a sync issue — not real delinquency. We soften the response.
 */
function isDelinquencyLikelySyncIssue(
  delinquency: StudentPortalDelinquency,
  payments: StudentPortalPayment[],
): boolean {
  if (!delinquency.isDelinquent) return false;
  return hasAsaasPaidButLocalPending(payments);
}

// ─── Main Consolidator ──────────────────────────────────────────

export function consolidatePortalStatus(
  data: StudentPortalData,
  profile: { planStatus?: string; planName?: string; planExpiresAt?: string },
): PortalStatusResult {
  const { subscription, payments, delinquency, contract } = data;
  const nextPayment = getNextPendingPayment(payments);
  const paymentLinkAvailable = hasPaymentLink(nextPayment);

  // ─── BLOCKED conditions (priority order) ───

  // 1. Delinquent with significant overdue
  if (delinquency.isDelinquent && delinquency.daysDelinquent > 0) {
    // Check if this might be a sync issue (Asaas received but local still pending)
    if (isDelinquencyLikelySyncIssue(delinquency, payments)) {
      // Soften to attention — there's evidence the student paid but webhook didn't sync
      return {
        status: 'attention',
        title: 'Pagamento em processamento',
        subtitle: 'Seu pagamento foi identificado, mas ainda está sendo processado. Se persistir, entre em contato com a academia.',
        dominantReason: 'payment_overdue_mild',
        ctaLabel: 'Falar com a academia',
        ctaAction: 'contact',
        nextPayment,
        hasPaymentLink: paymentLinkAvailable,
      };
    }

    return {
      status: 'blocked',
      title: 'Pendência financeira',
      subtitle: delinquency.overdueCount === 1
        ? 'Existe uma cobrança vencida impedindo seu acesso.'
        : `Existem ${delinquency.overdueCount} cobranças vencidas impedindo seu acesso.`,
      dominantReason: 'delinquent',
      ctaLabel: paymentLinkAvailable ? 'Pagar agora' : 'Ver situação financeira',
      ctaAction: paymentLinkAvailable ? 'pay' : 'contact',
      nextPayment,
      hasPaymentLink: paymentLinkAvailable,
    };
  }

  // 2. Subscription expired
  if (subscription && subscription.status === 'expired') {
    return {
      status: 'blocked',
      title: 'Assinatura expirada',
      subtitle: 'Sua assinatura expirou. Entre em contato com a academia para renovar.',
      dominantReason: 'subscription_expired',
      ctaLabel: 'Falar com a academia',
      ctaAction: 'contact',
      nextPayment,
      hasPaymentLink: paymentLinkAvailable,
    };
  }

  // 3. Subscription cancelled/inactive
  if (subscription && (subscription.status === 'cancelled' || subscription.status === 'inactive')) {
    return {
      status: 'blocked',
      title: 'Assinatura inativa',
      subtitle: 'Sua assinatura está inativa. Entre em contato com a academia.',
      dominantReason: 'subscription_inactive',
      ctaLabel: 'Falar com a academia',
      ctaAction: 'contact',
      nextPayment,
      hasPaymentLink: paymentLinkAvailable,
    };
  }

  // 4. No subscription at all and plan not active
  if (!subscription && profile.planStatus !== 'active') {
    return {
      status: 'blocked',
      title: 'Sem plano ativo',
      subtitle: 'Você não possui um plano ativo. Entre em contato com a academia.',
      dominantReason: 'no_subscription',
      ctaLabel: 'Falar com a academia',
      ctaAction: 'contact',
      nextPayment,
      hasPaymentLink: paymentLinkAvailable,
    };
  }

  // 5. Plan explicitly inactive (snapshot field)
  if (profile.planStatus === 'inactive' || profile.planStatus === 'expired') {
    return {
      status: 'blocked',
      title: 'Plano inativo',
      subtitle: 'Seu plano está inativo. Entre em contato com a academia para reativar.',
      dominantReason: 'plan_inactive',
      ctaLabel: 'Falar com a academia',
      ctaAction: 'contact',
      nextPayment,
      hasPaymentLink: paymentLinkAvailable,
    };
  }

  // ─── ATTENTION conditions ───

  // 1. Payment overdue but not yet blocking (delinquency not flagged or mild)
  if (nextPayment && daysUntil(nextPayment.dueDate) < 0) {
    return {
      status: 'attention',
      title: 'Pagamento vencido',
      subtitle: `Você tem uma cobrança vencida há ${Math.abs(daysUntil(nextPayment.dueDate))} dia(s). Regularize para evitar bloqueio.`,
      dominantReason: 'payment_overdue_mild',
      ctaLabel: paymentLinkAvailable ? 'Pagar agora' : 'Ver cobrança',
      ctaAction: 'pay',
      nextPayment,
      hasPaymentLink: paymentLinkAvailable,
    };
  }

  // 2. Payment due within 3 days
  if (nextPayment && daysUntil(nextPayment.dueDate) <= 3 && daysUntil(nextPayment.dueDate) >= 0) {
    const days = daysUntil(nextPayment.dueDate);
    return {
      status: 'attention',
      title: 'Vencimento próximo',
      subtitle: days === 0
        ? 'Seu pagamento vence hoje.'
        : days === 1
          ? 'Seu pagamento vence amanhã.'
          : `Seu pagamento vence em ${days} dias.`,
      dominantReason: 'payment_due_soon',
      ctaLabel: paymentLinkAvailable ? 'Pagar agora' : 'Ver cobrança',
      ctaAction: 'pay',
      nextPayment,
      hasPaymentLink: paymentLinkAvailable,
    };
  }

  // 3. Subscription expiring within 7 days
  if (subscription?.expiresAt) {
    const daysLeft = daysUntil(subscription.expiresAt);
    if (daysLeft >= 0 && daysLeft <= 7) {
      return {
        status: 'attention',
        title: 'Assinatura expirando',
        subtitle: daysLeft === 0
          ? 'Sua assinatura expira hoje.'
          : `Sua assinatura expira em ${daysLeft} dia(s).`,
        dominantReason: 'subscription_expiring_soon',
        ctaLabel: 'Falar com a academia',
        ctaAction: 'contact',
        nextPayment,
        hasPaymentLink: paymentLinkAvailable,
      };
    }
  }

  // 4. No contract accepted (soft attention)
  if (!contract) {
    return {
      status: 'attention',
      title: 'Contrato pendente',
      subtitle: 'Nenhum contrato foi aceito ainda. Verifique com a academia.',
      dominantReason: 'no_contract',
      ctaLabel: 'Ver QR de acesso',
      ctaAction: 'qr',
      nextPayment,
      hasPaymentLink: paymentLinkAvailable,
    };
  }

  // ─── ACTIVE ───

  const activeSubtitle = nextPayment
    ? `Próximo vencimento em ${formatDateShort(nextPayment.dueDate)}`
    : 'Seu acesso está liberado.';

  return {
    status: 'active',
    title: 'Seu acesso está liberado',
    subtitle: activeSubtitle,
    dominantReason: null,
    ctaLabel: 'Ver QR de acesso',
    ctaAction: 'qr',
    nextPayment,
    hasPaymentLink: paymentLinkAvailable,
  };
}

// ─── Format helpers ──────────────────────────────────────────────

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDateFull(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export function daysUntilDate(dateStr: string): number {
  return daysUntil(dateStr);
}
