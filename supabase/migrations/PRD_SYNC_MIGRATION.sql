-- ============================================================================
-- PRD SYNC MIGRATION: Align PRD schema with STG (source of truth)
-- Generated: 2025-01-27
-- PRD project: ooinkljdxgixwflsasgr
-- STG project: hvgqdihblfepstcxrcwb
-- ============================================================================
-- STRATEGY: Drop views→triggers→policies→functions, alter tables, recreate all
-- PRD data is minimal (1 academy, 2 profiles, 5 roles) - safe to modify
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: DROP ALL VIEWS (depend on table columns)
-- ============================================================================
DROP VIEW IF EXISTS public.invite_links_list CASCADE;
DROP VIEW IF EXISTS public.my_profile CASCADE;
DROP VIEW IF EXISTS public.staff_list_view CASCADE;
DROP VIEW IF EXISTS public.staff_with_role CASCADE;
DROP VIEW IF EXISTS public.student_drafts_list CASCADE;
DROP VIEW IF EXISTS public.student_list_view CASCADE;
DROP VIEW IF EXISTS public.students_with_status CASCADE;

-- ============================================================================
-- PHASE 2: DROP ALL TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS academies_updated_at ON public.academies;
DROP TRIGGER IF EXISTS academy_memberships_single_primary ON public.academy_memberships;
DROP TRIGGER IF EXISTS academy_memberships_ensure_primary ON public.academy_memberships;
DROP TRIGGER IF EXISTS update_invite_links_updated_at ON public.invite_links;
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS roles_updated_at ON public.roles;
DROP TRIGGER IF EXISTS staff_profiles_updated_at ON public.staff_profiles;
DROP TRIGGER IF EXISTS trigger_student_drafts_updated_at ON public.student_drafts;
DROP TRIGGER IF EXISTS trg_student_drafts_updated ON public.student_drafts;
DROP TRIGGER IF EXISTS student_profiles_generate_registration ON public.student_profiles;
DROP TRIGGER IF EXISTS student_profiles_updated_at ON public.student_profiles;
DROP TRIGGER IF EXISTS student_unit_ensure_primary ON public.student_unit_assignments;
DROP TRIGGER IF EXISTS units_updated_at ON public.units;

-- Also drop auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================================
-- PHASE 3: DROP ALL RLS POLICIES
-- ============================================================================

-- academies
DROP POLICY IF EXISTS "Staff with settings:write can update academy" ON public.academies;
DROP POLICY IF EXISTS "Users can view their academies" ON public.academies;
DROP POLICY IF EXISTS "Admin edita academia" ON public.academies;
DROP POLICY IF EXISTS "Usuário vê suas academias" ON public.academies;

-- academy_memberships
DROP POLICY IF EXISTS "Admin cria memberships para sua academia" ON public.academy_memberships;
DROP POLICY IF EXISTS "Staff can add members" ON public.academy_memberships;
DROP POLICY IF EXISTS "Users can create own membership" ON public.academy_memberships;
DROP POLICY IF EXISTS "Users can update own membership" ON public.academy_memberships;
DROP POLICY IF EXISTS "View memberships in academy" ON public.academy_memberships;
DROP POLICY IF EXISTS "Staff vê memberships da academia" ON public.academy_memberships;
DROP POLICY IF EXISTS "Usuário vê próprias memberships" ON public.academy_memberships;

-- invite_links
DROP POLICY IF EXISTS "Staff can create links for own academy" ON public.invite_links;
DROP POLICY IF EXISTS "Staff can update own academy links" ON public.invite_links;
DROP POLICY IF EXISTS "Staff can view own academy links" ON public.invite_links;

-- invites
DROP POLICY IF EXISTS "Create invites" ON public.invites;
DROP POLICY IF EXISTS "Update invites" ON public.invites;
DROP POLICY IF EXISTS "View invites" ON public.invites;
DROP POLICY IF EXISTS "Convites pendentes são públicos" ON public.invites;
DROP POLICY IF EXISTS "Staff cria convites" ON public.invites;
DROP POLICY IF EXISTS "Staff vê convites da academia" ON public.invites;

-- profiles
DROP POLICY IF EXISTS "Admin cria perfis para sua academia" ON public.profiles;
DROP POLICY IF EXISTS "Allow email lookup by cpf for login" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view profiles in academy" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff vê perfis da mesma academia" ON public.profiles;
DROP POLICY IF EXISTS "Usuário edita próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuário vê próprio perfil" ON public.profiles;

-- roles
DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;
DROP POLICY IF EXISTS "Roles são públicas para leitura" ON public.roles;

-- staff_profiles
DROP POLICY IF EXISTS "Admin cria staff para sua academia" ON public.staff_profiles;
DROP POLICY IF EXISTS "Update staff" ON public.staff_profiles;
DROP POLICY IF EXISTS "Users can create own staff profile" ON public.staff_profiles;
DROP POLICY IF EXISTS "View staff in academy" ON public.staff_profiles;
DROP POLICY IF EXISTS "Admin vê staff da academia" ON public.staff_profiles;
DROP POLICY IF EXISTS "Staff vê próprio perfil" ON public.staff_profiles;

-- staff_unit_assignments
DROP POLICY IF EXISTS "Admin cria unit assignments" ON public.staff_unit_assignments;
DROP POLICY IF EXISTS "Manage staff units" ON public.staff_unit_assignments;
DROP POLICY IF EXISTS "View staff units" ON public.staff_unit_assignments;
DROP POLICY IF EXISTS "Staff vê próprias unit assignments" ON public.staff_unit_assignments;

-- student_drafts
DROP POLICY IF EXISTS "Staff deletes own academy drafts" ON public.student_drafts;
DROP POLICY IF EXISTS "Staff inserts own academy drafts" ON public.student_drafts;
DROP POLICY IF EXISTS "Staff selects own academy drafts" ON public.student_drafts;
DROP POLICY IF EXISTS "Staff updates own academy drafts" ON public.student_drafts;

