-- Home dashboard overview (Mission #5)
-- Aggregates KPIs + actionable alerts scoped to staff academy tenancy

CREATE INDEX IF NOT EXISTS idx_academy_memberships_academy_profile
  ON public.academy_memberships (academy_id, profile_id);

CREATE INDEX IF NOT EXISTS idx_student_drafts_academy_status_updated
  ON public.student_drafts (academy_id, status, updated_at);

CREATE INDEX IF NOT EXISTS idx_invite_links_academy_status_expires_created
  ON public.invite_links (academy_id, status, expires_at, created_at);

CREATE INDEX IF NOT EXISTS idx_units_academy_status
  ON public.units (academy_id, status);

CREATE OR REPLACE FUNCTION public.get_home_overview()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_academy_id uuid;
  v_academy_name text;

  v_total_students integer := 0;
  v_active_students integer := 0;
  v_open_drafts integer := 0;
  v_pending_invites integer := 0;
  v_active_units integer := 0;

  v_old_drafts_count integer := 0;
  v_expiring_invites_count integer := 0;
  v_stale_invites_count integer := 0;
  v_non_active_students_count integer := 0;
  v_inactive_units_count integer := 0;

  v_alerts jsonb := '[]'::jsonb;
BEGIN
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'UNAUTHENTICATED'
    );
  END IF;

  IF NOT public.is_staff() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'FORBIDDEN'
    );
  END IF;

  SELECT am.academy_id
  INTO v_academy_id
  FROM public.academy_memberships am
  WHERE am.profile_id = v_actor
  ORDER BY am.is_primary DESC, am.created_at ASC
  LIMIT 1;

  IF v_academy_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'ACADEMY_NOT_FOUND'
    );
  END IF;

  SELECT a.trade_name
  INTO v_academy_name
  FROM public.academies a
  WHERE a.id = v_academy_id;

  SELECT COUNT(DISTINCT am.profile_id)
  INTO v_total_students
  FROM public.academy_memberships am
  JOIN public.profiles p ON p.id = am.profile_id
  WHERE am.academy_id = v_academy_id
    AND p.user_type = 'student';

  SELECT COUNT(DISTINCT am.profile_id)
  INTO v_active_students
  FROM public.academy_memberships am
  JOIN public.profiles p ON p.id = am.profile_id
  JOIN public.student_profiles sp ON sp.id = p.id
  WHERE am.academy_id = v_academy_id
    AND p.user_type = 'student'
    AND sp.status = 'active';

  SELECT COUNT(*)
  INTO v_open_drafts
  FROM public.student_drafts sd
  WHERE sd.academy_id = v_academy_id
    AND sd.status NOT IN ('published', 'archived');

  SELECT COUNT(*)
  INTO v_pending_invites
  FROM public.invite_links il
  WHERE il.academy_id = v_academy_id
    AND il.status = 'active'
    AND il.expires_at > now();

  SELECT COUNT(*)
  INTO v_active_units
  FROM public.units u
  WHERE u.academy_id = v_academy_id
    AND COALESCE(u.status::text, 'active') = 'active';

  SELECT COUNT(*)
  INTO v_old_drafts_count
  FROM public.student_drafts sd
  WHERE sd.academy_id = v_academy_id
    AND sd.status IN ('in_progress', 'completed')
    AND sd.updated_at < now() - interval '2 days';

  SELECT COUNT(*)
  INTO v_expiring_invites_count
  FROM public.invite_links il
  WHERE il.academy_id = v_academy_id
    AND il.status = 'active'
    AND il.expires_at > now()
    AND il.expires_at <= now() + interval '48 hours';

  SELECT COUNT(*)
  INTO v_stale_invites_count
  FROM public.invite_links il
  WHERE il.academy_id = v_academy_id
    AND il.status = 'active'
    AND il.created_at < now() - interval '7 days';

  SELECT COUNT(DISTINCT am.profile_id)
  INTO v_non_active_students_count
  FROM public.academy_memberships am
  JOIN public.profiles p ON p.id = am.profile_id
  JOIN public.student_profiles sp ON sp.id = p.id
  WHERE am.academy_id = v_academy_id
    AND p.user_type = 'student'
    AND sp.status IN ('pending', 'inactive', 'suspended', 'blocked');

  SELECT COUNT(*)
  INTO v_inactive_units_count
  FROM public.units u
  WHERE u.academy_id = v_academy_id
    AND COALESCE(u.status::text, 'active') IN ('inactive', 'maintenance');

  SELECT COALESCE(jsonb_agg(alert_item ORDER BY priority), '[]'::jsonb)
  INTO v_alerts
  FROM (
    SELECT
      1 AS priority,
      jsonb_build_object(
        'id', 'old-drafts',
        'type', 'system',
        'severity', CASE WHEN v_old_drafts_count >= 5 THEN 'critical' ELSE 'warning' END,
        'title', v_old_drafts_count || ' rascunho(s) pendente(s)',
        'description', 'Rascunhos sem atualização há mais de 2 dias.',
        'actionLabel', 'Abrir onboarding',
        'actionHref', '/users/onboarding',
        'count', v_old_drafts_count,
        'timestamp', now()
      ) AS alert_item
    WHERE v_old_drafts_count > 0

    UNION ALL

    SELECT
      2 AS priority,
      jsonb_build_object(
        'id', 'expiring-invites',
        'type', 'system',
        'severity', 'warning',
        'title', v_expiring_invites_count || ' convite(s) expira(m) em 48h',
        'description', 'Convites ativos próximos da expiração.',
        'actionLabel', 'Ver alunos',
        'actionHref', '/users',
        'count', v_expiring_invites_count,
        'timestamp', now()
      ) AS alert_item
    WHERE v_expiring_invites_count > 0

    UNION ALL

    SELECT
      3 AS priority,
      jsonb_build_object(
        'id', 'stale-invites',
        'type', 'system',
        'severity', 'warning',
        'title', v_stale_invites_count || ' convite(s) ativo(s) há mais de 7 dias',
        'description', 'Convites enviados que ainda não foram utilizados.',
        'actionLabel', 'Ver alunos',
        'actionHref', '/users',
        'count', v_stale_invites_count,
        'timestamp', now()
      ) AS alert_item
    WHERE v_stale_invites_count > 0

    UNION ALL

    SELECT
      4 AS priority,
      jsonb_build_object(
        'id', 'students-non-active',
        'type', 'access',
        'severity', CASE WHEN v_non_active_students_count >= 10 THEN 'critical' ELSE 'warning' END,
        'title', v_non_active_students_count || ' aluno(s) não ativo(s)',
        'description', 'Alunos com status pending/inactive/suspended/blocked.',
        'actionLabel', 'Ver alunos',
        'actionHref', '/users',
        'count', v_non_active_students_count,
        'timestamp', now()
      ) AS alert_item
    WHERE v_non_active_students_count > 0

    UNION ALL

    SELECT
      5 AS priority,
      jsonb_build_object(
        'id', 'inactive-units',
        'type', 'system',
        'severity', 'warning',
        'title', v_inactive_units_count || ' unidade(s) inativa(s)',
        'description', 'Unidades com status inactive ou maintenance.',
        'actionLabel', 'Ver unidades',
        'actionHref', '/settings/units',
        'count', v_inactive_units_count,
        'timestamp', now()
      ) AS alert_item
    WHERE v_inactive_units_count > 0
  ) alerts;

  RETURN jsonb_build_object(
    'success', true,
    'academy_id', v_academy_id,
    'academy_name', v_academy_name,
    'kpis', jsonb_build_object(
      'total_students', v_total_students,
      'active_students', v_active_students,
      'open_drafts', v_open_drafts,
      'pending_invites', v_pending_invites,
      'active_units', v_active_units
    ),
    'alerts', v_alerts
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_home_overview() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_home_overview() FROM anon;
REVOKE ALL ON FUNCTION public.get_home_overview() FROM authenticated;
REVOKE ALL ON FUNCTION public.get_home_overview() FROM service_role;

GRANT EXECUTE ON FUNCTION public.get_home_overview() TO authenticated, service_role;
