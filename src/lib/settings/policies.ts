import { z } from 'zod';

export interface DelinquencyPolicy {
  blockAccess: boolean;
  graceDays: number;
}

export interface BillingAutomationPolicy {
  dueReminder: {
    enabled: boolean;
    daysBeforeDue: number;
  };
  overdueNotice: {
    enabled: boolean;
    daysAfterDue: number;
  };
  preBlock: {
    enabled: boolean;
    daysBeforeBlock: number;
  };
  escalation: {
    enabled: boolean;
    daysOverdue: number;
  };
  subscriptionExpiring: {
    enabled: boolean;
    daysBeforeExpiry: number;
  };
  paymentConfirmed: {
    enabled: boolean;
  };
  regularization: {
    enabled: boolean;
  };
  reactivation: {
    enabled: boolean;
    minDaysSinceLoss: number;
    maxDaysSinceLoss: number;
  };
}

export interface BillingPolicies {
  delinquency: DelinquencyPolicy;
  billing: BillingAutomationPolicy;
}

export const DELINQUENCY_POLICY_DEFAULTS: DelinquencyPolicy = {
  blockAccess: false,
  graceDays: 0,
};

export const BILLING_AUTOMATION_POLICY_DEFAULTS: BillingAutomationPolicy = {
  dueReminder: {
    enabled: true,
    daysBeforeDue: 3,
  },
  overdueNotice: {
    enabled: true,
    daysAfterDue: 1,
  },
  preBlock: {
    enabled: true,
    daysBeforeBlock: 1,
  },
  escalation: {
    enabled: true,
    daysOverdue: 14,
  },
  subscriptionExpiring: {
    enabled: true,
    daysBeforeExpiry: 7,
  },
  paymentConfirmed: {
    enabled: true,
  },
  regularization: {
    enabled: true,
  },
  reactivation: {
    enabled: true,
    minDaysSinceLoss: 0,
    maxDaysSinceLoss: 90,
  },
};

export const BILLING_POLICIES_DEFAULTS: BillingPolicies = {
  delinquency: DELINQUENCY_POLICY_DEFAULTS,
  billing: BILLING_AUTOMATION_POLICY_DEFAULTS,
};

const delinquencyPolicySchema = z.object({
  blockAccess: z.boolean(),
  graceDays: z.number().int().min(0).max(365),
});

