'use client';

import { useState } from 'react';
import { Button, Card, Badge } from '@/components/ui';
import { OnboardingSession } from '@/lib/users';
import type { ExternalBillingResult } from '@/lib/users/onboardingService';

interface StepActivationProps {
  session: OnboardingSession;
  onActivate: () => Promise<ActivationOutcome>;
  onBack: () => void;
  onFinish: () => void;
}

export interface ActivationOutcome {
  localSuccess: boolean;
  billing?: ExternalBillingResult;
  error?: string;
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: 'Cartão de crédito',
  debit: 'Cartão de débito',
  pix: 'PIX',
  boleto: 'Boleto',
  cash: 'Dinheiro',
};

const BILLING_STATUS_CONFIG: Record<string, {
  icon: 'check' | 'clock' | 'alert';
  label: string;
  description: string;
  variant: 'positive' | 'warning' | 'alert';
}> = {
  completed_with_billing: {
    icon: 'check',
    label: 'Cobrança criada',
    description: 'A cobrança foi criada automaticamente no sistema de pagamentos.',
    variant: 'positive',
  },
  completed_local_only: {
    icon: 'check',
    label: 'Pagamento manual',
    description: 'A cobrança ficou como pendente. O pagamento será registrado manualmente.',
    variant: 'positive',
  },
  pending_external_billing: {
    icon: 'clock',
    label: 'Cobrança pendente de configuração',
    description: 'A cobrança não foi criada automaticamente. Verifique a configuração da conta de pagamentos.',
    variant: 'warning',
  },
  failed_external_billing: {
    icon: 'alert',
    label: 'Erro na cobrança automática',
    description: 'Não foi possível criar a cobrança automática. A assinatura ficou ativa e a cobrança pode ser criada depois.',
    variant: 'alert',
  },
  already_exists: {
    icon: 'check',
    label: 'Cobrança já existente',
    description: 'A cobrança já havia sido criada anteriormente.',
    variant: 'positive',
  },
};

function BillingStatusIcon({ type, className }: { type: 'check' | 'clock' | 'alert'; className?: string }) {
  if (type === 'check') return <CheckCircleIcon className={className} />;
  if (type === 'clock') return <ClockIcon className={className} />;
  return <AlertIcon className={className} />;
}

