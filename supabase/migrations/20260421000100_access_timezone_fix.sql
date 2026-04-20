-- ============================================================
-- PR 29 — Fix timezone in process_checkin
-- ============================================================
-- BUG: `localtime` and `extract(dow from now())` use UTC on
-- Supabase servers. Plan access rules (allowed_weekdays,
-- allowed_start_time, allowed_end_time) are configured by the
-- academy in their local timezone.
--
-- FIX: Read the academy timezone from `academies.preferences->>'timezone'`
-- (default 'America/Sao_Paulo') and convert both current_time and
-- current_weekday to the academy's local timezone before comparing.
-- ============================================================

CREATE OR REPLACE FUNCTION public.process_checkin(
  p_user_id uuid,
  p_unit_id uuid,
  p_method text,
  p_flow text DEFAULT 'entry',
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
  -- FIX: timezone-aware time/weekday (populated after unit lookup)
  v_academy_tz text;
  v_current_time time;
  v_current_weekday int;
  v_scanner_mode text := 'entry_only';
  v_block_second_entry boolean := false;
  v_requested_flow text := lower(coalesce(p_flow, 'entry'));
  v_inside_before boolean := false;
  v_access_event text := null;
  v_presence_after boolean := null;
  -- Delinquency check variables
  v_is_delinquent boolean;
  v_del_count int;
BEGIN
  -- 1. Validate method
  IF p_method NOT IN ('manual', 'qr', 'scanner') THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'INVALID_METHOD',
      'status', 'denied',
      'message', 'Método de acesso inválido.',
      'log_id', null
    );
  END IF;

  IF v_requested_flow NOT IN ('entry', 'exit', 'auto') THEN
    v_requested_flow := 'entry';
  END IF;

  -- 2. Find unit + academy preferences
  SELECT u.id, u.academy_id, u.name, a.preferences
  INTO v_unit
  FROM public.units u
  JOIN public.academies a ON a.id = u.academy_id
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

  -- FIX: Resolve academy timezone and compute local time/weekday
  v_academy_tz := coalesce(v_unit.preferences->>'timezone', 'America/Sao_Paulo');
  v_current_time := (v_now AT TIME ZONE v_academy_tz)::time;
  v_current_weekday := extract(dow from (v_now AT TIME ZONE v_academy_tz));

  -- 3. Auth checks
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

  -- 4. Read scanner mode from preferences
  v_scanner_mode := coalesce(v_unit.preferences->'accessControl'->>'scannerMode', 'entry_only');
  v_block_second_entry := coalesce((v_unit.preferences->'accessControl'->>'blockSecondEntryWithoutExit')::boolean, false);

  -- 5. Find student
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
    -- 6. Find subscription
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
      -- ================================================================
      -- 7. DELINQUENCY POLICY CHECK
      -- ================================================================
      IF coalesce((v_unit.preferences->'delinquency'->>'blockAccess')::boolean, false) THEN
        SELECT d.is_delinquent, d.overdue_count
        INTO v_is_delinquent, v_del_count
        FROM public.get_student_delinquency(
          v_user.id,
          v_unit.academy_id,
          coalesce((v_unit.preferences->'delinquency'->>'graceDays')::int, 0)
        ) d;

        IF coalesce(v_is_delinquent, false) THEN
          v_reason := 'PAYMENT_OVERDUE';
          v_message := format(
            'Acesso bloqueado por inadimplência financeira (%s cobrança(s) em atraso).',
            v_del_count
          );
        END IF;
      END IF;

      -- 8. Plan access rules (skip if already blocked by delinquency)
      IF v_reason NOT IN ('PAYMENT_OVERDUE') THEN
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
          END IF;
        END IF;
      END IF;

      -- 9. Entry/exit logic (skip if blocked by delinquency or plan rules)
      IF v_reason NOT IN ('PAYMENT_OVERDUE', 'UNIT_NOT_ALLOWED', 'TIME_NOT_ALLOWED') THEN
        SELECT al.presence_after
        INTO v_inside_before
        FROM public.access_logs al
        WHERE al.academy_id = v_unit.academy_id
          AND al.user_id = v_user.id
          AND al.status = 'allowed'
          AND al.presence_after IS NOT NULL
        ORDER BY al.occurred_at DESC
        LIMIT 1;

        v_inside_before := coalesce(v_inside_before, false);

        IF v_scanner_mode = 'single_entry_exit' THEN
          v_access_event := CASE WHEN v_inside_before THEN 'exit' ELSE 'entry' END;
        ELSIF v_scanner_mode = 'separate_entry_exit' THEN
          v_access_event := CASE WHEN v_requested_flow = 'exit' THEN 'exit' ELSE 'entry' END;
        ELSE
          v_access_event := null;
        END IF;

        IF v_access_event = 'entry' AND v_block_second_entry AND v_inside_before THEN
          v_reason := 'ALREADY_INSIDE';
          v_message := 'Aluno já possui entrada ativa sem saída registrada.';
        ELSIF v_access_event = 'exit' AND NOT v_inside_before THEN
          v_reason := 'EXIT_WITHOUT_ENTRY';
          v_message := 'Não existe entrada ativa para registrar a saída.';
        ELSE
          v_status := 'allowed';
          v_reason := 'ACCESS_GRANTED';
          v_message := CASE
            WHEN v_access_event = 'exit' THEN 'Saída registrada com sucesso.'
            WHEN v_access_event = 'entry' THEN 'Entrada liberada.'
            ELSE 'Acesso liberado.'
          END;
          v_presence_after := CASE
            WHEN v_access_event = 'entry' THEN true
            WHEN v_access_event = 'exit' THEN false
            ELSE null
          END;
        END IF;
      END IF;
    END IF;
  END IF;

  -- 10. Log and return
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
    occurred_at,
    access_event,
    presence_after,
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
    v_now,
    v_access_event,
    CASE WHEN v_status = 'allowed' THEN v_presence_after ELSE null END,
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
      'allowed_end_time', v_rule_allowed_end_time,
      'scanner_mode', v_scanner_mode,
      'requested_flow', v_requested_flow,
      'access_event', v_access_event,
      'inside_before', v_inside_before,
      'presence_after', CASE WHEN v_status = 'allowed' THEN v_presence_after ELSE null END,
      'delinquency_blocked', CASE WHEN v_reason = 'PAYMENT_OVERDUE' THEN true ELSE false END,
      'delinquency_count', v_del_count,
      'academy_timezone', v_academy_tz
    )
  )
  RETURNING id INTO v_log_id;

  RETURN jsonb_build_object(
    'success', v_status = 'allowed',
    'reason', v_reason,
    'status', v_status,
    'message', v_message,
    'log_id', v_log_id,
    'event_type', v_access_event,
    'presence_after', CASE WHEN v_status = 'allowed' THEN v_presence_after ELSE null END
  );
END;
$function$;

-- Also fix the process_checkin_by_identifier overload if it exists
-- (it delegates to process_checkin, so the 4-param overload is already correct)
