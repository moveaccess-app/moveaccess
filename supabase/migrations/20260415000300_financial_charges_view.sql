-- FINANCIAL CHARGES VIEW — Read model for the financial page
-- PR #8: Consolidate payment + student + subscription + plan + Asaas data
--
-- Replaces multiple browser-side REST calls with a single pre-joined
-- view. The WHERE clause mirrors the RLS policy on payments (staff of
-- the academy), using auth.uid() directly so it works without
-- security_invoker and follows the same pattern as my_profile.

CREATE OR REPLACE VIEW public.financial_charges_view AS
SELECT
  p.id,
  p.academy_id,
  p.subscription_id,
  p.student_id,
  p.amount,
  p.currency,
  p.status,
  p.method,
  p.reference,
  p.due_date,
  p.paid_at,
  p.created_at,

  -- Student (from profiles + student_profiles)
  pr.name        AS student_name,
  pr.email       AS student_email,
  pr.cpf         AS student_document,
  sp.registration_id AS student_registration_id,
  sp.status      AS student_status,

  -- Subscription
  sub.plan_id,
  sub.status     AS subscription_status,
  sub.expires_at AS subscription_expires_at,

  -- Plan
  pl.name        AS plan_name,

  -- Asaas charge (nullable — only exists for external charges)
  ac.asaas_payment_id,
  ac.billing_type  AS asaas_billing_type,
  ac.asaas_status,
  ac.net_value     AS asaas_net_value,
  ac.invoice_url,
  ac.bank_slip_url,
  ac.synced_at     AS asaas_synced_at,
  ac.asaas_subscription_id,

  -- Derived: charge origin
  CASE
    WHEN ac.id IS NOT NULL AND ac.asaas_subscription_id IS NOT NULL THEN 'recurring'
    WHEN ac.id IS NOT NULL THEN 'asaas'
    ELSE 'local'
  END AS charge_origin,

  -- Derived: flags
  (ac.id IS NOT NULL)                   AS is_asaas_managed,
  (ac.asaas_subscription_id IS NOT NULL) AS is_recurring

FROM public.payments p
LEFT JOIN public.student_profiles sp  ON sp.id  = p.student_id
LEFT JOIN public.profiles pr          ON pr.id  = p.student_id
LEFT JOIN public.subscriptions sub    ON sub.id = p.subscription_id
LEFT JOIN public.plans pl             ON pl.id  = sub.plan_id
LEFT JOIN public.asaas_charges ac     ON ac.payment_id = p.id
WHERE EXISTS (
  SELECT 1
  FROM public.profiles pr_auth
  JOIN public.academy_memberships am ON am.profile_id = pr_auth.id
  WHERE pr_auth.id = auth.uid()
    AND pr_auth.user_type = 'staff'
    AND am.academy_id = p.academy_id
);

-- Grant access
GRANT SELECT ON public.financial_charges_view TO authenticated, service_role;

COMMENT ON VIEW public.financial_charges_view IS
  'Read model for the financial page. Pre-joins payments with student, subscription, plan, and Asaas charge data. Filtered by academy membership of the authenticated user.';
