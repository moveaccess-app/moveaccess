-- Team management RPCs (Mission #6)
-- Secure staff list + admin-only create/update under academy tenancy

CREATE OR REPLACE FUNCTION public.get_team_staff_list()
RETURNS TABLE (
  id uuid,
  name text,
  email text,
  phone text,
  cpf text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz,
  role_id public.role_id,
  status public.staff_status,
  last_login_at timestamptz,
  last_login_ip text,
  custom_permissions text[],
  academy_id uuid,
  academy_name text,
  unit_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_academy_id uuid;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED';
  END IF;

  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  SELECT am.academy_id
  INTO v_academy_id
  FROM public.academy_memberships am
  WHERE am.profile_id = v_actor
  ORDER BY am.is_primary DESC, am.created_at ASC
  LIMIT 1;

  IF v_academy_id IS NULL THEN
    RAISE EXCEPTION 'ACADEMY_NOT_FOUND';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.email,
    p.phone,
    p.cpf,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    sp.role AS role_id,
    sp.status,
    sp.last_login_at,
    sp.last_login_ip,
    sp.custom_permissions,
    am.academy_id,
    a.trade_name AS academy_name,
    COALESCE(
      (
        SELECT array_agg(sua.unit_id)
        FROM public.staff_unit_assignments sua
        JOIN public.units u ON u.id = sua.unit_id
        WHERE sua.staff_id = p.id
          AND u.academy_id = v_academy_id
      ),
      ARRAY[]::uuid[]
    ) AS unit_ids
  FROM public.profiles p
  JOIN public.staff_profiles sp ON sp.id = p.id
  JOIN public.academy_memberships am ON am.profile_id = p.id AND am.academy_id = v_academy_id
  JOIN public.academies a ON a.id = am.academy_id
  WHERE p.user_type = 'staff'
  ORDER BY p.name ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_team_staff(
  p_name text,
  p_email text,
  p_password text,
  p_phone text DEFAULT NULL,
  p_role public.role_id DEFAULT 'receptionist'::public.role_id,
  p_unit_ids uuid[] DEFAULT ARRAY[]::uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_actor_academy_id uuid;
  v_user_id uuid;
  v_email text;
  v_phone text;
  v_units_count integer := 0;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNAUTHENTICATED');
  END IF;

  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'FORBIDDEN');
  END IF;

  v_email := lower(trim(coalesce(p_email, '')));
  v_phone := nullif(trim(coalesce(p_phone, '')), '');

  IF trim(coalesce(p_name, '')) = '' OR v_email = '' OR length(trim(coalesce(p_password, ''))) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_PAYLOAD');
  END IF;

  SELECT am.academy_id
  INTO v_actor_academy_id
  FROM public.academy_memberships am
  WHERE am.profile_id = v_actor
  ORDER BY am.is_primary DESC, am.created_at ASC
  LIMIT 1;

  IF v_actor_academy_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'ACADEMY_NOT_FOUND');
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.email) = v_email) THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'EMAIL_ALREADY_REGISTERED');
  END IF;

  IF cardinality(COALESCE(p_unit_ids, ARRAY[]::uuid[])) > 0 THEN
    SELECT COUNT(*)
    INTO v_units_count
    FROM public.units u
    WHERE u.id = ANY (p_unit_ids)
      AND u.academy_id = v_actor_academy_id;

    IF v_units_count <> cardinality(p_unit_ids) THEN
      RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_UNITS');
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
    now(),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('name', trim(p_name), 'user_type', 'staff'),
    now(),
    now()
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
    now(),
    now(),
    now()
  );

  INSERT INTO public.profiles (id, user_type, name, email, phone)
  VALUES (v_user_id, 'staff', trim(p_name), v_email, v_phone)
  ON CONFLICT (id) DO UPDATE
  SET
    user_type = 'staff',
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = now();

  INSERT INTO public.staff_profiles (id, role, status)
  VALUES (v_user_id, p_role, 'active');

  INSERT INTO public.academy_memberships (profile_id, academy_id, is_primary)
  VALUES (v_user_id, v_actor_academy_id, true)
  ON CONFLICT (profile_id, academy_id) DO UPDATE
  SET is_primary = true;

  IF cardinality(COALESCE(p_unit_ids, ARRAY[]::uuid[])) > 0 THEN
    INSERT INTO public.staff_unit_assignments (staff_id, unit_id)
    SELECT v_user_id, unnest(p_unit_ids);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'academy_id', v_actor_academy_id,
    'email', v_email
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNIQUE_VIOLATION', 'detail', SQLERRM);
  WHEN others THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'CREATE_FAILED', 'detail', SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_team_staff(
  p_staff_id uuid,
  p_role public.role_id DEFAULT NULL,
  p_status public.staff_status DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_unit_ids uuid[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_actor_academy_id uuid;
  v_target_exists boolean := false;
  v_units_count integer := 0;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNAUTHENTICATED');
  END IF;

  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'FORBIDDEN');
  END IF;

  SELECT am.academy_id
  INTO v_actor_academy_id
  FROM public.academy_memberships am
  WHERE am.profile_id = v_actor
  ORDER BY am.is_primary DESC, am.created_at ASC
  LIMIT 1;

  IF v_actor_academy_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'ACADEMY_NOT_FOUND');
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.staff_profiles sp
    JOIN public.academy_memberships am ON am.profile_id = sp.id
    JOIN public.profiles p ON p.id = sp.id
    WHERE sp.id = p_staff_id
      AND am.academy_id = v_actor_academy_id
      AND p.user_type = 'staff'
  ) INTO v_target_exists;

  IF NOT v_target_exists THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'STAFF_NOT_FOUND');
  END IF;

  IF p_role IS NOT NULL OR p_status IS NOT NULL THEN
    UPDATE public.staff_profiles sp
    SET
      role = COALESCE(p_role, sp.role),
      status = COALESCE(p_status, sp.status),
      updated_at = now()
    WHERE sp.id = p_staff_id;
  END IF;

  IF p_phone IS NOT NULL THEN
    UPDATE public.profiles p
    SET
      phone = nullif(trim(p_phone), ''),
      updated_at = now()
    WHERE p.id = p_staff_id;
  END IF;

  IF p_unit_ids IS NOT NULL THEN
    IF cardinality(COALESCE(p_unit_ids, ARRAY[]::uuid[])) > 0 THEN
      SELECT COUNT(*)
      INTO v_units_count
      FROM public.units u
      WHERE u.id = ANY (p_unit_ids)
        AND u.academy_id = v_actor_academy_id;

      IF v_units_count <> cardinality(p_unit_ids) THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_UNITS');
      END IF;
    END IF;

    DELETE FROM public.staff_unit_assignments
    WHERE staff_id = p_staff_id;

    IF cardinality(COALESCE(p_unit_ids, ARRAY[]::uuid[])) > 0 THEN
      INSERT INTO public.staff_unit_assignments (staff_id, unit_id)
      SELECT p_staff_id, unnest(p_unit_ids);
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'staff_id', p_staff_id);
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UPDATE_FAILED', 'detail', SQLERRM);
END;
$function$;

REVOKE ALL ON FUNCTION public.get_team_staff_list() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_team_staff(text, text, text, text, public.role_id, uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_team_staff(uuid, public.role_id, public.staff_status, text, uuid[]) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.get_team_staff_list() FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_team_staff(text, text, text, text, public.role_id, uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_team_staff(uuid, public.role_id, public.staff_status, text, uuid[]) FROM anon;

GRANT EXECUTE ON FUNCTION public.get_team_staff_list() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_team_staff(text, text, text, text, public.role_id, uuid[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_team_staff(uuid, public.role_id, public.staff_status, text, uuid[]) TO authenticated, service_role;
