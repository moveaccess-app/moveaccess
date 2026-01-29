-- =============================================================================
-- Migration: Multi-tenant Setup for Staff
-- Aplicada em: STG (DEV) - 27/01/2026
-- Objetivo: Ajustar multi-tenant para funcionar com isolamento por academia
-- =============================================================================

-- =============================================================================
-- PARTE 1: Dados de Teste (Academy B + Usuários)
-- =============================================================================

-- 1. Criar segunda academia (Academy B)
INSERT INTO academies (id, trade_name, legal_name, cnpj, email)
VALUES (
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'Gym Elite',
  'Gym Elite LTDA',
  '98765432000199',
  'contato@gymelite.com'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Vincular admin existente à Academy A
INSERT INTO academy_memberships (profile_id, academy_id, is_primary)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  true
)
ON CONFLICT (profile_id, academy_id) DO NOTHING;

-- 3. Vincular aluno3 à Academy A
INSERT INTO academy_memberships (profile_id, academy_id, is_primary)
VALUES (
  'ddb53109-ef49-427c-8fc0-389f1ad8d79f'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  true
)
ON CONFLICT (profile_id, academy_id) DO NOTHING;

-- =============================================================================
-- PARTE 2: Usuários da Academy B
-- =============================================================================

-- Staff B (auth.users)
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'staff.b@gymelite.com',
  crypt('StaffB123!', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Staff Gym Elite"}'::jsonb,
  'authenticated', 'authenticated', now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- Profile Staff B
INSERT INTO profiles (id, user_type, name, email)
VALUES ('00000000-0000-0000-0000-000000000002'::uuid, 'staff', 'Staff Gym Elite', 'staff.b@gymelite.com')
ON CONFLICT (id) DO NOTHING;

-- Staff Profile B
INSERT INTO staff_profiles (id, role, status, custom_permissions)
VALUES ('00000000-0000-0000-0000-000000000002'::uuid, 'admin', 'active', ARRAY['*'])
ON CONFLICT (id) DO NOTHING;

-- Membership Staff B -> Academy B
INSERT INTO academy_memberships (profile_id, academy_id, is_primary)
VALUES ('00000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid, true)
ON CONFLICT (profile_id, academy_id) DO NOTHING;

-- Aluno B (auth.users)
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'aluno.b@gymelite.com',
  crypt('AlunoB123!', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Aluno Gym Elite"}'::jsonb,
  'authenticated', 'authenticated', now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- Profile Aluno B
INSERT INTO profiles (id, user_type, name, email, cpf)
VALUES ('00000000-0000-0000-0000-000000000003'::uuid, 'student', 'Aluno Gym Elite', 'aluno.b@gymelite.com', '99988877766')
ON CONFLICT (id) DO NOTHING;

-- Student Profile B
INSERT INTO student_profiles (id, status, plan_status)
VALUES ('00000000-0000-0000-0000-000000000003'::uuid, 'active', 'active')
ON CONFLICT (id) DO NOTHING;

-- Membership Aluno B -> Academy B
INSERT INTO academy_memberships (profile_id, academy_id, is_primary)
VALUES ('00000000-0000-0000-0000-000000000003'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid, true)
ON CONFLICT (profile_id, academy_id) DO NOTHING;

-- =============================================================================
-- PARTE 3: Unidades para teste
-- =============================================================================

-- Unidades da Academy A
INSERT INTO units (academy_id, name, status, email)
VALUES ('a0000000-0000-0000-0000-000000000001'::uuid, 'Move Fitness - Centro', 'active', 'centro@movefitness.com')
ON CONFLICT DO NOTHING;

INSERT INTO units (academy_id, name, status, email)
VALUES ('a0000000-0000-0000-0000-000000000001'::uuid, 'Move Fitness - Zona Sul', 'active', 'zonasul@movefitness.com')
ON CONFLICT DO NOTHING;

-- Unidade da Academy B
INSERT INTO units (academy_id, name, status, email)
VALUES ('b0000000-0000-0000-0000-000000000002'::uuid, 'Gym Elite - Shopping', 'active', 'shopping@gymelite.com')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- PARTE 4: Atualizar view my_profile com academy_ids
-- =============================================================================

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
  (SELECT array_agg(am.academy_id) FROM academy_memberships am WHERE am.profile_id = p.id) as academy_ids,
  (SELECT jsonb_agg(jsonb_build_object('id', a.id, 'name', a.trade_name, 'is_primary', am.is_primary))
   FROM academy_memberships am JOIN academies a ON a.id = am.academy_id WHERE am.profile_id = p.id) as academies
FROM profiles p
LEFT JOIN staff_profiles sp ON sp.id = p.id AND p.user_type = 'staff'
LEFT JOIN student_profiles stu ON stu.id = p.id AND p.user_type = 'student'
WHERE p.id = auth.uid();

GRANT SELECT ON my_profile TO authenticated;
