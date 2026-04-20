-- ═══════════════════════════════════════════════════════════════════
-- PR-15: Contratos reais e versionados por academia
-- ═══════════════════════════════════════════════════════════════════
--
-- 1. Creates contract_templates — versioned contract documents per academy
-- 2. Adds template_id + content_snapshot to contract_acceptances
-- 3. Updates _activate_student_subscription to store template reference
-- 4. Creates RPC get_active_contract_template for onboarding
-- 5. Updates finalize_student_draft + complete_my_invite_signup to pass template
-- ═══════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════
-- 1. contract_templates table
-- ═══════════════════════════════════════════════════════════════════
--
-- Each row = one immutable version of a template.
-- Versioning: same academy + same name lineage → incrementing version.
-- Only one row per academy can be status='published' at a time (the active one for onboarding).
-- Lifecycle: draft → published → archived
--

CREATE TABLE IF NOT EXISTS public.contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  content text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.contract_templates IS
  'Versioned contract/terms templates per academy. Each row is an immutable version.';

-- Only one published template per academy at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_contract_templates_one_published
  ON public.contract_templates (academy_id)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_contract_templates_academy
  ON public.contract_templates (academy_id);

CREATE INDEX IF NOT EXISTS idx_contract_templates_status
  ON public.contract_templates (academy_id, status);


-- ═══════════════════════════════════════════════════════════════════
-- 1b. RLS for contract_templates
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Staff can view templates of their academy
CREATE POLICY "Staff view contract templates"
ON public.contract_templates FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid() AND p.user_type = 'staff'
      AND am.academy_id = contract_templates.academy_id
  )
);

-- Staff can insert/update templates for their academy
CREATE POLICY "Staff manage contract templates"
ON public.contract_templates FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid() AND p.user_type = 'staff'
      AND am.academy_id = contract_templates.academy_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid() AND p.user_type = 'staff'
      AND am.academy_id = contract_templates.academy_id
  )
);

-- Service role full access
CREATE POLICY "Service role full access contract templates"
ON public.contract_templates FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.contract_templates FROM PUBLIC;
GRANT SELECT ON public.contract_templates TO authenticated;
GRANT ALL ON public.contract_templates TO service_role;


-- ═══════════════════════════════════════════════════════════════════
-- 2. Extend contract_acceptances with template reference
-- ═══════════════════════════════════════════════════════════════════

-- template_id: which template was accepted (nullable for legacy rows)
ALTER TABLE public.contract_acceptances
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.contract_templates(id) ON DELETE SET NULL;

-- template_version: the version number at acceptance time
ALTER TABLE public.contract_acceptances
  ADD COLUMN IF NOT EXISTS template_version integer;

-- content_snapshot: the exact text shown to the user (legal audit trail)
ALTER TABLE public.contract_acceptances
  ADD COLUMN IF NOT EXISTS content_snapshot text;

CREATE INDEX IF NOT EXISTS idx_contract_acceptances_template
  ON public.contract_acceptances (template_id);


-- ═══════════════════════════════════════════════════════════════════
-- 3. get_active_contract_template — used by onboarding to fetch content
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_active_contract_template(p_academy_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template RECORD;
BEGIN
  SELECT id, name, description, content, version, published_at
  INTO v_template
  FROM public.contract_templates
  WHERE academy_id = p_academy_id
    AND status = 'published'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'found', false,
      'reason', 'NO_PUBLISHED_TEMPLATE'
    );
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'template', jsonb_build_object(
      'id', v_template.id,
      'name', v_template.name,
      'description', v_template.description,
      'content', v_template.content,
      'version', v_template.version,
      'publishedAt', v_template.published_at
    )
  );
END;
$$;

