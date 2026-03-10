-- PLANS MODULE
-- Mission #8: plans catalog

CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(12,2) NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'active',
  access_rules jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plans_billing_cycle_check CHECK (billing_cycle IN ('monthly', 'yearly', 'custom')),
  CONSTRAINT plans_status_check CHECK (status IN ('active', 'inactive')),
  CONSTRAINT plans_price_check CHECK (price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_plans_academy_id
  ON public.plans (academy_id);

CREATE INDEX IF NOT EXISTS idx_plans_academy_status
  ON public.plans (academy_id, status);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff view plans in academy" ON public.plans;
CREATE POLICY "Staff view plans in academy"
ON public.plans
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = plans.academy_id
  )
);

DROP POLICY IF EXISTS "Staff insert plans in academy" ON public.plans;
CREATE POLICY "Staff insert plans in academy"
ON public.plans
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = plans.academy_id
  )
);

DROP POLICY IF EXISTS "Staff update plans in academy" ON public.plans;
CREATE POLICY "Staff update plans in academy"
ON public.plans
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = plans.academy_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = plans.academy_id
  )
);

REVOKE ALL ON public.plans FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.plans TO authenticated, service_role;
