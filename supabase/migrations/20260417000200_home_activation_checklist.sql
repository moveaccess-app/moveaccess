-- =============================================================================
-- Migration: Home Activation Checklist
-- PR 23 — Jornada 1: Home Inteligente de Ativação
--
-- Extends get_home_overview() to return activation checklist counts
-- so the frontend can detect academy maturity and show activation guide
-- =============================================================================

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
  v_setup_completed boolean;

  -- KPIs
  v_total_students integer := 0;
  v_active_students integer := 0;
  v_open_drafts integer := 0;
  v_pending_invites integer := 0;
  v_active_units integer := 0;

  -- Alert counts
  v_old_drafts_count integer := 0;
  v_expiring_invites_count integer := 0;
  v_stale_invites_count integer := 0;
  v_non_active_students_count integer := 0;
  v_inactive_units_count integer := 0;

  -- Activation checklist counts
  v_plans_count integer := 0;
  v_published_contracts_count integer := 0;
  v_students_count integer := 0;
  v_checkins_count integer := 0;
  v_paid_payments_count integer := 0;
  v_billing_configured boolean := false;

  -- Financial KPIs
  v_pending_payments_count integer := 0;
  v_month_revenue numeric := 0;
  v_overdue_students_count integer := 0;
  v_checkins_today integer := 0;
  v_new_students_month integer := 0;

  v_alerts jsonb := '[]'::jsonb;
