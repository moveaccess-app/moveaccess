-- SUBSCRIPTIONS SEARCH PATH HARDENING
-- Mission #9 follow-up: secure helper functions

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