export function StepActivation({ session, onActivate, onBack, onFinish }: StepActivationProps) {
  const [state, setState] = useState<'review' | 'activating' | 'result'>('review');
  const [outcome, setOutcome] = useState<ActivationOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userName = session.collectedData.identification?.fullName || 'Aluno';
  const planName = session.collectedData.planSelection?.planName || 'Plano';
  const planValue = session.collectedData.planSelection?.value || 0;
  const paymentMethod = session.collectedData.payment?.method || 'manual';
  const contractAccepted = session.collectedData.contract?.acceptedTerms || false;

  const handleActivate = async () => {
    setState('activating');
    setError(null);

    try {
      const result = await onActivate();
      setOutcome(result);
      setState('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao ativar');
      setState('review');
    }
  };

  // ─── Loading state ──────────────────────────────────────────────

  if (state === 'activating') {
    return (
      <div className="space-y-8 text-center py-8">
        <div className="w-16 h-16 mx-auto border-4 border-[var(--element-primary)] border-t-transparent rounded-full animate-spin" />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Ativando cadastro...
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Criando assinatura e configurando cobrança. Aguarde.
          </p>
        </div>
      </div>
    );
  }

  // ─── Result state ───────────────────────────────────────────────

  if (state === 'result' && outcome) {
    if (!outcome.localSuccess) {
      return (
        <div className="space-y-8 text-center py-8">
          <div className="w-20 h-20 mx-auto bg-[var(--status-alert)]/10 rounded-full flex items-center justify-center">
            <AlertIcon className="w-12 h-12 text-[var(--status-alert)]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              Erro ao concluir cadastro
            </h2>
            <p className="text-[var(--text-secondary)]">
              {outcome.error || 'Não foi possível concluir a ativação. Tente novamente.'}
            </p>
          </div>
          <Button onClick={() => setState('review')}>
            Tentar novamente
          </Button>
        </div>
      );
    }

    const billingConfig = outcome.billing
      ? BILLING_STATUS_CONFIG[outcome.billing.status] || BILLING_STATUS_CONFIG.pending_external_billing
      : BILLING_STATUS_CONFIG.completed_local_only;

    const colorVar = `var(--status-${billingConfig.variant})`;

    return (
      <div className="space-y-8 text-center py-8">
        <div className="w-20 h-20 mx-auto bg-[var(--status-positive)]/10 rounded-full flex items-center justify-center">
          <CheckCircleIcon className="w-12 h-12 text-[var(--status-positive)]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Cadastro concluído!
          </h2>
          <p className="text-[var(--text-secondary)]">
            {userName.split(' ')[0]} foi cadastrado(a) com sucesso.
          </p>
        </div>

        {/* Billing status */}
        <Card className="p-4 text-left" style={{ borderColor: `${colorVar}40`, backgroundColor: `${colorVar}08` }}>
          <div className="flex items-start gap-3">
            <BillingStatusIcon
              type={billingConfig.icon}
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              // @ts-expect-error -- dynamic color
              style={{ color: colorVar }}
            />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {billingConfig.label}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {billingConfig.description}
              </p>
              {outcome.billing?.reason === 'NO_ASAAS_ACCOUNT' && (
                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                  Configure uma conta Asaas em Configurações para ativar cobranças automáticas.
                </p>
              )}
              {outcome.billing?.reason === 'STUDENT_MISSING_CPF' && (
                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                  O CPF do aluno não foi informado. Complete o cadastro para ativar a cobrança.
                </p>
              )}
            </div>
          </div>
        </Card>

        <Button onClick={onFinish} size="lg">
          Continuar
        </Button>
      </div>
    );
  }

  // ─── Review state (default) ─────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Confirmar ativação
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Revise o resumo e confirme para finalizar o cadastro de {userName.split(' ')[0]}.
        </p>
      </div>

      {error && (
        <Card className="p-4 border-[var(--status-alert)]/30 bg-[var(--status-alert)]/5">
          <p className="text-sm text-[var(--status-alert)]">{error}</p>
        </Card>
      )}

      {/* Resumo do cadastro */}
      <Card className="p-6">
        <h3 className="font-medium text-[var(--text-primary)] mb-4">
          Resumo do cadastro
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[var(--text-tertiary)]">Nome</p>
              <p className="font-medium text-[var(--text-primary)]">{userName}</p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">E-mail</p>
              <p className="font-medium text-[var(--text-primary)]">
                {session.collectedData.identification?.email}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Plano</p>
              <p className="font-medium text-[var(--text-primary)]">{planName}</p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Valor</p>
              <p className="font-medium text-[var(--text-primary)]">
                {formatCurrency(planValue)}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Contrato</p>
              <p className="font-medium text-[var(--text-primary)]">
                {contractAccepted ? 'Aceito digitalmente' : 'Não aceito'}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Forma de pagamento</p>
              <p className="font-medium text-[var(--text-primary)]">
                {PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Status da cobrança */}
      <Card className="p-4 border-[var(--status-warning)]/30 bg-[var(--status-warning)]/5">
        <div className="flex items-start gap-3">
          <ClockIcon className="w-5 h-5 text-[var(--status-warning)] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Primeira cobrança: Pendente
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              A cobrança de {formatCurrency(planValue)} será registrada com status pendente.
              O pagamento será processado conforme a forma de cobrança escolhida.
            </p>
          </div>
        </div>
      </Card>

      {/* O que acontece ao confirmar */}
      <Card className="p-6 bg-[var(--background-secondary)] border-none">
        <h3 className="font-medium text-[var(--text-primary)] mb-3">
          Ao confirmar:
        </h3>
        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          <li className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-[var(--status-positive)] flex-shrink-0" />
            Conta do aluno será criada
          </li>
          <li className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-[var(--status-positive)] flex-shrink-0" />
            Assinatura do plano {planName} será ativada
          </li>
          <li className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-[var(--status-positive)] flex-shrink-0" />
            Primeira cobrança será registrada
            <Badge variant="warning" className="text-xs ml-1">Pendente</Badge>
          </li>
          {contractAccepted && (
            <li className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-[var(--status-positive)] flex-shrink-0" />
              Aceite do contrato será registrado
            </li>
          )}
        </ul>
      </Card>

      {/* Ações */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="ghost" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={handleActivate} size="lg">
          Confirmar e ativar
        </Button>
      </div>
    </div>
  );
}
