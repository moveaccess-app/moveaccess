-- Mission #14: Secure signed rotating QR tokens
-- Replaces static MOVEACCESS:STUDENT:{uuid} with signed HMAC-SHA256 tokens
-- Token format: MOVEACCESS:QR:{base64url_payload}.{hex_hmac}
-- Payload (JSON): { s: student_id, a: academy_id, iat: epoch, exp: epoch+60, n: nonce_hex }

-- ============================================================
-- 1. App configuration table (QR signing secret storage)
--    IMPORTANT: update 'qr_secret' value before deploying to each environment
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_config (
  key        TEXT        PRIMARY KEY,
  value      TEXT        NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Only SECURITY DEFINER functions access this table — no public reads
CREATE POLICY "app_config_no_public_access" ON public.app_config
  FOR ALL USING (false);

-- Seed QR secret (replace with env-specific value per deployment)
INSERT INTO public.app_config (key, value)
VALUES ('qr_secret', 'stg_moveaccess_qr_8f3a9b2e1c4d7e6f_2026')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ============================================================
-- 2. Anti-replay nonces table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.qr_used_nonces (
  nonce      TEXT        PRIMARY KEY,
  student_id UUID        NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  used_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qr_used_nonces_used_at ON public.qr_used_nonces(used_at);

ALTER TABLE public.qr_used_nonces ENABLE ROW LEVEL SECURITY;

-- Only SECURITY DEFINER functions and service_role access this table
CREATE POLICY "nonces_no_direct_access" ON public.qr_used_nonces
  FOR ALL TO authenticated USING (false);

-- ============================================================
-- 3. Base64url helper functions
-- ============================================================
CREATE OR REPLACE FUNCTION public.to_base64url(data BYTEA)
RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
  SELECT replace(replace(replace(encode(data, 'base64'), '+', '-'), '/', '_'), E'\n', '');
$$;

CREATE OR REPLACE FUNCTION public.from_base64url(data TEXT)
RETURNS BYTEA LANGUAGE SQL IMMUTABLE AS $$
  SELECT decode(
    translate(data, '-_', '+/')
    || repeat('=', (4 - length(data) % 4) % 4),
    'base64'
  );
$$;

-- ============================================================
-- 4. issue_student_qr_token() — called by the authenticated student
-- ============================================================
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
  -- 1. Require authenticated session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: must be authenticated';
  END IF;

  -- 2. Require a student profile
  SELECT sp.id INTO v_student_id
  FROM public.student_profiles sp
  WHERE sp.id = v_user_id
  LIMIT 1;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Forbidden: no student profile for this user';
  END IF;

  -- 3. Find the student's primary academy
  SELECT am.academy_id INTO v_academy_id
  FROM public.academy_memberships am
  WHERE am.profile_id = v_user_id
  ORDER BY am.is_primary DESC, am.created_at DESC
  LIMIT 1;

  IF v_academy_id IS NULL THEN
    RAISE EXCEPTION 'Forbidden: no academy membership found';
  END IF;

  -- 4. Get signing secret
  SELECT ac.value INTO v_secret
  FROM public.app_config ac
  WHERE ac.key = 'qr_secret';

  IF v_secret IS NULL OR trim(v_secret) = '' THEN
    RAISE EXCEPTION 'Configuration error: QR secret not set';
  END IF;

  -- 5. Build token components
  v_nonce := encode(extensions.gen_random_bytes(16), 'hex');
  v_iat   := EXTRACT(EPOCH FROM clock_timestamp())::BIGINT;
  v_exp   := v_iat + 60; -- 60-second expiry

  -- 6. Encode payload: compact JSON → UTF8 bytes → base64url
  v_payload := public.to_base64url(
    convert_to(
      json_build_object(
        's',   v_student_id::TEXT,
        'a',   v_academy_id::TEXT,
        'iat', v_iat,
        'exp', v_exp,
        'n',   v_nonce
      )::TEXT,
      'UTF8'
    )
  );

  -- 7. HMAC-SHA256 signature over the base64url payload
  v_sig := encode(
    extensions.hmac(v_payload::BYTEA, v_secret::BYTEA, 'sha256'),
    'hex'
  );

  RETURN 'MOVEACCESS:QR:' || v_payload || '.' || v_sig;
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_student_qr_token() TO authenticated;

-- ============================================================
-- 5. Update process_checkin_by_identifier to validate signed QR
-- ============================================================
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

  -- Secure QR vars
  v_dot_pos     INT;
  v_encoded     TEXT;
  v_sig_given   TEXT;
  v_sig_computed TEXT;
  v_secret      TEXT;
  v_payload_raw TEXT;
  v_payload     JSONB;
  v_exp         BIGINT;
  v_nonce       TEXT;
  v_qr_student  UUID;
  v_qr_academy  UUID;
BEGIN
  -- ── Basic guards ──────────────────────────────────────────
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

  -- ── Branch: MOVEACCESS:QR: signed token ──────────────────
  IF v_identifier ~* '^MOVEACCESS:QR:[A-Za-z0-9+/=_-]+\.[0-9a-f]{64}$' THEN

    -- 1. Get signing secret from configuration table
    SELECT ac.value INTO v_secret
    FROM public.app_config ac WHERE ac.key = 'qr_secret';

    IF v_secret IS NULL OR trim(v_secret) = '' THEN
      RETURN jsonb_build_object(
        'success', false, 'reason', 'CONFIGURATION_ERROR',
        'status', 'denied', 'message', 'Erro de configuração do servidor.', 'log_id', null
      );
    END IF;

    -- 2. Split payload.sig (last 64 chars = sha256 hex)
    v_dot_pos   := length(v_identifier) - 64;  -- position of the separating dot
    v_sig_given := right(v_identifier, 64);
    -- payload is everything after "MOVEACCESS:QR:" up to the dot (exclusive)
    v_encoded   := substring(v_identifier FROM 15 FOR v_dot_pos - 15);

    -- 3. Verify HMAC
    v_sig_computed := encode(
      extensions.hmac(v_encoded::BYTEA, v_secret::BYTEA, 'sha256'),
      'hex'
    );

    IF v_sig_computed <> v_sig_given THEN
      RETURN jsonb_build_object(
        'success', false, 'reason', 'INVALID_QR_SIGNATURE',
        'status', 'denied',
        'message', 'QR inválido ou adulterado.',
        'log_id', null
      );
    END IF;

    -- 4. Decode payload
    BEGIN
      v_payload_raw := convert_from(public.from_base64url(v_encoded), 'UTF8');
      v_payload     := v_payload_raw::JSONB;
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false, 'reason', 'INVALID_QR_PAYLOAD',
        'status', 'denied', 'message', 'QR com formato inválido.', 'log_id', null
      );
    END;

    -- 5. Check expiry
    v_exp := (v_payload->>'exp')::BIGINT;
    IF EXTRACT(EPOCH FROM clock_timestamp())::BIGINT > v_exp THEN
      RETURN jsonb_build_object(
        'success', false, 'reason', 'QR_EXPIRED',
        'status', 'denied',
        'message', 'QR expirado. Solicite um novo código.',
        'log_id', null
      );
    END IF;

    -- 6. Check nonce (anti-replay)
    v_nonce := v_payload->>'n';
    IF EXISTS (SELECT 1 FROM public.qr_used_nonces WHERE nonce = v_nonce) THEN
      RETURN jsonb_build_object(
        'success', false, 'reason', 'QR_ALREADY_USED',
        'status', 'denied',
        'message', 'QR já utilizado. Aguarde o próximo código.',
        'log_id', null
      );
    END IF;

    -- 7. Validate student and academy match the scanner's unit
    BEGIN
      v_qr_student := (v_payload->>'s')::UUID;
      v_qr_academy := (v_payload->>'a')::UUID;
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false, 'reason', 'INVALID_QR_PAYLOAD',
        'status', 'denied', 'message', 'QR com dados inválidos.', 'log_id', null
      );
    END;

    IF v_qr_academy <> v_unit.academy_id THEN
      RETURN jsonb_build_object(
        'success', false, 'reason', 'ACADEMY_MISMATCH',
        'status', 'denied',
        'message', 'QR gerado para outra academia.',
        'log_id', null
      );
    END IF;

    -- 8. Consume nonce (register before granting to prevent TOCTOU)
    INSERT INTO public.qr_used_nonces (nonce, student_id)
    VALUES (v_nonce, v_qr_student)
    ON CONFLICT (nonce) DO NOTHING;

    -- Purge nonces older than 10 minutes to keep table lean
    DELETE FROM public.qr_used_nonces
    WHERE used_at < now() - INTERVAL '10 minutes';

    -- 9. Delegate to existing access check
    RETURN public.process_checkin(v_qr_student, p_unit_id, p_method, p_notes);

  -- ── Branch: static MOVEACCESS:STUDENT: (legacy / fallback) ──
  ELSIF v_identifier ~* '^MOVEACCESS:STUDENT:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_student_id := substring(v_identifier FROM '^MOVEACCESS:STUDENT:(.*)$')::UUID;

  -- ── Branch: raw UUID ──────────────────────────────────────
  ELSIF v_identifier ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_student_id := v_identifier::UUID;

  ELSE
    v_student_id := null;
  END IF;

  -- ── Legacy path: look up by student_id / email / phone / CPF ──
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

  -- ── Not found: log and return ──────────────────────────────
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

-- ── Permissions (mirror previous migration) ──────────────────
REVOKE ALL ON FUNCTION public.process_checkin_by_identifier(text, uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_checkin_by_identifier(text, uuid, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.process_checkin_by_identifier(text, uuid, text, text) TO authenticated, service_role;
