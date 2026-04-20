import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface FinancialHealthCheckResult {
  academyId: string;
  stats: {
    totalCharges: number;
    totalPayments: number;
    pendingPayments: number;
    paidPayments: number;
    failedPayments: number;
    webhookEventsLast30d: number;
    checkedAt: string;
  };
  staleCharges: Array<{
    chargeId: string;
    paymentId: string;
    asaasPaymentId: string;
    asaasStatus: string;
    localPaymentStatus: string;
    lastSyncedAt: string;
    daysSinceSync: number;
    amount: number;
    dueDate: string;
  }>;
  statusMismatches: Array<{
    chargeId: string;
    paymentId: string;
    asaasPaymentId: string;
    asaasStatus: string;
    localPaymentStatus: string;
    mismatchType: string;
    amount: number;
    dueDate: string;
  }>;
  failedEvents: Array<{
    eventId: string;
    eventType: string;
    status: string;
    errorMessage: string | null;
    asaasPaymentId: string | null;
    retryCount: number;
    receivedAt: string;
    lastAttemptAt: string | null;
  }>;
  orphanEvents: Array<{
    eventId: string;
    eventType: string;
    asaasPaymentId: string | null;
    errorMessage: string | null;
    receivedAt: string;
  }>;
  pendingTooLong: Array<{
    paymentId: string;
    studentId: string;
    amount: number;
    dueDate: string;
    daysOverdue: number;
    hasAsaasCharge: boolean;
    asaasStatus: string | null;
    asaasChargeId: string | null;
  }>;
  issueCount: number;
  error?: string;
}

export async function runFinancialHealthCheck(
  academyId: string,
): Promise<FinancialHealthCheckResult> {
  const supabase = await createServerSupabaseClient();

  // RPC not in generated types until migration is applied — cast to bypass
  const { data, error } = await (supabase.rpc as CallableFunction)(
    'financial_health_check',
    { p_academy_id: academyId },
  );

  if (error) {
    throw new Error(`Health check failed: ${(error as { message: string }).message}`);
  }

  return data as FinancialHealthCheckResult;
}
