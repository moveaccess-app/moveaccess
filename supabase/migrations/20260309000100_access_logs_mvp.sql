-- ACCESS MVP
-- Mission #7: access logs + manual check-in

CREATE TABLE IF NOT EXISTS public.access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  user_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name text,
  user_document text,
  method text NOT NULL,
  status text NOT NULL,
  denial_reason text NULL,
  operator_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes text NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  raw_payload jsonb NULL DEFAULT '{}'::jsonb,
  CONSTRAINT access_logs_method_check CHECK (method IN ('manual', 'qr', 'scanner')),
  CONSTRAINT access_logs_status_check CHECK (status IN ('allowed', 'denied'))
);

CREATE INDEX IF NOT EXISTS idx_access_logs_academy_occurred_at
  ON public.access_logs (academy_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_access_logs_academy_unit_occurred_at
  ON public.access_logs (academy_id, unit_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_access_logs_academy_status_occurred_at
  ON public.access_logs (academy_id, status, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_access_logs_user_occurred_at
  ON public.access_logs (user_id, occurred_at DESC);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff view access logs in academy" ON public.access_logs;
CREATE POLICY "Staff view access logs in academy"
ON public.access_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = access_logs.academy_id
  )
);

REVOKE ALL ON public.access_logs FROM PUBLIC;
GRANT SELECT ON public.access_logs TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.process_checkin(
  p_user_id uuid,
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
  v_user record;
  v_status text := 'denied';
  v_message text := 'Acesso negado';
  v_denial_reason text := null;
  v_log_id uuid;
BEGIN
  IF p_method NOT IN ('manual', 'qr', 'scanner') THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'denied',
      'message', 'Método de acesso inválido.',
      'denial_reason', 'INVALID_METHOD',
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
      'status', 'denied',
      'message', 'Unidade não encontrada.',
      'denial_reason', 'UNIT_NOT_FOUND',
      'log_id', null
    );
  END IF;

  IF v_actor IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'denied',
      'message', 'Operador não autenticado.',
      'denial_reason', 'UNAUTHENTICATED',
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
      'status', 'denied',
      'message', 'Operador sem acesso à unidade.',
      'denial_reason', 'FORBIDDEN',
      'log_id', null
    );
  END IF;

  SELECT
    p.id,
    p.name,
    p.cpf,
    p.email,
    p.phone,
    sp.status AS student_status
  INTO v_user
  FROM public.profiles p
  JOIN public.academy_memberships am ON am.profile_id = p.id AND am.academy_id = v_unit.academy_id
  LEFT JOIN public.student_profiles sp ON sp.id = p.id
  WHERE p.id = p_user_id
    AND p.user_type = 'student';

  IF NOT FOUND THEN
    v_denial_reason := 'USER_NOT_FOUND';
    v_message := 'Usuário não encontrado nesta academia.';
  ELSIF COALESCE(v_user.student_status, 'pending') <> 'active' THEN
    v_denial_reason := 'STUDENT_INACTIVE';
    v_message := 'Aluno sem acesso ativo.';
  ELSE
    v_status := 'allowed';
    v_message := 'Acesso liberado.';
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
    v_user.id,
    v_user.name,
    COALESCE(v_user.cpf, v_user.email, v_user.phone),
    p_method,
    v_status,
    v_denial_reason,
    v_actor,
    nullif(trim(coalesce(p_notes, '')), ''),
    jsonb_build_object(
      'unit_name', v_unit.name,
      'operator_id', v_actor,
      'student_status', v_user.student_status
    )
  )
  RETURNING id INTO v_log_id;

  RETURN jsonb_build_object(
    'success', v_status = 'allowed',
    'status', v_status,
    'message', v_message,
    'denial_reason', v_denial_reason,
    'log_id', v_log_id
  );
END;
$function$;

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
  v_identifier_clean text := regexp_replace(trim(coalesce(p_identifier, '')), '\\D', '', 'g');
  v_user record;
  v_log_id uuid;
BEGIN
  IF p_method NOT IN ('manual', 'qr', 'scanner') THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'denied',
      'message', 'Método de acesso inválido.',
      'denial_reason', 'INVALID_METHOD',
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
      'status', 'denied',
      'message', 'Unidade não encontrada.',
      'denial_reason', 'UNIT_NOT_FOUND',
      'log_id', null
    );
  END IF;

  IF v_actor IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'denied',
      'message', 'Operador não autenticado.',
      'denial_reason', 'UNAUTHENTICATED',
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
      'status', 'denied',
      'message', 'Operador sem acesso à unidade.',
      'denial_reason', 'FORBIDDEN',
      'log_id', null
    );
  END IF;

  SELECT p.id, p.name, p.cpf, p.email, p.phone
  INTO v_user
  FROM public.profiles p
  JOIN public.academy_memberships am ON am.profile_id = p.id AND am.academy_id = v_unit.academy_id
  WHERE p.user_type = 'student'
    AND (
      lower(p.email) = lower(v_identifier)
      OR regexp_replace(coalesce(p.phone, ''), '\\D', '', 'g') = v_identifier_clean
      OR regexp_replace(coalesce(p.cpf, ''), '\\D', '', 'g') = v_identifier_clean
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
    'status', 'denied',
    'message', 'Usuário não encontrado nesta academia.',
    'denial_reason', 'USER_NOT_FOUND',
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
