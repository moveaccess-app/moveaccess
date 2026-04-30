-- Repair student auth rows used by /aluno/ativar/{token}.
--
-- Some students created by the internal onboarding are inserted directly into
-- auth.users by SQL. GoTrue expects normalized token columns and an email
-- identity row; when either is missing, admin.getUserById/updateUserById can
-- fail with "Database error loading user".

BEGIN;

UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, '')
WHERE confirmation_token IS NULL
   OR recovery_token IS NULL
   OR email_change_token_new IS NULL
   OR email_change_token_current IS NULL
   OR reauthentication_token IS NULL
   OR email_change IS NULL
   OR phone_change IS NULL
   OR phone_change_token IS NULL;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  u.id::text,
  now(),
  now(),
  now()
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE p.user_type = 'student'
  AND NOT EXISTS (
    SELECT 1
    FROM auth.identities i
    WHERE i.user_id = u.id
      AND i.provider = 'email'
  );

CREATE OR REPLACE FUNCTION public.ensure_student_auth_login(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_now timestamptz := now();
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'MISSING_USER_ID');
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id
    AND user_type = 'student'::public.user_type;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'STUDENT_PROFILE_NOT_FOUND');
  END IF;

  IF NULLIF(trim(v_profile.email), '') IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'STUDENT_EMAIL_MISSING');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    IF EXISTS (
      SELECT 1
      FROM auth.users
      WHERE lower(email) = lower(v_profile.email)
    ) THEN
      RETURN jsonb_build_object('success', false, 'error_code', 'AUTH_EMAIL_CONFLICT');
    END IF;

    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change_token_current,
      reauthentication_token,
      email_change,
      phone_change,
      phone_change_token,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      lower(v_profile.email),
      extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
      v_now,
      v_now,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'name', v_profile.name,
        'full_name', v_profile.name,
        'phone', v_profile.phone,
        'cpf', v_profile.cpf,
        'onboarded_by_staff', true
      ),
      COALESCE(v_profile.created_at, v_now),
      v_now
    );
  END IF;

  UPDATE auth.users
  SET
    email = lower(v_profile.email),
    aud = COALESCE(NULLIF(aud, ''), 'authenticated'),
    role = COALESCE(NULLIF(role, ''), 'authenticated'),
    email_confirmed_at = COALESCE(email_confirmed_at, v_now),
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    reauthentication_token = COALESCE(reauthentication_token, ''),
    email_change = COALESCE(email_change, ''),
    phone_change = COALESCE(phone_change, ''),
    phone_change_token = COALESCE(phone_change_token, ''),
    raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
      || '{"provider":"email","providers":["email"]}'::jsonb,
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object(
        'name', v_profile.name,
        'full_name', v_profile.name,
        'phone', v_profile.phone,
        'cpf', v_profile.cpf,
        'onboarded_by_staff', true
      ),
    updated_at = v_now
  WHERE id = p_user_id;

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    p_user_id,
    jsonb_build_object('sub', p_user_id::text, 'email', lower(v_profile.email), 'email_verified', true),
    'email',
    p_user_id::text,
    v_now,
    v_now,
    v_now
  WHERE NOT EXISTS (
    SELECT 1
    FROM auth.identities
    WHERE user_id = p_user_id
      AND provider = 'email'
  );

  RETURN jsonb_build_object('success', true, 'user_id', p_user_id, 'email', lower(v_profile.email));
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_student_auth_login(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_student_auth_login(uuid) TO service_role;

COMMENT ON FUNCTION public.ensure_student_auth_login(uuid) IS
  'Repairs the auth.users/auth.identities shape required by Supabase Auth before a student portal password activation.';

COMMIT;