-- Both anon (public signup) and authenticated (staff onboarding) need access
REVOKE ALL ON FUNCTION public.get_active_contract_template(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_contract_template(uuid) TO anon, authenticated, service_role;


-- ═══════════════════════════════════════════════════════════════════
-- 4. Update _activate_student_subscription — accept template info
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public._activate_student_subscription(
  p_academy_id uuid,
  p_student_id uuid,
  p_plan_id uuid,
  p_payment_method text DEFAULT 'manual',
  p_contract_accepted boolean DEFAULT false,
  p_template_id uuid DEFAULT NULL,
  p_template_version integer DEFAULT NULL,
  p_contract_content text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_plan RECORD;
  v_subscription_id uuid;
  v_payment_id uuid;
  v_now timestamptz := now();
  v_db_payment_method text;
  v_expires_at timestamptz;
  v_existing_sub_id uuid;
  v_terms_version text;
BEGIN
  -- 1. Validate plan exists and belongs to academy
  SELECT id, name, price, billing_cycle
  INTO v_plan
  FROM public.plans
  WHERE id = p_plan_id
    AND academy_id = p_academy_id
    AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'activated', false,
      'reason', 'PLAN_NOT_FOUND'
    );
  END IF;

  -- 2. Idempotency: check for existing active/paused subscription
  SELECT id INTO v_existing_sub_id
  FROM public.subscriptions
  WHERE student_id = p_student_id
    AND status IN ('active', 'paused')
  LIMIT 1;

  IF v_existing_sub_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'activated', true,
      'already_existed', true,
      'subscription_id', v_existing_sub_id
    );
  END IF;

  -- 3. Calculate expiration based on billing cycle
  v_expires_at := CASE v_plan.billing_cycle
    WHEN 'monthly' THEN v_now + interval '30 days'
    WHEN 'yearly' THEN v_now + interval '365 days'
    ELSE NULL  -- custom: no auto-expiration
  END;

  -- 4. Create subscription
  v_subscription_id := gen_random_uuid();
  INSERT INTO public.subscriptions (
    id, academy_id, student_id, plan_id, status,
    started_at, expires_at, billing_cycle, price
  ) VALUES (
    v_subscription_id, p_academy_id, p_student_id, v_plan.id,
    'active', v_now, v_expires_at, v_plan.billing_cycle, v_plan.price
  );

  -- 5. Map payment method from onboarding to DB enum
  v_db_payment_method := CASE p_payment_method
    WHEN 'credit_card' THEN 'card'
    WHEN 'debit' THEN 'card'
    WHEN 'cash' THEN 'manual'
    WHEN 'pix' THEN 'pix'
    WHEN 'boleto' THEN 'boleto'
    WHEN 'card' THEN 'card'
    WHEN 'manual' THEN 'manual'
    ELSE 'manual'
  END;

  -- 6. Create first payment (always pending — honest status)
  v_payment_id := gen_random_uuid();
  INSERT INTO public.payments (
    id, academy_id, subscription_id, student_id,
    amount, currency, status, method, due_date
  ) VALUES (
    v_payment_id, p_academy_id, v_subscription_id, p_student_id,
    v_plan.price, 'BRL', 'pending', v_db_payment_method, v_now::date
  );

  -- 7. Contract acceptance audit trail (now with template reference)
  IF p_contract_accepted THEN
    v_terms_version := COALESCE(p_template_version::text, '1.0');

    INSERT INTO public.contract_acceptances (
      academy_id, student_id, subscription_id,
      terms_version, accepted_at,
      template_id, template_version, content_snapshot
    ) VALUES (
      p_academy_id, p_student_id, v_subscription_id,
      v_terms_version, v_now,
      p_template_id, p_template_version, p_contract_content
    );
  END IF;

  RETURN jsonb_build_object(
    'activated', true,
    'already_existed', false,
    'subscription_id', v_subscription_id,
    'payment_id', v_payment_id,
    'plan_name', v_plan.name,
    'plan_price', v_plan.price,
    'billing_cycle', v_plan.billing_cycle
  );
END;
$$;


