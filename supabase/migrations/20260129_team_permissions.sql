-- =============================================================================
-- DEV Migration: Team & Permissions Module
-- Timestamp: 20260129_team_permissions
-- Ambiente: DEV (hvgqdihblfepstcxrcwb.supabase.co)
-- 
-- Este arquivo documenta todas as alterações aplicadas no DEV para o módulo
-- de Equipe & Permissões. Aplicado via MCP em 2026-01-28/29.
-- =============================================================================

-- ============================================================================
-- PARTE 1: FUNÇÃO has_permission(text)
-- Versão simplificada que usa auth.uid() internamente
-- ============================================================================

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

-- ============================================================================
-- PARTE 2: TABELA student_unit_assignments (se não existir)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.student_unit_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, unit_id)
);

ALTER TABLE public.student_unit_assignments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_student_unit_student ON student_unit_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_unit_unit ON student_unit_assignments(unit_id);
CREATE INDEX IF NOT EXISTS idx_student_unit_primary ON student_unit_assignments(student_id) WHERE is_primary = true;

-- ============================================================================
-- PARTE 3: COLUNAS EXTRAS EM student_profiles
-- ============================================================================

ALTER TABLE student_profiles 
  ADD COLUMN IF NOT EXISTS status_reason text,
  ADD COLUMN IF NOT EXISTS status_since timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS registration_origin text DEFAULT 'manual';

-- ============================================================================
-- PARTE 4: COLUNA EXTRA EM staff_profiles
-- ============================================================================

ALTER TABLE staff_profiles 
  ADD COLUMN IF NOT EXISTS last_login_ip text;

-- ============================================================================
-- PARTE 5: COLUNAS EM academies E units
-- ============================================================================

-- academies.status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'academies' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE academies ADD COLUMN status academy_status DEFAULT 'active';
  END IF;
END$$;

-- academies.updated_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'academies' 
    AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE academies ADD COLUMN updated_by uuid REFERENCES profiles(id);
  END IF;
END$$;

-- units.updated_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'units' 
    AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE units ADD COLUMN updated_by uuid REFERENCES profiles(id);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_academies_status ON academies(status);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);

-- ============================================================================
-- PARTE 6: RLS POLICIES PARA STAFF
-- ============================================================================

-- Policy: Staff pode visualizar student_profiles da mesma academy
DROP POLICY IF EXISTS "Staff vê alunos da academia" ON public.student_profiles;
CREATE POLICY "Staff vê alunos da academia" ON public.student_profiles
  FOR SELECT
  USING (
    is_staff() 
    AND has_permission('users:view')
    AND EXISTS (
      SELECT 1 FROM academy_memberships am
      WHERE am.profile_id = student_profiles.id
      AND am.academy_id = ANY(get_user_academy_ids())
    )
  );

-- Policy: Staff pode editar student_profiles da mesma academy
DROP POLICY IF EXISTS "Staff edita alunos" ON public.student_profiles;
CREATE POLICY "Staff edita alunos" ON public.student_profiles
  FOR UPDATE
  USING (
    is_staff() 
    AND has_permission('users:edit')
    AND EXISTS (
      SELECT 1 FROM academy_memberships am
      WHERE am.profile_id = student_profiles.id
      AND am.academy_id = ANY(get_user_academy_ids())
    )
  );

-- Policy: Aluno vê próprias unit assignments
DROP POLICY IF EXISTS "Aluno vê próprias unit assignments" ON public.student_unit_assignments;
CREATE POLICY "Aluno vê próprias unit assignments" ON public.student_unit_assignments
  FOR SELECT
  USING (student_id = auth.uid());

-- Policy: Staff pode ver unit assignments de alunos da mesma academy
DROP POLICY IF EXISTS "Staff vê unit assignments da academia" ON public.student_unit_assignments;
CREATE POLICY "Staff vê unit assignments da academia" ON public.student_unit_assignments
  FOR SELECT
  USING (
    is_staff() 
    AND has_permission('users:view')
    AND EXISTS (
      SELECT 1 FROM academy_memberships am
      WHERE am.profile_id = student_unit_assignments.student_id
      AND am.academy_id = ANY(get_user_academy_ids())
    )
  );

-- ============================================================================
-- PARTE 7: VIEW student_list_view
-- ============================================================================

DROP VIEW IF EXISTS public.student_list_view;

CREATE OR REPLACE VIEW public.student_list_view AS
SELECT 
  p.id,
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
FROM profiles p
JOIN student_profiles sp ON sp.id = p.id
LEFT JOIN student_unit_assignments sua ON sua.student_id = p.id AND sua.is_primary = true
LEFT JOIN units u ON u.id = sua.unit_id
LEFT JOIN academy_memberships am ON am.profile_id = p.id AND am.is_primary = true
LEFT JOIN academies a ON a.id = am.academy_id
WHERE p.user_type = 'student';

ALTER VIEW public.student_list_view SET (security_invoker = true);

COMMENT ON VIEW public.student_list_view IS 'View consolidada de alunos para listagem. Respeita RLS via security_invoker.';

-- ============================================================================
-- PARTE 8: VIEW staff_list_view
-- ============================================================================

DROP VIEW IF EXISTS public.staff_list_view;

CREATE OR REPLACE VIEW public.staff_list_view AS
SELECT 
  p.id,
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
  COALESCE(
    (SELECT array_agg(sua.unit_id) FROM staff_unit_assignments sua WHERE sua.staff_id = p.id),
    ARRAY[]::uuid[]
  ) AS unit_ids
FROM profiles p
JOIN staff_profiles sp ON sp.id = p.id
LEFT JOIN academy_memberships am ON am.profile_id = p.id AND am.is_primary = true
LEFT JOIN academies a ON a.id = am.academy_id
WHERE p.user_type = 'staff';

ALTER VIEW public.staff_list_view SET (security_invoker = true);

COMMENT ON VIEW public.staff_list_view IS 'View consolidada de staff para listagem. Respeita RLS via security_invoker.';

-- ============================================================================
-- PARTE 9: VIEW my_profile (atualizada com academy_ids)
-- ============================================================================

DROP VIEW IF EXISTS my_profile;

CREATE VIEW my_profile AS
SELECT 
  p.id,
  p.user_type,
  p.name,
  p.email,
  p.phone,
  p.cpf,
  p.avatar_url,
  p.created_at,
  p.updated_at,
  -- Staff fields
  sp.role,
  sp.status as staff_status,
  sp.custom_permissions,
  sp.last_login_at,
  -- Student fields
  stu.status as student_status,
  stu.registration_id,
  stu.plan_name,
  stu.plan_status,
  stu.plan_expires_at,
  -- Academy info
  (
    SELECT array_agg(am.academy_id)
    FROM academy_memberships am
    WHERE am.profile_id = p.id
  ) as academy_ids,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'id', a.id,
      'name', a.trade_name,
      'is_primary', am.is_primary
    ))
    FROM academy_memberships am
    JOIN academies a ON a.id = am.academy_id
    WHERE am.profile_id = p.id
  ) as academies
FROM profiles p
LEFT JOIN staff_profiles sp ON sp.id = p.id AND p.user_type = 'staff'
LEFT JOIN student_profiles stu ON stu.id = p.id AND p.user_type = 'student'
WHERE p.id = auth.uid();

GRANT SELECT ON my_profile TO authenticated;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration team_permissions completa!';
  RAISE NOTICE '========================================';
END $$;
