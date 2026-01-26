-- ============================================
-- ACADEMIES (Tenant Principal)
-- ============================================

CREATE TABLE academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados básicos
  trade_name TEXT NOT NULL,                    -- Nome fantasia
  legal_name TEXT,                             -- Razão social
  cnpj TEXT UNIQUE,                            -- CNPJ (único)
  
  -- Contato
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  
  -- Endereço (JSONB para flexibilidade)
  address JSONB DEFAULT '{}',
  
  -- Logo
  logo_url TEXT,
  
  -- Preferências (idioma, timezone, moeda, formato de data)
  preferences JSONB DEFAULT '{
    "language": "pt-BR",
    "timezone": "America/Sao_Paulo",
    "currency": "BRL",
    "dateFormat": "DD/MM/YYYY"
  }',
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_academies_cnpj ON academies(cnpj) WHERE cnpj IS NOT NULL;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER academies_updated_at
  BEFORE UPDATE ON academies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE academies IS 'Tenant principal - cada academia é um tenant isolado';
COMMENT ON COLUMN academies.trade_name IS 'Nome fantasia da academia';
COMMENT ON COLUMN academies.preferences IS 'Configurações de localização e preferências';
