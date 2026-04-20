-- ============================================================
-- PR 29 — Add GRANT DELETE for plan_access_rules
-- ============================================================
-- The DELETE RLS policy was added in migration 20260420000100,
-- but the corresponding GRANT DELETE was missing. Without it,
-- the RLS policy is unreachable — DELETE operations fail with
-- a permissions error before RLS is even evaluated.
-- ============================================================

GRANT DELETE ON public.plan_access_rules TO authenticated, service_role;
