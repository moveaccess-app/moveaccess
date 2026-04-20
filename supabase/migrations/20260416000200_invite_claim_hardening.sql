-- PR 12.5 - Invite/public signup hardening
-- Adds claim tracking, public resume flow via auth, WhatsApp metadata,
-- and keeps the invite lifecycle explicit without exposing sensitive data in URLs.

ALTER TABLE public.invite_links
  ADD COLUMN IF NOT EXISTS recipient_name text NULL,
  ADD COLUMN IF NOT EXISTS recipient_phone text NULL,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS claimed_email text NULL,
  ADD COLUMN IF NOT EXISTS claimed_by_user_id uuid NULL,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'invite_links_claimed_by_user_id_fkey'
  ) THEN
    ALTER TABLE public.invite_links
      ADD CONSTRAINT invite_links_claimed_by_user_id_fkey
      FOREIGN KEY (claimed_by_user_id)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invite_links_claimed_by_user
  ON public.invite_links (claimed_by_user_id);

CREATE INDEX IF NOT EXISTS idx_invite_links_pending_queue
  ON public.invite_links (academy_id, status, claimed_at, expires_at);

COMMENT ON COLUMN public.invite_links.recipient_name IS 'Human-friendly name used by the operator when sharing the invite.';
COMMENT ON COLUMN public.invite_links.recipient_phone IS 'Optional WhatsApp/phone number used only for operational sharing.';
COMMENT ON COLUMN public.invite_links.claimed_at IS 'First time the invite was securely claimed by the invited person.';
COMMENT ON COLUMN public.invite_links.claimed_email IS 'Email used when the invited person claimed the invite.';
COMMENT ON COLUMN public.invite_links.claimed_by_user_id IS 'Auth/profile user that claimed the invite and can resume the public signup.';
COMMENT ON COLUMN public.invite_links.completed_at IS 'Timestamp when the invite-driven signup was completed.';

