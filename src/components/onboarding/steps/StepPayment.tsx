'use client';

import { useState } from 'react';
import { Button, Card, Input, Label } from '@/components/ui';
import { OnboardingSession } from '@/lib/users';
import { cn } from '@/lib/utils';

interface StepPaymentProps {
  session: OnboardingSession;
  onNext: (data: OnboardingSession['collectedData']['payment']) => void;
  onBack: () => void;
}

type PaymentMethod = 'credit_card' | 'debit' | 'pix' | 'boleto';

const paymentMethodInfo: Record<PaymentMethod, { label: string; description: string; icon: string }> = {
  credit_card: { 
    label: 'Cartão de crédito', 
    description: 'Parcele em até 12x',
    icon: '💳'
  },
  debit: { 
    label: 'Cartão de débito', 
    description: 'Débito à vista',
    icon: '💳'
  },
  pix: { 
    label: 'PIX', 
    description: 'Aprovação instantânea',
    icon: '📱'
  },
  boleto: { 
    label: 'Boleto bancário', 
    description: 'Vencimento em 3 dias',
    icon: '📄'
  },
};

export function StepPayment({ session, onNext, onBack }: StepPaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    session.collectedData.payment?.method || 'credit_card'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const planValue = session.collectedData.planSelection?.value || 0;
  const planName = session.collectedData.planSelection?.planName || 'Plano';

  const formatCardNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 16) {
      return numbers.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    }
    return cardData.number;
  };

  const formatExpiry = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 4) {
      return numbers.replace(/(\d{2})(\d)/, '$1/$2');
    }
    return cardData.expiry;
  };

  const handleCardChange = (field: string, value: string) => {
    setCardData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateCard = () => {
    if (paymentMethod !== 'credit_card' && paymentMethod !== 'debit') {
      return true;
    }

    const newErrors: Record<string, string> = {};
    
    if (!cardData.number.trim() || cardData.number.replace(/\D/g, '').length < 16) {
      newErrors.number = 'Número do cartão inválido';
    }
    
    if (!cardData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    if (!cardData.expiry.trim() || cardData.expiry.replace(/\D/g, '').length < 4) {
      newErrors.expiry = 'Data inválida';
    }
    
    if (!cardData.cvv.trim() || cardData.cvv.length < 3) {
      newErrors.cvv = 'CVV inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCard()) return;

    setIsProcessing(true);
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);

    onNext({
      paymentId: `pay-${Date.now()}`,
      method: paymentMethod,
      status: paymentMethod === 'boleto' ? 'pending' : 'completed',
      value: planValue,
      paidAt: paymentMethod === 'boleto' ? undefined : new Date().toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Pagamento
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Escolha a forma de pagamento para o plano {planName}.
        </p>
      </div>

      {/* Resumo do valor */}
      <Card className="p-4 bg-[var(--background-secondary)] border-none">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-[var(--text-tertiary)]">Valor mensal</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">
              R$ {planValue.toFixed(2).replace('.', ',')}
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
          Forma de pagamento
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

      {/* Dados do cartão */}
      {(paymentMethod === 'credit_card' || paymentMethod === 'debit') && (
        <div className="space-y-4 p-4 border border-[var(--border-default)] rounded-lg">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
            Dados do cartão
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Número do cartão</Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="0000 0000 0000 0000"
              value={cardData.number}
              onChange={(e) => handleCardChange('number', formatCardNumber(e.target.value))}
              className={errors.number ? 'border-[var(--status-negative)]' : ''}
            />
            {errors.number && (
              <p className="text-xs text-[var(--status-negative)]">{errors.number}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardName">Nome impresso no cartão</Label>
            <Input
              id="cardName"
              type="text"
              placeholder="NOME COMO ESTÁ NO CARTÃO"
              value={cardData.name}
              onChange={(e) => handleCardChange('name', e.target.value.toUpperCase())}
              className={errors.name ? 'border-[var(--status-negative)]' : ''}
            />
            {errors.name && (
              <p className="text-xs text-[var(--status-negative)]">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cardExpiry">Validade</Label>
              <Input
                id="cardExpiry"
                type="text"
                placeholder="MM/AA"
                value={cardData.expiry}
                onChange={(e) => handleCardChange('expiry', formatExpiry(e.target.value))}
                className={errors.expiry ? 'border-[var(--status-negative)]' : ''}
              />
              {errors.expiry && (
                <p className="text-xs text-[var(--status-negative)]">{errors.expiry}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cardCvv">CVV</Label>
              <Input
                id="cardCvv"
                type="text"
                placeholder="123"
                maxLength={4}
                value={cardData.cvv}
                onChange={(e) => handleCardChange('cvv', e.target.value.replace(/\D/g, ''))}
                className={errors.cvv ? 'border-[var(--status-negative)]' : ''}
              />
              {errors.cvv && (
                <p className="text-xs text-[var(--status-negative)]">{errors.cvv}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PIX */}
      {paymentMethod === 'pix' && (
        <Card className="p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Ao continuar, um QR Code será gerado para pagamento via PIX.
          </p>
          <div className="w-32 h-32 mx-auto bg-[var(--background-tertiary)] rounded-lg flex items-center justify-center">
            <span className="text-4xl">📱</span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-4">
            O pagamento será confirmado instantaneamente após a leitura do QR Code.
          </p>
        </Card>
      )}

      {/* Boleto */}
      {paymentMethod === 'boleto' && (
        <Card className="p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Ao continuar, um boleto será gerado com vencimento para 3 dias úteis.
          </p>
          <div className="w-32 h-32 mx-auto bg-[var(--background-tertiary)] rounded-lg flex items-center justify-center">
            <span className="text-4xl">📄</span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-4">
            O acesso será liberado após a compensação do boleto (1-3 dias úteis).
          </p>
        </Card>
      )}

      {/* Ações */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isProcessing}
        >
          Voltar
        </Button>
        <Button type="submit" disabled={isProcessing}>
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processando...
            </span>
          ) : (
            `Pagar R$ ${planValue.toFixed(2).replace('.', ',')}`
          )}
        </Button>
      </div>
    </form>
  );
}
