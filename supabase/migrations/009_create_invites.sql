-- ============================================
-- INVITES (Convites para cadastro via link)
-- ============================================

CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Token único para URL (ex: /cadastro/{token})
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Contexto do convite
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  
  -- Tipo de convite
  invite_type user_type NOT NULL DEFAULT 'student',
  
  -- Para staff: qual role terá
  staff_role role_id,
  
  -- Status
  status invite_status DEFAULT 'pending',
  
  -- Validade
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Desconto (para alunos)
  discount JSONB,  -- { type: 'percentage'|'fixed', value: number, appliesTo: string }
  
  -- Rastreamento
  created_by UUID REFERENCES profiles(id),
  opened_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  -- Resultado
  created_profile_id UUID REFERENCES profiles(id),
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_invites_academy ON invites(academy_id);
CREATE INDEX idx_invites_status ON invites(status);
CREATE INDEX idx_invites_expires ON invites(expires_at) WHERE status = 'pending';

-- ============================================
-- FUNÇÃO: Verificar se convite é válido
-- ============================================

CREATE OR REPLACE FUNCTION is_invite_valid(invite_token TEXT)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE invites IS 'Convites para cadastro de staff ou alunos via link';
COMMENT ON COLUMN invites.token IS 'Token único usado na URL de cadastro';
