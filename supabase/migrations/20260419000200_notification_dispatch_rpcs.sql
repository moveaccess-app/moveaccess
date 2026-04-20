-- ============================================================
-- PR 19 — RPC functions for notification dispatch
-- ============================================================
-- Server-side functions that find candidates for each
-- notification type. Called via supabase.rpc() from the
-- dispatch cron job.
--
-- All functions exclude candidates that already have a
-- successful notification_logs entry (idempotency check).
-- ============================================================

-- ─── 1. Due reminder candidates (D-3) ───────────────────────
-- Payments due in exactly 3 days, still pending, student has email,
-- and no successful due_reminder notification already sent.

CREATE OR REPLACE FUNCTION find_due_reminder_candidates()
RETURNS TABLE (
  payment_id    UUID,
  student_id    UUID,
  academy_id    UUID,
  student_name  TEXT,
  student_email TEXT,
  plan_name     TEXT,
  amount        NUMERIC(12,2),
  due_date      TIMESTAMPTZ,
  invoice_url   TEXT,
  bank_slip_url TEXT,
  academy_name  TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    p.id          AS payment_id,
    p.student_id,
    p.academy_id,
    pr.name       AS student_name,
    pr.email      AS student_email,
    pl.name       AS plan_name,
    p.amount,
    p.due_date,
    ac.invoice_url,
    ac.bank_slip_url,
    a.trade_name  AS academy_name
  FROM payments p
  JOIN profiles pr     ON pr.id = p.student_id
  JOIN academies a     ON a.id  = p.academy_id
  LEFT JOIN subscriptions s ON s.id = p.subscription_id
  LEFT JOIN plans pl   ON pl.id = s.plan_id
  LEFT JOIN asaas_charges ac ON ac.payment_id = p.id
  WHERE p.status = 'pending'
    AND p.due_date::date = (CURRENT_DATE + INTERVAL '3 days')
    AND pr.email IS NOT NULL
    AND pr.email <> ''
    AND NOT EXISTS (
      SELECT 1 FROM notification_logs nl
      WHERE nl.idempotency_key = 'due_reminder:' || p.id::text
        AND nl.status = 'sent'
    )
  ORDER BY p.due_date ASC;
$$;

-- ─── 2. Overdue notice candidates (D+1) ─────────────────────
-- Payments overdue by exactly 1 day (or more, up to 7 days,
-- to catch any that were missed), still pending, student has email,
-- no overdue_notice already sent for this payment.

CREATE OR REPLACE FUNCTION find_overdue_notice_candidates()
RETURNS TABLE (
  payment_id    UUID,
  student_id    UUID,
  academy_id    UUID,
  student_name  TEXT,
  student_email TEXT,
  plan_name     TEXT,
  amount        NUMERIC(12,2),
  due_date      TIMESTAMPTZ,
  days_overdue  INT,
  invoice_url   TEXT,
  bank_slip_url TEXT,
  academy_name  TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    p.id          AS payment_id,
    p.student_id,
    p.academy_id,
    pr.name       AS student_name,
    pr.email      AS student_email,
    pl.name       AS plan_name,
    p.amount,
    p.due_date,
    (CURRENT_DATE - p.due_date::date)::int AS days_overdue,
    ac.invoice_url,
    ac.bank_slip_url,
    a.trade_name  AS academy_name
  FROM payments p
  JOIN profiles pr     ON pr.id = p.student_id
  JOIN academies a     ON a.id  = p.academy_id
  LEFT JOIN subscriptions s ON s.id = p.subscription_id
  LEFT JOIN plans pl   ON pl.id = s.plan_id
  LEFT JOIN asaas_charges ac ON ac.payment_id = p.id
  WHERE p.status = 'pending'
    AND p.due_date::date < CURRENT_DATE
    AND (CURRENT_DATE - p.due_date::date) BETWEEN 1 AND 7
    AND pr.email IS NOT NULL
    AND pr.email <> ''
    AND NOT EXISTS (
      SELECT 1 FROM notification_logs nl
      WHERE nl.idempotency_key = 'overdue_notice:' || p.id::text
        AND nl.status = 'sent'
    )
  ORDER BY p.due_date ASC;
$$;

-- ─── 3. Pre-block candidates ────────────────────────────────
-- Students who:
--   • Have overdue payments past the academy's grace period
--   • Belong to an academy with blockAccess = true
--   • Haven't received a pre_block notification this month
-- One row per student+academy (aggregated).

CREATE OR REPLACE FUNCTION find_pre_block_candidates()
RETURNS TABLE (
  student_id      UUID,
  academy_id      UUID,
  student_name    TEXT,
  student_email   TEXT,
  academy_name    TEXT,
  total_overdue   NUMERIC(12,2),
  oldest_due_date TIMESTAMPTZ,
  grace_days      INT
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    p.student_id,
    p.academy_id,
    pr.name       AS student_name,
    pr.email      AS student_email,
    a.trade_name  AS academy_name,
    SUM(p.amount) AS total_overdue,
    MIN(p.due_date) AS oldest_due_date,
    COALESCE((a.preferences->'delinquency'->>'graceDays')::int, 0) AS grace_days
  FROM payments p
  JOIN profiles pr   ON pr.id = p.student_id
  JOIN academies a   ON a.id  = p.academy_id
  WHERE p.status = 'pending'
    AND p.due_date::date < CURRENT_DATE
    -- Academy has blocking enabled
    AND COALESCE((a.preferences->'delinquency'->>'blockAccess')::boolean, false) = true
    -- Past grace period (or within 1 day of it)
    AND (CURRENT_DATE - p.due_date::date) >=
        GREATEST(COALESCE((a.preferences->'delinquency'->>'graceDays')::int, 0) - 1, 0)
    -- Student has email
    AND pr.email IS NOT NULL
    AND pr.email <> ''
    -- Not already warned this month
    AND NOT EXISTS (
      SELECT 1 FROM notification_logs nl
      WHERE nl.idempotency_key = 'pre_block:' || p.student_id::text || ':' || p.academy_id::text || ':' || to_char(CURRENT_DATE, 'YYYY-MM')
        AND nl.status = 'sent'
    )
  GROUP BY p.student_id, p.academy_id, pr.name, pr.email, a.trade_name, a.preferences
  ORDER BY MIN(p.due_date) ASC;
$$;
