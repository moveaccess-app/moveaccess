-- Mission #13: allow fixed student QR identifiers in scanner check-in
-- Supports both raw UUID and prefixed format: MOVEACCESS:STUDENT:{student_id}

CREATE OR REPLACE FUNCTION public.process_checkin_by_identifier(
  p_identifier text,
  p_unit_id uuid,
  p_method text,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_unit record;
  v_identifier text := trim(coalesce(p_identifier, ''));
  v_identifier_clean text := regexp_replace(trim(coalesce(p_identifier, '')), '\D', '', 'g');
  v_student_id_text text;
  v_student_id uuid;
  v_user record;
  v_log_id uuid;
BEGIN
  IF p_method NOT IN ('manual', 'qr', 'scanner') THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'INVALID_METHOD',
      'status', 'denied',
      'message', 'Método de acesso inválido.',
      'log_id', null
    );
  END IF;

  SELECT u.id, u.academy_id, u.name
  INTO v_unit
  FROM public.units u
  WHERE u.id = p_unit_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'UNIT_NOT_FOUND',
      'status', 'denied',
      'message', 'Unidade não encontrada.',
      'log_id', null
    );
  END IF;

  IF v_actor IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'UNAUTHENTICATED',
      'status', 'denied',
      'message', 'Operador não autenticado.',
      'log_id', null
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = v_actor
      AND p.user_type = 'staff'
      AND am.academy_id = v_unit.academy_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'FORBIDDEN',
      'status', 'denied',
      'message', 'Operador sem acesso à unidade.',
      'log_id', null
    );
  END IF;

  IF v_identifier ~* '^MOVEACCESS:STUDENT:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_student_id_text := substring(v_identifier from '^MOVEACCESS:STUDENT:(.*)$');
    v_student_id := v_student_id_text::uuid;
  ELSIF v_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_student_id := v_identifier::uuid;
  ELSE
    v_student_id := null;
  END IF;

  SELECT p.id, p.name, p.cpf, p.email, p.phone
  INTO v_user
  FROM public.profiles p
  JOIN public.academy_memberships am ON am.profile_id = p.id AND am.academy_id = v_unit.academy_id
  WHERE p.user_type = 'student'
    AND (
      p.id = v_student_id
      OR lower(p.email) = lower(v_identifier)
      OR regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') = v_identifier_clean
      OR regexp_replace(coalesce(p.cpf, ''), '\D', '', 'g') = v_identifier_clean
    )
  ORDER BY p.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN public.process_checkin(v_user.id, p_unit_id, p_method, p_notes);
  END IF;

  INSERT INTO public.access_logs (
    academy_id,
    unit_id,
    user_id,
    user_name,
    user_document,
    method,
    status,
    denial_reason,
    operator_id,
    notes,
    raw_payload
  ) VALUES (
    v_unit.academy_id,
    v_unit.id,
    null,
    null,
    nullif(v_identifier, ''),
    p_method,
    'denied',
    'USER_NOT_FOUND',
    v_actor,
    nullif(trim(coalesce(p_notes, '')), ''),
    jsonb_build_object(
      'unit_name', v_unit.name,
      'operator_id', v_actor,
      'identifier', v_identifier
    )
  )
  RETURNING id INTO v_log_id;

  RETURN jsonb_build_object(
    'success', false,
    'reason', 'USER_NOT_FOUND',
    'status', 'denied',
    'message', 'Usuário não encontrado nesta academia.',
    'log_id', v_log_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.process_checkin(uuid, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_checkin_by_identifier(text, uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_checkin(uuid, uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_checkin_by_identifier(text, uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.process_checkin(uuid, uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_checkin_by_identifier(text, uuid, text, text) TO authenticated, service_role;
