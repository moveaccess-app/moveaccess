-- ============================================================
-- PR 20 — Add DELETE policy for plan_access_rules
-- ============================================================
-- Enables staff to remove access restrictions (= set plan to free access)
-- Follows the same RLS pattern used for SELECT/INSERT/UPDATE.
-- ============================================================

CREATE POLICY "Staff delete plan access rules in academy"
ON public.plan_access_rules
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = plan_access_rules.academy_id
  )
);
