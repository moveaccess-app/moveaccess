-- ============================================
-- ROLES (Papéis e Permissões)
-- ============================================

CREATE TABLE roles (
  id role_id PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Permissões como array de strings (ex: 'users:read', 'access:checkin')
  permissions TEXT[] DEFAULT '{}',
  
  -- Roles do sistema não podem ser deletadas
  is_system BOOLEAN DEFAULT FALSE,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at
CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED: Roles padrão do sistema
-- ============================================

INSERT INTO roles (id, name, description, permissions, is_system) VALUES
(
  'admin',
  'Administrador',
  'Acesso total ao sistema, incluindo configurações e gestão de equipe',
  ARRAY[
    -- Acesso
    'access:view_log', 'access:manual_release', 'access:export', 'access:configure_qr',
    -- Usuários
    'users:view', 'users:create', 'users:edit', 'users:block', 'users:delete',
    -- Planos
    'plans:view', 'plans:create', 'plans:edit', 'plans:deactivate',
    -- Assinaturas
    'subscriptions:view', 'subscriptions:create', 'subscriptions:edit', 'subscriptions:cancel',
    -- Contratos
    'contracts:view', 'contracts:create', 'contracts:edit', 'contracts:publish', 'contracts:archive',
    -- Financeiro
    'financial:view', 'financial:mark_paid', 'financial:exempt', 'financial:export', 'financial:refund',
    -- Configurações
    'settings:view', 'settings:edit_academy', 'settings:manage_units', 'settings:manage_team', 
    'settings:manage_policies', 'settings:manage_integrations', 'settings:view_audit'
  ],
  TRUE
),
(
  'manager',
  'Gestor',
  'Gestão operacional completa, sem acesso a configurações sensíveis',
  ARRAY[
    'access:view_log', 'access:manual_release', 'access:export', 'access:configure_qr',
    'users:view', 'users:create', 'users:edit', 'users:block',
    'plans:view', 'plans:create', 'plans:edit',
    'subscriptions:view', 'subscriptions:create', 'subscriptions:edit', 'subscriptions:cancel',
    'contracts:view', 'contracts:create', 'contracts:edit', 'contracts:publish',
    'financial:view', 'financial:mark_paid', 'financial:export',
    'settings:view', 'settings:manage_units', 'settings:view_audit'
  ],
  TRUE
),
(
  'receptionist',
  'Recepção',
  'Atendimento ao cliente, check-in e cadastros básicos',
  ARRAY[
    'access:view_log', 'access:manual_release',
    'users:view', 'users:create', 'users:edit',
    'plans:view',
    'subscriptions:view', 'subscriptions:create',
    'contracts:view',
    'financial:view',
    'settings:view'
  ],
  TRUE
),
(
  'financial',
  'Financeiro',
  'Gestão financeira, cobranças e relatórios',
  ARRAY[
    'access:view_log',
    'users:view',
    'plans:view',
    'subscriptions:view',
    'contracts:view',
    'financial:view', 'financial:mark_paid', 'financial:exempt', 'financial:export', 'financial:refund',
    'settings:view'
  ],
  TRUE
),
(
  'readonly',
  'Somente Leitura',
  'Visualização apenas, sem permissão de edição',
  ARRAY[
    'access:view_log',
    'users:view',
    'plans:view',
    'subscriptions:view',
    'contracts:view',
    'financial:view',
    'settings:view'
  ],
  TRUE
);

COMMENT ON TABLE roles IS 'Papéis do sistema com permissões granulares';
COMMENT ON COLUMN roles.permissions IS 'Array de permissões no formato modulo:acao';
