-- =============================================================================
-- Migration: Academy Self-Service Signup
-- PR 21+22 — Jornada 1: "Abrir academia e operar em 1 dia"
--
-- Adds:
--   1. setup_completed + setup_step columns to academies
--   2. Updated my_profile view with setup_completed
--   3. RLS policies for new signup flow
-- =============================================================================

-- -------------------------------------------------------
-- 1. Add setup columns to academies
-- -------------------------------------------------------
ALTER TABLE academies
  ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS setup_step SMALLINT DEFAULT 0;

-- Mark ALL existing academies as completed (they were set up manually)
UPDATE academies SET setup_completed = TRUE, setup_step = 5
WHERE setup_completed = FALSE OR setup_completed IS NULL;

-- -------------------------------------------------------
-- 2. Recreate my_profile view with setup_completed
-- -------------------------------------------------------
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
  sp.status AS staff_status,
  sp.custom_permissions,
  sp.last_login_at,
  -- Student fields
  stu.status AS student_status,
  stu.registration_id,
  stu.plan_name,
  stu.plan_status,
  stu.plan_expires_at,
  -- Academy info
  (SELECT array_agg(am.academy_id)
     FROM academy_memberships am
    WHERE am.profile_id = p.id) AS academy_ids,
  (SELECT jsonb_agg(jsonb_build_object(
            'id', a.id,
            'name', a.trade_name,
            'is_primary', am.is_primary))
     FROM academy_memberships am
     JOIN academies a ON a.id = am.academy_id
    WHERE am.profile_id = p.id) AS academies,
  -- Setup status (from primary academy)
  (SELECT a.setup_completed
     FROM academy_memberships am
     JOIN academies a ON a.id = am.academy_id
    WHERE am.profile_id = p.id AND am.is_primary = TRUE
    LIMIT 1) AS setup_completed,
  (SELECT a.setup_step
     FROM academy_memberships am
     JOIN academies a ON a.id = am.academy_id
    WHERE am.profile_id = p.id AND am.is_primary = TRUE
    LIMIT 1) AS setup_step
FROM profiles p
LEFT JOIN staff_profiles sp ON sp.id = p.id AND p.user_type = 'staff'
LEFT JOIN student_profiles stu ON stu.id = p.id AND p.user_type = 'student'
WHERE p.id = auth.uid();

GRANT SELECT ON my_profile TO authenticated;
