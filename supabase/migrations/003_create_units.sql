-- ============================================
-- UNITS (Unidades da Academia)
-- ============================================

CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  
  -- Dados básicos
  name TEXT NOT NULL,
  status unit_status DEFAULT 'active',
  
  -- Contato
  phone TEXT,
  email TEXT,
  
  -- Endereço
  address JSONB DEFAULT '{}',
  
  -- Horário de funcionamento (array de objetos por dia da semana)
  operating_hours JSONB DEFAULT '[]',
  
  -- Configuração de acesso
  access_config JSONB DEFAULT '{
    "qrEnabled": true,
    "dailyLimitDefault": 1,
    "requireOtpNewDevice": true,
    "toleranceMinutes": 15
  }',
  
  -- QR Token (gerado para cada unidade)
  qr_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_units_academy ON units(academy_id);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_units_qr_token ON units(qr_token);

-- Trigger updated_at
CREATE TRIGGER units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE units IS 'Unidades físicas de uma academia';
COMMENT ON COLUMN units.qr_token IS 'Token único para geração de QR Code de acesso';
