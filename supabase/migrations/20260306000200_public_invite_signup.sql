-- Public invite signup flow (STG first)
-- Adds secure RPCs for public token validation + signup finalization

CREATE OR REPLACE FUNCTION public.get_invite_signup_context(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_link public.invite_links%ROWTYPE;
  v_academy_name text;
  v_unit_name text;
BEGIN
  SELECT * INTO v_link
  FROM public.invite_links
  WHERE token = p_token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'TOKEN_NOT_FOUND'
    );
  END IF;

  IF v_link.status IN ('revoked', 'expired') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'TOKEN_INVALID'
    );
  END IF;

  IF v_link.expires_at < now() THEN
    UPDATE public.invite_links
    SET status = 'expired', updated_at = now()
    WHERE id = v_link.id;

    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'TOKEN_EXPIRED'
    );
  END IF;

  IF v_link.status = 'used' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'TOKEN_USED'
    );
  END IF;

  SELECT a.trade_name INTO v_academy_name
  FROM public.academies a
  WHERE a.id = v_link.academy_id;

  IF v_link.unit_id IS NOT NULL THEN
    SELECT u.name INTO v_unit_name
    FROM public.units u
    WHERE u.id = v_link.unit_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'token', v_link.token,
    'academy_id', v_link.academy_id,
    'academy_name', v_academy_name,
    'unit_id', v_link.unit_id,
    'unit_name', v_unit_name,
    'expected_email', v_link.expected_email,
    'expires_at', v_link.expires_at,
    'description', v_link.description
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.finalize_invite_signup(
  p_token text,
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text DEFAULT NULL,
  p_cpf text DEFAULT NULL,
  p_birth_date date DEFAULT NULL,
  p_address jsonb DEFAULT NULL,
  p_emergency_contact jsonb DEFAULT NULL
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
BEGIN
  v_email := lower(trim(coalesce(p_email, '')));
  v_cpf := nullif(regexp_replace(coalesce(p_cpf, ''), '[^0-9]', '', 'g'), '');

  IF v_email = '' OR p_password IS NULL OR length(trim(p_password)) < 6 OR p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_PAYLOAD'
    );
  END IF;

  SELECT * INTO v_link
  FROM public.invite_links
  WHERE token = p_token
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'TOKEN_NOT_FOUND'
    );
  END IF;

  IF v_link.status IN ('revoked', 'expired') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'TOKEN_INVALID'
    );
  END IF;

  IF v_link.expires_at < now() THEN
    UPDATE public.invite_links
    SET status = 'expired', updated_at = now()
    WHERE id = v_link.id;

    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'TOKEN_EXPIRED'
    );
  END IF;

  IF v_link.status = 'used' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'TOKEN_USED'
    );
  END IF;

  IF v_link.expected_email IS NOT NULL AND lower(v_link.expected_email) <> v_email THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'EMAIL_MISMATCH'
    );
  END IF;

  SELECT p.id INTO v_existing_profile_id
  FROM public.profiles p
  WHERE lower(p.email) = v_email
  LIMIT 1;

  IF v_existing_profile_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'EMAIL_ALREADY_REGISTERED'
    );
  END IF;

  IF v_cpf IS NOT NULL THEN
    SELECT p.id INTO v_existing_profile_id
    FROM public.profiles p
    WHERE p.cpf = v_cpf
    LIMIT 1;

    IF v_existing_profile_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'CPF_ALREADY_REGISTERED'
      );
    END IF;
  END IF;

  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
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
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    v_now,
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('name', trim(p_full_name), 'user_type', 'student'),
    v_now,
    v_now
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    v_user_id::text,
    v_now,
    v_now,
    v_now
  );

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
    trim(p_full_name),
    v_email,
    nullif(trim(coalesce(p_phone, '')), ''),
    v_cpf
  )
  ON CONFLICT (id) DO UPDATE
  SET
    user_type = 'student',
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    cpf = EXCLUDED.cpf,
    updated_at = v_now;

  INSERT INTO public.student_profiles (
    id,
    status,
    status_since,
    birth_date,
    address,
    emergency_contact,
    registration_origin,
    plan_status,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    'active',
    v_now,
    p_birth_date,
    COALESCE(p_address, '{}'::jsonb),
    COALESCE(p_emergency_contact, '{}'::jsonb),
    'website',
    'active',
    v_now,
    v_now
  )
  ON CONFLICT (id) DO UPDATE
  SET
    birth_date = COALESCE(EXCLUDED.birth_date, public.student_profiles.birth_date),
    address = COALESCE(EXCLUDED.address, public.student_profiles.address),
    emergency_contact = COALESCE(EXCLUDED.emergency_contact, public.student_profiles.emergency_contact),
    updated_at = v_now;

  INSERT INTO public.academy_memberships (
    profile_id,
    academy_id,
    is_primary
  ) VALUES (
    v_user_id,
    v_link.academy_id,
    true
  )
  ON CONFLICT (profile_id, academy_id) DO UPDATE
  SET is_primary = true;

  IF v_link.unit_id IS NOT NULL THEN
    INSERT INTO public.student_unit_assignments (
      student_id,
      unit_id,
      is_primary
    ) VALUES (
      v_user_id,
      v_link.unit_id,
      true
    )
    ON CONFLICT (student_id, unit_id) DO UPDATE
    SET is_primary = true;
  END IF;

  UPDATE public.invite_links
  SET
    status = 'used',
    used_at = COALESCE(used_at, v_now),
    updated_at = v_now
  WHERE id = v_link.id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'academy_id', v_link.academy_id,
    'unit_id', v_link.unit_id,
    'email', v_email
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'UNIQUE_VIOLATION',
      'detail', SQLERRM
    );
  WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'SIGNUP_FAILED',
      'detail', SQLERRM
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_invite_signup_context(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_invite_signup(text, text, text, text, text, text, date, jsonb, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_invite_signup_context(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.finalize_invite_signup(text, text, text, text, text, text, date, jsonb, jsonb) TO anon, authenticated, service_role;
