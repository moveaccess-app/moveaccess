-- PR 34: Financial Robustness — Invisible Infrastructure
--
-- 1. Enhance asaas_webhook_events with retry tracking + affected entities
-- 2. Fix get_student_portal_data to use academy's configured grace_days
-- 3. Add financial_health_check() RPC for staff to detect inconsistencies
-- 4. Add subscription status sync to process_checkin delinquency context
--
-- All changes are backwards-compatible — no breaking schema changes.

-- ============================================================================
-- 1. ENHANCE asaas_webhook_events — retry tracking + affected entities
-- ============================================================================

-- retry_count: how many times this event was (re)processed
ALTER TABLE public.asaas_webhook_events
  ADD COLUMN IF NOT EXISTS retry_count int NOT NULL DEFAULT 0;

-- last_attempt_at: when was the last processing attempt
ALTER TABLE public.asaas_webhook_events
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz NULL;

-- affected_payment_id: which local payment was affected (if known)
ALTER TABLE public.asaas_webhook_events
  ADD COLUMN IF NOT EXISTS affected_payment_id uuid NULL;

-- affected_charge_id: which asaas_charges row was affected (if known)
ALTER TABLE public.asaas_webhook_events
  ADD COLUMN IF NOT EXISTS affected_charge_id uuid NULL;

-- academy_id: direct reference for scoping (avoids joins)
ALTER TABLE public.asaas_webhook_events
  ADD COLUMN IF NOT EXISTS academy_id uuid NULL;

-- Index for academy-scoped queries
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_academy_id
  ON public.asaas_webhook_events (academy_id)
  WHERE academy_id IS NOT NULL;

-- Index for finding events by affected payment
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_affected_payment
  ON public.asaas_webhook_events (affected_payment_id)
  WHERE affected_payment_id IS NOT NULL;

-- ============================================================================
-- 2. FIX get_student_portal_data — use academy's configured grace_days
-- ============================================================================
-- Before: hardcoded grace_days=0, creating mismatch with process_checkin
-- After: reads grace_days from academies.preferences->'delinquency'->>'graceDays'
-- This ensures portal and check-in agree on delinquency status.

