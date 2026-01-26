-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View completa do perfil do usuário atual
CREATE OR REPLACE VIEW my_profile AS
SELECT 
  p.*,
  CASE 
    WHEN p.user_type = 'staff' THEN to_jsonb(sp.*)
    ELSE NULL
  END as staff_data,
  CASE 
    WHEN p.user_type = 'student' THEN to_jsonb(stp.*)
    ELSE NULL
  END as student_data,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'academy_id', am.academy_id,
      'is_primary', am.is_primary,
      'academy', jsonb_build_object(
        'id', a.id,
        'trade_name', a.trade_name,
        'logo_url', a.logo_url
      )
    ))
    FROM academy_memberships am
    JOIN academies a ON a.id = am.academy_id
    WHERE am.profile_id = p.id
  ) as academies
FROM profiles p
LEFT JOIN staff_profiles sp ON sp.id = p.id
LEFT JOIN student_profiles stp ON stp.id = p.id
WHERE p.id = auth.uid();

-- View de staff com role expandida
CREATE OR REPLACE VIEW staff_with_role AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.phone,
  p.avatar_url,
  sp.role,
  r.name as role_name,
  COALESCE(sp.custom_permissions, r.permissions) as permissions,
  sp.status,
  sp.last_login_at,
  (
    SELECT array_agg(unit_id) 
    FROM staff_unit_assignments sua 
    WHERE sua.staff_id = sp.id
  ) as unit_ids
FROM profiles p
JOIN staff_profiles sp ON sp.id = p.id
JOIN roles r ON r.id = sp.role;

-- View de alunos com status de acesso
CREATE OR REPLACE VIEW students_with_status AS
SELECT 
  p.id,
  p.name,
  p.email,
  p.phone,
  p.cpf,
  stp.registration_id,
  stp.status,
  stp.status_reason,
  stp.plan_name,
  stp.plan_status,
  stp.plan_expires_at,
  stp.created_at,
  -- Verifica se acesso é permitido
  CASE 
    WHEN stp.status != 'active' THEN FALSE
    WHEN stp.plan_status NOT IN ('active', 'pending') THEN FALSE
    ELSE TRUE
  END as access_allowed,
  (
    SELECT jsonb_agg(jsonb_build_object(
      'unit_id', sua.unit_id,
      'is_primary', sua.is_primary,
      'unit_name', u.name
    ))
    FROM student_unit_assignments sua
    JOIN units u ON u.id = sua.unit_id
    WHERE sua.student_id = stp.id
  ) as units
FROM profiles p
JOIN student_profiles stp ON stp.id = p.id;

COMMENT ON VIEW my_profile IS 'Perfil completo do usuário autenticado';
COMMENT ON VIEW staff_with_role IS 'Lista de staff com roles e permissões expandidas';
COMMENT ON VIEW students_with_status IS 'Lista de alunos com status de acesso calculado';
