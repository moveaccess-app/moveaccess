// Use-case: Create a recurring subscription on Asaas from an existing local subscription.
//
// Flow:
//   1. Validate authorization (staff + academy membership)
//   2. Load the local subscription and validate eligibility
//   3. Check for existing external subscription link (idempotency)
//   4. Resolve Asaas account (unit > academy fallback)
//   5. Ensure customer is synced on Asaas
//   6. Map local billing cycle to Asaas cycle
//   7. Map local payment method to Asaas billingType
//   8. Create the subscription on Asaas
//   9. Persist the local subscription link (asaas_subscriptions)
//  10. Return typed result

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { resolveAsaasAccountServer, type ResolvedAccount } from './asaas-account-resolver';
import { getCredentialResolver } from './credential-resolver';
import { AsaasClient } from './asaas-client';
import { syncCustomer } from './sync-customer';
import { requireStaffForAcademy, AuthorizationError } from './auth';
import type {
  AsaasEnvironment,
  AsaasBillingType,
  AsaasSubscriptionCycle,
  AsaasSubscriptionStatus,
} from './types';

export { AuthorizationError };

// ─── Input / Output ──────────────────────────────────────────────

export interface CreateAsaasSubscriptionInput {
  subscriptionId: string;
  academyId: string;
  unitId?: string | null;
  environment: AsaasEnvironment;
  billingType: AsaasBillingType;
  /** Override value (optional). If omitted, uses local subscription price. */
  value?: number;
  /** Override nextDueDate (optional). If omitted, uses local subscription logic. */
  nextDueDate?: string;
  /** Optional description for Asaas. */
  description?: string;
  /** Optional end date for the subscription on Asaas. */
  endDate?: string;
  /** Optional max number of payment cycles. */
  maxPayments?: number;
}

export interface CreateAsaasSubscriptionResult {
  success: true;
  action: 'created' | 'already_exists';
  localSubscriptionLinkId: string;
  asaasSubscriptionId: string;
  asaasStatus: AsaasSubscriptionStatus;
  cycle: AsaasSubscriptionCycle;
  billingType: AsaasBillingType;
  value: number;
  nextDueDate: string | null;
  account: {
    id: string;
    source: ResolvedAccount['source'];
    isFallbackToAcademy: boolean;
  };
}

// ─── Errors ──────────────────────────────────────────────────────

export class SubscriptionNotEligibleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubscriptionNotEligibleError';
  }
}

// ─── Local subscription data ─────────────────────────────────────

interface LocalSubscription {
  id: string;
  academy_id: string;
  student_id: string;
  plan_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  billing_cycle: string;
  price: number;
}

async function loadLocalSubscription(
  subscriptionId: string,
  academyId: string,
): Promise<LocalSubscription> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, academy_id, student_id, plan_id, status, started_at, expires_at, billing_cycle, price')
    .eq('id', subscriptionId)
    .single();

  if (error || !data) {
    throw new Error(`Assinatura local ${subscriptionId} não encontrada.`);
  }

  const subscription = data as unknown as LocalSubscription;
  subscription.price = Number(subscription.price);

  if (subscription.academy_id !== academyId) {
    throw new AuthorizationError('Assinatura não pertence à academia informada.');
  }

  return subscription;
}

// ─── Eligibility validation ──────────────────────────────────────

const ELIGIBLE_LOCAL_STATUSES = new Set(['active']);

const LOCAL_CYCLE_TO_ASAAS: Record<string, AsaasSubscriptionCycle> = {
  monthly: 'MONTHLY',
  yearly: 'YEARLY',
};

const SUPPORTED_LOCAL_CYCLES = new Set(Object.keys(LOCAL_CYCLE_TO_ASAAS));

function validateEligibility(subscription: LocalSubscription): AsaasSubscriptionCycle {
  if (!ELIGIBLE_LOCAL_STATUSES.has(subscription.status)) {
    throw new SubscriptionNotEligibleError(
      `Assinatura local está com status "${subscription.status}". ` +
      `Apenas assinaturas ativas podem gerar assinatura recorrente no Asaas.`,
    );
  }

  if (!SUPPORTED_LOCAL_CYCLES.has(subscription.billing_cycle)) {
    const supported = Array.from(SUPPORTED_LOCAL_CYCLES).join(', ');
    throw new SubscriptionNotEligibleError(
      `Ciclo de cobrança "${subscription.billing_cycle}" não é suportado para recorrência no Asaas neste momento. ` +
      `Ciclos suportados: ${supported}.`,
    );
  }

  if (subscription.price <= 0) {
    throw new SubscriptionNotEligibleError(
      `Assinatura local possui preço ${subscription.price}. ` +
      `O Asaas exige valor positivo para criar assinatura recorrente.`,
    );
  }

  return LOCAL_CYCLE_TO_ASAAS[subscription.billing_cycle];
}