-- student_profiles
DROP POLICY IF EXISTS "Staff edita alunos" ON public.student_profiles;
DROP POLICY IF EXISTS "Staff vê alunos da academia" ON public.student_profiles;
DROP POLICY IF EXISTS "Update students" ON public.student_profiles;
DROP POLICY IF EXISTS "Users can create own student profile" ON public.student_profiles;
DROP POLICY IF EXISTS "View students" ON public.student_profiles;
DROP POLICY IF EXISTS "Aluno vê próprio perfil" ON public.student_profiles;

-- student_unit_assignments
DROP POLICY IF EXISTS "Aluno vê próprias unit assignments" ON public.student_unit_assignments;
DROP POLICY IF EXISTS "Staff vê unit assignments da academia" ON public.student_unit_assignments;

-- units
DROP POLICY IF EXISTS "Staff can manage units" ON public.units;
DROP POLICY IF EXISTS "Users can view units in their academies" ON public.units;
DROP POLICY IF EXISTS "Staff gerencia unidades" ON public.units;
DROP POLICY IF EXISTS "Usuário vê unidades das suas academias" ON public.units;

-- ============================================================================
-- PHASE 4: DROP ALL FUNCTIONS (PRD versions)
-- ============================================================================
DROP FUNCTION IF EXISTS public.complete_user_setup CASCADE;
DROP FUNCTION IF EXISTS public.create_invite_link CASCADE;
DROP FUNCTION IF EXISTS public.ensure_single_primary_academy CASCADE;
DROP FUNCTION IF EXISTS public.ensure_single_primary_unit CASCADE;
DROP FUNCTION IF EXISTS public.gen_invite_token CASCADE;
DROP FUNCTION IF EXISTS public.gen_registration_id CASCADE;
DROP FUNCTION IF EXISTS public.generate_registration_id CASCADE;
DROP FUNCTION IF EXISTS public.get_user_academies CASCADE;
DROP FUNCTION IF EXISTS public.get_user_academy_ids CASCADE;
DROP FUNCTION IF EXISTS public.get_user_primary_academy_id CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
-- has_permission has multiple overloads
DROP FUNCTION IF EXISTS public.has_permission(text) CASCADE;
DROP FUNCTION IF EXISTS public.has_permission(text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin CASCADE;
DROP FUNCTION IF EXISTS public.is_invite_valid CASCADE;
DROP FUNCTION IF EXISTS public.is_member_of_academy CASCADE;
DROP FUNCTION IF EXISTS public.is_staff CASCADE;
DROP FUNCTION IF EXISTS public.update_student_draft_timestamp CASCADE;
DROP FUNCTION IF EXISTS public.update_student_drafts_updated_at CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS public.use_invite_token CASCADE;
DROP FUNCTION IF EXISTS public.validate_invite CASCADE;
DROP FUNCTION IF EXISTS public.validate_invite_token CASCADE;

-- ============================================================================
-- PHASE 5: ALTER TABLES TO MATCH STG
-- ============================================================================

-- -------------------------------------------------------
-- 5A: academies - rename tax_id→cnpj, settings→preferences, add missing cols
-- -------------------------------------------------------
-- Rename columns
ALTER TABLE public.academies RENAME COLUMN tax_id TO cnpj;
ALTER TABLE public.academies RENAME COLUMN settings TO preferences;

-- Add missing columns
ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS address jsonb DEFAULT '{}'::jsonb;

-- Fix nullable constraints (STG allows NULL on created_at, updated_at, status)
ALTER TABLE public.academies ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE public.academies ALTER COLUMN updated_at DROP NOT NULL;
ALTER TABLE public.academies ALTER COLUMN status DROP NOT NULL;

-- Add unique constraint on cnpj (was already unique as tax_id, just renamed)
-- Check if constraint exists already
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academies_cnpj_key') THEN
    ALTER TABLE public.academies ADD CONSTRAINT academies_cnpj_key UNIQUE (cnpj);
  END IF;
END $$;

-- Update preferences default to match STG
ALTER TABLE public.academies ALTER COLUMN preferences SET DEFAULT '{"currency": "BRL", "language": "pt-BR", "timezone": "America/Sao_Paulo", "dateFormat": "DD/MM/YYYY"}'::jsonb;

-- Add comment
COMMENT ON TABLE public.academies IS 'Academia demo: Move Fitness (id: a0000000-0000-0000-0000-000000000001)';
COMMENT ON COLUMN public.academies.preferences IS 'Configurações de localização e preferências';
COMMENT ON COLUMN public.academies.trade_name IS 'Nome fantasia da academia';

-- -------------------------------------------------------
-- 5B: academy_memberships - rename joined_at→created_at, drop unit_id
-- -------------------------------------------------------
ALTER TABLE public.academy_memberships RENAME COLUMN joined_at TO created_at;
ALTER TABLE public.academy_memberships ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE public.academy_memberships DROP COLUMN IF EXISTS unit_id;

-- Ensure unique constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academy_memberships_profile_id_academy_id_key') THEN
    ALTER TABLE public.academy_memberships ADD CONSTRAINT academy_memberships_profile_id_academy_id_key UNIQUE (profile_id, academy_id);
  END IF;
END $$;

COMMENT ON TABLE public.academy_memberships IS 'Relacionamento N:N entre usuários e academias';
COMMENT ON COLUMN public.academy_memberships.is_primary IS 'Academia principal/padrão do usuário';

-- -------------------------------------------------------
-- 5C: invites - add missing cols, drop PRD-only cols, fix defaults
-- -------------------------------------------------------
-- Add STG-only columns
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS opened_at timestamptz;
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS created_profile_id uuid REFERENCES public.profiles(id);

-- Drop PRD-only columns
ALTER TABLE public.invites DROP COLUMN IF EXISTS max_uses;
ALTER TABLE public.invites DROP COLUMN IF EXISTS used_count;

-- Fix token default to use extensions.gen_random_bytes
ALTER TABLE public.invites ALTER COLUMN token SET DEFAULT encode(extensions.gen_random_bytes(16), 'hex'::text);

-- Fix invite_type default
ALTER TABLE public.invites ALTER COLUMN invite_type SET DEFAULT 'student'::user_type;

COMMENT ON TABLE public.invites IS 'Convites para cadastro de staff ou alunos via link';
COMMENT ON COLUMN public.invites.token IS 'Token único usado na URL de cadastro';

-- -------------------------------------------------------
-- 5D: units - change address type, add missing cols, fix defaults
-- -------------------------------------------------------
-- Change address from text to jsonb (need to handle existing data)
ALTER TABLE public.units ALTER COLUMN address TYPE jsonb USING
  CASE
    WHEN address IS NULL THEN '{}'::jsonb
    WHEN address = '' THEN '{}'::jsonb
    ELSE jsonb_build_object('raw', address)
  END;
ALTER TABLE public.units ALTER COLUMN address SET DEFAULT '{}'::jsonb;

-- Add missing columns
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS operating_hours jsonb DEFAULT '[]'::jsonb;

-- Fix access_config default
ALTER TABLE public.units ALTER COLUMN access_config SET DEFAULT '{"qrEnabled": true, "toleranceMinutes": 15, "dailyLimitDefault": 1, "requireOtpNewDevice": true}'::jsonb;

-- Fix qr_token to use extensions.gen_random_bytes and allow null
ALTER TABLE public.units ALTER COLUMN qr_token DROP NOT NULL;
ALTER TABLE public.units ALTER COLUMN qr_token SET DEFAULT encode(extensions.gen_random_bytes(16), 'hex'::text);

-- Fix nullable constraints
ALTER TABLE public.units ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE public.units ALTER COLUMN updated_at DROP NOT NULL;
ALTER TABLE public.units ALTER COLUMN status DROP NOT NULL;

COMMENT ON TABLE public.units IS 'Unidades físicas de uma academia';
COMMENT ON COLUMN public.units.qr_token IS 'Token único para geração de QR Code de acesso';

-- -------------------------------------------------------
-- 5E: staff_unit_assignments - drop PRD-only is_primary
-- -------------------------------------------------------
ALTER TABLE public.staff_unit_assignments DROP COLUMN IF EXISTS is_primary;

COMMENT ON TABLE public.staff_unit_assignments IS 'Unidades que o staff pode acessar (vazio = todas)';

-- -------------------------------------------------------
-- 5F: student_profiles - drop PRD-only plan_id, fix defaults
-- -------------------------------------------------------
ALTER TABLE public.student_profiles DROP COLUMN IF EXISTS plan_id;

-- Fix registration_id default (STG uses trigger, not column default)
ALTER TABLE public.student_profiles ALTER COLUMN registration_id DROP DEFAULT;

-- Fix registration_origin default
ALTER TABLE public.student_profiles ALTER COLUMN registration_origin SET DEFAULT 'app'::text;

-- Fix address default
ALTER TABLE public.student_profiles ALTER COLUMN address SET DEFAULT '{}'::jsonb;

-- Fix emergency_contact default
ALTER TABLE public.student_profiles ALTER COLUMN emergency_contact SET DEFAULT '{}'::jsonb;

COMMENT ON TABLE public.student_profiles IS 'Dados específicos de alunos (extensão de profiles)';
COMMENT ON COLUMN public.student_profiles.registration_id IS 'Matrícula no formato ALU-YYYY-NNNN';

-- -------------------------------------------------------
-- 5G: student_unit_assignments - drop PRD-only updated_at
-- -------------------------------------------------------
ALTER TABLE public.student_unit_assignments DROP COLUMN IF EXISTS updated_at;

-- -------------------------------------------------------
-- 5H: profiles - ensure email is NOT NULL (STG)
-- -------------------------------------------------------
-- STG profiles.email is NOT NULL, but PRD has it nullable
-- Need to handle existing NULL emails first
UPDATE public.profiles SET email = 'unknown@moveaccess.com' WHERE email IS NULL;
ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;

COMMENT ON TABLE public.profiles IS 'Perfil base de todos os usuários (staff e students)';
COMMENT ON COLUMN public.profiles.id IS 'Mesmo ID do auth.users - relação 1:1';

-- -------------------------------------------------------
-- 5I: roles - fix is_system default
-- -------------------------------------------------------
ALTER TABLE public.roles ALTER COLUMN is_system SET DEFAULT false;

COMMENT ON TABLE public.roles IS 'Papéis do sistema com permissões granulares';
COMMENT ON COLUMN public.roles.permissions IS 'Array de permissões no formato modulo:acao';

-- -------------------------------------------------------
-- 5J: student_drafts - add check constraints
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_drafts_current_step_check') THEN
    ALTER TABLE public.student_drafts ADD CONSTRAINT student_drafts_current_step_check
      CHECK (current_step = ANY (ARRAY['identification'::text, 'personal_data'::text, 'plan_selection'::text, 'contract'::text, 'payment'::text, 'activation'::text]));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_drafts_status_check') THEN
    ALTER TABLE public.student_drafts ADD CONSTRAINT student_drafts_status_check
      CHECK (status = ANY (ARRAY['in_progress'::text, 'completed'::text, 'abandoned'::text, 'published'::text, 'archived'::text]));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'student_drafts_origin_check') THEN
    ALTER TABLE public.student_drafts ADD CONSTRAINT student_drafts_origin_check
      CHECK (origin = ANY (ARRAY['staff'::text, 'self_registration'::text, 'invite_link'::text]));
  END IF;
