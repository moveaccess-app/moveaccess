-- Mission #15: access scanner modes (entry-only, separate entry/exit, single auto entry+exit)
-- Also converges secure QR token format to compact payload in all environments.

ALTER TABLE public.access_logs
  ADD COLUMN IF NOT EXISTS access_event text NULL,
  ADD COLUMN IF NOT EXISTS presence_after boolean NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'access_logs_access_event_check'
  ) THEN
    ALTER TABLE public.access_logs
      ADD CONSTRAINT access_logs_access_event_check
      CHECK (access_event IS NULL OR access_event IN ('entry', 'exit'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_access_logs_presence_lookup
  ON public.access_logs (academy_id, user_id, occurred_at DESC)
  WHERE status = 'allowed' AND presence_after IS NOT NULL;

CREATE OR REPLACE FUNCTION public.to_base64url(data BYTEA)
RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
  SELECT replace(
    replace(
      replace(
        replace(encode(data, 'base64'), '+', '-'),
        '/', '_'
      ),
      '=', ''
    ),
    E'\n', ''
  );
$$;

CREATE OR REPLACE FUNCTION public.issue_student_qr_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id    UUID;
  v_student_id UUID;
  v_academy_id UUID;
  v_nonce      TEXT;
  v_iat        BIGINT;
  v_exp        BIGINT;
  v_payload    TEXT;
  v_secret     TEXT;
  v_sig        TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: must be authenticated';
  END IF;

  SELECT sp.id INTO v_student_id
  FROM public.student_profiles sp
  WHERE sp.id = v_user_id
  LIMIT 1;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Forbidden: no student profile for this user';
  END IF;

  SELECT am.academy_id INTO v_academy_id
  FROM public.academy_memberships am
  WHERE am.profile_id = v_user_id
  ORDER BY am.is_primary DESC, am.created_at DESC
  LIMIT 1;

  IF v_academy_id IS NULL THEN
    RAISE EXCEPTION 'Forbidden: no academy membership found';
  END IF;

  SELECT ac.value INTO v_secret
  FROM public.app_config ac
  WHERE ac.key = 'qr_secret';

  IF v_secret IS NULL OR trim(v_secret) = '' THEN
    RAISE EXCEPTION 'Configuration error: QR secret not set';
  END IF;

  v_nonce := encode(extensions.gen_random_bytes(16), 'hex');
  v_iat   := EXTRACT(EPOCH FROM clock_timestamp())::BIGINT;
  v_exp   := v_iat + 60;

  v_payload := public.to_base64url(
    convert_to(
      jsonb_build_object(
        's', replace(v_student_id::TEXT, '-', ''),
        'a', replace(v_academy_id::TEXT, '-', ''),
        'iat', v_iat,
        'exp', v_exp,
        'n', v_nonce
      )::TEXT,
      'UTF8'
    )
  );

  v_sig := encode(
    extensions.hmac(v_payload::BYTEA, v_secret::BYTEA, 'sha256'),
    'hex'
  );

  RETURN 'MOVEACCESS:QR:' || v_payload || '.' || v_sig;
END;
$$;

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
  v_current_time time := localtime;
  v_current_weekday int := extract(dow from v_now);
  v_scanner_mode text := 'entry_only';
  v_block_second_entry boolean := false;
  v_requested_flow text := lower(coalesce(p_flow, 'entry'));
  v_inside_before boolean := false;
  v_access_event text := null;
  v_presence_after boolean := null;
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

  IF v_requested_flow NOT IN ('entry', 'exit', 'auto') THEN
    v_requested_flow := 'entry';
  END IF;

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

  v_scanner_mode := coalesce(v_unit.preferences->'accessControl'->>'scannerMode', 'entry_only');
  v_block_second_entry := coalesce((v_unit.preferences->'accessControl'->>'blockSecondEntryWithoutExit')::boolean, false);

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
        END IF;
      END IF;

      IF v_reason NOT IN ('UNIT_NOT_ALLOWED', 'TIME_NOT_ALLOWED') THEN
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
      'presence_after', CASE WHEN v_status = 'allowed' THEN v_presence_after ELSE null END
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
BEGIN
  RETURN public.process_checkin(p_user_id, p_unit_id, p_method, 'entry', p_notes);
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_checkin_by_identifier(
  p_identifier text,
  p_unit_id uuid,
  p_method text,
  p_flow text DEFAULT 'entry',
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_actor            UUID   := auth.uid();
  v_unit             RECORD;
  v_identifier       TEXT   := trim(coalesce(p_identifier, ''));
  v_identifier_clean TEXT   := regexp_replace(trim(coalesce(p_identifier, '')), '\D', '', 'g');
  v_student_id       UUID;
  v_user             RECORD;
  v_log_id           UUID;
  v_sig_given      TEXT;
  v_sig_computed   TEXT;
  v_secret         TEXT;
  v_encoded        TEXT;
  v_payload_raw    TEXT;
  v_payload        JSONB;
  v_exp            BIGINT;
  v_nonce          TEXT;
  v_qr_student     UUID;
  v_qr_academy     UUID;
  v_qr_student_txt TEXT;
  v_qr_academy_txt TEXT;
BEGIN
  IF p_method NOT IN ('manual', 'qr', 'scanner') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'INVALID_METHOD', 'status', 'denied', 'message', 'Método de acesso inválido.', 'log_id', null);
  END IF;

  SELECT u.id, u.academy_id, u.name INTO v_unit
  FROM public.units u WHERE u.id = p_unit_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'UNIT_NOT_FOUND', 'status', 'denied', 'message', 'Unidade não encontrada.', 'log_id', null);
  END IF;

  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'UNAUTHENTICATED', 'status', 'denied', 'message', 'Operador não autenticado.', 'log_id', null);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = v_actor
      AND p.user_type = 'staff'
      AND am.academy_id = v_unit.academy_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'FORBIDDEN', 'status', 'denied', 'message', 'Operador sem acesso à unidade.', 'log_id', null);
  END IF;

  IF v_identifier ~* '^MOVEACCESS:QR:[A-Za-z0-9_-]+\.[0-9a-f]{64}$' THEN
    SELECT ac.value INTO v_secret FROM public.app_config ac WHERE ac.key = 'qr_secret';

    IF v_secret IS NULL OR trim(v_secret) = '' THEN
      RETURN jsonb_build_object('success', false, 'reason', 'CONFIGURATION_ERROR', 'status', 'denied', 'message', 'Erro de configuração do servidor.', 'log_id', null);
    END IF;

    v_sig_given := right(v_identifier, 64);
    v_encoded   := substring(v_identifier FROM 15 FOR length(v_identifier) - 14 - 65);
    v_sig_computed := encode(extensions.hmac(v_encoded::BYTEA, v_secret::BYTEA, 'sha256'), 'hex');

    IF v_sig_computed <> v_sig_given THEN
      RETURN jsonb_build_object('success', false, 'reason', 'INVALID_QR_SIGNATURE', 'status', 'denied', 'message', 'QR inválido ou adulterado.', 'log_id', null);
    END IF;

    BEGIN
      v_payload_raw := convert_from(public.from_base64url(v_encoded), 'UTF8');
      v_payload     := v_payload_raw::JSONB;
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('success', false, 'reason', 'INVALID_QR_PAYLOAD', 'status', 'denied', 'message', 'QR com formato inválido.', 'log_id', null);
    END;

    v_exp := (v_payload->>'exp')::BIGINT;
    IF EXTRACT(EPOCH FROM clock_timestamp())::BIGINT > v_exp THEN
      RETURN jsonb_build_object('success', false, 'reason', 'QR_EXPIRED', 'status', 'denied', 'message', 'QR expirado. Solicite um novo código.', 'log_id', null);
    END IF;

    v_nonce := v_payload->>'n';
    IF EXISTS (SELECT 1 FROM public.qr_used_nonces WHERE nonce = v_nonce) THEN
      RETURN jsonb_build_object('success', false, 'reason', 'QR_ALREADY_USED', 'status', 'denied', 'message', 'QR já utilizado. Aguarde o próximo código.', 'log_id', null);
    END IF;

    BEGIN
      v_qr_student_txt := coalesce(v_payload->>'s', '');
      v_qr_academy_txt := coalesce(v_payload->>'a', '');

      IF length(v_qr_student_txt) = 32 THEN
        v_qr_student_txt := regexp_replace(v_qr_student_txt, '^(.{8})(.{4})(.{4})(.{4})(.{12})$', '\1-\2-\3-\4-\5');
      END IF;

      IF length(v_qr_academy_txt) = 32 THEN
        v_qr_academy_txt := regexp_replace(v_qr_academy_txt, '^(.{8})(.{4})(.{4})(.{4})(.{12})$', '\1-\2-\3-\4-\5');
      END IF;

      v_qr_student := v_qr_student_txt::UUID;
      v_qr_academy := v_qr_academy_txt::UUID;
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('success', false, 'reason', 'INVALID_QR_PAYLOAD', 'status', 'denied', 'message', 'QR com dados inválidos.', 'log_id', null);
    END;

    IF v_qr_academy <> v_unit.academy_id THEN
      RETURN jsonb_build_object('success', false, 'reason', 'ACADEMY_MISMATCH', 'status', 'denied', 'message', 'QR gerado para outra academia.', 'log_id', null);
    END IF;

    INSERT INTO public.qr_used_nonces (nonce, student_id)
    VALUES (v_nonce, v_qr_student)
    ON CONFLICT (nonce) DO NOTHING;

    DELETE FROM public.qr_used_nonces
    WHERE used_at < now() - INTERVAL '10 minutes';

    RETURN public.process_checkin(v_qr_student, p_unit_id, p_method, p_flow, p_notes);
  ELSIF v_identifier ~* '^MOVEACCESS:STUDENT:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_student_id := substring(v_identifier FROM '^MOVEACCESS:STUDENT:(.*)$')::UUID;
  ELSIF v_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_student_id := v_identifier::UUID;
  ELSE
    v_student_id := null;
  END IF;

  SELECT p.id, p.name, p.cpf, p.email, p.phone INTO v_user
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
    RETURN public.process_checkin(v_user.id, p_unit_id, p_method, p_flow, p_notes);
  END IF;

  INSERT INTO public.access_logs (
    academy_id, unit_id, user_id, user_name, user_document,
    method, status, denial_reason, operator_id, notes, raw_payload
  ) VALUES (
    v_unit.academy_id, v_unit.id, null, null, nullif(v_identifier, ''),
    p_method, 'denied', 'USER_NOT_FOUND', v_actor,
    nullif(trim(coalesce(p_notes, '')), ''),
    jsonb_build_object('unit_name', v_unit.name, 'operator_id', v_actor, 'identifier', v_identifier, 'requested_flow', lower(coalesce(p_flow, 'entry')))
  )
  RETURNING id INTO v_log_id;

  RETURN jsonb_build_object('success', false, 'reason', 'USER_NOT_FOUND', 'status', 'denied', 'message', 'Usuário não encontrado nesta academia.', 'log_id', v_log_id);
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
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN public.process_checkin_by_identifier(p_identifier, p_unit_id, p_method, 'entry', p_notes);
END;
$function$;

REVOKE ALL ON FUNCTION public.process_checkin(uuid, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_checkin(uuid, uuid, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_checkin_by_identifier(text, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_checkin_by_identifier(text, uuid, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_checkin(uuid, uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_checkin(uuid, uuid, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_checkin_by_identifier(text, uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_checkin_by_identifier(text, uuid, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.process_checkin(uuid, uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_checkin(uuid, uuid, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_checkin_by_identifier(text, uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_checkin_by_identifier(text, uuid, text, text, text) TO authenticated, service_role;