-- PR 17 — Student Portal v2: server-side RPC for student self-service data.
--
-- Creates a single SECURITY DEFINER function `get_student_portal_data` that
-- returns the student's own financial, contractual, and access data.
--
-- Security model:
--   - Only works for the authenticated user (auth.uid())
--   - SECURITY DEFINER bypasses RLS to read from payments, access_logs,
--     contract_acceptances, and asaas_charges
--   - Student can only see their own data — enforced by WHERE clauses
--   - Granted to authenticated role only

-- ═══════════════════════════════════════════════════════════════════
-- 1. get_student_portal_data — main aggregator
-- ═══════════════════════════════════════════════════════════════════

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

  -- ── 3. Delinquency (reuse existing function) ──────────────────
  SELECT jsonb_build_object(
    'isDelinquent', d.is_delinquent,
    'overdueCount', d.overdue_count,
    'overdueTotal', d.overdue_total,
    'oldestOverdueDate', d.oldest_overdue_date,
    'daysDelinquent', d.days_delinquent
  )
  INTO v_delinquency
  FROM public.get_student_delinquency(v_student_id, p_academy_id, 0) d;

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

COMMENT ON FUNCTION public.get_student_portal_data IS
  'Returns aggregated portal data for the authenticated student: subscription, payments, delinquency, contract, and access logs. SECURITY DEFINER — bypasses RLS, enforces student_id = auth.uid().';

-- ─── Permissions ─────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.get_student_portal_data(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_student_portal_data(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_student_portal_data(uuid) TO authenticated, service_role;