const billingAutomationPolicySchema = z.object({
  dueReminder: z.object({
    enabled: z.boolean(),
    daysBeforeDue: z.number().int().min(0).max(30),
  }),
  overdueNotice: z.object({
    enabled: z.boolean(),
    daysAfterDue: z.number().int().min(1).max(60),
  }),
  preBlock: z.object({
    enabled: z.boolean(),
    daysBeforeBlock: z.number().int().min(0).max(30),
  }),
  escalation: z.object({
    enabled: z.boolean(),
    daysOverdue: z.number().int().min(2).max(120),
  }),
  subscriptionExpiring: z.object({
    enabled: z.boolean(),
    daysBeforeExpiry: z.number().int().min(1).max(60),
  }),
  paymentConfirmed: z.object({
    enabled: z.boolean(),
  }),
  regularization: z.object({
    enabled: z.boolean(),
  }),
  reactivation: z.object({
    enabled: z.boolean(),
    minDaysSinceLoss: z.number().int().min(0).max(365),
    maxDaysSinceLoss: z.number().int().min(0).max(365),
  }),
});

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function readInt(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

function buildNormalizedBillingAutomationPolicy(
  value: unknown,
  delinquency: DelinquencyPolicy,
): BillingAutomationPolicy {
  const raw = asRecord(value);
  const dueReminder = asRecord(raw.dueReminder);
  const overdueNotice = asRecord(raw.overdueNotice);
  const preBlock = asRecord(raw.preBlock);
  const escalation = asRecord(raw.escalation);
  const subscriptionExpiring = asRecord(raw.subscriptionExpiring);
  const paymentConfirmed = asRecord(raw.paymentConfirmed);
  const regularization = asRecord(raw.regularization);
  const reactivation = asRecord(raw.reactivation);

  const normalized: BillingAutomationPolicy = {
    dueReminder: {
      enabled: readBoolean(
        dueReminder.enabled,
        BILLING_AUTOMATION_POLICY_DEFAULTS.dueReminder.enabled,
      ),
      daysBeforeDue: readInt(
        dueReminder.daysBeforeDue,
        BILLING_AUTOMATION_POLICY_DEFAULTS.dueReminder.daysBeforeDue,
        0,
        30,
      ),
    },
    overdueNotice: {
      enabled: readBoolean(
        overdueNotice.enabled,
        BILLING_AUTOMATION_POLICY_DEFAULTS.overdueNotice.enabled,
      ),
      daysAfterDue: readInt(
        overdueNotice.daysAfterDue,
        BILLING_AUTOMATION_POLICY_DEFAULTS.overdueNotice.daysAfterDue,
        1,
        60,
      ),
    },
    preBlock: {
      enabled: readBoolean(
        preBlock.enabled,
        BILLING_AUTOMATION_POLICY_DEFAULTS.preBlock.enabled,
      ),
      daysBeforeBlock: readInt(
        preBlock.daysBeforeBlock,
        BILLING_AUTOMATION_POLICY_DEFAULTS.preBlock.daysBeforeBlock,
        0,
        30,
      ),
    },
    escalation: {
      enabled: readBoolean(
        escalation.enabled,
        BILLING_AUTOMATION_POLICY_DEFAULTS.escalation.enabled,
      ),
      daysOverdue: readInt(
        escalation.daysOverdue,
        BILLING_AUTOMATION_POLICY_DEFAULTS.escalation.daysOverdue,
        2,
        120,
      ),
    },
    subscriptionExpiring: {
      enabled: readBoolean(
        subscriptionExpiring.enabled,
        BILLING_AUTOMATION_POLICY_DEFAULTS.subscriptionExpiring.enabled,
      ),
      daysBeforeExpiry: readInt(
        subscriptionExpiring.daysBeforeExpiry,
        BILLING_AUTOMATION_POLICY_DEFAULTS.subscriptionExpiring.daysBeforeExpiry,
        1,
        60,
      ),
    },
    paymentConfirmed: {
      enabled: readBoolean(
        paymentConfirmed.enabled,
        BILLING_AUTOMATION_POLICY_DEFAULTS.paymentConfirmed.enabled,
      ),
    },
    regularization: {
      enabled: readBoolean(
        regularization.enabled,
        BILLING_AUTOMATION_POLICY_DEFAULTS.regularization.enabled,
      ),
    },
    reactivation: {
      enabled: readBoolean(
        reactivation.enabled,
        BILLING_AUTOMATION_POLICY_DEFAULTS.reactivation.enabled,
      ),
      minDaysSinceLoss: readInt(
        reactivation.minDaysSinceLoss,
        BILLING_AUTOMATION_POLICY_DEFAULTS.reactivation.minDaysSinceLoss,
        0,
        365,
      ),
      maxDaysSinceLoss: readInt(
        reactivation.maxDaysSinceLoss,
        BILLING_AUTOMATION_POLICY_DEFAULTS.reactivation.maxDaysSinceLoss,
        0,
        365,
      ),
    },
  };

  if (!delinquency.blockAccess) {
    normalized.preBlock.enabled = false;
  }

  normalized.preBlock.daysBeforeBlock = Math.min(
    normalized.preBlock.daysBeforeBlock,
    delinquency.graceDays,
  );

  if (
    normalized.overdueNotice.enabled
    && normalized.escalation.enabled
    && normalized.escalation.daysOverdue <= normalized.overdueNotice.daysAfterDue
  ) {
    normalized.escalation.daysOverdue = normalized.overdueNotice.daysAfterDue + 1;
  }

  if (
    normalized.reactivation.maxDaysSinceLoss
    < normalized.reactivation.minDaysSinceLoss
  ) {
    normalized.reactivation.maxDaysSinceLoss = normalized.reactivation.minDaysSinceLoss;
  }

  return billingAutomationPolicySchema.parse(normalized);
}

export function normalizeDelinquencyPolicy(value: unknown): DelinquencyPolicy {
  const raw = asRecord(value);

  return delinquencyPolicySchema.parse({
    blockAccess: readBoolean(raw.blockAccess, DELINQUENCY_POLICY_DEFAULTS.blockAccess),
    graceDays: readInt(raw.graceDays, DELINQUENCY_POLICY_DEFAULTS.graceDays, 0, 365),
  });
}

export function normalizeBillingAutomationPolicy(
  value: unknown,
  delinquency: DelinquencyPolicy = DELINQUENCY_POLICY_DEFAULTS,
): BillingAutomationPolicy {
  return buildNormalizedBillingAutomationPolicy(value, delinquency);
}

export function getEffectiveBillingPolicies(
  preferences: { delinquency?: unknown; billing?: unknown } | null | undefined,
): BillingPolicies {
  const raw = asRecord(preferences);
  const delinquency = normalizeDelinquencyPolicy(raw.delinquency);

  return {
    delinquency,
    billing: normalizeBillingAutomationPolicy(raw.billing, delinquency),
  };
}

export function validateBillingPolicies(
  value: BillingPolicies,
): { success: true; policies: BillingPolicies } | { success: false; error: string } {
  const delinquencyResult = delinquencyPolicySchema.safeParse(value.delinquency);

  if (!delinquencyResult.success) {
    return {
      success: false,
      error: 'Configuração de inadimplência inválida.',
    };
  }

  const billingResult = billingAutomationPolicySchema.safeParse(value.billing);

  if (!billingResult.success) {
    return {
      success: false,
      error: 'Configuração de cobrança e automações inválida.',
    };
  }

  const policies: BillingPolicies = {
    delinquency: delinquencyResult.data,
    billing: billingResult.data,
  };

  if (!policies.delinquency.blockAccess && policies.billing.preBlock.enabled) {
    return {
      success: false,
      error: 'Ative o bloqueio por inadimplência para usar alertas de pré-bloqueio.',
    };
  }

  if (
    policies.billing.preBlock.enabled
    && policies.billing.preBlock.daysBeforeBlock > policies.delinquency.graceDays
  ) {
    return {
      success: false,
      error: 'O pré-bloqueio não pode começar antes da janela de tolerância configurada.',
    };
  }

  if (
    policies.billing.overdueNotice.enabled
    && policies.billing.escalation.enabled
    && policies.billing.escalation.daysOverdue <= policies.billing.overdueNotice.daysAfterDue
  ) {
    return {
      success: false,
      error: 'A escalada precisa acontecer depois do primeiro aviso de atraso.',
    };
  }

  if (
    policies.billing.reactivation.minDaysSinceLoss
    > policies.billing.reactivation.maxDaysSinceLoss
  ) {
    return {
      success: false,
      error: 'A janela mínima de reativação precisa ser menor ou igual à máxima.',
    };
  }

  return {
    success: true,
    policies,
  };
}