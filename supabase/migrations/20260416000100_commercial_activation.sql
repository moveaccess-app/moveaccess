-- COMMERCIAL ACTIVATION
-- PR #12: Connect onboarding to real billing infrastructure
-- Creates: contract_acceptances table, public plans catalog RPC,
-- shared activation helper, updates finalization RPCs

-- ═══════════════════════════════════════════════════════════════════
-- 1. contract_acceptances — audit trail for contract acceptance
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.contract_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  terms_version text NOT NULL DEFAULT '1.0',
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text NULL,
  user_agent text NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_acceptances_academy
  ON public.contract_acceptances (academy_id);

CREATE INDEX IF NOT EXISTS idx_contract_acceptances_student
  ON public.contract_acceptances (student_id);

CREATE INDEX IF NOT EXISTS idx_contract_acceptances_subscription
  ON public.contract_acceptances (subscription_id);

ALTER TABLE public.contract_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view contract acceptances in academy"
ON public.contract_acceptances FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = contract_acceptances.academy_id
  )
);

CREATE POLICY "Service role full access contract acceptances"
ON public.contract_acceptances FOR ALL TO service_role
USING (true) WITH CHECK (true);

REVOKE ALL ON public.contract_acceptances FROM PUBLIC;
GRANT SELECT ON public.contract_acceptances TO authenticated;
GRANT ALL ON public.contract_acceptances TO service_role;


