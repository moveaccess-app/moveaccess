-- Fix the active finalize_student_draft activation overload so the first payment
-- does not become overdue on the same local day because of UTC midnight storage.

CREATE OR REPLACE FUNCTION public._activate_student_subscription(
  p_academy_id uuid,
  p_student_id uuid,
  p_plan_id uuid,
  p_payment_method text DEFAULT 'manual'::text,
  p_contract_accepted boolean DEFAULT false,
  p_template_id uuid DEFAULT NULL::uuid,
  p_template_version integer DEFAULT NULL::integer,
  p_contract_content text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_plan RECORD;
  v_subscription_id uuid;
  v_payment_id uuid;
  v_now timestamptz := now();
  v_db_payment_method text;
  v_expires_at timestamptz;
  v_existing_sub_id uuid;
  v_terms_version text;
  v_first_due_at timestamptz;
BEGIN
  SELECT id, name, price, billing_cycle
  INTO v_plan
  FROM public.plans
  WHERE id = p_plan_id
    AND academy_id = p_academy_id
    AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'activated', false,
      'reason', 'PLAN_NOT_FOUND'
    );
  END IF;

  SELECT id INTO v_existing_sub_id
  FROM public.subscriptions
  WHERE student_id = p_student_id
    AND status IN ('active', 'paused')
  LIMIT 1;

  IF v_existing_sub_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'activated', true,
      'already_existed', true,
      'subscription_id', v_existing_sub_id
    );
  END IF;

  v_expires_at := CASE v_plan.billing_cycle
    WHEN 'monthly' THEN v_now + interval '30 days'
    WHEN 'yearly' THEN v_now + interval '365 days'
    ELSE NULL
  END;

  v_subscription_id := gen_random_uuid();
  INSERT INTO public.subscriptions (
    id, academy_id, student_id, plan_id, status,
    started_at, expires_at, billing_cycle, price
  ) VALUES (
    v_subscription_id, p_academy_id, p_student_id, v_plan.id,
    'active', v_now, v_expires_at, v_plan.billing_cycle, v_plan.price
  );

  v_db_payment_method := CASE p_payment_method
    WHEN 'credit_card' THEN 'card'
    WHEN 'debit' THEN 'card'
    WHEN 'cash' THEN 'manual'
    WHEN 'pix' THEN 'pix'
    WHEN 'boleto' THEN 'boleto'
    WHEN 'card' THEN 'card'
    WHEN 'manual' THEN 'manual'
    ELSE 'manual'
  END;

  -- Store the first due date at the end of the next Sao Paulo business day so
  -- it does not render as the previous day in the UI or become overdue too early.
  v_first_due_at := (
    ((timezone('America/Sao_Paulo', v_now)::date + 2)::timestamp AT TIME ZONE 'America/Sao_Paulo')
    - interval '1 second'
  );

  v_payment_id := gen_random_uuid();
  INSERT INTO public.payments (
    id, academy_id, subscription_id, student_id,
    amount, currency, status, method, due_date
  ) VALUES (
    v_payment_id, p_academy_id, v_subscription_id, p_student_id,
    v_plan.price, 'BRL', 'pending', v_db_payment_method, v_first_due_at
  );

  IF p_contract_accepted THEN
    v_terms_version := COALESCE(p_template_version::text, '1.0');

    INSERT INTO public.contract_acceptances (
      academy_id, student_id, subscription_id,
      terms_version, accepted_at,
      template_id, template_version, content_snapshot
    ) VALUES (
      p_academy_id, p_student_id, v_subscription_id,
      v_terms_version, v_now,
      p_template_id, p_template_version, p_contract_content
    );
  END IF;

  RETURN jsonb_build_object(
    'activated', true,
    'already_existed', false,
    'subscription_id', v_subscription_id,
    'payment_id', v_payment_id,
    'plan_name', v_plan.name,
    'plan_price', v_plan.price,
    'billing_cycle', v_plan.billing_cycle
  );
END;
$function$;

NOTIFY pgrst, 'reload schema';