BEGIN
  -- Auth checks
  IF v_actor IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNAUTHENTICATED');
  END IF;

  IF NOT public.is_staff() THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'FORBIDDEN');
  END IF;

  -- Get academy
  SELECT am.academy_id
  INTO v_academy_id
  FROM public.academy_memberships am
  WHERE am.profile_id = v_actor
  ORDER BY am.is_primary DESC, am.created_at ASC
  LIMIT 1;

  IF v_academy_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'ACADEMY_NOT_FOUND');
  END IF;

  SELECT a.trade_name, COALESCE(a.setup_completed, true)
  INTO v_academy_name, v_setup_completed
  FROM public.academies a
  WHERE a.id = v_academy_id;

  -- =========================================================================
  -- EXISTING KPIs (preserved from original)
  -- =========================================================================

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

  -- =========================================================================
  -- ACTIVATION CHECKLIST COUNTS
  -- =========================================================================

  -- Active plans
  SELECT COUNT(*)
  INTO v_plans_count
  FROM public.plans p
  WHERE p.academy_id = v_academy_id
    AND p.status = 'active';

  -- Published contract templates
  SELECT COUNT(*)
  INTO v_published_contracts_count
  FROM public.contract_templates ct
  WHERE ct.academy_id = v_academy_id
    AND ct.status = 'published';

  -- Students count (total, already computed above)
  v_students_count := v_total_students;

  -- Check-in count (all time)
  SELECT COUNT(*)
  INTO v_checkins_count
  FROM public.access_logs al
  WHERE al.academy_id = v_academy_id;

  -- Paid payments count
  SELECT COUNT(*)
  INTO v_paid_payments_count
  FROM public.payments pm
  WHERE pm.academy_id = v_academy_id
    AND pm.status = 'paid';

  -- Billing configured (Asaas account exists and active)
  SELECT EXISTS (
    SELECT 1 FROM public.asaas_accounts aa
    WHERE aa.academy_id = v_academy_id
      AND aa.status = 'active'
      AND aa.api_key_reference IS NOT NULL
  ) INTO v_billing_configured;

  -- =========================================================================
  -- DASHBOARD KPIs (for mature academies)
  -- =========================================================================

  -- Pending payments
  SELECT COUNT(*)
  INTO v_pending_payments_count
  FROM public.payments pm
  WHERE pm.academy_id = v_academy_id
    AND pm.status = 'pending';

  -- Revenue this month
  SELECT COALESCE(SUM(pm.amount), 0)
  INTO v_month_revenue
  FROM public.payments pm
  WHERE pm.academy_id = v_academy_id
    AND pm.status = 'paid'
    AND pm.paid_at >= date_trunc('month', now());

  -- Overdue students (payments overdue > 0)
  SELECT COUNT(DISTINCT pm.student_id)
  INTO v_overdue_students_count
  FROM public.payments pm
  WHERE pm.academy_id = v_academy_id
    AND pm.status = 'pending'
    AND pm.due_date < now()::date;

  -- Check-ins today
  SELECT COUNT(*)
  INTO v_checkins_today
  FROM public.access_logs al
  WHERE al.academy_id = v_academy_id
    AND al.occurred_at >= date_trunc('day', now());

  -- New students this month
  SELECT COUNT(DISTINCT am.profile_id)
  INTO v_new_students_month
  FROM public.academy_memberships am
  JOIN public.profiles p ON p.id = am.profile_id
  WHERE am.academy_id = v_academy_id
    AND p.user_type = 'student'
    AND am.created_at >= date_trunc('month', now());

  -- =========================================================================
  -- ALERTS (preserved from original)
  -- =========================================================================

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
    SELECT 1 AS priority,
      jsonb_build_object(
        'id', 'old-drafts', 'type', 'system',
        'severity', CASE WHEN v_old_drafts_count >= 5 THEN 'critical' ELSE 'warning' END,
        'title', v_old_drafts_count || ' rascunho(s) pendente(s)',
        'description', 'Rascunhos sem atualização há mais de 2 dias.',
        'actionLabel', 'Abrir onboarding', 'actionHref', '/users/onboarding',
        'count', v_old_drafts_count, 'timestamp', now()
      ) AS alert_item
    WHERE v_old_drafts_count > 0

    UNION ALL

    SELECT 2 AS priority,
      jsonb_build_object(
        'id', 'expiring-invites', 'type', 'system',
        'severity', 'warning',
        'title', v_expiring_invites_count || ' convite(s) expira(m) em 48h',
        'description', 'Convites ativos próximos da expiração.',
        'actionLabel', 'Ver alunos', 'actionHref', '/users',
        'count', v_expiring_invites_count, 'timestamp', now()
      ) AS alert_item
    WHERE v_expiring_invites_count > 0

    UNION ALL

    SELECT 3 AS priority,
      jsonb_build_object(
        'id', 'stale-invites', 'type', 'system',
        'severity', 'warning',
        'title', v_stale_invites_count || ' convite(s) ativo(s) há mais de 7 dias',
        'description', 'Convites enviados que ainda não foram utilizados.',
        'actionLabel', 'Ver alunos', 'actionHref', '/users',
        'count', v_stale_invites_count, 'timestamp', now()
      ) AS alert_item
    WHERE v_stale_invites_count > 0

    UNION ALL

    SELECT 4 AS priority,
      jsonb_build_object(
        'id', 'students-non-active', 'type', 'access',
        'severity', CASE WHEN v_non_active_students_count >= 10 THEN 'critical' ELSE 'warning' END,
        'title', v_non_active_students_count || ' aluno(s) não ativo(s)',
        'description', 'Alunos com status pending/inactive/suspended/blocked.',
        'actionLabel', 'Ver alunos', 'actionHref', '/users',
        'count', v_non_active_students_count, 'timestamp', now()
      ) AS alert_item
    WHERE v_non_active_students_count > 0

    UNION ALL

    SELECT 5 AS priority,
      jsonb_build_object(
        'id', 'inactive-units', 'type', 'system',
        'severity', 'warning',
        'title', v_inactive_units_count || ' unidade(s) inativa(s)',
        'description', 'Unidades com status inactive ou maintenance.',
        'actionLabel', 'Ver unidades', 'actionHref', '/settings/units',
        'count', v_inactive_units_count, 'timestamp', now()
      ) AS alert_item
    WHERE v_inactive_units_count > 0
  ) alerts;

  -- =========================================================================
  -- RETURN
  -- =========================================================================

  RETURN jsonb_build_object(
    'success', true,
    'academy_id', v_academy_id,
    'academy_name', v_academy_name,
    'setup_completed', v_setup_completed,
    'kpis', jsonb_build_object(
      'total_students', v_total_students,
      'active_students', v_active_students,
      'open_drafts', v_open_drafts,
      'pending_invites', v_pending_invites,
      'active_units', v_active_units
    ),
    'activation', jsonb_build_object(
      'has_unit', v_active_units > 0,
      'has_plan', v_plans_count > 0,
      'has_published_contract', v_published_contracts_count > 0,
      'has_student', v_students_count > 0,
      'has_checkin', v_checkins_count > 0,
      'has_payment', v_paid_payments_count > 0,
      'has_billing', v_billing_configured,
      'plans_count', v_plans_count,
      'students_count', v_students_count,
      'contracts_count', v_published_contracts_count,
      'checkins_count', v_checkins_count,
      'payments_count', v_paid_payments_count
    ),
    'dashboard', jsonb_build_object(
      'pending_payments', v_pending_payments_count,
      'month_revenue', v_month_revenue,
      'overdue_students', v_overdue_students_count,
      'checkins_today', v_checkins_today,
      'new_students_month', v_new_students_month
    ),
    'alerts', v_alerts
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_home_overview() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_home_overview() FROM anon;
