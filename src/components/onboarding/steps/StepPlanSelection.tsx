'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Badge } from '@/components/ui';
import { OnboardingSession } from '@/lib/users';
import {
  getPublicCatalogPlans,
  formatPrice,
  BILLING_CYCLE_LABELS,
  type CatalogPlan,
} from '@/lib/plans/publicPlansService';
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
  isSelected,
  onSelect,
}: {
  plan: CatalogPlan;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const cycleLabel = BILLING_CYCLE_LABELS[plan.billingCycle] || plan.billingCycle;

  return (
    <Card
      onClick={onSelect}
      className={cn(
        'relative h-full min-w-0 cursor-pointer overflow-hidden p-6 transition-all',
        isSelected
          ? 'ring-2 ring-[var(--element-primary)] border-[var(--element-primary)]'
          : 'hover:border-[var(--border-hover)]'
      )}
    >
      {isSelected && (
        <div className="absolute top-4 right-4 w-6 h-6 bg-[var(--element-primary)] rounded-full flex items-center justify-center">
          <CheckIcon className="w-4 h-4 text-white" />
        </div>
      )}

      <div className="space-y-4 min-w-0">
        <div className="min-w-0 space-y-1">
          <h3 className="break-words text-lg font-semibold text-[var(--text-primary)]">
            {plan.name}
          </h3>
          {plan.description && (
            <p className="break-words text-sm text-[var(--text-secondary)]">
              {plan.description}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1">
            <span className="break-words text-3xl font-bold text-[var(--text-primary)]">
              {formatPrice(plan.price)}
            </span>
            <span className="text-sm text-[var(--text-tertiary)]">
              /{cycleLabel.toLowerCase()}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 pt-2 border-t border-[var(--divider-primary)]">
          <Badge variant="secondary" className="text-xs">
            {cycleLabel}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

export function StepPlanSelection({ session, onNext, onBack }: StepPlanSelectionProps) {
  const [plans, setPlans] = useState<CatalogPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>(
    session.collectedData.planSelection?.planId || ''
  );
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadPlans() {
      setIsLoading(true);
      const catalogPlans = await getPublicCatalogPlans(session.academyId);
      if (!cancelled) {
        setPlans(catalogPlans);
        setIsLoading(false);
      }
    }
    loadPlans();
    return () => { cancelled = true; };
  }, [session.academyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlan) {
      setError('Selecione um plano para continuar');
      return;
    }

    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return;

    onNext({
      planId: plan.id,
      planName: plan.name,
      billingType: plan.billingCycle,
      value: plan.price,
      startDate: new Date().toISOString().split('T')[0],
    });
  };

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--element-primary)]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Escolha o plano
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Selecione o plano ideal para{' '}
          {session.collectedData.identification?.fullName?.split(' ')[0] || 'o aluno'}.
        </p>
      </div>

      {plans.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Nenhum plano ativo cadastrado. Cadastre planos em Configurações antes de continuar.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlan === plan.id}
              onSelect={() => {
                setSelectedPlan(plan.id);
                setError('');
              }}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-[var(--status-negative)]">{error}</p>
      )}

      {selectedPlanData && (
        <Card className="p-4 bg-[var(--background-secondary)] border-none">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-[var(--text-tertiary)]">Plano selecionado</p>
              <p className="break-words font-semibold text-[var(--text-primary)]">
                {selectedPlanData.name} — {BILLING_CYCLE_LABELS[selectedPlanData.billingCycle] || selectedPlanData.billingCycle}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xl font-bold text-[var(--element-primary)]">
                {formatPrice(selectedPlanData.price)}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-between pt-4">
        <Button type="button" variant="ghost" onClick={onBack}>
          Voltar
        </Button>
        <Button type="submit" disabled={plans.length === 0}>
          Continuar
        </Button>
      </div>
    </form>
  );
}
