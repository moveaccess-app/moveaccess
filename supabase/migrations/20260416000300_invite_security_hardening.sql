-- PR 14 — Invite security hardening
-- Closes legacy bypass vectors, strengthens password validation,
-- and cleans up the old public invite table exposure.

-- ═══════════════════════════════════════════════════════════════════
-- 1. DROP legacy finalize_invite_signup function
--    This RPC was accessible by anon and bypassed the claim mechanism
--    introduced in PR 12.5. An attacker with a valid token could call
--    finalize_invite_signup directly, creating a user and marking the
--    invite as used without going through claim_invite_signup first.
--    The active flow uses claim_invite_signup + complete_my_invite_signup.
-- ═══════════════════════════════════════════════════════════════════

-- Drop the new signature (PR 12 / commercial activation)
DROP FUNCTION IF EXISTS public.finalize_invite_signup(
  text, text, text, text, text, text, date, jsonb, jsonb, uuid, text, boolean
);

-- Drop the original signature (PR pre-12)
DROP FUNCTION IF EXISTS public.finalize_invite_signup(
  text, text, text, text, text, text, date, jsonb, jsonb
);

-- ═══════════════════════════════════════════════════════════════════
-- 2. Revoke public SELECT on legacy invites table
--    The old invites table had a policy allowing anyone (anon) to see
--    pending invites, which exposed tokens, academy_ids, and discount
--    data. This table is no longer used by the active flow (invite_links
--    is the active table), but the public policy remained as a vector.
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Anyone can view pending invites" ON public.invites;
DROP POLICY IF EXISTS "Convites pendentes são públicos" ON public.invites;

-- Also revoke the legacy is_invite_valid RPC that operated on the old table
DROP FUNCTION IF EXISTS public.is_invite_valid(text);

-- ═══════════════════════════════════════════════════════════════════
-- 3. Strengthen password validation in claim_invite_signup
--    Minimum 8 chars (up from 6) with basic complexity:
--    at least one letter and one digit.
-- ═══════════════════════════════════════════════════════════════════

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
  v_password text := COALESCE(p_password, '');
  v_user_id uuid;
  v_draft_id uuid;
  v_existing_profile_id uuid;
BEGIN
  -- ── Input validation ───────────────────────────────────────────

  IF v_email = '' OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_EMAIL');
  END IF;

  IF p_full_name IS NULL OR length(trim(p_full_name)) < 2 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_NAME');
  END IF;

  -- Password: min 8 chars, at least one letter and one digit
  IF length(trim(v_password)) < 8 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'PASSWORD_TOO_SHORT');
  END IF;

  IF trim(v_password) !~ '[a-zA-Z]' OR trim(v_password) !~ '[0-9]' THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'PASSWORD_TOO_WEAK');
  END IF;

  -- ── Token lookup & validation ──────────────────────────────────

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

  -- ── Target binding ─────────────────────────────────────────────

  IF v_link.expected_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVITE_TARGET_REQUIRED');
  END IF;

  IF lower(v_link.expected_email) <> v_email THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'EMAIL_MISMATCH');
  END IF;

  -- ── Claim guard ────────────────────────────────────────────────

  IF v_link.claimed_by_user_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'INVITE_ALREADY_CLAIMED');
  END IF;

  -- ── Uniqueness check ──────────────────────────────────────────

  SELECT p.id INTO v_existing_profile_id
  FROM public.profiles p
  WHERE lower(p.email) = v_email
  LIMIT 1;

  IF v_existing_profile_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'EMAIL_ALREADY_REGISTERED');
  END IF;

  -- ── User creation ─────────────────────────────────────────────

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
    extensions.crypt(trim(v_password), extensions.gen_salt('bf')),
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

  -- ── Claim binding ─────────────────────────────────────────────

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

-- Grants: anon needs to call claim (unauthenticated first access)
REVOKE ALL ON FUNCTION public.claim_invite_signup(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_invite_signup(text, text, text, text, text) TO anon, authenticated, service_role;
