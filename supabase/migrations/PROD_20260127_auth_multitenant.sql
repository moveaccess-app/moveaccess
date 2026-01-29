-- =============================================================================
-- Migration: PROD - Auth + Multi-tenant Setup
-- Data: 27/01/2026
-- Descrição: Aplicar todas as estruturas de auth e multi-tenant no PROD
-- =============================================================================

-- IMPORTANTE: Este arquivo assume que as migrations 001-018 já foram aplicadas
-- Se não foram, aplicar primeiro as migrations do repositório supabase/migrations/

-- =============================================================================
-- PARTE 1: Atualizar view my_profile para incluir academy_ids
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
  -- Staff fields (flattened)
  sp.role,
  sp.status as staff_status,
  sp.custom_permissions,
  sp.last_login_at,
  -- Student fields (flattened)
  stu.status as student_status,
  stu.registration_id,
  stu.plan_name,
  stu.plan_status,
  stu.plan_expires_at,
  -- Academy info (array de IDs e nomes)
  (
    SELECT array_agg(am.academy_id)
    FROM academy_memberships am
    WHERE am.profile_id = p.id
  ) as academy_ids,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'id', a.id,
      'name', a.trade_name,
      'is_primary', am.is_primary
    ))
    FROM academy_memberships am
    JOIN academies a ON a.id = am.academy_id
    WHERE am.profile_id = p.id
  ) as academies
FROM profiles p
LEFT JOIN staff_profiles sp ON sp.id = p.id AND p.user_type = 'staff'
LEFT JOIN student_profiles stu ON stu.id = p.id AND p.user_type = 'student'
WHERE p.id = auth.uid();

-- Garantir que a view respeita RLS
GRANT SELECT ON my_profile TO authenticated;

-- =============================================================================
-- PARTE 2: Vincular usuário admin à academy existente (PROD)
-- AJUSTAR O ID conforme o admin real do PROD
-- =============================================================================

-- Vincular admin do PROD à primeira academy
-- NOTA: Substituir '00000000-0000-0000-0000-000000000001' pelo ID real do admin no PROD
-- NOTA: Substituir 'a0000000-0000-0000-0000-000000000001' pelo ID real da academy no PROD

-- Descomentar e ajustar IDs antes de executar:
/*
INSERT INTO academy_memberships (profile_id, academy_id, is_primary)
SELECT 
  (SELECT id FROM profiles WHERE user_type = 'staff' LIMIT 1),
  (SELECT id FROM academies LIMIT 1),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM academy_memberships 
  WHERE profile_id = (SELECT id FROM profiles WHERE user_type = 'staff' LIMIT 1)
);
*/

-- =============================================================================
-- VERIFICAÇÕES PÓS-MIGRATION
-- =============================================================================

-- 1. Verificar se view my_profile existe
SELECT 'View my_profile criada' as status 
WHERE EXISTS (
  SELECT 1 FROM information_schema.views 
  WHERE table_name = 'my_profile'
);

-- 2. Verificar se academy_ids está presente
SELECT 'Campo academy_ids presente' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'my_profile' AND column_name = 'academy_ids'
);

-- 3. Contar usuários sem vínculo (deveria ser 0)
SELECT 
  COUNT(*) as usuarios_sem_academy,
  'ATENÇÃO: Vincular estes usuários a uma academy!' as acao
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM academy_memberships am 
  WHERE am.profile_id = p.id
);