END $$;

COMMENT ON TABLE public.student_drafts IS 'Rascunhos de cadastro de alunos - dados parciais antes de criar auth.users';
COMMENT ON COLUMN public.student_drafts.current_step IS 'Última etapa salva do wizard';
COMMENT ON COLUMN public.student_drafts.collected_data IS 'JSONB com dados de cada step: identification, personalData, planSelection, contract, payment, activation';
COMMENT ON COLUMN public.student_drafts.published_user_id IS 'ID do usuário criado quando draft foi publicado';
COMMENT ON COLUMN public.student_drafts.origin IS 'Origem do cadastro: staff (criado pela academia), self_registration (auto-cadastro), invite_link (via link de convite)';

-- -------------------------------------------------------
-- 5K: invite_links - add check constraint
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invite_links_status_check') THEN
    ALTER TABLE public.invite_links ADD CONSTRAINT invite_links_status_check
      CHECK (status = ANY (ARRAY['active'::text, 'used'::text, 'expired'::text, 'revoked'::text]));
  END IF;
END $$;

-- ============================================================================
-- PHASE 6: RECREATE ALL FUNCTIONS (from STG definitions)
-- ============================================================================

-- 6.1 update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 6.2 update_student_draft_timestamp
CREATE OR REPLACE FUNCTION public.update_student_draft_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 6.3 ensure_single_primary_academy
CREATE OR REPLACE FUNCTION public.ensure_single_primary_academy()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE academy_memberships
    SET is_primary = FALSE
    WHERE profile_id = NEW.profile_id
      AND id != NEW.id
      AND is_primary = TRUE;
  END IF;
  RETURN NEW;
