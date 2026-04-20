-- ASAAS ACCOUNTS BASE
-- PR #1: local account model and resolution fallback for academy/unit billing

CREATE UNIQUE INDEX IF NOT EXISTS idx_units_academy_id_id
  ON public.units (academy_id, id);

CREATE TABLE IF NOT EXISTS public.asaas_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  unit_id uuid NULL,
  environment text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  account_name text NOT NULL DEFAULT '',
  asaas_account_id text NULL,
  wallet_id text NULL,
  api_key_reference text NULL,
  external_reference text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT asaas_accounts_environment_check CHECK (environment IN ('sandbox', 'production')),
  CONSTRAINT asaas_accounts_status_check CHECK (status IN ('active', 'inactive')),
  CONSTRAINT asaas_accounts_unit_fkey
    FOREIGN KEY (academy_id, unit_id)
    REFERENCES public.units (academy_id, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_asaas_accounts_academy_environment_status
  ON public.asaas_accounts (academy_id, environment, status);

CREATE INDEX IF NOT EXISTS idx_asaas_accounts_unit_environment_status
  ON public.asaas_accounts (unit_id, environment, status)
  WHERE unit_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_asaas_accounts_academy_environment_default
  ON public.asaas_accounts (academy_id, environment)
  WHERE unit_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_asaas_accounts_unit_environment
  ON public.asaas_accounts (unit_id, environment)
  WHERE unit_id IS NOT NULL;

DROP TRIGGER IF EXISTS asaas_accounts_updated_at ON public.asaas_accounts;
CREATE TRIGGER asaas_accounts_updated_at
  BEFORE UPDATE ON public.asaas_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.asaas_accounts IS 'Configuração local da conta Asaas usada para resolver operações financeiras da academia ou unidade.';
COMMENT ON COLUMN public.asaas_accounts.unit_id IS 'Se informado, a unidade usa esta conta própria; se nulo, a conta vale para toda a academia.';
COMMENT ON COLUMN public.asaas_accounts.environment IS 'Ambiente da conta/configuração no Asaas: sandbox ou production.';
COMMENT ON COLUMN public.asaas_accounts.api_key_reference IS 'Referência do segredo/token fora do banco. Nunca armazenar a chave real aqui.';
COMMENT ON COLUMN public.asaas_accounts.asaas_account_id IS 'Identificador externo principal da conta no Asaas, quando existir.';
COMMENT ON COLUMN public.asaas_accounts.wallet_id IS 'Identificador externo de wallet no Asaas, útil para operações futuras como split e conciliação.';

ALTER TABLE public.asaas_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff view Asaas accounts in academy" ON public.asaas_accounts;
CREATE POLICY "Staff view Asaas accounts in academy"
ON public.asaas_accounts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = asaas_accounts.academy_id
  )
);

DROP POLICY IF EXISTS "Staff insert Asaas accounts in academy" ON public.asaas_accounts;
CREATE POLICY "Staff insert Asaas accounts in academy"
ON public.asaas_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = asaas_accounts.academy_id
  )
  AND (
    asaas_accounts.unit_id IS NULL OR EXISTS (
      SELECT 1
      FROM public.units u
      WHERE u.id = asaas_accounts.unit_id
        AND u.academy_id = asaas_accounts.academy_id
    )
  )
);

DROP POLICY IF EXISTS "Staff update Asaas accounts in academy" ON public.asaas_accounts;
CREATE POLICY "Staff update Asaas accounts in academy"
ON public.asaas_accounts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = asaas_accounts.academy_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = asaas_accounts.academy_id
  )
  AND (
    asaas_accounts.unit_id IS NULL OR EXISTS (
      SELECT 1
      FROM public.units u
      WHERE u.id = asaas_accounts.unit_id
        AND u.academy_id = asaas_accounts.academy_id
    )
  )
);

REVOKE ALL ON public.asaas_accounts FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.asaas_accounts TO authenticated, service_role;