-- ASAAS CUSTOMERS BASE
-- PR #2: student-to-customer link per Asaas account and environment

CREATE TABLE IF NOT EXISTS public.asaas_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  asaas_account_id uuid NOT NULL REFERENCES public.asaas_accounts(id) ON DELETE CASCADE,
  environment text NOT NULL,
  asaas_customer_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  external_reference text NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT asaas_customers_environment_check CHECK (environment IN ('sandbox', 'production')),
  CONSTRAINT asaas_customers_status_check CHECK (status IN ('active', 'deleted'))
);

-- One customer per student per Asaas account (account already encapsulates environment)
CREATE UNIQUE INDEX IF NOT EXISTS idx_asaas_customers_student_account
  ON public.asaas_customers (student_id, asaas_account_id);

-- Quick lookup by academy + environment
CREATE INDEX IF NOT EXISTS idx_asaas_customers_academy_environment
  ON public.asaas_customers (academy_id, environment);

-- Quick lookup by Asaas customer ID (for future webhooks)
CREATE INDEX IF NOT EXISTS idx_asaas_customers_asaas_customer_id
  ON public.asaas_customers (asaas_customer_id);

-- Timestamps
DROP TRIGGER IF EXISTS asaas_customers_updated_at ON public.asaas_customers;
CREATE TRIGGER asaas_customers_updated_at
  BEFORE UPDATE ON public.asaas_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.asaas_customers IS 'Vínculo entre aluno local e customer no Asaas, por conta e ambiente.';
COMMENT ON COLUMN public.asaas_customers.student_id IS 'ID do aluno local (student_profiles).';
COMMENT ON COLUMN public.asaas_customers.asaas_account_id IS 'Conta Asaas local usada para criar o customer.';
COMMENT ON COLUMN public.asaas_customers.asaas_customer_id IS 'ID externo do customer no Asaas (ex: cus_000005401844).';
COMMENT ON COLUMN public.asaas_customers.environment IS 'Ambiente (sandbox/production), denormalizado da conta Asaas para queries.';
COMMENT ON COLUMN public.asaas_customers.external_reference IS 'Referência externa enviada ao Asaas (externalReference) para rastreabilidade bidirecional.';
COMMENT ON COLUMN public.asaas_customers.synced_at IS 'Última sincronização bem-sucedida com o Asaas.';

-- RLS
ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff view Asaas customers in academy" ON public.asaas_customers;
CREATE POLICY "Staff view Asaas customers in academy"
ON public.asaas_customers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = asaas_customers.academy_id
  )
);

DROP POLICY IF EXISTS "Staff insert Asaas customers in academy" ON public.asaas_customers;
CREATE POLICY "Staff insert Asaas customers in academy"
ON public.asaas_customers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = asaas_customers.academy_id
  )
);

DROP POLICY IF EXISTS "Staff update Asaas customers in academy" ON public.asaas_customers;
CREATE POLICY "Staff update Asaas customers in academy"
ON public.asaas_customers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = asaas_customers.academy_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = asaas_customers.academy_id
  )
);

REVOKE ALL ON public.asaas_customers FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.asaas_customers TO authenticated, service_role;
