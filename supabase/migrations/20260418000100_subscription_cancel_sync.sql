-- PR 16 — Bidirectional subscription cancellation + Asaas sync
--
-- This migration:
-- 1. Fixes the first payment grace period:
--    The _activate_student_subscription RPC previously set due_date = v_now::date
--    (today), which meant students could be immediately blocked if payment
--    verification runs on the same day. Now sets due_date = v_now::date + 1
--    (tomorrow), giving 1 day of grace for the first payment to be processed.
--
-- 2. Adds asaas_subscription_id column to asaas_webhook_events for subscription
--    event correlation.

-- ─── 1. Fix first payment due_date (grace period) ───────────────
CREATE OR REPLACE FUNCTION public._activate_student_subscription(
  p_academy_id uuid,
  p_student_id uuid,
  p_plan_id uuid,
  p_payment_method text DEFAULT 'manual',
  p_contract_accepted boolean DEFAULT false,
  p_contract_content text DEFAULT NULL,
  p_template_id uuid DEFAULT NULL,
  p_template_version integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_plan RECORD;
  v_subscription_id uuid;
  v_payment_id uuid;
  v_expires_at timestamptz;
  v_existing_sub_id uuid;
  v_db_payment_method text;
  v_terms_version text;
BEGIN
  -- 1. Load plan
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

  -- 2. Idempotency: check for existing active/paused subscription
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

  -- 3. Calculate expiration based on billing cycle
  v_expires_at := CASE v_plan.billing_cycle
    WHEN 'monthly' THEN v_now + interval '30 days'
    WHEN 'yearly' THEN v_now + interval '365 days'
    ELSE NULL  -- custom: no auto-expiration
  END;

  -- 4. Create subscription
  v_subscription_id := gen_random_uuid();
  INSERT INTO public.subscriptions (
    id, academy_id, student_id, plan_id, status,
    started_at, expires_at, billing_cycle, price
  ) VALUES (
    v_subscription_id, p_academy_id, p_student_id, v_plan.id,
    'active', v_now, v_expires_at, v_plan.billing_cycle, v_plan.price
  );

  -- 5. Map payment method from onboarding to DB enum
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

  -- 6. Create first payment (pending — due tomorrow for 1-day grace period)
  v_payment_id := gen_random_uuid();
  INSERT INTO public.payments (
    id, academy_id, subscription_id, student_id,
    amount, currency, status, method, due_date
  ) VALUES (
    v_payment_id, p_academy_id, v_subscription_id, p_student_id,
    v_plan.price, 'BRL', 'pending', v_db_payment_method, (v_now::date + 1)
  );

  -- 7. Contract acceptance audit trail (now with template reference)
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
$$;

-- ─── 2. Add asaas_subscription_id to webhook events for correlation ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'asaas_webhook_events'
      AND column_name = 'asaas_subscription_id'
  ) THEN
    ALTER TABLE public.asaas_webhook_events
      ADD COLUMN asaas_subscription_id text;

    CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_subscription_id
      ON public.asaas_webhook_events (asaas_subscription_id)
      WHERE asaas_subscription_id IS NOT NULL;
  END IF;
END $$;
