-- ============================================================
-- PR 35 — Automations Premium: Cobrança, Reativação e Churn Prevention
-- ============================================================
--
-- 1. automation_actions table — lifecycle tracking for all automation events
-- 2. Extend notification_logs.type to support new notification types
-- 3. New RPCs: escalation, subscription_expiring, reactivation, regularization
-- 4. Auto-resolution function: resolve actions when payment is received
-- 5. Academy automation preferences
-- ============================================================

-- ============================================================================
-- 1. AUTOMATION_ACTIONS — lifecycle tracking for automations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.automation_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id      UUID NOT NULL REFERENCES public.academies(id),
  student_id      UUID NOT NULL,

  -- What triggered this automation
  trigger_type    TEXT NOT NULL CHECK (trigger_type IN (
    'payment_due_soon',       -- D-3: payment about to be due
    'payment_overdue',        -- D+1 to D+7: recently overdue
    'payment_escalation',     -- D+14+: persistent overdue
    'pre_block_warning',      -- approaching access block
    'subscription_expiring',  -- subscription about to expire
    'regularization',         -- student went from delinquent → regular
    'reactivation',           -- cancelled/expired student eligible for win-back
    'payment_confirmed'       -- payment was received (resolution event)
  )),

  -- Entity that caused the trigger
  entity_type     TEXT NOT NULL CHECK (entity_type IN ('payment', 'subscription', 'student')),
  entity_id       UUID NOT NULL,

  -- Lifecycle stage
  stage           TEXT NOT NULL CHECK (stage IN (
    'reminder',       -- gentle pre-due reminder
    'first_notice',   -- first overdue notice
    'escalation',     -- persistent overdue escalation
    'pre_block',      -- about to lose access
    'resolved',       -- situation was resolved
    'reactivation',   -- win-back outreach
    'confirmation'    -- payment received confirmation
  )),

  -- Current status of this action
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',        -- created, awaiting execution
    'executed',       -- action was executed (email sent, etc.)
    'resolved',       -- situation resolved (payment received, etc.)
    'cancelled',      -- cancelled (no longer needed)
    'failed',         -- execution failed
    'skipped'         -- skipped (e.g., no email, duplicate, etc.)
  )),

  -- Channel used (or intended)
  channel         TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'internal')),

  -- Link to the actual notification sent (if any)
  notification_log_id UUID NULL,

  -- Idempotency key — prevents duplicate actions
  idempotency_key TEXT NOT NULL,

  -- Rich payload with template data, reason codes, etc.
  payload         JSONB NULL,

  -- Resolution tracking
  resolved_at     TIMESTAMPTZ NULL,
  resolved_reason TEXT NULL CHECK (resolved_reason IN (
    'payment_received',
    'manual_resolution',
    'subscription_reactivated',
    'student_regularized',
    'superseded',
    NULL
  )),

  -- Execution tracking
  executed_at     TIMESTAMPTZ NULL,
  error_message   TEXT NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_automation_idempotency UNIQUE (idempotency_key)
);

-- Indices for common queries
CREATE INDEX IF NOT EXISTS idx_automation_actions_academy
  ON public.automation_actions (academy_id);

CREATE INDEX IF NOT EXISTS idx_automation_actions_student
  ON public.automation_actions (student_id);

CREATE INDEX IF NOT EXISTS idx_automation_actions_status
  ON public.automation_actions (status)
  WHERE status IN ('pending', 'executed');

CREATE INDEX IF NOT EXISTS idx_automation_actions_trigger_type
  ON public.automation_actions (trigger_type, status);

CREATE INDEX IF NOT EXISTS idx_automation_actions_entity
  ON public.automation_actions (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_automation_actions_created
  ON public.automation_actions (created_at DESC);

-- RLS: staff can read their academy's actions
ALTER TABLE public.automation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY automation_actions_staff_read ON public.automation_actions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_memberships am
      JOIN public.profiles p ON p.id = am.profile_id
      WHERE am.profile_id = auth.uid()
        AND am.academy_id = automation_actions.academy_id
        AND p.user_type = 'staff'
    )
  );

