'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { OnboardingSession } from '@/lib/users';
import { cn } from '@/lib/utils';

interface StepPaymentProps {
  session: OnboardingSession;
  onNext: (data: OnboardingSession['collectedData']['payment']) => void;
  onBack: () => void;
}

type PaymentMethod = 'credit_card' | 'pix' | 'boleto';

function isSupportedPaymentMethod(value: string | undefined): value is PaymentMethod {
  return value === 'credit_card' || value === 'pix' || value === 'boleto';
}

const paymentMethodInfo: Record<PaymentMethod, { label: string; description: string; icon: string }> = {
  credit_card: {
    label: 'Cartão de crédito',
    description: 'Cobrança recorrente',
    icon: '💳',
  },
  pix: {
    label: 'PIX',
    description: 'Cobrança via QR Code',
    icon: '📱',
  },
  boleto: {
    label: 'Boleto bancário',
    description: 'Vencimento em 3 dias',
    icon: '📄',
  },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function StepPayment({ session, onNext, onBack }: StepPaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    isSupportedPaymentMethod(session.collectedData.payment?.method)
      ? session.collectedData.payment.method
      : 'pix'
  );

  const planValue = session.collectedData.planSelection?.value || 0;
  const planName = session.collectedData.planSelection?.planName || 'Plano';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onNext({
      method: paymentMethod,
      status: 'pending',
      value: planValue,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Forma de pagamento
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Escolha como serão geradas as cobranças do plano {planName}.
        </p>
      </div>

      {/* Resumo do valor */}
      <Card className="p-4 bg-[var(--background-secondary)] border-none">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-[var(--text-tertiary)]">Valor do plano</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              {formatCurrency(planValue)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--text-tertiary)]">Primeira cobrança</p>
            <p className="font-medium text-[var(--text-primary)]">
              {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </Card>

      {/* Método de pagamento */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          Forma de cobrança
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.keys(paymentMethodInfo) as PaymentMethod[]).map((method) => (
            <label
              key={method}
              className={cn(
                'p-4 border rounded-lg cursor-pointer transition-all text-center',
                paymentMethod === method
                  ? 'border-[var(--element-primary)] bg-[var(--element-primary)]/5'
                  : 'border-[var(--border-default)] hover:border-[var(--border-hover)]'
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method}
                checked={paymentMethod === method}
                onChange={() => setPaymentMethod(method)}
                className="sr-only"
              />
              <span className="text-2xl mb-2 block">{paymentMethodInfo[method].icon}</span>
              <p className="font-medium text-sm text-[var(--text-primary)]">
                {paymentMethodInfo[method].label}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {paymentMethodInfo[method].description}
              </p>
            </label>
          ))}
        </div>
      </div>

      {/* Aviso honesto */}
      <Card className="p-4 border-[var(--status-warning)]/30 bg-[var(--status-warning)]/5">
        <p className="text-sm text-[var(--text-secondary)]">
          A primeira cobrança será registrada com status <strong>Pendente</strong>.
          {paymentMethod === 'pix' && ' O link de pagamento via PIX será enviado após a ativação.'}
          {paymentMethod === 'boleto' && ' O boleto será gerado após a ativação.'}
          {paymentMethod === 'credit_card' && ' A cobrança no cartão será processada após a ativação.'}
        </p>
      </Card>

      {/* Ações */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="ghost" onClick={onBack}>
          Voltar
        </Button>
        <Button type="submit">
          Confirmar e continuar
        </Button>
      </div>
    </form>
  );
}