// ─── Billing type validation ─────────────────────────────────────

const SUPPORTED_BILLING_TYPES = new Set<AsaasBillingType>(['PIX', 'BOLETO', 'CREDIT_CARD']);

function validateBillingType(billingType: AsaasBillingType): void {
  if (!SUPPORTED_BILLING_TYPES.has(billingType)) {
    const supported = Array.from(SUPPORTED_BILLING_TYPES).join(', ');
    throw new SubscriptionNotEligibleError(
      `billingType "${billingType}" não é suportado para assinatura recorrente neste momento. ` +
      `Tipos suportados: ${supported}.`,
    );
  }
}

// ─── Existing link check ─────────────────────────────────────────

interface ExistingSubscriptionLink {
  id: string;
  asaas_subscription_id: string;
  asaas_status: string;
  billing_type: string;
  cycle: string;
  value: number;
  next_due_date: string | null;
  asaas_account_id: string;
}

async function findExistingLink(subscriptionId: string): Promise<ExistingSubscriptionLink | null> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('asaas_subscriptions')
    .select('id, asaas_subscription_id, asaas_status, billing_type, cycle, value, next_due_date, asaas_account_id')
    .eq('subscription_id', subscriptionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao verificar assinatura externa existente: ${error.message}`);
  }

  return data as unknown as ExistingSubscriptionLink | null;
}

// ─── Persist subscription link ───────────────────────────────────

async function persistSubscriptionLink(input: {
  subscriptionId: string;
  academyId: string;
  asaasAccountId: string;
  asaasCustomerLinkId: string;
  environment: AsaasEnvironment;
  asaasSubscriptionId: string;
  externalReference: string;
  asaasStatus: AsaasSubscriptionStatus;
  billingType: AsaasBillingType;
  cycle: AsaasSubscriptionCycle;
  value: number;
  nextDueDate: string | null;
  endDate: string | null;
  maxPayments: number | null;
  description: string;
}): Promise<string> {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('asaas_subscriptions')
    .insert({
      subscription_id: input.subscriptionId,
      academy_id: input.academyId,
      asaas_account_id: input.asaasAccountId,
      asaas_customer_id: input.asaasCustomerLinkId,
      environment: input.environment,
      asaas_subscription_id: input.asaasSubscriptionId,
      external_reference: input.externalReference,
      asaas_status: input.asaasStatus,
      billing_type: input.billingType,
      cycle: input.cycle,
      value: input.value,
      next_due_date: input.nextDueDate,
      end_date: input.endDate,
      max_payments: input.maxPayments,
      description: input.description,
      synced_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(
      `Erro ao persistir vínculo de assinatura externa: ${error?.message ?? 'unknown'}`,
    );
  }

  return (data as unknown as { id: string }).id;
}

// ─── Customer sync (reuses sync-customer) ────────────────────────

interface CustomerLinkResult {
  localLinkId: string;
  asaasCustomerId: string;
}

async function ensureCustomerSynced(input: {
  studentId: string;
  academyId: string;
  unitId?: string | null;
  environment: AsaasEnvironment;
}): Promise<CustomerLinkResult> {
  const result = await syncCustomer(input);
  return {
    localLinkId: result.localLinkId,
    asaasCustomerId: result.asaasCustomerId,
  };
}

// ─── External reference ──────────────────────────────────────────

function buildSubscriptionExternalReference(subscriptionId: string, academyId: string): string {
  // Asaas enforces max 100 chars for externalReference.
  // "subscription" (12 chars) would exceed limit with full UUIDs, so we use "sub" (3 chars).
  // Pattern: moveaccess:sub:{uuid}:academy:{uuid} = ~96 chars.
  return `moveaccess:sub:${subscriptionId}:academy:${academyId}`;
}

// ─── Due date logic ──────────────────────────────────────────────

function resolveNextDueDate(
  overrideNextDueDate: string | undefined,
  localSubscription: LocalSubscription,
): string {
  if (overrideNextDueDate) {
    return formatDate(overrideNextDueDate);
  }

  // Use the subscription's started_at if it's in the future,
  // otherwise use today (Asaas doesn't accept past dates for nextDueDate).
  const now = new Date();
  const startedAt = new Date(localSubscription.started_at);

  if (startedAt > now) {
    return formatDate(localSubscription.started_at);
  }

  // Default: today's date
  return formatDate(now.toISOString());
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    throw new Error(`Data inválida: "${dateStr}"`);
  }
  return d.toISOString().split('T')[0];
}

// ─── Main use-case ───────────────────────────────────────────────

export async function createAsaasSubscription(
  input: CreateAsaasSubscriptionInput,
): Promise<CreateAsaasSubscriptionResult> {
  // 1. Validate authorization
  await requireStaffForAcademy(input.academyId);

  // 2. Load and validate local subscription
  const localSub = await loadLocalSubscription(input.subscriptionId, input.academyId);

  // 3. Validate eligibility (status, cycle, price)
  const asaasCycle = validateEligibility(localSub);

  // 4. Validate billing type
  validateBillingType(input.billingType);

  // 5. Check for existing link (idempotency — no silent duplication)
  const existingLink = await findExistingLink(localSub.id);

  if (existingLink) {
    return {
      success: true,
      action: 'already_exists',
      localSubscriptionLinkId: existingLink.id,
      asaasSubscriptionId: existingLink.asaas_subscription_id,
      asaasStatus: existingLink.asaas_status as AsaasSubscriptionStatus,
      cycle: existingLink.cycle as AsaasSubscriptionCycle,
      billingType: existingLink.billing_type as AsaasBillingType,
      value: Number(existingLink.value),
      nextDueDate: existingLink.next_due_date,
      account: {
        id: existingLink.asaas_account_id,
        source: 'academy',
        isFallbackToAcademy: false,
      },
    };
  }

  // 6. Resolve Asaas account
  const resolvedAccount = await resolveAsaasAccountServer({
    academyId: input.academyId,
    unitId: input.unitId,
    environment: input.environment,
  });

  // 7. Ensure customer is synced
  const customerLink = await ensureCustomerSynced({
    studentId: localSub.student_id,
    academyId: input.academyId,
    unitId: input.unitId,
    environment: input.environment,
  });

  // 8. Resolve credential and build client
  const credentialResolver = getCredentialResolver();
  const apiKey = await credentialResolver.resolve(resolvedAccount.apiKeyReference);
  const client = new AsaasClient(apiKey, input.environment);

  // 9. Build payload
  const externalReference = buildSubscriptionExternalReference(localSub.id, input.academyId);
  const subscriptionValue = input.value ?? localSub.price;
  const nextDueDate = resolveNextDueDate(input.nextDueDate, localSub);

  const asaasResponse = await client.createSubscription({
    customer: customerLink.asaasCustomerId,
    billingType: input.billingType,
    value: subscriptionValue,
    nextDueDate,
    cycle: asaasCycle,
    description: input.description ?? `MoveAccess — Assinatura ${localSub.id.slice(0, 8)}`,
    endDate: input.endDate,
    maxPayments: input.maxPayments,
    externalReference,
  });

  // 10. Persist local link
  const linkId = await persistSubscriptionLink({
    subscriptionId: localSub.id,
    academyId: input.academyId,
    asaasAccountId: resolvedAccount.id,
    asaasCustomerLinkId: customerLink.localLinkId,
    environment: input.environment,
    asaasSubscriptionId: asaasResponse.id,
    externalReference,
    asaasStatus: asaasResponse.status,
    billingType: asaasResponse.billingType,
    cycle: asaasResponse.cycle,
    value: asaasResponse.value,
    nextDueDate: asaasResponse.nextDueDate ?? null,
    endDate: asaasResponse.endDate ?? null,
    maxPayments: asaasResponse.maxPayments ?? null,
    description: asaasResponse.description ?? '',
  });

  return {
    success: true,
    action: 'created',
    localSubscriptionLinkId: linkId,
    asaasSubscriptionId: asaasResponse.id,
    asaasStatus: asaasResponse.status,
    cycle: asaasResponse.cycle,
    billingType: asaasResponse.billingType,
    value: asaasResponse.value,
    nextDueDate: asaasResponse.nextDueDate ?? null,
    account: {
      id: resolvedAccount.id,
      source: resolvedAccount.source,
      isFallbackToAcademy: resolvedAccount.isFallbackToAcademy,
    },
  };
}