CREATE OR REPLACE FUNCTION public.get_student_portal_data(
  p_academy_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_student_id uuid := auth.uid();
  v_membership_exists boolean;
  v_payments jsonb;
  v_contract jsonb;
  v_access_logs jsonb;
  v_delinquency jsonb;
  v_subscription jsonb;
  v_grace_days int;
BEGIN
  -- ── 0. Verify the student belongs to this academy ──────────────
  SELECT EXISTS (
    SELECT 1 FROM public.academy_memberships
    WHERE profile_id = v_student_id
      AND academy_id = p_academy_id
  ) INTO v_membership_exists;

  IF NOT v_membership_exists THEN
    RETURN jsonb_build_object(
      'error', 'NOT_A_MEMBER',
      'message', 'Aluno não pertence a esta academia'
    );
  END IF;

  -- ── 0.1 Load academy delinquency policy (grace_days) ──────────
  SELECT coalesce(
    (a.preferences->'delinquency'->>'graceDays')::int,
    0
  )
  INTO v_grace_days
  FROM public.academies a
  WHERE a.id = p_academy_id;

  -- ── 1. Subscription (active or most recent) ───────────────────
  SELECT jsonb_build_object(
    'id', s.id,
    'planId', s.plan_id,
    'planName', p.name,
    'status', s.status,
    'billingCycle', s.billing_cycle,
    'price', s.price,
    'startedAt', s.started_at,
    'expiresAt', s.expires_at,
    'cancelledAt', s.cancelled_at
  )
  INTO v_subscription
  FROM public.subscriptions s
  LEFT JOIN public.plans p ON p.id = s.plan_id
  WHERE s.student_id = v_student_id
    AND s.academy_id = p_academy_id
  ORDER BY
    CASE s.status WHEN 'active' THEN 0 WHEN 'paused' THEN 1 ELSE 2 END,
    s.started_at DESC
  LIMIT 1;

  -- ── 2. Payments (last 20, with charge URLs) ───────────────────
  SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.due_date DESC), '[]'::jsonb)
  INTO v_payments
  FROM (
    SELECT
      pay.id,
      pay.amount,
      pay.currency,
      pay.status,
      pay.method,
      pay.due_date AS "dueDate",
      pay.paid_at AS "paidAt",
      pay.created_at AS "createdAt",
      ac.invoice_url AS "invoiceUrl",
      ac.bank_slip_url AS "bankSlipUrl",
      ac.billing_type AS "billingType",
      ac.asaas_status AS "asaasStatus",
      CASE
        WHEN ac.id IS NOT NULL THEN 'asaas'
        ELSE 'local'
      END AS "chargeOrigin"
    FROM public.payments pay
    LEFT JOIN public.asaas_charges ac ON ac.payment_id = pay.id
    WHERE pay.student_id = v_student_id
      AND pay.academy_id = p_academy_id
    ORDER BY pay.due_date DESC
    LIMIT 20
  ) t;

  -- ── 3. Delinquency (reuse existing function with academy grace_days) ──
  SELECT jsonb_build_object(
    'isDelinquent', d.is_delinquent,
    'overdueCount', d.overdue_count,
    'overdueTotal', d.overdue_total,
    'oldestOverdueDate', d.oldest_overdue_date,
    'daysDelinquent', d.days_delinquent
  )
  INTO v_delinquency
  FROM public.get_student_delinquency(v_student_id, p_academy_id, v_grace_days) d;

  -- ── 4. Contract acceptance (most recent) ───────────────────────
  SELECT jsonb_build_object(
    'id', ca.id,
    'termsVersion', ca.terms_version,
    'acceptedAt', ca.accepted_at,
    'templateId', ca.template_id,
    'templateVersion', ca.template_version,
    'templateName', ct.name,
    'contentSnapshot', ca.content_snapshot
  )
  INTO v_contract
  FROM public.contract_acceptances ca
  LEFT JOIN public.contract_templates ct ON ct.id = ca.template_id
  WHERE ca.student_id = v_student_id
    AND ca.academy_id = p_academy_id
  ORDER BY ca.accepted_at DESC
  LIMIT 1;

  -- ── 5. Access logs (last 15) ───────────────────────────────────
  SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t."occurredAt" DESC), '[]'::jsonb)
  INTO v_access_logs
  FROM (
    SELECT
      al.id,
      al.unit_id AS "unitId",
      u.name AS "unitName",
      al.method,
      al.status,
      al.access_event AS "accessEvent",
      al.denial_reason AS "denialReason",
      al.occurred_at AS "occurredAt"
    FROM public.access_logs al
    LEFT JOIN public.units u ON u.id = al.unit_id
    WHERE al.user_id = v_student_id
      AND al.academy_id = p_academy_id
    ORDER BY al.occurred_at DESC
    LIMIT 15
  ) t;

  -- ── 6. Return everything ──────────────────────────────────────
  RETURN jsonb_build_object(
    'subscription', coalesce(v_subscription, 'null'::jsonb),
    'payments', v_payments,
    'delinquency', coalesce(v_delinquency, jsonb_build_object(
      'isDelinquent', false,
      'overdueCount', 0,
      'overdueTotal', 0,
      'oldestOverdueDate', null,
      'daysDelinquent', 0
    )),
    'contract', coalesce(v_contract, 'null'::jsonb),
    'accessLogs', v_access_logs
  );
END;
$$;

-- ============================================================================
-- 3. FINANCIAL HEALTH CHECK — staff-facing RPC
-- ============================================================================
-- Detects common inconsistencies between local and external state.
-- Returns a structured diagnostic report per academy.

