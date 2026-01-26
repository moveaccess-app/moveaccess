-- ============================================
-- ENABLE RLS EM TODAS AS TABELAS
-- ============================================

ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_unit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_unit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNÇÕES HELPER PARA RLS
-- ============================================

-- Obter IDs das academias do usuário atual
CREATE OR REPLACE FUNCTION get_user_academy_ids()
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT academy_id 
    FROM academy_memberships 
    WHERE profile_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Obter a academia primária do usuário atual
CREATE OR REPLACE FUNCTION get_user_primary_academy_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT academy_id 
    FROM academy_memberships 
    WHERE profile_id = auth.uid() AND is_primary = TRUE
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verificar se usuário é staff
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND user_type = 'staff'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Verificar se usuário tem uma permissão específica
CREATE OR REPLACE FUNCTION has_permission(required_permission TEXT)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- POLICIES: ROLES (todos podem ler)
-- ============================================

CREATE POLICY "Roles são públicas para leitura"
  ON roles FOR SELECT
  USING (TRUE);

-- ============================================
-- POLICIES: PROFILES
-- ============================================

-- Usuário vê próprio perfil
CREATE POLICY "Usuário vê próprio perfil"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Staff vê perfis da mesma academia
CREATE POLICY "Staff vê perfis da mesma academia"
  ON profiles FOR SELECT
  USING (
    is_staff() AND
    EXISTS (
      SELECT 1 FROM academy_memberships am
      WHERE am.profile_id = profiles.id
        AND am.academy_id = ANY(get_user_academy_ids())
    )
  );

-- Usuário edita próprio perfil (campos básicos)
CREATE POLICY "Usuário edita próprio perfil"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- POLICIES: ACADEMIES
-- ============================================

-- Usuário vê apenas academias que pertence
CREATE POLICY "Usuário vê suas academias"
  ON academies FOR SELECT
  USING (id = ANY(get_user_academy_ids()));

-- Apenas admin pode editar academy
CREATE POLICY "Admin edita academia"
  ON academies FOR UPDATE
  USING (
    id = ANY(get_user_academy_ids()) AND
    has_permission('settings:edit_academy')
  );

-- ============================================
-- POLICIES: UNITS
-- ============================================

-- Usuário vê unidades das suas academias
CREATE POLICY "Usuário vê unidades das suas academias"
  ON units FOR SELECT
  USING (academy_id = ANY(get_user_academy_ids()));

-- Staff com permissão gerencia unidades
CREATE POLICY "Staff gerencia unidades"
  ON units FOR ALL
  USING (
    academy_id = ANY(get_user_academy_ids()) AND
    has_permission('settings:manage_units')
  );

-- ============================================
-- POLICIES: ACADEMY_MEMBERSHIPS
-- ============================================

-- Usuário vê próprias memberships
CREATE POLICY "Usuário vê próprias memberships"
  ON academy_memberships FOR SELECT
  USING (profile_id = auth.uid());

-- Staff vê memberships da academia
CREATE POLICY "Staff vê memberships da academia"
  ON academy_memberships FOR SELECT
  USING (
    is_staff() AND
    academy_id = ANY(get_user_academy_ids())
  );

-- ============================================
-- POLICIES: STAFF_PROFILES
-- ============================================

-- Staff vê próprio perfil de staff
CREATE POLICY "Staff vê próprio perfil"
  ON staff_profiles FOR SELECT
  USING (id = auth.uid());

-- Admin vê staff da academia
CREATE POLICY "Admin vê staff da academia"
  ON staff_profiles FOR SELECT
  USING (
    has_permission('settings:manage_team') AND
    EXISTS (
      SELECT 1 FROM academy_memberships am
      WHERE am.profile_id = staff_profiles.id
        AND am.academy_id = ANY(get_user_academy_ids())
    )
  );

-- ============================================
-- POLICIES: STUDENT_PROFILES
-- ============================================

-- Aluno vê próprio perfil
CREATE POLICY "Aluno vê próprio perfil"
  ON student_profiles FOR SELECT
  USING (id = auth.uid());

-- Staff vê alunos da academia
CREATE POLICY "Staff vê alunos da academia"
  ON student_profiles FOR SELECT
  USING (
    is_staff() AND
    has_permission('users:view') AND
    EXISTS (
      SELECT 1 FROM academy_memberships am
      WHERE am.profile_id = student_profiles.id
        AND am.academy_id = ANY(get_user_academy_ids())
    )
  );

-- Staff edita alunos
CREATE POLICY "Staff edita alunos"
  ON student_profiles FOR UPDATE
  USING (
    is_staff() AND
    has_permission('users:edit') AND
    EXISTS (
      SELECT 1 FROM academy_memberships am
      WHERE am.profile_id = student_profiles.id
        AND am.academy_id = ANY(get_user_academy_ids())
    )
  );

-- ============================================
-- POLICIES: INVITES
-- ============================================

-- Qualquer um pode ler convite válido (para cadastro)
CREATE POLICY "Convites pendentes são públicos"
  ON invites FOR SELECT
  USING (status = 'pending' AND expires_at > NOW());

-- Staff cria convites
CREATE POLICY "Staff cria convites"
  ON invites FOR INSERT
  WITH CHECK (
    is_staff() AND
    academy_id = ANY(get_user_academy_ids())
  );

-- Staff vê convites da academia
CREATE POLICY "Staff vê convites da academia"
  ON invites FOR SELECT
  USING (
    is_staff() AND
    academy_id = ANY(get_user_academy_ids())
  );

-- ============================================
-- POLICIES: UNIT ASSIGNMENTS
-- ============================================

CREATE POLICY "Staff vê próprias unit assignments"
  ON staff_unit_assignments FOR SELECT
  USING (staff_id = auth.uid());

CREATE POLICY "Aluno vê próprias unit assignments"
  ON student_unit_assignments FOR SELECT
  USING (student_id = auth.uid());
