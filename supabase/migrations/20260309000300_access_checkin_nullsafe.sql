-- ACCESS CHECKIN NULL-SAFE FIX
-- Mission #10 follow-up: avoid unassigned record access in process_checkin logs

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