CREATE OR REPLACE FUNCTION public.mask_email_hint(p_email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_email IS NULL OR position('@' IN trim(lower(p_email))) = 0 THEN NULL
    ELSE concat(
      substring(split_part(trim(lower(p_email)), '@', 1) FROM 1 FOR 1),
      '***@',
      split_part(trim(lower(p_email)), '@', 2)
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_invite_signup_context(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_link public.invite_links%ROWTYPE;
  v_academy_name text;
  v_unit_name text;
BEGIN
  SELECT * INTO v_link
  FROM public.invite_links
  WHERE token = p_token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'TOKEN_NOT_FOUND');
  END IF;

  IF v_link.status = 'revoked' THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'TOKEN_CANCELLED');
  END IF;

  IF v_link.status = 'expired' OR (v_link.status = 'active' AND v_link.expires_at < now()) THEN
    IF v_link.status = 'active' THEN
      UPDATE public.invite_links
      SET status = 'expired', updated_at = now()
      WHERE id = v_link.id;
    END IF;

    RETURN jsonb_build_object('success', false, 'error_code', 'TOKEN_EXPIRED');
  END IF;

  IF v_link.status = 'used' THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'TOKEN_COMPLETED');
  END IF;

  IF v_link.claimed_by_user_id IS NOT NULL THEN
    IF v_actor IS NULL OR v_actor <> v_link.claimed_by_user_id THEN
      RETURN jsonb_build_object('success', false, 'error_code', 'TOKEN_CLAIMED');
    END IF;
  ELSIF v_link.expected_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVITE_TARGET_REQUIRED');
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
    'email_hint', public.mask_email_hint(COALESCE(v_link.claimed_email, v_link.expected_email)),
    'description', v_link.description,
    'recipient_name', v_link.recipient_name,
    'expires_at', v_link.expires_at,
    'lifecycle_status', CASE
      WHEN v_link.claimed_by_user_id IS NOT NULL THEN 'claimed'
      ELSE 'pending'
    END,
    'claimed_by_current_user', COALESCE(v_actor = v_link.claimed_by_user_id, false),
    'draft_id', v_link.draft_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_invite_signup(
  p_token text,
  p_email text,
  p_full_name text,
  p_phone text DEFAULT NULL,
  p_password text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_link public.invite_links%ROWTYPE;
  v_now timestamptz := now();
  v_email text := lower(trim(COALESCE(p_email, '')));
  v_phone text := NULLIF(trim(COALESCE(p_phone, '')), '');
  v_user_id uuid;
  v_draft_id uuid;
  v_existing_profile_id uuid;
BEGIN
  IF v_email = ''
     OR p_password IS NULL
     OR length(trim(p_password)) < 6
     OR p_full_name IS NULL
     OR trim(p_full_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_PAYLOAD');
  END IF;

  SELECT * INTO v_link
  FROM public.invite_links
  WHERE token = p_token
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'TOKEN_NOT_FOUND');
  END IF;

  IF v_link.status = 'revoked' THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'TOKEN_CANCELLED');
  END IF;

  IF v_link.status = 'expired' OR (v_link.status = 'active' AND v_link.expires_at < now()) THEN
    IF v_link.status = 'active' THEN
      UPDATE public.invite_links
      SET status = 'expired', updated_at = now()
      WHERE id = v_link.id;
    END IF;

    RETURN jsonb_build_object('success', false, 'error_code', 'TOKEN_EXPIRED');
  END IF;

  IF v_link.status = 'used' THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'TOKEN_COMPLETED');
  END IF;

  IF v_link.expected_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVITE_TARGET_REQUIRED');
  END IF;

  IF lower(v_link.expected_email) <> v_email THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'EMAIL_MISMATCH');
  END IF;

  IF v_link.claimed_by_user_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVITE_ALREADY_CLAIMED');
  END IF;

  SELECT p.id INTO v_existing_profile_id
  FROM public.profiles p
  WHERE lower(p.email) = v_email
  LIMIT 1;

  IF v_existing_profile_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'EMAIL_ALREADY_REGISTERED');
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
    jsonb_build_object('name', trim(p_full_name), 'user_type', 'student', 'signup_origin', 'invite_link'),
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

  INSERT INTO public.profiles (id, user_type, name, email, phone)
  VALUES (v_user_id, 'student', trim(p_full_name), v_email, v_phone)
  ON CONFLICT (id) DO UPDATE SET
    user_type = 'student',
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = v_now;

  INSERT INTO public.student_profiles (
    id,
    status,
    status_since,
    registration_origin,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    'pending',
    v_now,
    'website',
    v_now,
    v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    status = 'pending',
    status_since = COALESCE(public.student_profiles.status_since, v_now),
    registration_origin = COALESCE(public.student_profiles.registration_origin, 'website'),
    updated_at = v_now;

  INSERT INTO public.student_drafts (
    academy_id,
    unit_id,
    created_by,
    current_step,
    status,
    origin,
    collected_data
  ) VALUES (
    v_link.academy_id,
    v_link.unit_id,
    v_link.created_by,
    'personal_data',
    'in_progress',
    'invite_link',
    jsonb_build_object(
      'identification', jsonb_build_object(
        'fullName', trim(p_full_name),
        'email', v_email,
        'phone', v_phone,
        'userType', 'student'
      )
    )
  )
  RETURNING id INTO v_draft_id;

  UPDATE public.invite_links
  SET
    claimed_at = v_now,
    claimed_email = v_email,
    claimed_by_user_id = v_user_id,
    draft_id = v_draft_id,
    updated_at = v_now
  WHERE id = v_link.id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'draft_id', v_draft_id,
    'email', v_email,
    'next_step', 'personal_data'
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNIQUE_VIOLATION', 'detail', SQLERRM);
  WHEN others THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'CLAIM_FAILED', 'detail', SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_invite_signup_session(p_token text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_link public.invite_links%ROWTYPE;
  v_draft public.student_drafts%ROWTYPE;
  v_academy_name text;
  v_unit_name text;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNAUTHENTICATED');
  END IF;

  SELECT * INTO v_link
  FROM public.invite_links
  WHERE claimed_by_user_id = v_actor
    AND status = 'active'
    AND claimed_at IS NOT NULL
    AND expires_at > now()
    AND (p_token IS NULL OR token = p_token)
  ORDER BY claimed_at DESC, updated_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'NO_PENDING_SIGNUP');
  END IF;

  IF v_link.draft_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'DRAFT_NOT_FOUND');
  END IF;

  SELECT * INTO v_draft
  FROM public.student_drafts
  WHERE id = v_link.draft_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'DRAFT_NOT_FOUND');
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
    'description', v_link.description,
    'recipient_name', v_link.recipient_name,
    'email_hint', public.mask_email_hint(COALESCE(v_link.claimed_email, v_link.expected_email)),
    'expires_at', v_link.expires_at,
    'draft_id', v_draft.id,
    'draft_status', v_draft.status,
    'current_step', v_draft.current_step,
    'collected_data', COALESCE(v_draft.collected_data, '{}'::jsonb),
    'created_at', v_draft.created_at,
    'updated_at', v_draft.updated_at,
    'completed_at', v_draft.completed_at,
    'published_at', v_draft.published_at,
    'published_user_id', v_draft.published_user_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_my_invite_signup_progress(
  p_token text,
  p_current_step text,
  p_status text,
  p_collected_data jsonb,
  p_completed_at timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_link public.invite_links%ROWTYPE;
  v_draft public.student_drafts%ROWTYPE;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNAUTHENTICATED');
  END IF;

  IF p_current_step NOT IN ('identification', 'personal_data', 'plan_selection', 'contract', 'payment', 'activation') THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_STEP');
  END IF;

  IF p_status NOT IN ('in_progress', 'completed') THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_STATUS');
  END IF;

  SELECT * INTO v_link
  FROM public.invite_links
  WHERE token = p_token
    AND claimed_by_user_id = v_actor
    AND status = 'active'
    AND claimed_at IS NOT NULL
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'CLAIM_NOT_FOUND');
  END IF;

  IF v_link.draft_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'DRAFT_NOT_FOUND');
  END IF;

  UPDATE public.student_drafts
  SET
    current_step = p_current_step,
    status = p_status,
    collected_data = COALESCE(p_collected_data, '{}'::jsonb),
    completed_at = p_completed_at,
    updated_at = now()
  WHERE id = v_link.draft_id
  RETURNING * INTO v_draft;

  RETURN jsonb_build_object(
    'success', true,
    'draft_id', v_draft.id,
    'draft_status', v_draft.status,
    'current_step', v_draft.current_step,
    'collected_data', COALESCE(v_draft.collected_data, '{}'::jsonb),
    'created_at', v_draft.created_at,
    'updated_at', v_draft.updated_at,
    'completed_at', v_draft.completed_at,
    'published_at', v_draft.published_at,
    'published_user_id', v_draft.published_user_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_my_invite_signup(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_now timestamptz := now();
  v_link public.invite_links%ROWTYPE;
  v_draft public.student_drafts%ROWTYPE;
  v_identification jsonb;
  v_personal_data jsonb;
  v_plan_selection jsonb;
  v_full_name text;
  v_phone text;
  v_cpf text;
  v_birth_date date;
  v_address jsonb;
  v_emergency_contact jsonb;
  v_plan_id_text text;
  v_plan_id uuid;
  v_payment_method text := 'manual';
  v_contract_accepted boolean := false;
  v_activation jsonb := NULL;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNAUTHENTICATED');
  END IF;

  SELECT * INTO v_link
  FROM public.invite_links
  WHERE token = p_token
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'TOKEN_NOT_FOUND');
  END IF;

  IF v_link.status = 'used' THEN
    RETURN jsonb_build_object('success', true, 'already_completed', true, 'user_id', COALESCE(v_link.claimed_by_user_id, v_actor));
  END IF;

  IF v_link.claimed_by_user_id IS NULL OR v_link.claimed_by_user_id <> v_actor THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'CLAIM_FORBIDDEN');
  END IF;

  IF v_link.status = 'revoked' THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'TOKEN_CANCELLED');
  END IF;

  IF v_link.status = 'expired' OR (v_link.status = 'active' AND v_link.expires_at < now()) THEN
    IF v_link.status = 'active' THEN
      UPDATE public.invite_links
      SET status = 'expired', updated_at = now()
      WHERE id = v_link.id;
    END IF;

    RETURN jsonb_build_object('success', false, 'error_code', 'TOKEN_EXPIRED');
  END IF;

  IF v_link.draft_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'DRAFT_NOT_FOUND');
  END IF;

  SELECT * INTO v_draft
  FROM public.student_drafts
  WHERE id = v_link.draft_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'DRAFT_NOT_FOUND');
  END IF;

  IF v_draft.published_user_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'already_completed', true, 'user_id', v_draft.published_user_id);
  END IF;

  v_identification := COALESCE(v_draft.collected_data -> 'identification', '{}'::jsonb);
  v_personal_data := COALESCE(v_draft.collected_data -> 'personalData', '{}'::jsonb);
  v_plan_selection := COALESCE(v_draft.collected_data -> 'planSelection', '{}'::jsonb);

  v_full_name := NULLIF(trim(COALESCE(v_identification ->> 'fullName', '')), '');
  v_phone := NULLIF(trim(COALESCE(v_identification ->> 'phone', '')), '');
  v_cpf := NULLIF(regexp_replace(COALESCE(v_personal_data ->> 'document', ''), '[^0-9]', '', 'g'), '');

  IF v_full_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'MISSING_IDENTIFICATION_DATA');
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

  UPDATE public.profiles
  SET
    user_type = 'student',
    name = v_full_name,
    email = COALESCE(v_link.claimed_email, public.profiles.email),
    phone = COALESCE(v_phone, public.profiles.phone),
    cpf = COALESCE(v_cpf, public.profiles.cpf),
    updated_at = v_now
  WHERE id = v_actor;

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
    v_actor,
    'active',
    v_now,
    v_birth_date,
    v_address,
    v_emergency_contact,
    'website',
    v_now,
    v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    status_since = v_now,
    birth_date = COALESCE(EXCLUDED.birth_date, public.student_profiles.birth_date),
    address = COALESCE(EXCLUDED.address, public.student_profiles.address),
    emergency_contact = COALESCE(EXCLUDED.emergency_contact, public.student_profiles.emergency_contact),
    registration_origin = COALESCE(public.student_profiles.registration_origin, 'website'),
    updated_at = v_now;

  INSERT INTO public.academy_memberships (profile_id, academy_id, is_primary)
  VALUES (v_actor, v_link.academy_id, true)
  ON CONFLICT (profile_id, academy_id) DO UPDATE SET is_primary = true;

  IF v_link.unit_id IS NOT NULL THEN
    INSERT INTO public.student_unit_assignments (student_id, unit_id, is_primary)
    VALUES (v_actor, v_link.unit_id, true)
    ON CONFLICT (student_id, unit_id) DO UPDATE SET is_primary = true;
  END IF;

  v_plan_id := NULL;
  v_plan_id_text := NULLIF(trim(COALESCE(v_plan_selection ->> 'planId', '')), '');
  IF v_plan_id_text IS NOT NULL THEN
    BEGIN
      v_plan_id := v_plan_id_text::uuid;
    EXCEPTION
      WHEN others THEN
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
      v_link.academy_id,
      v_actor,
      v_plan_id,
      v_payment_method,
      v_contract_accepted
    );
  END IF;

  UPDATE public.student_drafts
  SET
    status = 'published',
    current_step = 'activation',
    completed_at = COALESCE(completed_at, v_now),
    published_at = v_now,
    published_user_id = v_actor,
    updated_at = v_now
  WHERE id = v_draft.id;

  UPDATE public.invite_links
  SET
    status = 'used',
    used_at = COALESCE(used_at, v_now),
    completed_at = COALESCE(completed_at, v_now),
    updated_at = v_now
  WHERE id = v_link.id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_actor,
    'academy_id', v_link.academy_id,
    'unit_id', v_link.unit_id,
    'activation', COALESCE(v_activation, jsonb_build_object('activated', false, 'reason', 'NO_PLAN_SELECTED'))
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNIQUE_VIOLATION', 'detail', SQLERRM);
  WHEN others THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'SIGNUP_FAILED', 'detail', SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_home_overview()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_academy_id uuid;
  v_academy_name text;

  v_total_students integer := 0;
  v_active_students integer := 0;
  v_open_drafts integer := 0;
  v_pending_invites integer := 0;
  v_active_units integer := 0;

  v_old_drafts_count integer := 0;
  v_expiring_invites_count integer := 0;
  v_stale_invites_count integer := 0;
  v_non_active_students_count integer := 0;
  v_inactive_units_count integer := 0;

  v_alerts jsonb := '[]'::jsonb;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNAUTHENTICATED');
  END IF;

  IF NOT public.is_staff() THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'FORBIDDEN');
  END IF;

  SELECT am.academy_id
  INTO v_academy_id
  FROM public.academy_memberships am
  WHERE am.profile_id = v_actor
  ORDER BY am.is_primary DESC, am.created_at ASC
  LIMIT 1;

  IF v_academy_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'ACADEMY_NOT_FOUND');
  END IF;

  SELECT a.trade_name INTO v_academy_name
  FROM public.academies a
  WHERE a.id = v_academy_id;

  SELECT COUNT(DISTINCT am.profile_id)
  INTO v_total_students
  FROM public.academy_memberships am
  JOIN public.profiles p ON p.id = am.profile_id
  WHERE am.academy_id = v_academy_id
    AND p.user_type = 'student';

  SELECT COUNT(DISTINCT am.profile_id)
  INTO v_active_students
  FROM public.academy_memberships am
  JOIN public.profiles p ON p.id = am.profile_id
  JOIN public.student_profiles sp ON sp.id = p.id
  WHERE am.academy_id = v_academy_id
    AND p.user_type = 'student'
    AND sp.status = 'active';

  SELECT COUNT(*)
  INTO v_open_drafts
  FROM public.student_drafts sd
  WHERE sd.academy_id = v_academy_id
    AND sd.status NOT IN ('published', 'archived');

  SELECT COUNT(*)
  INTO v_pending_invites
  FROM public.invite_links il
  WHERE il.academy_id = v_academy_id
    AND il.status = 'active'
    AND il.claimed_at IS NULL
    AND il.expires_at > now();

  SELECT COUNT(*)
  INTO v_active_units
  FROM public.units u
  WHERE u.academy_id = v_academy_id
    AND COALESCE(u.status::text, 'active') = 'active';

  SELECT COUNT(*)
  INTO v_old_drafts_count
  FROM public.student_drafts sd
  WHERE sd.academy_id = v_academy_id
    AND sd.status IN ('in_progress', 'completed')
    AND sd.updated_at < now() - interval '2 days';

  SELECT COUNT(*)
  INTO v_expiring_invites_count
  FROM public.invite_links il
  WHERE il.academy_id = v_academy_id
    AND il.status = 'active'
    AND il.claimed_at IS NULL
    AND il.expires_at > now()
    AND il.expires_at <= now() + interval '48 hours';

  SELECT COUNT(*)
  INTO v_stale_invites_count
  FROM public.invite_links il
  WHERE il.academy_id = v_academy_id
    AND il.status = 'active'
    AND il.claimed_at IS NULL
    AND il.created_at < now() - interval '7 days';

  SELECT COUNT(DISTINCT am.profile_id)
  INTO v_non_active_students_count
  FROM public.academy_memberships am
  JOIN public.profiles p ON p.id = am.profile_id
  JOIN public.student_profiles sp ON sp.id = p.id
  WHERE am.academy_id = v_academy_id
    AND p.user_type = 'student'
    AND sp.status IN ('pending', 'inactive', 'suspended', 'blocked');

  SELECT COUNT(*)
  INTO v_inactive_units_count
  FROM public.units u
  WHERE u.academy_id = v_academy_id
    AND COALESCE(u.status::text, 'active') IN ('inactive', 'maintenance');

  SELECT COALESCE(jsonb_agg(alert_item ORDER BY priority), '[]'::jsonb)
  INTO v_alerts
  FROM (
    SELECT
      1 AS priority,
      jsonb_build_object(
        'id', 'old-drafts',
        'type', 'system',
        'severity', CASE WHEN v_old_drafts_count >= 5 THEN 'critical' ELSE 'warning' END,
        'title', v_old_drafts_count || ' rascunho(s) pendente(s)',
        'description', 'Rascunhos sem atualizacao ha mais de 2 dias.',
        'actionLabel', 'Abrir onboarding',
        'actionHref', '/users/onboarding',
        'count', v_old_drafts_count,
        'timestamp', now()
      ) AS alert_item
    WHERE v_old_drafts_count > 0

    UNION ALL

    SELECT
      2 AS priority,
      jsonb_build_object(
        'id', 'expiring-invites',
        'type', 'system',
        'severity', 'warning',
        'title', v_expiring_invites_count || ' convite(s) expira(m) em 48h',
        'description', 'Convites pendentes proximos da expiracao.',
        'actionLabel', 'Ver alunos',
        'actionHref', '/users',
        'count', v_expiring_invites_count,
        'timestamp', now()
      ) AS alert_item
    WHERE v_expiring_invites_count > 0

    UNION ALL

    SELECT
      3 AS priority,
      jsonb_build_object(
        'id', 'stale-invites',
        'type', 'system',
        'severity', 'warning',
        'title', v_stale_invites_count || ' convite(s) pendente(s) ha mais de 7 dias',
        'description', 'Convites enviados que ainda nao foram claimados.',
        'actionLabel', 'Ver alunos',
        'actionHref', '/users',
        'count', v_stale_invites_count,
        'timestamp', now()
      ) AS alert_item
    WHERE v_stale_invites_count > 0

    UNION ALL

    SELECT
      4 AS priority,
      jsonb_build_object(
        'id', 'students-non-active',
        'type', 'access',
        'severity', CASE WHEN v_non_active_students_count >= 10 THEN 'critical' ELSE 'warning' END,
        'title', v_non_active_students_count || ' aluno(s) nao ativo(s)',
        'description', 'Alunos com status pending/inactive/suspended/blocked.',
        'actionLabel', 'Ver alunos',
        'actionHref', '/users',
        'count', v_non_active_students_count,
        'timestamp', now()
      ) AS alert_item
    WHERE v_non_active_students_count > 0

    UNION ALL

    SELECT
      5 AS priority,
      jsonb_build_object(
        'id', 'inactive-units',
        'type', 'system',
        'severity', 'warning',
        'title', v_inactive_units_count || ' unidade(s) inativa(s)',
        'description', 'Ha unidades inativas ou em manutencao.',
        'actionLabel', 'Ver unidades',
        'actionHref', '/settings/units',
        'count', v_inactive_units_count,
        'timestamp', now()
      ) AS alert_item
    WHERE v_inactive_units_count > 0
  ) alerts_ranked;

  RETURN jsonb_build_object(
    'success', true,
    'academy_name', v_academy_name,
    'kpis', jsonb_build_object(
      'total_students', v_total_students,
      'active_students', v_active_students,
      'open_drafts', v_open_drafts,
      'pending_invites', v_pending_invites,
      'active_units', v_active_units
    ),
    'alerts', v_alerts
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.mask_email_hint(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mask_email_hint(text) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_invite_signup_context(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_invite_signup(text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_invite_signup_session(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_my_invite_signup_progress(text, text, text, jsonb, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_my_invite_signup(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_invite_signup_context(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_invite_signup(text, text, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_invite_signup_session(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.save_my_invite_signup_progress(text, text, text, jsonb, timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_my_invite_signup(text) TO authenticated, service_role;