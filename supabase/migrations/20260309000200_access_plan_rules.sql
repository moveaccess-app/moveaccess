-- ACCESS PLAN RULES
-- Mission #10: enforce subscriptions and plan access rules in check-in

CREATE TABLE IF NOT EXISTS public.plan_access_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  allowed_units uuid[] NULL,
  allowed_weekdays int[] NULL,
  allowed_start_time time NULL,
  allowed_end_time time NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plan_access_rules_weekdays_check CHECK (
    allowed_weekdays IS NULL
    OR (
      cardinality(allowed_weekdays) > 0
      AND allowed_weekdays <@ ARRAY[0, 1, 2, 3, 4, 5, 6]::int[]
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_access_rules_plan_id
  ON public.plan_access_rules (plan_id);

CREATE INDEX IF NOT EXISTS idx_plan_access_rules_academy_id
  ON public.plan_access_rules (academy_id);

ALTER TABLE public.plan_access_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff view plan access rules in academy" ON public.plan_access_rules;
CREATE POLICY "Staff view plan access rules in academy"
ON public.plan_access_rules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = plan_access_rules.academy_id
  )
);

DROP POLICY IF EXISTS "Staff insert plan access rules in academy" ON public.plan_access_rules;
CREATE POLICY "Staff insert plan access rules in academy"
ON public.plan_access_rules
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = plan_access_rules.academy_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.plans pl
    WHERE pl.id = plan_access_rules.plan_id
      AND pl.academy_id = plan_access_rules.academy_id
  )
);

DROP POLICY IF EXISTS "Staff update plan access rules in academy" ON public.plan_access_rules;
CREATE POLICY "Staff update plan access rules in academy"
ON public.plan_access_rules
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = plan_access_rules.academy_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = plan_access_rules.academy_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.plans pl
    WHERE pl.id = plan_access_rules.plan_id
      AND pl.academy_id = plan_access_rules.academy_id
  )
);

REVOKE ALL ON public.plan_access_rules FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.plan_access_rules TO authenticated, service_role;

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
  v_subscription_id uuid;
  v_subscription_plan_id uuid;
  v_subscription_status text;
  v_subscription_expires_at timestamptz;
  v_rule_allowed_units uuid[];
  v_rule_allowed_weekdays int[];
  v_rule_allowed_start_time time;
  v_rule_allowed_end_time time;
  v_status text := 'denied';
  v_reason text := 'USER_NOT_FOUND';
  v_message text := 'Usuário não encontrado nesta academia.';
  v_log_id uuid;
  v_now timestamptz := now();
  v_current_time time := localtime;
  v_current_weekday int := extract(dow from v_now);
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
    v_reason := 'USER_NOT_FOUND';
    v_message := 'Usuário não encontrado nesta academia.';
  ELSIF COALESCE(v_user.student_status, 'pending') <> 'active' THEN
    v_reason := 'STUDENT_INACTIVE';
    v_message := 'Aluno sem acesso ativo.';
  ELSE
    SELECT
      s.id,
      s.plan_id,
      s.status,
      s.expires_at
    INTO v_subscription_id,
      v_subscription_plan_id,
      v_subscription_status,
      v_subscription_expires_at
    FROM public.subscriptions s
    WHERE s.student_id = v_user.id
    ORDER BY
      CASE WHEN s.status = 'active' THEN 0 ELSE 1 END,
      s.started_at DESC,
      s.created_at DESC
    LIMIT 1;

    IF NOT FOUND OR v_subscription_status <> 'active' THEN
      v_reason := 'SUBSCRIPTION_INACTIVE';
      v_message := 'Aluno não possui assinatura ativa.';
    ELSIF v_subscription_expires_at IS NOT NULL AND v_subscription_expires_at < v_now THEN
      v_reason := 'SUBSCRIPTION_EXPIRED';
      v_message := 'Assinatura expirada.';
    ELSE
      SELECT
        par.allowed_units,
        par.allowed_weekdays,
        par.allowed_start_time,
        par.allowed_end_time
      INTO v_rule_allowed_units,
        v_rule_allowed_weekdays,
        v_rule_allowed_start_time,
        v_rule_allowed_end_time
      FROM public.plan_access_rules par
      WHERE par.plan_id = v_subscription_plan_id
        AND par.academy_id = v_unit.academy_id
      LIMIT 1;

      IF FOUND THEN
        IF v_rule_allowed_units IS NOT NULL AND NOT (p_unit_id = ANY(v_rule_allowed_units)) THEN
          v_reason := 'UNIT_NOT_ALLOWED';
          v_message := 'Plano não permite acesso a esta unidade.';
        ELSIF v_rule_allowed_weekdays IS NOT NULL AND NOT (v_current_weekday = ANY(v_rule_allowed_weekdays)) THEN
          v_reason := 'TIME_NOT_ALLOWED';
          v_message := 'Plano não permite acesso neste dia.';
        ELSIF v_rule_allowed_start_time IS NOT NULL AND v_current_time < v_rule_allowed_start_time THEN
          v_reason := 'TIME_NOT_ALLOWED';
          v_message := 'Plano não permite acesso neste horário.';
        ELSIF v_rule_allowed_end_time IS NOT NULL AND v_current_time > v_rule_allowed_end_time THEN
          v_reason := 'TIME_NOT_ALLOWED';
          v_message := 'Plano não permite acesso neste horário.';
        ELSE
          v_status := 'allowed';
          v_reason := 'ACCESS_GRANTED';
          v_message := 'Acesso liberado.';
        END IF;
      ELSE
        v_status := 'allowed';
        v_reason := 'ACCESS_GRANTED';
        v_message := 'Acesso liberado.';
      END IF;
    END IF;
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
    CASE WHEN v_status = 'allowed' THEN null ELSE v_reason END,
    v_actor,
    nullif(trim(coalesce(p_notes, '')), ''),
    jsonb_build_object(
      'unit_name', v_unit.name,
      'operator_id', v_actor,
      'student_status', v_user.student_status,
      'subscription_id', v_subscription_id,
      'subscription_status', v_subscription_status,
      'subscription_expires_at', v_subscription_expires_at,
      'plan_id', v_subscription_plan_id,
      'allowed_units', v_rule_allowed_units,
      'allowed_weekdays', v_rule_allowed_weekdays,
      'allowed_start_time', v_rule_allowed_start_time,
      'allowed_end_time', v_rule_allowed_end_time
    )
  )
  RETURNING id INTO v_log_id;

  RETURN jsonb_build_object(
    'success', v_status = 'allowed',
    'reason', v_reason,
    'status', v_status,
    'message', v_message,
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