END;
$function$;

-- 6.4 ensure_single_primary_unit
CREATE OR REPLACE FUNCTION public.ensure_single_primary_unit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE student_unit_assignments
    SET is_primary = FALSE
    WHERE student_id = NEW.student_id
      AND id != NEW.id
      AND is_primary = TRUE;
  END IF;
  RETURN NEW;
END;
$function$;

-- 6.5 generate_registration_id
CREATE OR REPLACE FUNCTION public.generate_registration_id()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  year_str TEXT;
  seq_num INT;
  new_reg_id TEXT;
BEGIN
  IF NEW.registration_id IS NULL THEN
    year_str := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(
      CAST(SUBSTRING(registration_id FROM 'ALU-\d{4}-(\d+)') AS INT)
    ), 0) + 1
    INTO seq_num
    FROM student_profiles
    WHERE registration_id LIKE 'ALU-' || year_str || '-%';

    new_reg_id := 'ALU-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');
    NEW.registration_id := new_reg_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- 6.6 get_user_academy_ids
CREATE OR REPLACE FUNCTION public.get_user_academy_ids()
 RETURNS uuid[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN ARRAY(
    SELECT academy_id
    FROM academy_memberships
    WHERE profile_id = auth.uid()
  );
END;
$function$;

-- 6.7 get_user_primary_academy_id
CREATE OR REPLACE FUNCTION public.get_user_primary_academy_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT academy_id
    FROM academy_memberships
    WHERE profile_id = auth.uid() AND is_primary = TRUE
    LIMIT 1
  );
END;
$function$;

-- 6.8 handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_name text;
  v_user_type public.user_type;
BEGIN
  -- Extrair dados do metadata com fallbacks seguros
  v_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), 'Usuário');

  -- Cast explícito com schema qualificado
  BEGIN
    v_user_type := (NEW.raw_user_meta_data->>'user_type')::public.user_type;
  EXCEPTION WHEN others THEN
    v_user_type := 'student'::public.user_type;
  END;

  -- Inserir profile com ON CONFLICT para evitar erros
  INSERT INTO public.profiles (id, email, name, user_type)
  VALUES (NEW.id, NEW.email, v_name, v_user_type)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(public.profiles.name, EXCLUDED.name),
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log do erro mas não falha o signup
    RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- 6.9 has_permission
CREATE OR REPLACE FUNCTION public.has_permission(required_permission text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
DECLARE
  user_permissions TEXT[];
  role_permissions TEXT[];
BEGIN
  -- Buscar permissões customizadas e da role
  SELECT
    COALESCE(sp.custom_permissions, '{}'),
    COALESCE(r.permissions, '{}')
  INTO user_permissions, role_permissions
  FROM staff_profiles sp
  JOIN roles r ON r.id = sp.role
  WHERE sp.id = auth.uid();

  -- Se tem custom_permissions, usa elas, senão usa da role
  IF array_length(user_permissions, 1) > 0 THEN
    RETURN required_permission = ANY(user_permissions) OR '*' = ANY(user_permissions);
  ELSE
    RETURN required_permission = ANY(role_permissions) OR '*' = ANY(role_permissions);
  END IF;
END;
$function$;

-- 6.10 is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE id = auth.uid()
    AND role = 'admin'::role_id
  );
END;
$function$;

-- 6.11 is_staff
CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND user_type = 'staff'
  );
END;
$function$;

