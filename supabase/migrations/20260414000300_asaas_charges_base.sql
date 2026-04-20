-- ASAAS CHARGES BASE
-- PR #3: link between local payments and Asaas charges (payments endpoint)

CREATE TABLE IF NOT EXISTS public.asaas_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  asaas_account_id uuid NOT NULL REFERENCES public.asaas_accounts(id) ON DELETE CASCADE,
  asaas_customer_id uuid NOT NULL REFERENCES public.asaas_customers(id) ON DELETE CASCADE,
  environment text NOT NULL,

  -- Asaas external identifiers
  asaas_payment_id text NOT NULL,
  external_reference text NULL,

  -- Asaas billing info (snapshot at creation, updated by webhook later)
  billing_type text NOT NULL,
  asaas_status text NOT NULL,
  value numeric(12,2) NOT NULL,
  net_value numeric(12,2) NULL,
  due_date date NOT NULL,
  payment_date date NULL,

  -- URLs from Asaas response
  invoice_url text NULL,
  bank_slip_url text NULL,

  -- Timestamps
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT asaas_charges_environment_check CHECK (environment IN ('sandbox', 'production')),
  CONSTRAINT asaas_charges_billing_type_check CHECK (billing_type IN ('BOLETO', 'PIX', 'CREDIT_CARD', 'UNDEFINED'))
);

-- One Asaas charge per local payment (idempotency guard)
CREATE UNIQUE INDEX IF NOT EXISTS idx_asaas_charges_payment_id
  ON public.asaas_charges (payment_id);

-- Lookup by Asaas payment ID (for webhooks)
CREATE UNIQUE INDEX IF NOT EXISTS idx_asaas_charges_asaas_payment_id
  ON public.asaas_charges (asaas_payment_id);

-- Lookup by academy + environment
CREATE INDEX IF NOT EXISTS idx_asaas_charges_academy_environment
  ON public.asaas_charges (academy_id, environment);

-- Lookup by Asaas status (for reconciliation)
CREATE INDEX IF NOT EXISTS idx_asaas_charges_asaas_status
  ON public.asaas_charges (asaas_status);

-- Timestamps
DROP TRIGGER IF EXISTS asaas_charges_updated_at ON public.asaas_charges;
CREATE TRIGGER asaas_charges_updated_at
  BEFORE UPDATE ON public.asaas_charges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public.asaas_charges IS 'Vínculo entre payment local e cobrança criada no Asaas. Uma entrada por payment.';
COMMENT ON COLUMN public.asaas_charges.payment_id IS 'Payment local do MoveAccess que originou esta cobrança.';
COMMENT ON COLUMN public.asaas_charges.asaas_account_id IS 'Conta Asaas local usada para criar a cobrança.';
COMMENT ON COLUMN public.asaas_charges.asaas_customer_id IS 'Vínculo local do customer no Asaas usado para a cobrança.';
COMMENT ON COLUMN public.asaas_charges.asaas_payment_id IS 'ID externo do payment no Asaas (ex: pay_080225913252).';
COMMENT ON COLUMN public.asaas_charges.billing_type IS 'Tipo de cobrança no Asaas: BOLETO, PIX, CREDIT_CARD.';
COMMENT ON COLUMN public.asaas_charges.asaas_status IS 'Status mais recente da cobrança no Asaas (PENDING, RECEIVED, CONFIRMED, OVERDUE, etc).';
COMMENT ON COLUMN public.asaas_charges.net_value IS 'Valor líquido informado pelo Asaas após taxas.';
COMMENT ON COLUMN public.asaas_charges.invoice_url IS 'URL da fatura/invoice no Asaas.';
COMMENT ON COLUMN public.asaas_charges.bank_slip_url IS 'URL do boleto no Asaas (quando billing_type = BOLETO).';
COMMENT ON COLUMN public.asaas_charges.synced_at IS 'Última sincronização bem-sucedida com o Asaas.';

-- RLS
ALTER TABLE public.asaas_charges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff view Asaas charges in academy" ON public.asaas_charges;
CREATE POLICY "Staff view Asaas charges in academy"
ON public.asaas_charges
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = asaas_charges.academy_id
  )
);

DROP POLICY IF EXISTS "Staff insert Asaas charges in academy" ON public.asaas_charges;
CREATE POLICY "Staff insert Asaas charges in academy"
ON public.asaas_charges
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = asaas_charges.academy_id
  )
);

DROP POLICY IF EXISTS "Staff update Asaas charges in academy" ON public.asaas_charges;
CREATE POLICY "Staff update Asaas charges in academy"
ON public.asaas_charges
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = asaas_charges.academy_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.academy_memberships am ON am.profile_id = p.id
    WHERE p.id = auth.uid()
      AND p.user_type = 'staff'
      AND am.academy_id = asaas_charges.academy_id
  )
);

REVOKE ALL ON public.asaas_charges FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE ON public.asaas_charges TO authenticated, service_role;
