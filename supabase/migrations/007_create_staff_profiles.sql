-- ============================================
-- STAFF PROFILES (Extensão para funcionários)
-- ============================================

CREATE TABLE staff_profiles (
  -- ID = profiles.id (1:1)
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Role
  role role_id NOT NULL DEFAULT 'receptionist',
  
  -- Status
  status staff_status DEFAULT 'pending',
  
  -- Permissões customizadas (sobrescreve role se preenchido)
  custom_permissions TEXT[],
  
  -- Login tracking
  last_login_at TIMESTAMPTZ,
  last_login_ip TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at
CREATE TRIGGER staff_profiles_updated_at
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- UNIT ASSIGNMENTS (Staff pode acessar múltiplas unidades)
-- ============================================

CREATE TABLE staff_unit_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  
  -- Se vazio = acesso a todas as unidades da academia
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(staff_id, unit_id)
);

CREATE INDEX idx_staff_unit_assignments_staff ON staff_unit_assignments(staff_id);
CREATE INDEX idx_staff_unit_assignments_unit ON staff_unit_assignments(unit_id);

COMMENT ON TABLE staff_profiles IS 'Dados específicos de funcionários (extensão de profiles)';
COMMENT ON TABLE staff_unit_assignments IS 'Unidades que o staff pode acessar (vazio = todas)';
