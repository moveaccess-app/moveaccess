'use client';

import { useState, useMemo } from 'react';
import { Button, Card, Badge } from '@/components/ui';
import { OnboardingSession } from '@/mocks/onboardingMock';
import { 
  getPublicCatalogPlans, 
  formatPrice,
  BILLING_CYCLE_LABELS,
  type Plan,
  type BillingCycle,
} from '@/mocks/plansMock';
import { cn } from '@/lib/utils';

interface StepPlanSelectionProps {
  session: OnboardingSession;
  onNext: (data: OnboardingSession['collectedData']['planSelection']) => void;
  onBack: () => void;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PlanCard({ 
  plan, 
  billingCycle,
  isSelected, 
  onSelect 
}: { 
  plan: Plan; 
  billingCycle: BillingCycle;
  isSelected: boolean; 
  onSelect: () => void;
}) {
  const pricing = plan.pricing.find(p => p.cycle === billingCycle && p.enabled);
  const price = pricing?.price || plan.pricing.find(p => p.enabled)?.price || 0;
  const discount = pricing?.discountPercentage || 0;

  return (
    <Card
      onClick={onSelect}
      className={cn(
        'relative cursor-pointer transition-all p-6',
        isSelected 
          ? 'ring-2 ring-[var(--element-primary)] border-[var(--element-primary)]' 
          : 'hover:border-[var(--border-hover)]'
      )}
    >
      {plan.onboardingBehavior.isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--element-primary)] text-white text-xs font-medium px-3 py-1 rounded-full">
          Mais popular
        </span>
      )}
      
      {plan.onboardingBehavior.isBestValue && !plan.onboardingBehavior.isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--status-positive)] text-white text-xs font-medium px-3 py-1 rounded-full">
          Melhor custo
        </span>
      )}
      
      {isSelected && (
        <div className="absolute top-4 right-4 w-6 h-6 bg-[var(--element-primary)] rounded-full flex items-center justify-center">
          <CheckIcon className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {plan.name}
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {plan.shortDescription || plan.description}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-[var(--text-primary)]">
              {formatPrice(price)}
            </span>
            <span className="text-sm text-[var(--text-tertiary)]">/mês</span>
          </div>
          {discount > 0 && (
            <p className="text-xs text-[var(--status-positive)]">
              {discount}% de desconto no {BILLING_CYCLE_LABELS[billingCycle].toLowerCase()}
            </p>
          )}
        </div>

        <ul className="space-y-2">
          {plan.features.slice(0, 5).map((feature) => (
            <li key={feature.id} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
              <CheckIcon className="w-4 h-4 text-[var(--status-positive)] mt-0.5 flex-shrink-0" />
              {feature.name}
            </li>
          ))}
          {plan.features.length > 5 && (
            <li className="text-xs text-[var(--text-tertiary)]">
              +{plan.features.length - 5} benefícios
            </li>
          )}
        </ul>

        {/* Badges de comportamento */}
        <div className="flex flex-wrap gap-1 pt-2 border-t border-[var(--divider-primary)]">
          {plan.onboardingBehavior.trialDays > 0 && (
            <Badge variant="secondary" className="text-xs">
              {plan.onboardingBehavior.trialDays} dias grátis
            </Badge>
          )}
          {plan.onboardingBehavior.immediateAccessAfterCompletion && (
            <Badge variant="success" className="text-xs">
              Acesso imediato
            </Badge>
          )}
          {plan.accessRules.is24Hours && (
            <Badge variant="outline" className="text-xs">
              24h
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

export function StepPlanSelection({ session, onNext, onBack }: StepPlanSelectionProps) {
  // Obter planos do catálogo público
  const availablePlans = useMemo(() => getPublicCatalogPlans(), []);
  
  const [selectedPlan, setSelectedPlan] = useState<string>(
    session.collectedData.planSelection?.planId || ''
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    session.collectedData.planSelection?.billingType || 'monthly'
  );
  const [error, setError] = useState('');

  // Ciclos disponíveis (só mostra os que têm pelo menos um plano com esse ciclo habilitado)
  const availableCycles = useMemo(() => {
    const cycles: BillingCycle[] = ['monthly', 'quarterly', 'semiannual', 'annual'];
    return cycles.filter(cycle => 
      availablePlans.some(plan => plan.pricing.some(p => p.cycle === cycle && p.enabled))
    );
  }, [availablePlans]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      setError('Selecione um plano para continuar');
      return;
    }

    const plan = availablePlans.find(p => p.id === selectedPlan);
    if (!plan) return;

    const pricing = plan.pricing.find(p => p.cycle === billingCycle && p.enabled) 
      || plan.pricing.find(p => p.enabled);

    onNext({
      planId: selectedPlan,
      planName: plan.name,
      billingType: pricing?.cycle || 'monthly',
      value: pricing?.price || 0,
      startDate: new Date().toISOString().split('T')[0],
    });
  };

  // Plano selecionado para resumo
  const selectedPlanData = availablePlans.find(p => p.id === selectedPlan);
  const selectedPricing = selectedPlanData?.pricing.find(p => p.cycle === billingCycle && p.enabled)
    || selectedPlanData?.pricing.find(p => p.enabled);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Escolha o plano
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Selecione o plano ideal para {session.collectedData.identification?.fullName?.split(' ')[0] || 'o usuário'}.
        </p>
      </div>

      {/* Billing cycle selector */}
      <div className="flex flex-wrap gap-2 p-1 bg-[var(--background-secondary)] rounded-lg w-fit">
        {availableCycles.map((cycle) => {
          const hasDiscount = availablePlans.some(plan => 
            plan.pricing.find(p => p.cycle === cycle)?.discountPercentage || 0 > 0
          );
          return (
            <button
              key={cycle}
              type="button"
              onClick={() => setBillingCycle(cycle)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-all',
                billingCycle === cycle
                  ? 'bg-[var(--background-primary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              {BILLING_CYCLE_LABELS[cycle]}
              {hasDiscount && cycle !== 'monthly' && (
                <span className="ml-1 text-xs text-[var(--status-positive)]">
                  %
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {availablePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            isSelected={selectedPlan === plan.id}
            onSelect={() => {
              setSelectedPlan(plan.id);
              setError('');
            }}
          />
        ))}
      </div>

      {error && (
        <p className="text-sm text-[var(--status-negative)]">{error}</p>
      )}

      {/* Summary */}
      {selectedPlanData && selectedPricing && (
        <Card className="p-4 bg-[var(--background-secondary)] border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-tertiary)]">Plano selecionado</p>
              <p className="font-semibold text-[var(--text-primary)]">
                {selectedPlanData.name} - {BILLING_CYCLE_LABELS[selectedPricing.cycle]}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-[var(--element-primary)]">
                {formatPrice(selectedPricing.price)}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">por mês</p>
            </div>
          </div>
          
          {selectedPlanData.enrollmentFee.enabled && (
            <div className="mt-3 pt-3 border-t border-[var(--divider-primary)]">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-tertiary)]">Taxa de matrícula</span>
                <span className="text-[var(--text-primary)]">
                  {formatPrice(selectedPlanData.enrollmentFee.value)}
                </span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Ações */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
        >
          Voltar
        </Button>
        <Button type="submit">
          Continuar
        </Button>
      </div>
    </form>
  );
}