-- ═══════════════════════════════════════════════════════════════════
-- 5. Update finalize_student_draft — read template info from collected_data
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.finalize_student_draft(p_draft_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_now timestamptz := now();
  v_draft public.student_drafts%ROWTYPE;
  v_identification jsonb;
  v_personal_data jsonb;
  v_plan_selection jsonb;
  v_full_name text;
  v_email text;
  v_phone text;
  v_cpf text;
  v_birth_date date;
  v_address jsonb;
  v_emergency_contact jsonb;
  v_user_id uuid;
  -- Commercial activation
  v_plan_id_text text;
  v_plan_id uuid;
  v_payment_method text;
  v_contract_accepted boolean;
  v_template_id uuid;
  v_template_version integer;
  v_contract_content text;
  v_activation jsonb;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHENTICATED');
  END IF;

  IF NOT public.is_staff() THEN
    RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN');
  END IF;

  -- Load draft
  SELECT * INTO v_draft
  FROM public.student_drafts
  WHERE id = p_draft_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'DRAFT_NOT_FOUND');
  END IF;

  IF v_draft.status NOT IN ('in_progress', 'completed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'DRAFT_ALREADY_PUBLISHED');
  END IF;

  -- Validate staff belongs to same academy
  IF NOT EXISTS (
    SELECT 1 FROM public.academy_memberships
    WHERE profile_id = v_actor AND academy_id = v_draft.academy_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_IN_ACADEMY');
  END IF;

  -- Extract data
  v_identification := COALESCE(v_draft.collected_data -> 'identification', '{}'::jsonb);
  v_personal_data := COALESCE(v_draft.collected_data -> 'personalData', '{}'::jsonb);
  v_plan_selection := COALESCE(v_draft.collected_data -> 'planSelection', '{}'::jsonb);

  v_full_name := trim(COALESCE(v_identification ->> 'fullName', ''));
  v_email := lower(trim(COALESCE(v_identification ->> 'email', '')));
  v_phone := trim(COALESCE(v_identification ->> 'phone', ''));

  IF v_full_name = '' OR v_email = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'MISSING_REQUIRED_FIELDS');
  END IF;

  v_cpf := trim(COALESCE(v_personal_data ->> 'document', ''));
  v_birth_date := NULLIF(trim(v_personal_data ->> 'birthDate'), '')::date;
  v_address := v_personal_data -> 'address';
  v_emergency_contact := v_personal_data -> 'emergencyContact';

  -- ── Create or find Supabase auth user ──

  -- Check if a user with this email already exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    -- Create auth.user via admin API (SECURITY DEFINER allows this)
    INSERT INTO auth.users (
      id, instance_id, aud, role,
      email, encrypted_password,
      email_confirmed_at, confirmation_sent_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      v_email, crypt(gen_random_uuid()::text, gen_salt('bf')),
      v_now, v_now,
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'full_name', v_full_name,
        'phone', v_phone,
        'cpf', v_cpf,
        'onboarded_by_staff', true
      ),
      v_now, v_now
    )
    RETURNING id INTO v_user_id;
  END IF;

  -- ── Upsert profile ──

  INSERT INTO public.profiles (
    id, email, full_name, phone, user_type,
    cpf, birth_date, address, emergency_contact,
    created_at, updated_at
  ) VALUES (
    v_user_id, v_email, v_full_name, v_phone, 'student',
    NULLIF(v_cpf, ''), v_birth_date, v_address, v_emergency_contact,
    v_now, v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    cpf = COALESCE(EXCLUDED.cpf, profiles.cpf),
    birth_date = COALESCE(EXCLUDED.birth_date, profiles.birth_date),
    address = COALESCE(EXCLUDED.address, profiles.address),
    emergency_contact = COALESCE(EXCLUDED.emergency_contact, profiles.emergency_contact),
    user_type = 'student',
    updated_at = v_now;

  -- ── Upsert student_profiles ──

  INSERT INTO public.student_profiles (
    id, academy_id, status, enrolled_at, created_at, updated_at
  ) VALUES (
    v_user_id, v_draft.academy_id, 'active', v_now, v_now, v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    enrolled_at = COALESCE(student_profiles.enrolled_at, v_now),
    updated_at = v_now;

  -- ── Memberships ──

  INSERT INTO public.academy_memberships (profile_id, academy_id, is_primary)
  VALUES (v_user_id, v_draft.academy_id, true)
  ON CONFLICT (profile_id, academy_id) DO UPDATE SET is_primary = true;

  IF v_draft.unit_id IS NOT NULL THEN
    INSERT INTO public.student_unit_assignments (student_id, unit_id, is_primary)
    VALUES (v_user_id, v_draft.unit_id, true)
    ON CONFLICT (student_id, unit_id) DO UPDATE SET is_primary = true;
  END IF;

  -- ── Commercial activation (subscription + payment + contract) ──

  v_plan_id := NULL;
  v_payment_method := 'manual';
  v_contract_accepted := false;
  v_template_id := NULL;
  v_template_version := NULL;
  v_contract_content := NULL;
  v_activation := NULL;

  v_plan_id_text := NULLIF(trim(v_plan_selection ->> 'planId'), '');
  IF v_plan_id_text IS NOT NULL THEN
    BEGIN
      v_plan_id := v_plan_id_text::uuid;
    EXCEPTION WHEN others THEN
      v_plan_id := NULL;
    END;
  END IF;

  IF v_plan_id IS NOT NULL THEN
    v_payment_method := COALESCE(
      NULLIF(trim(COALESCE(v_draft.collected_data -> 'payment' ->> 'method', '')), ''),
      'manual'
    );
    v_contract_accepted := COALESCE(
      (v_draft.collected_data -> 'contract' ->> 'acceptedTerms')::boolean,
      false
    );

    -- Read template reference from collected_data
    BEGIN
      v_template_id := (v_draft.collected_data -> 'contract' ->> 'templateId')::uuid;
    EXCEPTION WHEN others THEN
      v_template_id := NULL;
    END;

    v_template_version := (v_draft.collected_data -> 'contract' ->> 'templateVersion')::integer;
    v_contract_content := v_draft.collected_data -> 'contract' ->> 'contractContent';

    v_activation := public._activate_student_subscription(
      v_draft.academy_id,
      v_user_id,
      v_plan_id,
      v_payment_method,
      v_contract_accepted,
      v_template_id,
      v_template_version,
      v_contract_content
    );
  END IF;

  -- ── Finalize draft ─────────────────────────────────────────────

  UPDATE public.student_drafts SET
    status = 'published',
    current_step = 'activation',
    completed_at = COALESCE(completed_at, v_now),
    published_at = v_now,
    published_user_id = v_user_id,
    updated_at = v_now
  WHERE id = v_draft.id;

  RETURN jsonb_build_object(
    'success', true,
    'draft_id', v_draft.id,
    'user_id', v_user_id,
    'email', v_email,
    'full_name', v_full_name,
    'activation', v_activation
  );
END;
$function$;


-- ═══════════════════════════════════════════════════════════════════
-- 6. Update complete_my_invite_signup — read template info from collected_data
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.complete_my_invite_signup(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_now timestamptz := now();
  v_link public.invite_links%ROWTYPE;
  v_draft public.student_drafts%ROWTYPE;
  v_plan_selection jsonb;
  v_plan_id_text text;
  v_plan_id uuid;
  v_payment_method text;
  v_contract_accepted boolean;
  v_template_id uuid;
  v_template_version integer;
  v_contract_content text;
  v_activation jsonb;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHENTICATED');
  END IF;

  -- ── Validate invite link ──

  SELECT * INTO v_link
  FROM public.invite_links
  WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVITE_NOT_FOUND');
  END IF;

  IF v_link.status NOT IN ('pending', 'claimed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVITE_NOT_CLAIMABLE');
  END IF;

  IF v_link.expires_at < v_now THEN
    UPDATE public.invite_links SET status = 'expired', updated_at = v_now WHERE id = v_link.id;
    RETURN jsonb_build_object('success', false, 'error', 'INVITE_EXPIRED');
  END IF;

  -- ── Validate draft ──

  SELECT * INTO v_draft
  FROM public.student_drafts
  WHERE id = v_link.draft_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'DRAFT_NOT_FOUND');
  END IF;

  IF v_draft.status NOT IN ('in_progress', 'completed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'DRAFT_ALREADY_PUBLISHED');
  END IF;

  -- ── Validate actor matches link ──

  IF v_link.claimed_user_id IS NOT NULL AND v_link.claimed_user_id <> v_actor THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_LINK_OWNER');
  END IF;

  -- ── Ensure profile exists ──

  INSERT INTO public.profiles (id, email, full_name, user_type, created_at, updated_at)
  SELECT
    v_actor,
    COALESCE(u.email, ''),
    COALESCE(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''),
    'student',
    v_now,
    v_now
  FROM auth.users u WHERE u.id = v_actor
  ON CONFLICT (id) DO UPDATE SET
    user_type = 'student',
    updated_at = v_now;

  -- Update profile from draft collected_data if available
  UPDATE public.profiles SET
    full_name = COALESCE(
      NULLIF(trim(COALESCE(v_draft.collected_data -> 'identification' ->> 'fullName', '')), ''),
      full_name
    ),
    phone = COALESCE(
      NULLIF(trim(COALESCE(v_draft.collected_data -> 'identification' ->> 'phone', '')), ''),
      phone
    ),
    cpf = COALESCE(
      NULLIF(trim(COALESCE(v_draft.collected_data -> 'personalData' ->> 'document', '')), ''),
      cpf
    ),
    birth_date = COALESCE(
      NULLIF(trim(COALESCE(v_draft.collected_data -> 'personalData' ->> 'birthDate', '')), '')::date,
      birth_date
    ),
    address = COALESCE(v_draft.collected_data -> 'personalData' -> 'address', address),
    emergency_contact = COALESCE(v_draft.collected_data -> 'personalData' -> 'emergencyContact', emergency_contact),
    updated_at = v_now
  WHERE id = v_actor;

  -- ── Student profiles + memberships ──

  INSERT INTO public.student_profiles (id, academy_id, status, enrolled_at, created_at, updated_at)
  VALUES (v_actor, v_link.academy_id, 'active', v_now, v_now, v_now)
  ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    enrolled_at = COALESCE(student_profiles.enrolled_at, v_now),
    updated_at = v_now;

  INSERT INTO public.academy_memberships (profile_id, academy_id, is_primary)
  VALUES (v_actor, v_link.academy_id, true)
  ON CONFLICT (profile_id, academy_id) DO UPDATE SET is_primary = true;

  IF v_link.unit_id IS NOT NULL THEN
    INSERT INTO public.student_unit_assignments (student_id, unit_id, is_primary)
    VALUES (v_actor, v_link.unit_id, true)
    ON CONFLICT (student_id, unit_id) DO UPDATE SET is_primary = true;
  END IF;

  -- ── Commercial activation ──

  v_plan_selection := COALESCE(v_draft.collected_data -> 'planSelection', '{}'::jsonb);
  v_plan_id := NULL;
  v_plan_id_text := NULLIF(trim(COALESCE(v_plan_selection ->> 'planId', '')), '');
  IF v_plan_id_text IS NOT NULL THEN
    BEGIN
      v_plan_id := v_plan_id_text::uuid;
    EXCEPTION
      WHEN others THEN
        v_plan_id := NULL;
    END;
  END IF;

  IF v_plan_id IS NOT NULL THEN
    v_payment_method := COALESCE(
      NULLIF(trim(COALESCE(v_draft.collected_data -> 'payment' ->> 'method', '')), ''),
      'manual'
    );
    v_contract_accepted := COALESCE(
      (v_draft.collected_data -> 'contract' ->> 'acceptedTerms')::boolean,
      false
    );

    -- Read template reference from collected_data
    BEGIN
      v_template_id := (v_draft.collected_data -> 'contract' ->> 'templateId')::uuid;
    EXCEPTION WHEN others THEN
      v_template_id := NULL;
    END;

    v_template_version := (v_draft.collected_data -> 'contract' ->> 'templateVersion')::integer;
    v_contract_content := v_draft.collected_data -> 'contract' ->> 'contractContent';

    v_activation := public._activate_student_subscription(
      v_link.academy_id,
      v_actor,
      v_plan_id,
      v_payment_method,
      v_contract_accepted,
      v_template_id,
      v_template_version,
      v_contract_content
    );
  END IF;

  -- ── Finalize draft + link ──

  UPDATE public.student_drafts
  SET
    status = 'published',
    current_step = 'activation',
    completed_at = COALESCE(completed_at, v_now),
    published_at = v_now,
    published_user_id = v_actor,
    updated_at = v_now
  WHERE id = v_draft.id;

  UPDATE public.invite_links
  SET
    status = 'used',
    used_at = COALESCE(used_at, v_now),
    completed_at = COALESCE(completed_at, v_now),
    updated_at = v_now
  WHERE id = v_link.id;

  RETURN jsonb_build_object(
    'success', true,
    'draft_id', v_draft.id,
    'invite_id', v_link.id,
    'user_id', v_actor,
    'activation', v_activation
  );
END;
$function$;


-- ═══════════════════════════════════════════════════════════════════
-- 7. Seed default template for existing academies
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO public.contract_templates (academy_id, name, description, content, version, status, published_at)
SELECT
  a.id,
  'Contrato Padrão de Prestação de Serviços',
  'Modelo padrão de contrato para todos os planos. Criado automaticamente na migração.',
  E'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ACADEMIA\n\nCLÁUSULA 1ª - DO OBJETO\nO presente contrato tem por objeto a prestação de serviços de academia, incluindo acesso às instalações, equipamentos e atividades oferecidas pela CONTRATADA.\n\nCLÁUSULA 2ª - DO PRAZO\nO prazo do presente contrato é determinado conforme o plano escolhido pelo CONTRATANTE, iniciando-se na data de ativação do acesso.\n\nCLÁUSULA 3ª - DO VALOR E FORMA DE PAGAMENTO\n3.1. O CONTRATANTE pagará à CONTRATADA o valor correspondente ao plano escolhido.\n3.2. O pagamento deverá ser efetuado até o dia do vencimento escolhido.\n3.3. O atraso no pagamento acarretará a suspensão temporária do acesso.\n\nCLÁUSULA 4ª - DAS OBRIGAÇÕES DO CONTRATANTE\n4.1. Respeitar as normas de uso das instalações.\n4.2. Utilizar os equipamentos de forma adequada.\n4.3. Portar-se de forma ética e respeitosa com funcionários e demais frequentadores.\n4.4. Comunicar qualquer alteração de dados cadastrais.\n\nCLÁUSULA 5ª - DAS OBRIGAÇÕES DA CONTRATADA\n5.1. Disponibilizar as instalações e equipamentos em perfeito estado.\n5.2. Manter profissionais capacitados para orientação.\n5.3. Garantir a segurança das instalações.\n\nCLÁUSULA 6ª - DA RESCISÃO\n6.1. O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 dias.\n6.2. A rescisão não exime o CONTRATANTE do pagamento de valores em aberto.\n\nCLÁUSULA 7ª - DISPOSIÇÕES GERAIS\n7.1. O CONTRATANTE declara estar apto à prática de atividades físicas, isentando a CONTRATADA de responsabilidade por eventuais lesões.\n7.2. Fica eleito o foro da comarca local para dirimir quaisquer questões oriundas deste contrato.',
  1,
  'published',
  now()
FROM public.academies a
WHERE NOT EXISTS (
  SELECT 1 FROM public.contract_templates ct
  WHERE ct.academy_id = a.id
);
