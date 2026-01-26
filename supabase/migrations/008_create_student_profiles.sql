-- ============================================
-- STUDENT PROFILES (Extensão para alunos)
-- ============================================

CREATE TABLE student_profiles (
  -- ID = profiles.id (1:1)
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Matrícula (gerada automaticamente)
  registration_id TEXT UNIQUE,
  
  -- Status
  status student_status DEFAULT 'pending',
  status_reason TEXT,
  status_since TIMESTAMPTZ DEFAULT NOW(),
  
  -- Dados pessoais
  birth_date DATE,
  address JSONB DEFAULT '{}',
  emergency_contact JSONB DEFAULT '{}',
  
  -- Origem do cadastro
  registration_origin TEXT DEFAULT 'app',  -- academy, app, website, migration
  
  -- Snapshot do plano ativo (desnormalizado para consulta rápida)
  plan_name TEXT,
  plan_status plan_status,
  plan_expires_at TIMESTAMPTZ,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_student_profiles_registration ON student_profiles(registration_id);
CREATE INDEX idx_student_profiles_status ON student_profiles(status);
CREATE INDEX idx_student_profiles_plan_status ON student_profiles(plan_status);

-- Trigger updated_at
CREATE TRIGGER student_profiles_updated_at
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STUDENT UNIT ASSIGNMENTS (Aluno pode acessar múltiplas unidades)
-- ============================================

CREATE TABLE student_unit_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  
  -- Unidade principal
  is_primary BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, unit_id)
);

CREATE INDEX idx_student_unit_assignments_student ON student_unit_assignments(student_id);
CREATE INDEX idx_student_unit_assignments_unit ON student_unit_assignments(unit_id);

-- Trigger para garantir apenas uma unidade primária
CREATE OR REPLACE FUNCTION ensure_single_primary_unit()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_unit_ensure_primary
  BEFORE INSERT OR UPDATE ON student_unit_assignments
  FOR EACH ROW
  WHEN (NEW.is_primary = TRUE)
  EXECUTE FUNCTION ensure_single_primary_unit();

-- ============================================
-- FUNÇÃO: Gerar matrícula automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION generate_registration_id()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_profiles_generate_registration
  BEFORE INSERT ON student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_registration_id();

COMMENT ON TABLE student_profiles IS 'Dados específicos de alunos (extensão de profiles)';
COMMENT ON COLUMN student_profiles.registration_id IS 'Matrícula no formato ALU-YYYY-NNNN';
