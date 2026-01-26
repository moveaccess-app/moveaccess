-- ============================================
-- SEED: Academia demo para desenvolvimento
-- ⚠️ Este seed é APENAS para DEV, não aplicar em PROD
-- ============================================

-- Inserir academia demo
INSERT INTO academies (id, trade_name, legal_name, cnpj, email, phone, whatsapp, address) 
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Move Fitness',
  'Move Academia e Fitness LTDA',
  '12.345.678/0001-90',
  'contato@movefitness.com.br',
  '(11) 3456-7890',
  '(11) 98765-4321',
  '{
    "street": "Av. Paulista",
    "number": "1000",
    "complement": "Sala 201",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310-100"
  }'::jsonb
);

-- Inserir unidades
INSERT INTO units (id, academy_id, name, status, phone, email, address) VALUES
(
  '11111111-1111-1111-1111-111111111111'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Unidade Centro',
  'active',
  '(11) 3456-7890',
  'centro@movefitness.com.br',
  '{
    "street": "Av. Paulista",
    "number": "1000",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310-100"
  }'::jsonb
),
(
  '22222222-2222-2222-2222-222222222222'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Unidade Jardins',
  'active',
  '(11) 3456-7891',
  'jardins@movefitness.com.br',
  '{
    "street": "Rua Oscar Freire",
    "number": "500",
    "neighborhood": "Jardins",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01426-001"
  }'::jsonb
);

-- Nota: Os usuários serão criados via auth.users (signup)
-- Use o dashboard Supabase ou a API para criar usuários de teste