-- service_role can do everything (used by cron/automation engine)
CREATE POLICY automation_actions_service_all ON public.automation_actions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 2. EXTEND notification_logs.type CHECK to include new types
-- ============================================================================

ALTER TABLE public.notification_logs
  DROP CONSTRAINT IF EXISTS notification_logs_type_check;

ALTER TABLE public.notification_logs
  ADD CONSTRAINT notification_logs_type_check CHECK (type IN (
    'invite',
    'due_reminder',
    'overdue_notice',
    'pre_block',
    'escalation',
    'subscription_expiring',
    'regularization',
    'reactivation_offer',
    'payment_confirmed'
  ));

-- Also extend entity_type to support 'subscription'
ALTER TABLE public.notification_logs
  DROP CONSTRAINT IF EXISTS notification_logs_entity_type_check;

ALTER TABLE public.notification_logs
  ADD CONSTRAINT notification_logs_entity_type_check CHECK (entity_type IN (
    'invite', 'payment', 'student', 'subscription'
  ));

-- ============================================================================
-- 3. NEW RPCs — Escalation candidates (D+14+)
-- ============================================================================
-- Payments overdue by 14+ days, still pending, no escalation sent yet.

CREATE OR REPLACE FUNCTION find_escalation_candidates()
RETURNS TABLE (
  payment_id      UUID,
  student_id      UUID,
  academy_id      UUID,
  student_name    TEXT,
  student_email   TEXT,
  plan_name       TEXT,
  amount          NUMERIC(12,2),
  due_date        TIMESTAMPTZ,
  days_overdue    INT,
  invoice_url     TEXT,
  bank_slip_url   TEXT,
  academy_name    TEXT,
  total_overdue   NUMERIC(12,2),
  overdue_count   INT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.id              AS payment_id,
    p.student_id,
    p.academy_id,
    pr.name           AS student_name,
    pr.email          AS student_email,
    pl.name           AS plan_name,
    p.amount,
    p.due_date,
    (CURRENT_DATE - p.due_date::date)::int AS days_overdue,
    ac.invoice_url,
    ac.bank_slip_url,
    a.trade_name      AS academy_name,
    -- Aggregated student totals via lateral
    student_totals.total_overdue,
    student_totals.overdue_count
  FROM payments p
  JOIN profiles pr     ON pr.id = p.student_id
  JOIN academies a     ON a.id  = p.academy_id
  LEFT JOIN subscriptions s ON s.id = p.subscription_id
  LEFT JOIN plans pl   ON pl.id = s.plan_id
  LEFT JOIN asaas_charges ac ON ac.payment_id = p.id
  CROSS JOIN LATERAL (
    SELECT
      COALESCE(SUM(p2.amount), 0) AS total_overdue,
      COUNT(*)::int AS overdue_count
    FROM payments p2
    WHERE p2.student_id = p.student_id
      AND p2.academy_id = p.academy_id
      AND p2.status = 'pending'
      AND p2.due_date::date < CURRENT_DATE
  ) student_totals
  WHERE p.status = 'pending'
    AND p.due_date::date < CURRENT_DATE
    AND (CURRENT_DATE - p.due_date::date) >= 14
    AND pr.email IS NOT NULL
    AND pr.email <> ''
    -- No escalation already sent for this payment
    AND NOT EXISTS (
      SELECT 1 FROM notification_logs nl
      WHERE nl.idempotency_key = 'escalation:' || p.id::text
        AND nl.status = 'sent'
    )
    -- No automation action already created
    AND NOT EXISTS (
      SELECT 1 FROM automation_actions aa
      WHERE aa.idempotency_key = 'escalation:' || p.id::text
        AND aa.status IN ('executed', 'resolved')
    )
  ORDER BY p.due_date ASC;
$$;

-- ============================================================================
-- 4. Subscription expiring candidates (D-7)
-- ============================================================================
-- Active subscriptions expiring within 7 days, no notification sent.

CREATE OR REPLACE FUNCTION find_subscription_expiring_candidates()
RETURNS TABLE (
  subscription_id UUID,
  student_id      UUID,
  academy_id      UUID,
  student_name    TEXT,
  student_email   TEXT,
  plan_name       TEXT,
  price           NUMERIC(12,2),
  expires_at      TIMESTAMPTZ,
  days_remaining  INT,
  academy_name    TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    s.id              AS subscription_id,
    s.student_id,
    s.academy_id,
    pr.name           AS student_name,
    pr.email          AS student_email,
    pl.name           AS plan_name,
    s.price,
    s.expires_at,
    (s.expires_at::date - CURRENT_DATE)::int AS days_remaining,
    a.trade_name      AS academy_name
  FROM subscriptions s
  JOIN profiles pr   ON pr.id = s.student_id
  JOIN plans pl      ON pl.id = s.plan_id
  JOIN academies a   ON a.id  = s.academy_id
  WHERE s.status = 'active'
    AND s.expires_at IS NOT NULL
    AND s.expires_at::date > CURRENT_DATE
    AND (s.expires_at::date - CURRENT_DATE) <= 7
    AND pr.email IS NOT NULL
    AND pr.email <> ''
    -- No subscription_expiring notification sent
    AND NOT EXISTS (
      SELECT 1 FROM notification_logs nl
      WHERE nl.idempotency_key = 'sub_expiring:' || s.id::text
        AND nl.status = 'sent'
    )
  ORDER BY s.expires_at ASC;
$$;

-- ============================================================================
-- 5. Reactivation candidates
-- ============================================================================
-- Students whose subscription was cancelled/expired within the last 90 days,
-- who don't have an active/paused subscription now, and haven't been
-- contacted for reactivation this month.

CREATE OR REPLACE FUNCTION find_reactivation_candidates()
RETURNS TABLE (
  student_id          UUID,
  academy_id          UUID,
  student_name        TEXT,
  student_email       TEXT,
  plan_name           TEXT,
  last_subscription_status TEXT,
  cancelled_or_expired_at  TIMESTAMPTZ,
  days_since_loss     INT,
  last_paid_amount    NUMERIC(12,2),
  academy_name        TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT ON (s.student_id, s.academy_id)
    s.student_id,
    s.academy_id,
    pr.name           AS student_name,
    pr.email          AS student_email,
    pl.name           AS plan_name,
    s.status          AS last_subscription_status,
    COALESCE(s.cancelled_at, s.updated_at) AS cancelled_or_expired_at,
    (CURRENT_DATE - COALESCE(s.cancelled_at, s.updated_at)::date)::int AS days_since_loss,
    (
      SELECT p2.amount FROM payments p2
      WHERE p2.student_id = s.student_id
        AND p2.academy_id = s.academy_id
        AND p2.status = 'paid'
      ORDER BY p2.paid_at DESC
      LIMIT 1
    ) AS last_paid_amount,
    a.trade_name      AS academy_name
  FROM subscriptions s
  JOIN profiles pr   ON pr.id = s.student_id
  JOIN plans pl      ON pl.id = s.plan_id
  JOIN academies a   ON a.id  = s.academy_id
  WHERE s.status IN ('cancelled', 'expired')
    -- Within 90-day reactivation window
    AND COALESCE(s.cancelled_at, s.updated_at) > (now() - interval '90 days')
    -- No current active/paused subscription
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions s2
      WHERE s2.student_id = s.student_id
        AND s2.academy_id = s.academy_id
        AND s2.status IN ('active', 'paused')
    )
    -- Student has email
    AND pr.email IS NOT NULL
    AND pr.email <> ''
    -- Not contacted for reactivation this month
    AND NOT EXISTS (
      SELECT 1 FROM automation_actions aa
      WHERE aa.student_id = s.student_id
        AND aa.academy_id = s.academy_id
        AND aa.trigger_type = 'reactivation'
        AND aa.status IN ('executed', 'pending')
        AND aa.created_at > date_trunc('month', CURRENT_DATE)
    )
  ORDER BY s.student_id, s.academy_id, COALESCE(s.cancelled_at, s.updated_at) DESC;
$$;

-- ============================================================================
-- 6. Recently regularized students
-- ============================================================================
-- Students who had automation actions (overdue/escalation/pre_block)
-- but now have NO pending overdue payments. Used to auto-resolve.

CREATE OR REPLACE FUNCTION find_recently_regularized_students()
RETURNS TABLE (
  student_id    UUID,
  academy_id    UUID,
  student_name  TEXT,
  student_email TEXT,
  academy_name  TEXT,
  pending_action_count INT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    aa.student_id,
    aa.academy_id,
    pr.name       AS student_name,
    pr.email      AS student_email,
    a.trade_name  AS academy_name,
    COUNT(*)::int AS pending_action_count
  FROM automation_actions aa
  JOIN profiles pr   ON pr.id = aa.student_id
  JOIN academies a   ON a.id  = aa.academy_id
  WHERE aa.status IN ('pending', 'executed')
    AND aa.trigger_type IN ('payment_overdue', 'payment_escalation', 'pre_block_warning')
    -- This student has NO overdue payments anymore
    AND NOT EXISTS (
      SELECT 1 FROM payments p
      WHERE p.student_id = aa.student_id
        AND p.academy_id = aa.academy_id
        AND p.status = 'pending'
        AND p.due_date::date < CURRENT_DATE
    )
  GROUP BY aa.student_id, aa.academy_id, pr.name, pr.email, a.trade_name;
$$;

-- ============================================================================
-- 7. Auto-resolve actions for a specific payment
-- ============================================================================
-- Called when a payment is received (via webhook) to cancel pending automations.

CREATE OR REPLACE FUNCTION resolve_automation_actions_for_payment(
  p_payment_id UUID
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_resolved_count INT;
BEGIN
  UPDATE automation_actions
  SET
    status = 'resolved',
    resolved_at = now(),
    resolved_reason = 'payment_received',
    updated_at = now()
  WHERE entity_type = 'payment'
    AND entity_id = p_payment_id
    AND status IN ('pending', 'executed');

  GET DIAGNOSTICS v_resolved_count = ROW_COUNT;
  RETURN v_resolved_count;
END;
$$;

-- ============================================================================
-- 8. Bulk resolve for a student (when all payments are regularized)
-- ============================================================================

CREATE OR REPLACE FUNCTION resolve_automation_actions_for_student(
  p_student_id UUID,
  p_academy_id UUID
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_resolved_count INT;
BEGIN
  UPDATE automation_actions
  SET
    status = 'resolved',
    resolved_at = now(),
    resolved_reason = 'student_regularized',
    updated_at = now()
  WHERE student_id = p_student_id
    AND academy_id = p_academy_id
    AND status IN ('pending', 'executed')
    AND trigger_type IN ('payment_overdue', 'payment_escalation', 'pre_block_warning');

  GET DIAGNOSTICS v_resolved_count = ROW_COUNT;
  RETURN v_resolved_count;
END;
$$;

-- ============================================================================
-- 9. Automation summary view (staff-facing)
-- ============================================================================

CREATE OR REPLACE VIEW public.automation_summary_view AS
SELECT
  aa.academy_id,
  aa.trigger_type,
  aa.stage,
  aa.status,
  COUNT(*)::int AS action_count,
  MIN(aa.created_at) AS oldest_action,
  MAX(aa.created_at) AS newest_action
FROM public.automation_actions aa
WHERE aa.created_at > now() - interval '30 days'
GROUP BY aa.academy_id, aa.trigger_type, aa.stage, aa.status;

-- RLS on the view is inherited from the underlying table query
-- but we grant SELECT to authenticated
GRANT SELECT ON public.automation_summary_view TO authenticated;

-- ============================================================================
-- 10. Permissions
-- ============================================================================

REVOKE ALL ON FUNCTION find_escalation_candidates() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION find_escalation_candidates() TO service_role;

REVOKE ALL ON FUNCTION find_subscription_expiring_candidates() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION find_subscription_expiring_candidates() TO service_role;

REVOKE ALL ON FUNCTION find_reactivation_candidates() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION find_reactivation_candidates() TO service_role;

REVOKE ALL ON FUNCTION find_recently_regularized_students() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION find_recently_regularized_students() TO service_role;

REVOKE ALL ON FUNCTION resolve_automation_actions_for_payment(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION resolve_automation_actions_for_payment(UUID) TO service_role;

REVOKE ALL ON FUNCTION resolve_automation_actions_for_student(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION resolve_automation_actions_for_student(UUID, UUID) TO service_role;
