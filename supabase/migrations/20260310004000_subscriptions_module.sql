-- SUBSCRIPTIONS MODULE
-- Mission #9: subscriptions catalog and student plan sync

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NULL,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  price numeric(12,2) NOT NULL,
  notes text NOT NULL DEFAULT '',
  cancelled_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_status_check CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  CONSTRAINT subscriptions_billing_cycle_check CHECK (billing_cycle IN ('monthly', 'yearly', 'custom')),
  CONSTRAINT subscriptions_price_check CHECK (price >= 0),
  CONSTRAINT subscriptions_cancelled_at_check CHECK (
    status = 'cancelled' OR cancelled_at IS NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_academy_id
  ON public.subscriptions (academy_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_student_id
  ON public.subscriptions (student_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id
  ON public.subscriptions (plan_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions (status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_academy_status
  ON public.subscriptions (academy_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_student_started_at
  ON public.subscriptions (student_id, started_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_single_current_per_student
  ON public.subscriptions (student_id)
  WHERE status IN ('active', 'paused');

CREATE OR REPLACE FUNCTION public.sync_student_current_plan_from_subscriptions(target_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_subscription RECORD;
BEGIN
  SELECT
    s.status,
    s.expires_at,
    p.name AS plan_name
  INTO current_subscription
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.student_id = target_student_id
    AND s.status IN ('active', 'paused')
  ORDER BY
    CASE WHEN s.status = 'active' THEN 0 ELSE 1 END,
    s.started_at DESC,
    s.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.student_profiles
    SET
      plan_name = current_subscription.plan_name,
      plan_status = CASE
        WHEN current_subscription.status = 'paused' THEN 'suspended'::public.plan_status
        ELSE current_subscription.status::public.plan_status
      END,
      plan_expires_at = current_subscription.expires_at,
      updated_at = now()
    WHERE id = target_student_id;
  ELSE
    UPDATE public.student_profiles
    SET
      plan_name = NULL,
      plan_status = NULL,
      plan_expires_at = NULL,
      updated_at = now()
    WHERE id = target_student_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_subscription_student_plan_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_student_current_plan_from_subscriptions(COALESCE(NEW.student_id, OLD.student_id));

  IF TG_OP = 'UPDATE' AND NEW.student_id IS DISTINCT FROM OLD.student_id THEN
    PERFORM public.sync_student_current_plan_from_subscriptions(OLD.student_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS subscriptions_sync_student_plan ON public.subscriptions;
CREATE TRIGGER subscriptions_sync_student_plan
  AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_subscription_student_plan_sync();

UPDATE public.student_profiles sp
SET
  plan_name = current_plan.plan_name,
  plan_status = current_plan.plan_status,
  plan_expires_at = current_plan.expires_at,
  updated_at = now()
FROM (
  SELECT DISTINCT ON (s.student_id)
    s.student_id,
    p.name AS plan_name,
    CASE
      WHEN s.status = 'paused' THEN 'suspended'::public.plan_status
      ELSE s.status::public.plan_status
    END AS plan_status,
    s.expires_at
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.status IN ('active', 'paused')
  ORDER BY
    s.student_id,
    CASE WHEN s.status = 'active' THEN 0 ELSE 1 END,
    s.started_at DESC,
    s.created_at DESC
) AS current_plan
WHERE sp.id = current_plan.student_id;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff view subscriptions in academy" ON public.subscriptions;
CREATE POLICY "Staff view subscriptions in academy"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = subscriptions.academy_id
  )
);

DROP POLICY IF EXISTS "Staff insert subscriptions in academy" ON public.subscriptions;
CREATE POLICY "Staff insert subscriptions in academy"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = subscriptions.academy_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.plans plan
    WHERE plan.id = subscriptions.plan_id
      AND plan.academy_id = subscriptions.academy_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles student_profile
    JOIN public.student_profiles sp ON sp.id = student_profile.id
    JOIN public.academy_memberships student_membership ON student_membership.profile_id = student_profile.id
    WHERE sp.id = subscriptions.student_id
      AND student_profile.user_type = 'student'
      AND student_membership.academy_id = subscriptions.academy_id
  )
);

DROP POLICY IF EXISTS "Staff update subscriptions in academy" ON public.subscriptions;
CREATE POLICY "Staff update subscriptions in academy"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = subscriptions.academy_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = subscriptions.academy_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.plans plan
    WHERE plan.id = subscriptions.plan_id
      AND plan.academy_id = subscriptions.academy_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.profiles student_profile
    JOIN public.student_profiles sp ON sp.id = student_profile.id
    JOIN public.academy_memberships student_membership ON student_membership.profile_id = student_profile.id
    WHERE sp.id = subscriptions.student_id
      AND student_profile.user_type = 'student'
      AND student_membership.academy_id = subscriptions.academy_id
  )
);

REVOKE ALL ON public.subscriptions FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated, service_role;