-- 6.12 is_invite_valid
CREATE OR REPLACE FUNCTION public.is_invite_valid(invite_token text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  inv invites;
BEGIN
  SELECT * INTO inv FROM invites WHERE token = invite_token;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF inv.status != 'pending' THEN
    RETURN FALSE;
  END IF;

  IF inv.expires_at < NOW() THEN
    -- Marcar como expirado
    UPDATE invites SET status = 'expired' WHERE id = inv.id;
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$function$;

-- 6.13 complete_user_setup
CREATE OR REPLACE FUNCTION public.complete_user_setup(p_user_id uuid, p_user_type user_type, p_academy_id uuid, p_unit_id uuid DEFAULT NULL::uuid, p_staff_role role_id DEFAULT NULL::role_id, p_cpf text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_name text;
  v_email text;
BEGIN
  -- 0. Buscar dados do usuário em auth.users
  SELECT
    raw_user_meta_data->>'name' as name,
    email
  INTO v_name, v_email
  FROM auth.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found in auth.users'
    );
  END IF;

  -- 1. Garantir que profile existe (INSERT ou UPDATE)
  INSERT INTO public.profiles (id, name, email, cpf, user_type)
  VALUES (
    p_user_id,
    COALESCE(v_name, 'Usuário'),
    v_email,
    NULLIF(p_cpf, ''),
    p_user_type
  )
  ON CONFLICT (id) DO UPDATE SET
    user_type = EXCLUDED.user_type,
    cpf = COALESCE(NULLIF(p_cpf, ''), public.profiles.cpf),
    updated_at = now();

  -- 2. Criar staff_profile ou student_profile
  IF p_user_type = 'staff'::public.user_type THEN
    INSERT INTO public.staff_profiles (id, role, status)
    VALUES (p_user_id, COALESCE(p_staff_role, 'receptionist'::public.role_id), 'active'::public.staff_status)
    ON CONFLICT (id) DO UPDATE SET
      role = EXCLUDED.role,
      status = EXCLUDED.status;
  ELSE
    INSERT INTO public.student_profiles (id, status, plan_name, plan_status, plan_expires_at)
    VALUES (
      p_user_id,
      'active'::public.student_status,
      'Plano Mensal',
      'active'::public.plan_status,
      now() + interval '30 days'
    )
    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;
  END IF;

  -- 3. Criar academy_membership (sem unit_id que não existe nesta tabela)
  INSERT INTO public.academy_memberships (profile_id, academy_id, is_primary)
  VALUES (p_user_id, p_academy_id, true)
  ON CONFLICT (profile_id, academy_id) DO UPDATE SET
    is_primary = EXCLUDED.is_primary;

  v_result := jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'user_type', p_user_type
  );

  RETURN v_result;
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$function$;

