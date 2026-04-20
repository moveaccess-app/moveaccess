-- Mission #14.1: compact signed QR tokens for better scanner readability
-- Goals:
--   1) remove base64url padding (=)
--   2) emit compact JSON (jsonb text)
--   3) encode UUIDs without hyphens in token payload
--   4) keep validator backward-compatible with previous token format

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

CREATE OR REPLACE FUNCTION public.process_checkin_by_identifier(
  p_identifier text,
  p_unit_id    uuid,
  p_method     text,
  p_notes      text DEFAULT NULL
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
    RETURN jsonb_build_object(
      'success', false, 'reason', 'INVALID_METHOD',
      'status', 'denied', 'message', 'Método de acesso inválido.', 'log_id', null
    );
  END IF;

  SELECT u.id, u.academy_id, u.name INTO v_unit
  FROM public.units u WHERE u.id = p_unit_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 'reason', 'UNIT_NOT_FOUND',
      'status', 'denied', 'message', 'Unidade não encontrada.', 'log_id', null
    );
  END IF;

  IF v_actor IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 'reason', 'UNAUTHENTICATED',
      'status', 'denied', 'message', 'Operador não autenticado.', 'log_id', null
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
      'success', false, 'reason', 'FORBIDDEN',
      'status', 'denied', 'message', 'Operador sem acesso à unidade.', 'log_id', null
    );
  END IF;

  IF v_identifier ~* '^MOVEACCESS:QR:[A-Za-z0-9_-]+\.[0-9a-f]{64}$' THEN
    SELECT ac.value INTO v_secret
    FROM public.app_config ac WHERE ac.key = 'qr_secret';

    IF v_secret IS NULL OR trim(v_secret) = '' THEN
      RETURN jsonb_build_object(
        'success', false, 'reason', 'CONFIGURATION_ERROR',
        'status', 'denied', 'message', 'Erro de configuração do servidor.', 'log_id', null
      );
    END IF;

    v_sig_given := right(v_identifier, 64);
    v_encoded   := substring(v_identifier FROM 15 FOR length(v_identifier) - 14 - 65);

    v_sig_computed := encode(
      extensions.hmac(v_encoded::BYTEA, v_secret::BYTEA, 'sha256'),
      'hex'
    );

    IF v_sig_computed <> v_sig_given THEN
      RETURN jsonb_build_object(
        'success', false, 'reason', 'INVALID_QR_SIGNATURE',
        'status', 'denied', 'message', 'QR inválido ou adulterado.', 'log_id', null
      );
    END IF;

    BEGIN
      v_payload_raw := convert_from(public.from_base64url(v_encoded), 'UTF8');
      v_payload     := v_payload_raw::JSONB;
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false, 'reason', 'INVALID_QR_PAYLOAD',
        'status', 'denied', 'message', 'QR com formato inválido.', 'log_id', null
      );
    END;

    v_exp := (v_payload->>'exp')::BIGINT;
    IF EXTRACT(EPOCH FROM clock_timestamp())::BIGINT > v_exp THEN
      RETURN jsonb_build_object(
        'success', false, 'reason', 'QR_EXPIRED',
        'status', 'denied', 'message', 'QR expirado. Solicite um novo código.', 'log_id', null
      );
    END IF;

    v_nonce := v_payload->>'n';
    IF EXISTS (SELECT 1 FROM public.qr_used_nonces WHERE nonce = v_nonce) THEN
      RETURN jsonb_build_object(
        'success', false, 'reason', 'QR_ALREADY_USED',
        'status', 'denied', 'message', 'QR já utilizado. Aguarde o próximo código.', 'log_id', null
      );
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
      RETURN jsonb_build_object(
        'success', false, 'reason', 'INVALID_QR_PAYLOAD',
        'status', 'denied', 'message', 'QR com dados inválidos.', 'log_id', null
      );
    END;

    IF v_qr_academy <> v_unit.academy_id THEN
      RETURN jsonb_build_object(
        'success', false, 'reason', 'ACADEMY_MISMATCH',
        'status', 'denied', 'message', 'QR gerado para outra academia.', 'log_id', null
      );
    END IF;

    INSERT INTO public.qr_used_nonces (nonce, student_id)
    VALUES (v_nonce, v_qr_student)
    ON CONFLICT (nonce) DO NOTHING;

    DELETE FROM public.qr_used_nonces
    WHERE used_at < now() - INTERVAL '10 minutes';

    RETURN public.process_checkin(v_qr_student, p_unit_id, p_method, p_notes);

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
    RETURN public.process_checkin(v_user.id, p_unit_id, p_method, p_notes);
  END IF;

  INSERT INTO public.access_logs (
    academy_id, unit_id, user_id, user_name, user_document,
    method, status, denial_reason, operator_id, notes, raw_payload
  ) VALUES (
    v_unit.academy_id, v_unit.id, null, null, nullif(v_identifier, ''),
    p_method, 'denied', 'USER_NOT_FOUND', v_actor,
    nullif(trim(coalesce(p_notes, '')), ''),
    jsonb_build_object('unit_name', v_unit.name, 'operator_id', v_actor, 'identifier', v_identifier)
  )
  RETURNING id INTO v_log_id;

  RETURN jsonb_build_object(
    'success', false, 'reason', 'USER_NOT_FOUND',
    'status', 'denied', 'message', 'Usuário não encontrado nesta academia.',
    'log_id', v_log_id
  );
END;
$function$;