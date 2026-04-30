-- Guard finalize_student_draft against raw CPF uniqueness failures and
-- safely reuse an existing student profile only when the identity matches.
-- Also scope onboarding activation idempotency by academy so a shared
-- student profile can enroll in more than one academy without reusing the
-- other academy subscription.

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
    AND academy_id = p_academy_id
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
  v_normalized_cpf text;
  v_birth_date date;
  v_address jsonb;
  v_emergency_contact jsonb;
  v_user_id uuid;
  v_existing_cpf_profile_id uuid;
  v_existing_cpf_email text;
  v_existing_cpf_user_type public.user_type;
  v_existing_cpf_in_current_academy boolean := false;
  v_plan_id_text text;
  v_plan_id uuid;
  v_payment_method text;
  v_contract_accepted boolean;
  v_template_id uuid;
  v_template_version integer;
  v_contract_content text;
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
  WHERE id = p_draft_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'DRAFT_NOT_FOUND');
  END IF;

  IF v_draft.status NOT IN ('in_progress', 'completed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'DRAFT_ALREADY_PUBLISHED');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.academy_memberships
    WHERE profile_id = v_actor
      AND academy_id = v_draft.academy_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_IN_ACADEMY');
  END IF;

  v_identification := COALESCE(v_draft.collected_data -> 'identification', '{}'::jsonb);
  v_personal_data := COALESCE(v_draft.collected_data -> 'personalData', '{}'::jsonb);
  v_plan_selection := COALESCE(v_draft.collected_data -> 'planSelection', '{}'::jsonb);

  v_full_name := trim(COALESCE(v_identification ->> 'fullName', ''));
  v_email := lower(trim(COALESCE(v_identification ->> 'email', '')));
  v_phone := trim(COALESCE(v_identification ->> 'phone', ''));

  IF v_full_name = '' OR v_email = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'MISSING_REQUIRED_FIELDS');
  END IF;

  v_cpf := NULLIF(trim(COALESCE(v_personal_data ->> 'document', '')), '');
  v_normalized_cpf := NULLIF(regexp_replace(COALESCE(v_cpf, ''), '\D', '', 'g'), '');
  v_birth_date := NULLIF(trim(v_personal_data ->> 'birthDate'), '')::date;
  v_address := CASE
    WHEN jsonb_typeof(v_personal_data -> 'address') = 'object' THEN v_personal_data -> 'address'
    ELSE '{}'::jsonb
  END;
  v_emergency_contact := CASE
    WHEN jsonb_typeof(v_personal_data -> 'emergencyContact') = 'object' THEN v_personal_data -> 'emergencyContact'
    ELSE '{}'::jsonb
  END;

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email
  LIMIT 1;

  IF v_normalized_cpf IS NOT NULL THEN
    SELECT
      p.id,
      p.email,
      p.user_type,
      EXISTS (
        SELECT 1
        FROM public.academy_memberships am
        WHERE am.profile_id = p.id
          AND am.academy_id = v_draft.academy_id
      )
    INTO
      v_existing_cpf_profile_id,
      v_existing_cpf_email,
      v_existing_cpf_user_type,
      v_existing_cpf_in_current_academy
    FROM public.profiles p
    WHERE regexp_replace(COALESCE(p.cpf, ''), '\D', '', 'g') = v_normalized_cpf
    ORDER BY
      CASE WHEN lower(COALESCE(p.email, '')) = v_email THEN 0 ELSE 1 END,
      CASE WHEN p.id = v_user_id THEN 0 ELSE 1 END,
      p.updated_at DESC NULLS LAST
    LIMIT 1;

    IF v_existing_cpf_profile_id IS NOT NULL THEN
      IF v_existing_cpf_in_current_academy THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Este CPF já está cadastrado nesta academia.',
          'error_code', 'DUPLICATE_CPF_CURRENT_ACADEMY'
        );
      END IF;

      IF v_existing_cpf_user_type IS DISTINCT FROM 'student'::public.user_type THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Este CPF já está vinculado a outro tipo de conta.',
          'error_code', 'DUPLICATE_CPF_NON_STUDENT_PROFILE'
        );
      END IF;

      IF v_user_id IS NOT NULL AND v_user_id <> v_existing_cpf_profile_id THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Este CPF já está vinculado a outro cadastro. Use o mesmo e-mail do aluno ou ajuste o cadastro existente antes de concluir.',
          'error_code', 'DUPLICATE_CPF_DIFFERENT_ACCOUNT'
        );
      END IF;

      IF COALESCE(lower(v_existing_cpf_email), '') <> '' AND lower(v_existing_cpf_email) <> v_email THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Este CPF já está vinculado a outro cadastro. Use o mesmo e-mail do aluno ou ajuste o cadastro existente antes de concluir.',
          'error_code', 'DUPLICATE_CPF_DIFFERENT_ACCOUNT'
        );
      END IF;

      v_user_id := v_existing_cpf_profile_id;
    END IF;
  END IF;

  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      v_email,
      extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
      v_now,
      v_now,
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'name', v_full_name,
        'full_name', v_full_name,
        'phone', v_phone,
        'cpf', v_cpf,
        'onboarded_by_staff', true
      ),
      v_now,
      v_now
    )
    RETURNING id INTO v_user_id;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    name,
    phone,
    user_type,
    cpf,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_email,
    v_full_name,
    NULLIF(v_phone, ''),
    'student',
    v_cpf,
    v_now,
    v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    cpf = COALESCE(EXCLUDED.cpf, public.profiles.cpf),
    user_type = 'student',
    updated_at = v_now;

  INSERT INTO public.student_profiles (
    id,
    status,
    status_since,
    birth_date,
    address,
    emergency_contact,
    registration_origin,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    'active',
    v_now,
    v_birth_date,
    v_address,
    v_emergency_contact,
    'academy',
    v_now,
    v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    status_since = CASE
      WHEN public.student_profiles.status IS DISTINCT FROM 'active'::public.student_status THEN v_now
      ELSE COALESCE(public.student_profiles.status_since, v_now)
    END,
    birth_date = COALESCE(EXCLUDED.birth_date, public.student_profiles.birth_date),
    address = CASE
      WHEN EXCLUDED.address = '{}'::jsonb THEN COALESCE(public.student_profiles.address, '{}'::jsonb)
      ELSE EXCLUDED.address
    END,
    emergency_contact = CASE
      WHEN EXCLUDED.emergency_contact = '{}'::jsonb THEN COALESCE(public.student_profiles.emergency_contact, '{}'::jsonb)
      ELSE EXCLUDED.emergency_contact
    END,
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

  v_plan_id := NULL;
  v_payment_method := 'manual';
  v_contract_accepted := false;
  v_template_id := NULL;
  v_template_version := NULL;
  v_contract_content := NULL;
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

    BEGIN
      v_template_id := (v_draft.collected_data -> 'contract' ->> 'templateId')::uuid;
    EXCEPTION WHEN others THEN
      v_template_id := NULL;
    END;

    v_template_version := (v_draft.collected_data -> 'contract' ->> 'templateVersion')::integer;
    v_contract_content := v_draft.collected_data -> 'contract' ->> 'contractContent';

    v_activation := public._activate_student_subscription(
      v_draft.academy_id,
      v_user_id,
      v_plan_id,
      v_payment_method,
      v_contract_accepted,
      v_template_id,
      v_template_version,
      v_contract_content
    );
  END IF;

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
    'email', v_email,
    'full_name', v_full_name,
    'activation', v_activation
  );
END;
$function$;

NOTIFY pgrst, 'reload schema';