-- 6.14 create_invite_link
CREATE OR REPLACE FUNCTION public.create_invite_link(p_academy_id uuid, p_unit_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text, p_expected_email text DEFAULT NULL::text, p_expires_in_days integer DEFAULT 30)
 RETURNS TABLE(id uuid, token text, academy_id uuid, unit_id uuid, created_by uuid, expected_email text, status text, expires_at timestamp with time zone, description text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_new_id UUID;
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Obtém o user autenticado
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verifica se usuário pertence à academia
  IF NOT EXISTS (
    SELECT 1 FROM academy_memberships am
    WHERE am.academy_id = p_academy_id
    AND am.profile_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Usuário não pertence a esta academia';
  END IF;

  -- Gera token e calcula expiração
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + (p_expires_in_days || ' days')::interval;

  -- Insere o link
  INSERT INTO invite_links (
    token,
    academy_id,
    unit_id,
    created_by,
    expected_email,
    description,
    expires_at,
    status
  ) VALUES (
    v_token,
    p_academy_id,
    p_unit_id,
    v_user_id,
    p_expected_email,
    p_description,
    v_expires_at,
    'active'
  )
  RETURNING invite_links.id INTO v_new_id;

  -- Retorna o link criado
  RETURN QUERY
  SELECT
    il.id,
    il.token,
    il.academy_id,
    il.unit_id,
    il.created_by,
    il.expected_email,
    il.status,
    il.expires_at,
    il.description,
    il.created_at
  FROM invite_links il
  WHERE il.id = v_new_id;
END;
$function$;

-- 6.15 use_invite_token
CREATE OR REPLACE FUNCTION public.use_invite_token(p_token text, p_email text DEFAULT NULL::text)
 RETURNS TABLE(success boolean, draft_id uuid, is_new_draft boolean, error_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_link invite_links%ROWTYPE;
  v_draft student_drafts%ROWTYPE;
  v_new_draft_id UUID;
BEGIN
  -- Busca e valida o link
  SELECT * INTO v_link
  FROM invite_links
  WHERE token = p_token
    AND status IN ('active', 'used')  -- Permite retomar se já usado
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, false, 'INVALID_TOKEN'::TEXT;
    RETURN;
  END IF;

  -- Valida email se esperado
  IF v_link.expected_email IS NOT NULL
     AND p_email IS NOT NULL
     AND lower(v_link.expected_email) != lower(p_email) THEN
    RETURN QUERY SELECT false, NULL::UUID, false, 'EMAIL_MISMATCH'::TEXT;
    RETURN;
  END IF;

  -- Se já tem draft associado, retoma
  IF v_link.draft_id IS NOT NULL THEN
    SELECT * INTO v_draft FROM student_drafts WHERE id = v_link.draft_id;

    IF FOUND AND v_draft.status IN ('in_progress', 'completed') THEN
      RETURN QUERY SELECT true, v_link.draft_id, false, NULL::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Cria novo draft
  INSERT INTO student_drafts (
    academy_id,
    unit_id,
    created_by,
    current_step,
    status,
    origin,
    collected_data
  ) VALUES (
    v_link.academy_id,
    v_link.unit_id,
    v_link.created_by,  -- Atribui ao staff que criou o link
    'identification',
    'in_progress',
    'invite_link',
    '{}'::jsonb
  )
  RETURNING id INTO v_new_draft_id;

  -- Atualiza o link
  UPDATE invite_links
  SET
    used_at = COALESCE(used_at, now()),  -- Só atualiza se for primeiro uso
    draft_id = v_new_draft_id,
    status = 'used',
    updated_at = now()
  WHERE id = v_link.id;

  RETURN QUERY SELECT true, v_new_draft_id, true, NULL::TEXT;
END;
$function$;

-- 6.16 validate_invite_token
CREATE OR REPLACE FUNCTION public.validate_invite_token(p_token text)
 RETURNS TABLE(is_valid boolean, invite_id uuid, academy_id uuid, unit_id uuid, expected_email text, draft_id uuid, error_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_link invite_links%ROWTYPE;
BEGIN
  -- Busca o link
  SELECT * INTO v_link
  FROM invite_links
  WHERE token = p_token;

  -- Token não existe
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      false, NULL::UUID, NULL::UUID, NULL::UUID, NULL::TEXT, NULL::UUID, 'TOKEN_NOT_FOUND'::TEXT;
    RETURN;
  END IF;

  -- Token revogado
  IF v_link.status = 'revoked' THEN
    RETURN QUERY SELECT
      false, v_link.id, v_link.academy_id, v_link.unit_id, v_link.expected_email, v_link.draft_id, 'TOKEN_REVOKED'::TEXT;
    RETURN;
  END IF;

  -- Token expirado
  IF v_link.expires_at < now() THEN
    -- Marca como expirado
    UPDATE invite_links SET status = 'expired', updated_at = now() WHERE id = v_link.id;

    RETURN QUERY SELECT
      false, v_link.id, v_link.academy_id, v_link.unit_id, v_link.expected_email, v_link.draft_id, 'TOKEN_EXPIRED'::TEXT;
    RETURN;
  END IF;

  -- Token válido!
  RETURN QUERY SELECT
    true, v_link.id, v_link.academy_id, v_link.unit_id, v_link.expected_email, v_link.draft_id, NULL::TEXT;
END;
$function$;

-- ============================================================================
-- PHASE 7: RECREATE ALL TRIGGERS (from STG)
-- ============================================================================

CREATE TRIGGER academies_updated_at
  BEFORE UPDATE ON public.academies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER academy_memberships_ensure_primary
  BEFORE INSERT OR UPDATE ON public.academy_memberships
  FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_academy();

CREATE TRIGGER update_invite_links_updated_at
  BEFORE UPDATE ON public.invite_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER staff_profiles_updated_at
  BEFORE UPDATE ON public.staff_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_student_drafts_updated
  BEFORE UPDATE ON public.student_drafts
  FOR EACH ROW EXECUTE FUNCTION update_student_draft_timestamp();

CREATE TRIGGER student_profiles_generate_registration
  BEFORE INSERT ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION generate_registration_id();

CREATE TRIGGER student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER student_unit_ensure_primary
  BEFORE INSERT OR UPDATE ON public.student_unit_assignments
  FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_unit();

CREATE TRIGGER units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auth trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PHASE 8: RECREATE ALL VIEWS (from STG definitions)
-- ============================================================================

-- 8.1 invite_links_list
CREATE OR REPLACE VIEW public.invite_links_list AS
SELECT id,
    token,
    academy_id,
    unit_id,
    created_by,
    expected_email,
    status,
    expires_at,
    used_at,
    draft_id,
    description,
    created_at,
    updated_at,
        CASE
            WHEN ((status = 'active'::text) AND (expires_at > now())) THEN true
            ELSE false
        END AS is_valid,
        CASE
            WHEN (expires_at > now()) THEN (expires_at - now())
            ELSE '00:00:00'::interval
        END AS time_remaining
   FROM invite_links
  ORDER BY created_at DESC;

-- 8.2 my_profile
CREATE OR REPLACE VIEW public.my_profile AS
SELECT p.id,
    p.user_type,
    p.name,
    p.email,
    p.phone,
    p.cpf,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    sp.role,
    sp.status AS staff_status,
    sp.custom_permissions,
    sp.last_login_at,
    stu.status AS student_status,
    stu.registration_id,
    stu.plan_name,
    stu.plan_status,
    stu.plan_expires_at,
    ( SELECT array_agg(am.academy_id) AS array_agg
           FROM academy_memberships am
          WHERE (am.profile_id = p.id)) AS academy_ids,
    ( SELECT jsonb_agg(jsonb_build_object('id', a.id, 'name', a.trade_name, 'is_primary', am.is_primary)) AS jsonb_agg
           FROM (academy_memberships am
             JOIN academies a ON ((a.id = am.academy_id)))
          WHERE (am.profile_id = p.id)) AS academies
   FROM ((profiles p
     LEFT JOIN staff_profiles sp ON (((sp.id = p.id) AND (p.user_type = 'staff'::user_type))))
     LEFT JOIN student_profiles stu ON (((stu.id = p.id) AND (p.user_type = 'student'::user_type))))
  WHERE (p.id = auth.uid());

-- 8.3 staff_list_view
CREATE OR REPLACE VIEW public.staff_list_view AS
SELECT p.id,
    p.name,
    p.email,
    p.phone,
    p.cpf,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    sp.role AS role_id,
    sp.status,
    sp.last_login_at,
    sp.last_login_ip,
    sp.custom_permissions,
    am.academy_id,
    a.trade_name AS academy_name,
    COALESCE(( SELECT array_agg(sua.unit_id) AS array_agg
           FROM staff_unit_assignments sua
          WHERE (sua.staff_id = p.id)), ARRAY[]::uuid[]) AS unit_ids
   FROM (((profiles p
     JOIN staff_profiles sp ON ((sp.id = p.id)))
     LEFT JOIN academy_memberships am ON (((am.profile_id = p.id) AND (am.is_primary = true))))
     LEFT JOIN academies a ON ((a.id = am.academy_id)))
  WHERE (p.user_type = 'staff'::user_type);

-- 8.4 staff_with_role
CREATE OR REPLACE VIEW public.staff_with_role AS
SELECT p.id,
    p.name,
    p.email,
    p.phone,
    p.avatar_url,
    sp.role,
    r.name AS role_name,
    COALESCE(sp.custom_permissions, r.permissions) AS permissions,
    sp.status,
    sp.last_login_at,
    ( SELECT array_agg(sua.unit_id) AS array_agg
           FROM staff_unit_assignments sua
          WHERE (sua.staff_id = sp.id)) AS unit_ids
   FROM ((profiles p
     JOIN staff_profiles sp ON ((sp.id = p.id)))
     JOIN roles r ON ((r.id = sp.role)));

-- 8.5 student_drafts_list
CREATE OR REPLACE VIEW public.student_drafts_list AS
SELECT d.id,
    d.academy_id,
    d.unit_id,
    u.name AS unit_name,
    d.current_step,
    d.status,
    d.origin,
    ((d.collected_data -> 'identification'::text) ->> 'fullName'::text) AS student_name,
    ((d.collected_data -> 'identification'::text) ->> 'email'::text) AS student_email,
    ((d.collected_data -> 'identification'::text) ->> 'phone'::text) AS student_phone,
    ((d.collected_data -> 'identification'::text) ->> 'userType'::text) AS user_type,
    ((d.collected_data -> 'personalData'::text) ->> 'document'::text) AS cpf,
    ((d.collected_data -> 'planSelection'::text) ->> 'planName'::text) AS plan_name,
    (((d.collected_data -> 'planSelection'::text) ->> 'value'::text))::numeric AS plan_value,
    d.created_by,
    p.name AS created_by_name,
    d.created_at,
    d.updated_at,
    d.completed_at,
    d.published_at,
    d.published_user_id,
    (((((
        CASE
            WHEN ((d.collected_data ->> 'identification'::text) IS NOT NULL) THEN 1
            ELSE 0
        END +
        CASE
            WHEN ((d.collected_data ->> 'personalData'::text) IS NOT NULL) THEN 1
            ELSE 0
        END) +
        CASE
            WHEN ((d.collected_data ->> 'planSelection'::text) IS NOT NULL) THEN 1
            ELSE 0
        END) +
        CASE
            WHEN ((d.collected_data ->> 'contract'::text) IS NOT NULL) THEN 1
            ELSE 0
        END) +
        CASE
            WHEN ((d.collected_data ->> 'payment'::text) IS NOT NULL) THEN 1
            ELSE 0
        END) +
        CASE
            WHEN ((d.collected_data ->> 'activation'::text) IS NOT NULL) THEN 1
            ELSE 0
        END) AS steps_completed
   FROM ((student_drafts d
     LEFT JOIN units u ON ((d.unit_id = u.id)))
     LEFT JOIN profiles p ON ((d.created_by = p.id)));

-- 8.6 student_list_view
CREATE OR REPLACE VIEW public.student_list_view AS
SELECT p.id,
    p.name AS full_name,
    p.email,
    p.phone,
    p.cpf AS document,
    p.avatar_url,
    p.created_at,
    sp.registration_id,
    sp.status,
    sp.status_reason,
    sp.status_since,
    sp.birth_date,
    sp.registration_origin,
    sp.address,
    sp.emergency_contact,
    sp.plan_name,
    sp.plan_status,
    sp.plan_expires_at,
    sua.unit_id,
    u.name AS unit_name,
    am.academy_id,
    a.trade_name AS academy_name
   FROM (((((profiles p
     JOIN student_profiles sp ON ((sp.id = p.id)))
     LEFT JOIN student_unit_assignments sua ON (((sua.student_id = p.id) AND (sua.is_primary = true))))
     LEFT JOIN units u ON ((u.id = sua.unit_id)))
     LEFT JOIN academy_memberships am ON (((am.profile_id = p.id) AND (am.is_primary = true))))
     LEFT JOIN academies a ON ((a.id = am.academy_id)))
  WHERE (p.user_type = 'student'::user_type);

-- 8.7 students_with_status
CREATE OR REPLACE VIEW public.students_with_status AS
SELECT p.id,
    p.name,
    p.email,
    p.phone,
    p.cpf,
    stp.registration_id,
    stp.status,
    stp.status_reason,
    stp.plan_name,
    stp.plan_status,
    stp.plan_expires_at,
    stp.created_at,
        CASE
            WHEN (stp.status <> 'active'::student_status) THEN false
            WHEN (stp.plan_status <> ALL (ARRAY['active'::plan_status, 'pending'::plan_status])) THEN false
            ELSE true
        END AS access_allowed,
    ( SELECT jsonb_agg(jsonb_build_object('unit_id', sua.unit_id, 'is_primary', sua.is_primary, 'unit_name', u.name)) AS jsonb_agg
           FROM (student_unit_assignments sua
             JOIN units u ON ((u.id = sua.unit_id)))
          WHERE (sua.student_id = stp.id)) AS units
   FROM (profiles p
     JOIN student_profiles stp ON ((stp.id = p.id)));

-- ============================================================================
-- PHASE 9: RECREATE ALL RLS POLICIES (from STG definitions)
-- ============================================================================

-- Ensure RLS is enabled on all tables
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_unit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_unit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- 9.1 academies policies
CREATE POLICY "Admin edita academia" ON public.academies
  FOR UPDATE TO public
  USING ((id = ANY (get_user_academy_ids())) AND has_permission('settings:edit_academy'::text));

CREATE POLICY "Usuário vê suas academias" ON public.academies
  FOR SELECT TO public
  USING (id = ANY (get_user_academy_ids()));

-- 9.2 academy_memberships policies
CREATE POLICY "Admin cria memberships para sua academia" ON public.academy_memberships
  FOR INSERT TO authenticated
  WITH CHECK (is_admin() AND (academy_id = ANY (get_user_academy_ids())));

CREATE POLICY "Staff vê memberships da academia" ON public.academy_memberships
  FOR SELECT TO public
  USING (is_staff() AND (academy_id = ANY (get_user_academy_ids())));

CREATE POLICY "Users can create own membership" ON public.academy_memberships
  FOR INSERT TO public
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own membership" ON public.academy_memberships
  FOR UPDATE TO public
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Usuário vê próprias memberships" ON public.academy_memberships
  FOR SELECT TO public
  USING (profile_id = auth.uid());

-- 9.3 invite_links policies
CREATE POLICY "Staff can create links for own academy" ON public.invite_links
  FOR INSERT TO authenticated
  WITH CHECK ((academy_id IN (SELECT am.academy_id FROM academy_memberships am WHERE am.profile_id = auth.uid())) AND (created_by = auth.uid()));

CREATE POLICY "Staff can update own academy links" ON public.invite_links
  FOR UPDATE TO authenticated
  USING (academy_id IN (SELECT am.academy_id FROM academy_memberships am WHERE am.profile_id = auth.uid()));

CREATE POLICY "Staff can view own academy links" ON public.invite_links
  FOR SELECT TO authenticated
  USING (academy_id IN (SELECT am.academy_id FROM academy_memberships am WHERE am.profile_id = auth.uid()));

-- 9.4 invites policies
CREATE POLICY "Convites pendentes são públicos" ON public.invites
  FOR SELECT TO public
  USING ((status = 'pending'::invite_status) AND (expires_at > now()));

CREATE POLICY "Staff cria convites" ON public.invites
  FOR INSERT TO public
  WITH CHECK (is_staff() AND (academy_id = ANY (get_user_academy_ids())));

CREATE POLICY "Staff vê convites da academia" ON public.invites
  FOR SELECT TO public
  USING (is_staff() AND (academy_id = ANY (get_user_academy_ids())));

-- 9.5 profiles policies
CREATE POLICY "Admin cria perfis para sua academia" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Allow email lookup by cpf for login" ON public.profiles
  FOR SELECT TO public
  USING (cpf IS NOT NULL);

CREATE POLICY "Staff vê perfis da mesma academia" ON public.profiles
  FOR SELECT TO public
  USING (is_staff() AND (EXISTS (SELECT 1 FROM academy_memberships am WHERE am.profile_id = profiles.id AND am.academy_id = ANY (get_user_academy_ids()))));

CREATE POLICY "Usuário edita próprio perfil" ON public.profiles
  FOR UPDATE TO public
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Usuário vê próprio perfil" ON public.profiles
  FOR SELECT TO public
  USING (id = auth.uid());

-- 9.6 roles policies
CREATE POLICY "Roles são públicas para leitura" ON public.roles
  FOR SELECT TO public
  USING (true);

-- 9.7 staff_profiles policies
CREATE POLICY "Admin cria staff para sua academia" ON public.staff_profiles
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin vê staff da academia" ON public.staff_profiles
  FOR SELECT TO public
  USING (has_permission('settings:manage_team'::text) AND (EXISTS (SELECT 1 FROM academy_memberships am WHERE am.profile_id = staff_profiles.id AND am.academy_id = ANY (get_user_academy_ids()))));

CREATE POLICY "Staff vê próprio perfil" ON public.staff_profiles
  FOR SELECT TO public
  USING (id = auth.uid());

CREATE POLICY "Users can create own staff profile" ON public.staff_profiles
  FOR INSERT TO public
  WITH CHECK (id = auth.uid());

-- 9.8 staff_unit_assignments policies
CREATE POLICY "Admin cria unit assignments" ON public.staff_unit_assignments
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Staff vê próprias unit assignments" ON public.staff_unit_assignments
  FOR SELECT TO public
  USING (staff_id = auth.uid());

-- 9.9 student_drafts policies
CREATE POLICY "Staff deletes own academy drafts" ON public.student_drafts
  FOR DELETE TO public
  USING (is_staff() AND (academy_id = ANY (get_user_academy_ids())) AND (status <> 'published'::text));

CREATE POLICY "Staff inserts own academy drafts" ON public.student_drafts
  FOR INSERT TO public
  WITH CHECK (is_staff() AND (academy_id = ANY (get_user_academy_ids())));

CREATE POLICY "Staff selects own academy drafts" ON public.student_drafts
  FOR SELECT TO public
  USING (is_staff() AND (academy_id = ANY (get_user_academy_ids())));

CREATE POLICY "Staff updates own academy drafts" ON public.student_drafts
  FOR UPDATE TO public
  USING (is_staff() AND (academy_id = ANY (get_user_academy_ids())) AND (status <> 'published'::text))
  WITH CHECK (is_staff() AND (academy_id = ANY (get_user_academy_ids())));

-- 9.10 student_profiles policies
CREATE POLICY "Aluno vê próprio perfil" ON public.student_profiles
  FOR SELECT TO public
  USING (id = auth.uid());

CREATE POLICY "Staff edita alunos" ON public.student_profiles
  FOR UPDATE TO public
  USING (is_staff() AND has_permission('users:edit'::text) AND (EXISTS (SELECT 1 FROM academy_memberships am WHERE am.profile_id = student_profiles.id AND am.academy_id = ANY (get_user_academy_ids()))));

CREATE POLICY "Staff vê alunos da academia" ON public.student_profiles
  FOR SELECT TO public
  USING (is_staff() AND has_permission('users:view'::text) AND (EXISTS (SELECT 1 FROM academy_memberships am WHERE am.profile_id = student_profiles.id AND am.academy_id = ANY (get_user_academy_ids()))));

CREATE POLICY "Users can create own student profile" ON public.student_profiles
  FOR INSERT TO public
  WITH CHECK (id = auth.uid());

-- 9.11 student_unit_assignments policies
CREATE POLICY "Aluno vê próprias unit assignments" ON public.student_unit_assignments
  FOR SELECT TO public
  USING (student_id = auth.uid());

CREATE POLICY "Staff vê unit assignments da academia" ON public.student_unit_assignments
  FOR SELECT TO public
  USING (is_staff() AND has_permission('users:view'::text) AND (EXISTS (SELECT 1 FROM academy_memberships am WHERE am.profile_id = student_unit_assignments.student_id AND am.academy_id = ANY (get_user_academy_ids()))));

-- 9.12 units policies
CREATE POLICY "Staff gerencia unidades" ON public.units
  FOR ALL TO public
  USING ((academy_id = ANY (get_user_academy_ids())) AND has_permission('settings:manage_units'::text));

CREATE POLICY "Usuário vê unidades das suas academias" ON public.units
  FOR SELECT TO public
  USING (academy_id = ANY (get_user_academy_ids()));

-- ============================================================================
-- PHASE 10: FIX AUTH TOKENS (same issue as STG - NULL tokens crash GoTrue)
-- ============================================================================
UPDATE auth.users SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, ''),
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, '')
WHERE confirmation_token IS NULL
   OR recovery_token IS NULL
   OR email_change_token_new IS NULL
   OR email_change_token_current IS NULL
   OR reauthentication_token IS NULL;

-- Fix missing auth.identities for any users that don't have them
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  u.id::text,
  now(),
  now(),
  now()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
);

COMMIT;
