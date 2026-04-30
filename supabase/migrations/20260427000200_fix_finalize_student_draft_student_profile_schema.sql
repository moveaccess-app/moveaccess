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

  v_cpf := trim(COALESCE(v_personal_data ->> 'document', ''));
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
      crypt(gen_random_uuid()::text, gen_salt('bf')),
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
    NULLIF(v_cpf, ''),
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