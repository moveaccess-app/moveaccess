-- ============================================
-- ACADEMY MEMBERSHIPS (N:N - Usuário pode pertencer a múltiplas academias)
-- ============================================

CREATE TABLE academy_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relacionamentos
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  
  -- Qual é a academia principal/padrão para este usuário
  is_primary BOOLEAN DEFAULT FALSE,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(profile_id, academy_id)
);

-- Índices
CREATE INDEX idx_academy_memberships_profile ON academy_memberships(profile_id);
CREATE INDEX idx_academy_memberships_academy ON academy_memberships(academy_id);
CREATE INDEX idx_academy_memberships_primary ON academy_memberships(profile_id, is_primary) WHERE is_primary = TRUE;

-- ============================================
-- FUNÇÃO: Garantir apenas uma academia primária por usuário
-- ============================================

CREATE OR REPLACE FUNCTION ensure_single_primary_academy()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER academy_memberships_ensure_primary
  BEFORE INSERT OR UPDATE ON academy_memberships
  FOR EACH ROW
  WHEN (NEW.is_primary = TRUE)
  EXECUTE FUNCTION ensure_single_primary_academy();

COMMENT ON TABLE academy_memberships IS 'Relacionamento N:N entre usuários e academias';
COMMENT ON COLUMN academy_memberships.is_primary IS 'Academia principal/padrão do usuário';
