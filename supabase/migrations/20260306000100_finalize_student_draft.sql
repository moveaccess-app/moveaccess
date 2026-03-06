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
  v_plan_name text;
  v_start_date date;
  v_plan_expires_at timestamptz;
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

  v_plan_name := NULLIF(trim(v_plan_selection ->> 'planName'), '');

  BEGIN
    v_start_date := NULLIF(v_plan_selection ->> 'startDate', '')::date;
  EXCEPTION
    WHEN others THEN
      v_start_date := NULL;
  END;

  v_plan_expires_at := CASE
    WHEN v_start_date IS NULL THEN NULL
    ELSE (v_start_date + interval '30 days')::timestamptz
  END;

  SELECT p.id INTO v_user_id
  FROM public.profiles p
  WHERE lower(p.email) = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated',
      'authenticated',
      v_email,
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      v_now,
      v_now,
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('name', v_full_name),
      v_now,
      v_now
    );
  ELSIF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'authenticated',
      'authenticated',
      v_email,
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      v_now,
      v_now,
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object('name', v_full_name),
      v_now,
      v_now
    );
  END IF;

  INSERT INTO public.profiles (
    id,
    user_type,
    name,
    email,
    phone,
    cpf
  ) VALUES (
    v_user_id,
    'student',
    v_full_name,
    v_email,
    v_phone,
    v_cpf
  )
  ON CONFLICT (id) DO UPDATE
  SET
    user_type = 'student',
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    cpf = COALESCE(EXCLUDED.cpf, public.profiles.cpf),
    updated_at = v_now;

  INSERT INTO public.student_profiles (
    id,
    status,
    status_since,
    birth_date,
    address,
    emergency_contact,
    registration_origin,
    plan_name,
    plan_status,
    plan_expires_at
  ) VALUES (
    v_user_id,
    'active',
    v_now,
    v_birth_date,
    v_address,
    v_emergency_contact,
    'academy',
    v_plan_name,
    CASE WHEN v_plan_name IS NULL THEN NULL ELSE 'active'::public.plan_status END,
    v_plan_expires_at
  )
  ON CONFLICT (id) DO UPDATE
  SET
    status = COALESCE(public.student_profiles.status, 'active'::public.student_status),
    birth_date = COALESCE(EXCLUDED.birth_date, public.student_profiles.birth_date),
    address = COALESCE(EXCLUDED.address, public.student_profiles.address),
    emergency_contact = COALESCE(EXCLUDED.emergency_contact, public.student_profiles.emergency_contact),
    registration_origin = COALESCE(public.student_profiles.registration_origin, 'academy'),
    plan_name = COALESCE(EXCLUDED.plan_name, public.student_profiles.plan_name),
    plan_status = COALESCE(EXCLUDED.plan_status, public.student_profiles.plan_status),
    plan_expires_at = COALESCE(EXCLUDED.plan_expires_at, public.student_profiles.plan_expires_at),
    updated_at = v_now;

  INSERT INTO public.academy_memberships (profile_id, academy_id, is_primary)
  VALUES (v_user_id, v_draft.academy_id, true)
  ON CONFLICT (profile_id, academy_id) DO UPDATE
  SET is_primary = true;

  IF v_draft.unit_id IS NOT NULL THEN
    INSERT INTO public.student_unit_assignments (student_id, unit_id, is_primary)
    VALUES (v_user_id, v_draft.unit_id, true)
    ON CONFLICT (student_id, unit_id) DO UPDATE
    SET is_primary = true;
  END IF;

  UPDATE public.student_drafts
  SET
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
    'already_published', false
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