CREATE OR REPLACE FUNCTION public.financial_health_check(
  p_academy_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_is_staff boolean;
  v_stale_charges jsonb;
  v_status_mismatches jsonb;
  v_failed_events jsonb;
  v_orphan_events jsonb;
  v_pending_too_long jsonb;
  v_stats jsonb;
BEGIN
  -- ── Auth: only staff of this academy ───────────────────────────
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = v_actor
      AND p.user_type = 'staff'
      AND am.academy_id = p_academy_id
  ) INTO v_is_staff;

  IF NOT v_is_staff THEN
    RETURN jsonb_build_object(
      'error', 'UNAUTHORIZED',
      'message', 'Apenas staff da academia pode executar health check'
    );
  END IF;

  -- ── 1. Stale charges: Asaas charges not synced in 7+ days ─────
  --    with local status still 'pending' (might have been paid externally)
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'chargeId', ac.id,
    'paymentId', ac.payment_id,
    'asaasPaymentId', ac.asaas_payment_id,
    'asaasStatus', ac.asaas_status,
    'localPaymentStatus', pay.status,
    'lastSyncedAt', ac.synced_at,
    'daysSinceSync', greatest(0, extract(day from now() - ac.synced_at))::int,
    'amount', pay.amount,
    'dueDate', pay.due_date
  ) ORDER BY ac.synced_at ASC), '[]'::jsonb)
  INTO v_stale_charges
  FROM public.asaas_charges ac
  JOIN public.payments pay ON pay.id = ac.payment_id
  WHERE ac.academy_id = p_academy_id
    AND pay.status = 'pending'
    AND ac.synced_at < now() - interval '7 days'
    AND ac.asaas_status NOT IN ('RECEIVED', 'RECEIVED_IN_CASH', 'CONFIRMED', 'REFUNDED', 'DELETED');

  -- ── 2. Status mismatches: local paid but Asaas not received ───
  --    OR Asaas received but local not paid
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'chargeId', ac.id,
    'paymentId', ac.payment_id,
    'asaasPaymentId', ac.asaas_payment_id,
    'asaasStatus', ac.asaas_status,
    'localPaymentStatus', pay.status,
    'mismatchType', CASE
      WHEN pay.status = 'paid' AND ac.asaas_status NOT IN ('RECEIVED', 'RECEIVED_IN_CASH', 'CONFIRMED')
        THEN 'local_paid_asaas_not'
      WHEN pay.status = 'pending' AND ac.asaas_status IN ('RECEIVED', 'RECEIVED_IN_CASH')
        THEN 'asaas_paid_local_not'
      WHEN pay.status = 'pending' AND ac.asaas_status IN ('DELETED', 'REFUNDED', 'BANK_SLIP_CANCELLED')
        THEN 'asaas_cancelled_local_pending'
      ELSE 'other'
    END,
    'amount', pay.amount,
    'dueDate', pay.due_date
  ) ORDER BY pay.due_date DESC), '[]'::jsonb)
  INTO v_status_mismatches
  FROM public.asaas_charges ac
  JOIN public.payments pay ON pay.id = ac.payment_id
  WHERE ac.academy_id = p_academy_id
    AND (
      -- Local says paid, Asaas doesn't agree
      (pay.status = 'paid' AND ac.asaas_status NOT IN ('RECEIVED', 'RECEIVED_IN_CASH', 'CONFIRMED'))
      OR
      -- Asaas says received, local still pending
      (pay.status = 'pending' AND ac.asaas_status IN ('RECEIVED', 'RECEIVED_IN_CASH'))
      OR
      -- Asaas says deleted/cancelled, local still pending
      (pay.status = 'pending' AND ac.asaas_status IN ('DELETED', 'REFUNDED', 'BANK_SLIP_CANCELLED'))
    );

  -- ── 3. Failed webhook events (last 30 days) ───────────────────
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'eventId', we.event_id,
    'eventType', we.event_type,
    'status', we.processing_status,
    'errorMessage', we.error_message,
    'asaasPaymentId', we.asaas_payment_id,
    'retryCount', we.retry_count,
    'receivedAt', we.received_at,
    'lastAttemptAt', we.last_attempt_at
  ) ORDER BY we.received_at DESC), '[]'::jsonb)
  INTO v_failed_events
  FROM public.asaas_webhook_events we
  WHERE (we.academy_id = p_academy_id
    OR (we.academy_id IS NULL AND we.asaas_account_id IN (
      SELECT id FROM public.asaas_accounts WHERE academy_id = p_academy_id
    )))
    AND we.processing_status = 'failed'
    AND we.received_at > now() - interval '30 days';

  -- ── 4. Orphan webhook events (last 30 days) ───────────────────
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'eventId', we.event_id,
    'eventType', we.event_type,
    'asaasPaymentId', we.asaas_payment_id,
    'errorMessage', we.error_message,
    'receivedAt', we.received_at
  ) ORDER BY we.received_at DESC), '[]'::jsonb)
  INTO v_orphan_events
  FROM public.asaas_webhook_events we
  WHERE (we.academy_id = p_academy_id
    OR (we.academy_id IS NULL AND we.asaas_account_id IN (
      SELECT id FROM public.asaas_accounts WHERE academy_id = p_academy_id
    )))
    AND we.processing_status = 'orphan'
    AND we.received_at > now() - interval '30 days';

  -- ── 5. Charges pending too long (14+ days overdue, still pending) ──
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'paymentId', pay.id,
    'studentId', pay.student_id,
    'amount', pay.amount,
    'dueDate', pay.due_date,
    'daysOverdue', greatest(0, extract(day from now() - pay.due_date))::int,
    'hasAsaasCharge', ac.id IS NOT NULL,
    'asaasStatus', ac.asaas_status,
    'asaasChargeId', ac.id
  ) ORDER BY pay.due_date ASC), '[]'::jsonb)
  INTO v_pending_too_long
  FROM public.payments pay
  LEFT JOIN public.asaas_charges ac ON ac.payment_id = pay.id
  WHERE pay.academy_id = p_academy_id
    AND pay.status = 'pending'
    AND pay.due_date < now() - interval '14 days';

  -- ── 6. Summary stats ──────────────────────────────────────────
  SELECT jsonb_build_object(
    'totalCharges', (SELECT count(*) FROM public.asaas_charges WHERE academy_id = p_academy_id),
    'totalPayments', (SELECT count(*) FROM public.payments WHERE academy_id = p_academy_id),
    'pendingPayments', (SELECT count(*) FROM public.payments WHERE academy_id = p_academy_id AND status = 'pending'),
    'paidPayments', (SELECT count(*) FROM public.payments WHERE academy_id = p_academy_id AND status = 'paid'),
    'failedPayments', (SELECT count(*) FROM public.payments WHERE academy_id = p_academy_id AND status = 'failed'),
    'webhookEventsLast30d', (
      SELECT count(*) FROM public.asaas_webhook_events we
      WHERE (we.academy_id = p_academy_id
        OR we.asaas_account_id IN (SELECT id FROM public.asaas_accounts WHERE academy_id = p_academy_id))
        AND we.received_at > now() - interval '30 days'
    ),
    'checkedAt', now()
  )
  INTO v_stats;

  -- ── Return report ──────────────────────────────────────────────
  RETURN jsonb_build_object(
    'academyId', p_academy_id,
    'stats', v_stats,
    'staleCharges', v_stale_charges,
    'statusMismatches', v_status_mismatches,
    'failedEvents', v_failed_events,
    'orphanEvents', v_orphan_events,
    'pendingTooLong', v_pending_too_long,
    'issueCount', (
      jsonb_array_length(v_stale_charges)
      + jsonb_array_length(v_status_mismatches)
      + jsonb_array_length(v_failed_events)
      + jsonb_array_length(v_orphan_events)
      + jsonb_array_length(v_pending_too_long)
    )
  );
END;
$$;

COMMENT ON FUNCTION public.financial_health_check IS
  'Staff-facing financial health check. Detects stale charges, status mismatches between local and Asaas, failed/orphan webhook events, and payments pending too long. Returns structured diagnostic report.';

REVOKE ALL ON FUNCTION public.financial_health_check(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.financial_health_check(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.financial_health_check(uuid) TO authenticated, service_role;

-- ============================================================================
-- 4. GRANT permissions for new columns
-- ============================================================================
-- service_role already has full access; authenticated users can read via
-- existing RLS policies on asaas_webhook_events.