-- ═══════════════════════════════════════════════════════════════════
-- 2. get_public_plans_catalog — returns active plans for an academy
--    Accessible by anon (for public signup) and authenticated
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_public_plans_catalog(p_academy_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'success', true,
      'plans', COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'description', p.description,
          'price', p.price,
          'billingCycle', p.billing_cycle,
          'accessRules', COALESCE(p.access_rules, '{}'::jsonb)
        ) ORDER BY p.price ASC
      ), '[]'::jsonb)
    )
    FROM public.plans p
    WHERE p.academy_id = p_academy_id
      AND p.status = 'active'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_plans_catalog(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_plans_catalog(uuid) TO anon, authenticated, service_role;


-- ═══════════════════════════════════════════════════════════════════
-- 3. _activate_student_subscription — shared commercial core
--    Called by both finalize_student_draft and finalize_invite_signup
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._activate_student_subscription(
  p_academy_id uuid,
  p_student_id uuid,
  p_plan_id uuid,
  p_payment_method text DEFAULT 'manual',
  p_contract_accepted boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_plan RECORD;
  v_subscription_id uuid;
  v_payment_id uuid;
  v_now timestamptz := now();
  v_db_payment_method text;
  v_expires_at timestamptz;
  v_existing_sub_id uuid;
BEGIN
  -- 1. Validate plan exists and belongs to academy
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
  -- Trigger subscriptions_sync_student_plan auto-updates student_profiles

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

  -- 6. Create first payment (always pending — honest status)
  v_payment_id := gen_random_uuid();
  INSERT INTO public.payments (
    id, academy_id, subscription_id, student_id,
    amount, currency, status, method, due_date
  ) VALUES (
    v_payment_id, p_academy_id, v_subscription_id, p_student_id,
    v_plan.price, 'BRL', 'pending', v_db_payment_method, v_now::date
  );

  -- 7. Contract acceptance audit trail
  IF p_contract_accepted THEN
    INSERT INTO public.contract_acceptances (
      academy_id, student_id, subscription_id,
      terms_version, accepted_at
    ) VALUES (
      p_academy_id, p_student_id, v_subscription_id,
      '1.0', v_now
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


-- ═══════════════════════════════════════════════════════════════════
-- 4. Updated finalize_student_draft — same signature, new logic
--    Now reads planId from collected_data and creates real billing
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.finalize_student_draft(p_draft_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_now timestamptz := now();
  v_draft public.student_drafts%ROWTYPE;
  v_identification jsonb;
  v_personal_data jsonb;
  v_plan_selection jsonb;
  v_full_name text;
  v_email text;
  v_phone text;
  v_cpf text;
  v_birth_date date;
  v_address jsonb;
  v_emergency_contact jsonb;
  v_user_id uuid;
  -- Commercial activation
  v_plan_id_text text;
  v_plan_id uuid;
  v_payment_method text;
  v_contract_accepted boolean;
  v_activation jsonb;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHENTICATED');
  END IF;

  IF NOT public.is_staff() THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  END IF;

  SELECT * INTO v_draft
  FROM public.student_drafts
  WHERE id = p_draft_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'DRAFT_NOT_FOUND');
  END IF;

  IF NOT (v_draft.academy_id = ANY(public.get_user_academy_ids())) THEN
    RETURN jsonb_build_object('success', false, 'error', 'DRAFT_OUTSIDE_ACADEMY');
  END IF;

  IF v_draft.status = 'published' AND v_draft.published_user_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_published', true,
      'draft_id', v_draft.id,
      'user_id', v_draft.published_user_id
    );
  END IF;

  v_identification := COALESCE(v_draft.collected_data -> 'identification', '{}'::jsonb);
  v_personal_data := COALESCE(v_draft.collected_data -> 'personalData', '{}'::jsonb);
  v_plan_selection := COALESCE(v_draft.collected_data -> 'planSelection', '{}'::jsonb);

  v_full_name := NULLIF(trim(v_identification ->> 'fullName'), '');
  v_email := NULLIF(lower(trim(v_identification ->> 'email')), '');
  v_phone := NULLIF(trim(v_identification ->> 'phone'), '');
  v_cpf := NULLIF(regexp_replace(COALESCE(v_personal_data ->> 'document', ''), '[^0-9]', '', 'g'), '');

  IF v_full_name IS NULL OR v_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'MISSING_IDENTIFICATION_DATA');
  END IF;

  BEGIN
    v_birth_date := NULLIF(v_personal_data ->> 'birthDate', '')::date;
  EXCEPTION
    WHEN others THEN
      v_birth_date := NULL;
  END;

  v_address := CASE
    WHEN jsonb_typeof(v_personal_data -> 'address') = 'object' THEN v_personal_data -> 'address'
    ELSE '{}'::jsonb
  END;

  v_emergency_contact := CASE
    WHEN jsonb_typeof(v_personal_data -> 'emergencyContact') = 'object' THEN v_personal_data -> 'emergencyContact'
    ELSE '{}'::jsonb
  END;

  -- ── User creation ──────────────────────────────────────────────

  SELECT p.id INTO v_user_id
  FROM public.profiles p
  WHERE lower(p.email) = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated', 'authenticated', v_email,
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      v_now, v_now,
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('name', v_full_name),
      v_now, v_now
    );
  ELSIF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated', 'authenticated', v_email,
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      v_now, v_now,
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('name', v_full_name),
      v_now, v_now
    );
  END IF;

  INSERT INTO public.profiles (id, user_type, name, email, phone, cpf)
  VALUES (v_user_id, 'student', v_full_name, v_email, v_phone, v_cpf)
  ON CONFLICT (id) DO UPDATE SET
    user_type = 'student',
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    cpf = COALESCE(EXCLUDED.cpf, public.profiles.cpf),
    updated_at = v_now;

  INSERT INTO public.student_profiles (
    id, status, status_since, birth_date, address, emergency_contact,
    registration_origin
  ) VALUES (
    v_user_id, 'active', v_now, v_birth_date, v_address, v_emergency_contact,
    'academy'
  )
  ON CONFLICT (id) DO UPDATE SET
    status = COALESCE(public.student_profiles.status, 'active'::public.student_status),
    birth_date = COALESCE(EXCLUDED.birth_date, public.student_profiles.birth_date),
    address = COALESCE(EXCLUDED.address, public.student_profiles.address),
    emergency_contact = COALESCE(EXCLUDED.emergency_contact, public.student_profiles.emergency_contact),
    registration_origin = COALESCE(public.student_profiles.registration_origin, 'academy'),
    updated_at = v_now;

  INSERT INTO public.academy_memberships (profile_id, academy_id, is_primary)
  VALUES (v_user_id, v_draft.academy_id, true)
  ON CONFLICT (profile_id, academy_id) DO UPDATE SET is_primary = true;

  IF v_draft.unit_id IS NOT NULL THEN
    INSERT INTO public.student_unit_assignments (student_id, unit_id, is_primary)
    VALUES (v_user_id, v_draft.unit_id, true)
    ON CONFLICT (student_id, unit_id) DO UPDATE SET is_primary = true;
  END IF;

  -- ── Commercial activation (subscription + payment + contract) ──

  v_plan_id := NULL;
  v_payment_method := 'manual';
  v_contract_accepted := false;
  v_activation := NULL;

  v_plan_id_text := NULLIF(trim(v_plan_selection ->> 'planId'), '');
  IF v_plan_id_text IS NOT NULL THEN
    BEGIN
      v_plan_id := v_plan_id_text::uuid;
    EXCEPTION WHEN others THEN
      v_plan_id := NULL;
    END;
  END IF;

  IF v_plan_id IS NOT NULL THEN
    v_payment_method := COALESCE(
      NULLIF(trim(COALESCE(v_draft.collected_data -> 'payment' ->> 'method', '')), ''),
      'manual'
    );
    v_contract_accepted := COALESCE(
      (v_draft.collected_data -> 'contract' ->> 'acceptedTerms')::boolean,
      false
    );

    v_activation := public._activate_student_subscription(
      v_draft.academy_id,
      v_user_id,
      v_plan_id,
      v_payment_method,
      v_contract_accepted
    );
  END IF;

  -- ── Finalize draft ─────────────────────────────────────────────

  UPDATE public.student_drafts SET
    status = 'published',
    current_step = 'activation',
    completed_at = COALESCE(completed_at, v_now),
    published_at = v_now,
    published_user_id = v_user_id,
    updated_at = v_now
  WHERE id = v_draft.id;

  RETURN jsonb_build_object(
    'success', true,
    'draft_id', v_draft.id,
    'user_id', v_user_id,
    'already_published', false,
    'activation', COALESCE(v_activation, jsonb_build_object('activated', false, 'reason', 'NO_PLAN_SELECTED'))
  );
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.finalize_student_draft(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_student_draft(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_student_draft(uuid) TO service_role;


-- ═══════════════════════════════════════════════════════════════════
-- 5. Updated finalize_invite_signup — new params for commercial data
--    DROP old signature, CREATE new with plan_id/payment_method/contract
-- ═══════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.finalize_invite_signup(text, text, text, text, text, text, date, jsonb, jsonb);

CREATE OR REPLACE FUNCTION public.finalize_invite_signup(
  p_token text,
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text DEFAULT NULL,
  p_cpf text DEFAULT NULL,
  p_birth_date date DEFAULT NULL,
  p_address jsonb DEFAULT NULL,
  p_emergency_contact jsonb DEFAULT NULL,
  -- NEW: commercial activation params
  p_plan_id uuid DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_contract_accepted boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_link public.invite_links%ROWTYPE;
  v_now timestamptz := now();
  v_user_id uuid;
  v_email text;
  v_cpf text;
  v_existing_profile_id uuid;
  v_activation jsonb;
BEGIN
  v_email := lower(trim(coalesce(p_email, '')));
  v_cpf := nullif(regexp_replace(coalesce(p_cpf, ''), '[^0-9]', '', 'g'), '');

  IF v_email = '' OR p_password IS NULL OR length(trim(p_password)) < 6
     OR p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_PAYLOAD');
  END IF;

  SELECT * INTO v_link FROM public.invite_links WHERE token = p_token LIMIT 1 FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'TOKEN_NOT_FOUND');
  END IF;

  IF v_link.status IN ('revoked', 'expired') THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'TOKEN_INVALID');
  END IF;

  IF v_link.expires_at < now() THEN
    UPDATE public.invite_links SET status = 'expired', updated_at = now() WHERE id = v_link.id;
    RETURN jsonb_build_object('success', false, 'error_code', 'TOKEN_EXPIRED');
  END IF;

  IF v_link.status = 'used' THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'TOKEN_USED');
  END IF;

  IF v_link.expected_email IS NOT NULL AND lower(v_link.expected_email) <> v_email THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'EMAIL_MISMATCH');
  END IF;

  SELECT p.id INTO v_existing_profile_id FROM public.profiles p WHERE lower(p.email) = v_email LIMIT 1;
  IF v_existing_profile_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'EMAIL_ALREADY_REGISTERED');
  END IF;

  IF v_cpf IS NOT NULL THEN
    SELECT p.id INTO v_existing_profile_id FROM public.profiles p WHERE p.cpf = v_cpf LIMIT 1;
    IF v_existing_profile_id IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error_code', 'CPF_ALREADY_REGISTERED');
    END IF;
  END IF;

  -- ── User creation ──────────────────────────────────────────────

  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    v_user_id, '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated', 'authenticated', v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    v_now,
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('name', trim(p_full_name), 'user_type', 'student'),
    v_now, v_now
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text, 'email', v_email,
      'email_verified', true, 'phone_verified', false
    ),
    'email', v_user_id::text, v_now, v_now, v_now
  );

  INSERT INTO public.profiles (id, user_type, name, email, phone, cpf)
  VALUES (v_user_id, 'student', trim(p_full_name), v_email,
          nullif(trim(coalesce(p_phone, '')), ''), v_cpf)
  ON CONFLICT (id) DO UPDATE SET
    user_type = 'student', name = EXCLUDED.name, email = EXCLUDED.email,
    phone = EXCLUDED.phone, cpf = EXCLUDED.cpf, updated_at = v_now;

  INSERT INTO public.student_profiles (
    id, status, status_since, birth_date, address, emergency_contact,
    registration_origin, created_at, updated_at
  ) VALUES (
    v_user_id, 'active', v_now, p_birth_date,
    COALESCE(p_address, '{}'::jsonb),
    COALESCE(p_emergency_contact, '{}'::jsonb),
    'website', v_now, v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    birth_date = COALESCE(EXCLUDED.birth_date, public.student_profiles.birth_date),
    address = COALESCE(EXCLUDED.address, public.student_profiles.address),
    emergency_contact = COALESCE(EXCLUDED.emergency_contact, public.student_profiles.emergency_contact),
    updated_at = v_now;

  INSERT INTO public.academy_memberships (profile_id, academy_id, is_primary)
  VALUES (v_user_id, v_link.academy_id, true)
  ON CONFLICT (profile_id, academy_id) DO UPDATE SET is_primary = true;

  IF v_link.unit_id IS NOT NULL THEN
    INSERT INTO public.student_unit_assignments (student_id, unit_id, is_primary)
    VALUES (v_user_id, v_link.unit_id, true)
    ON CONFLICT (student_id, unit_id) DO UPDATE SET is_primary = true;
  END IF;

  -- ── Commercial activation ─────────────────────────────────────

  v_activation := NULL;
  IF p_plan_id IS NOT NULL THEN
    v_activation := public._activate_student_subscription(
      v_link.academy_id,
      v_user_id,
      p_plan_id,
      COALESCE(p_payment_method, 'manual'),
      COALESCE(p_contract_accepted, false)
    );
  END IF;

  -- ── Mark invite as used ────────────────────────────────────────

  UPDATE public.invite_links SET
    status = 'used', used_at = COALESCE(used_at, v_now), updated_at = v_now
  WHERE id = v_link.id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'academy_id', v_link.academy_id,
    'unit_id', v_link.unit_id,
    'email', v_email,
    'activation', COALESCE(v_activation, jsonb_build_object('activated', false, 'reason', 'NO_PLAN_SELECTED'))
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNIQUE_VIOLATION', 'detail', SQLERRM);
  WHEN others THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'SIGNUP_FAILED', 'detail', SQLERRM);
END;
$function$;

REVOKE ALL ON FUNCTION public.finalize_invite_signup(text, text, text, text, text, text, date, jsonb, jsonb, uuid, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_invite_signup(text, text, text, text, text, text, date, jsonb, jsonb, uuid, text, boolean) TO anon, authenticated, service_role;
