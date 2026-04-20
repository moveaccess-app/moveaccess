-- PR 14.1 — validate_invite_token consistency
-- Keeps the preliminary token validator aligned with the hardened
-- public invite/signup flow already enforced by get_invite_signup_context
-- and claim_invite_signup.

CREATE OR REPLACE FUNCTION public.validate_invite_token(p_token text)
RETURNS TABLE(
  is_valid boolean,
  invite_id uuid,
  academy_id uuid,
  unit_id uuid,
  expected_email text,
  draft_id uuid,
  error_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_link public.invite_links%ROWTYPE;
BEGIN
  SELECT * INTO v_link
  FROM public.invite_links
  WHERE token = p_token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false, NULL::uuid, NULL::uuid, NULL::uuid, NULL::text, NULL::uuid, 'TOKEN_NOT_FOUND'::text;
    RETURN;
  END IF;

  IF v_link.status = 'revoked' THEN
    RETURN QUERY SELECT
      false, v_link.id, v_link.academy_id, v_link.unit_id, v_link.expected_email, v_link.draft_id, 'TOKEN_CANCELLED'::text;
    RETURN;
  END IF;

  IF v_link.status = 'expired' OR (v_link.status = 'active' AND v_link.expires_at < now()) THEN
    IF v_link.status = 'active' THEN
      UPDATE public.invite_links
      SET status = 'expired', updated_at = now()
      WHERE id = v_link.id;
    END IF;

    RETURN QUERY SELECT
      false, v_link.id, v_link.academy_id, v_link.unit_id, v_link.expected_email, v_link.draft_id, 'TOKEN_EXPIRED'::text;
    RETURN;
  END IF;

  IF v_link.status = 'used' THEN
    RETURN QUERY SELECT
      false, v_link.id, v_link.academy_id, v_link.unit_id, v_link.expected_email, v_link.draft_id, 'TOKEN_COMPLETED'::text;
    RETURN;
  END IF;

  IF v_link.claimed_by_user_id IS NOT NULL THEN
    RETURN QUERY SELECT
      false, v_link.id, v_link.academy_id, v_link.unit_id, v_link.expected_email, v_link.draft_id, 'TOKEN_CLAIMED'::text;
    RETURN;
  END IF;

  IF v_link.expected_email IS NULL THEN
    RETURN QUERY SELECT
      false, v_link.id, v_link.academy_id, v_link.unit_id, v_link.expected_email, v_link.draft_id, 'INVITE_TARGET_REQUIRED'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT
    true, v_link.id, v_link.academy_id, v_link.unit_id, v_link.expected_email, v_link.draft_id, NULL::text;
END;
$function$;