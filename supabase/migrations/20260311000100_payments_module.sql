-- PAYMENTS MODULE
-- Mission #11: minimal financial base for subscriptions

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'pending',
  method text NOT NULL DEFAULT 'manual',
  reference text NULL,
  due_date timestamptz NOT NULL,
  paid_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_amount_check CHECK (amount >= 0),
  CONSTRAINT payments_status_check CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  CONSTRAINT payments_method_check CHECK (method IN ('manual', 'pix', 'card', 'boleto')),
  CONSTRAINT payments_currency_check CHECK (char_length(trim(currency)) > 0),
  CONSTRAINT payments_paid_at_check CHECK (
    status <> 'paid' OR paid_at IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_payments_academy_id
  ON public.payments (academy_id);

CREATE INDEX IF NOT EXISTS idx_payments_subscription_id
  ON public.payments (subscription_id);

CREATE INDEX IF NOT EXISTS idx_payments_student_id
  ON public.payments (student_id);

CREATE INDEX IF NOT EXISTS idx_payments_status
  ON public.payments (status);

CREATE INDEX IF NOT EXISTS idx_payments_due_date
  ON public.payments (due_date);

CREATE INDEX IF NOT EXISTS idx_payments_academy_status_due_date
  ON public.payments (academy_id, status, due_date);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff view payments in academy" ON public.payments;
CREATE POLICY "Staff view payments in academy"
ON public.payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = payments.academy_id
  )
);

DROP POLICY IF EXISTS "Staff insert payments in academy" ON public.payments;
CREATE POLICY "Staff insert payments in academy"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = payments.academy_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.id = payments.subscription_id
      AND s.student_id = payments.student_id
      AND s.academy_id = payments.academy_id
  )
);

DROP POLICY IF EXISTS "Staff update payments in academy" ON public.payments;
CREATE POLICY "Staff update payments in academy"
ON public.payments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = payments.academy_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = payments.academy_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.id = payments.subscription_id
      AND s.student_id = payments.student_id
      AND s.academy_id = payments.academy_id
  )
);

REVOKE ALL ON public.payments FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated, service_role;
