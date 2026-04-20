'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { getPlans, type Plan } from '@/lib/plans/plansService';
import { getUsers, type User } from '@/lib/users/usersService';
import {
  createSubscription,
  formatPrice,
  getBillingCycleLabel,
  type SubscriptionBillingCycle,
} from '@/lib/subscriptions/subscriptionService';

type Step = 'user' | 'plan' | 'conditions' | 'review';

interface NewSubscriptionData {
  userId: string;
  planId: string;
  startedAt: string;
  expiresAt: string;
  billingCycle: SubscriptionBillingCycle;
  price: number;
  notes: string;
}

const STEPS: { id: Step; label: string; icon: ReactNode }[] = [
  {
    id: 'user',
    label: 'Aluno',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'plan',
    label: 'Plano',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    id: 'conditions',
    label: 'Condições',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'review',
    label: 'Revisão',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

function addMonths(date: string, months: number): string {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next.toISOString().split('T')[0];
}

function getSuggestedExpiration(startedAt: string, cycle: SubscriptionBillingCycle): string {
  if (!startedAt) return '';

  if (cycle === 'monthly') return addMonths(startedAt, 1);
  if (cycle === 'yearly') return addMonths(startedAt, 12);
  return '';
}

export default function NewAssinaturaPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('user');
  const [students, setStudents] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [planSearch, setPlanSearch] = useState('');
  const [data, setData] = useState<NewSubscriptionData>({
    userId: '',
    planId: '',
    startedAt: new Date().toISOString().split('T')[0],
    expiresAt: '',
    billingCycle: 'monthly',
    price: 0,
    notes: '',
  });

  useEffect(() => {
    async function loadOptions() {
      setLoading(true);
      setError(null);

      try {
        const [usersResult, plansResult] = await Promise.all([getUsers(), getPlans()]);
        setStudents(usersResult.users.filter((user) => user.userType === 'student'));
        setPlans(plansResult.filter((plan) => plan.status === 'active'));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar dados da assinatura.');
      } finally {
        setLoading(false);
      }
    }

    loadOptions();
  }, []);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === data.userId) || null,
    [data.userId, students]
  );

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === data.planId) || null,
    [data.planId, plans]
  );

  const filteredStudents = useMemo(() => {
    if (!userSearch.trim()) return students.slice(0, 20);

    const query = userSearch.toLowerCase();
    return students.filter((student) => {
      return [student.fullName, student.email, student.document, student.registrationId]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [students, userSearch]);

  const filteredPlans = useMemo(() => {
    if (!planSearch.trim()) return plans;

    const query = planSearch.toLowerCase();
    return plans.filter((plan) => {
      return [plan.name, plan.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [planSearch, plans]);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 'user':
        return !!data.userId;
      case 'plan':
        return !!data.planId;
      case 'conditions':
        return !!data.startedAt && !!data.billingCycle && data.price >= 0;
      case 'review':
        return !!selectedStudent && !!selectedPlan;
      default:
        return false;
    }
  }, [currentStep, data, selectedPlan, selectedStudent]);

  const goNext = () => {
    const index = STEPS.findIndex((step) => step.id === currentStep);
    if (index < STEPS.length - 1) {
      setCurrentStep(STEPS[index + 1].id);
    }
  };

  const goPrev = () => {
    const index = STEPS.findIndex((step) => step.id === currentStep);
    if (index > 0) {
      setCurrentStep(STEPS[index - 1].id);
    }
  };

  const selectStudent = (student: User) => {
    setData((previous) => ({ ...previous, userId: student.id }));
  };

  const selectPlan = (plan: Plan) => {
    setData((previous) => ({
      ...previous,
      planId: plan.id,
      billingCycle: plan.billingCycle,
      price: plan.price,
      expiresAt: getSuggestedExpiration(previous.startedAt, plan.billingCycle),
    }));
  };

  const handleCreateSubscription = async () => {
    if (!selectedStudent || !selectedPlan) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await createSubscription({
      studentId: selectedStudent.id,
      planId: selectedPlan.id,
      startedAt: data.startedAt,
      expiresAt: data.expiresAt || null,
      billingCycle: data.billingCycle,
      price: data.price,
      notes: data.notes,
    });

    setSubmitting(false);

    if (!result.success || !result.subscription) {
      setError(result.error || 'Não foi possível criar a assinatura.');
      return;
    }

    router.push(`/assinaturas/${result.subscription.id}`);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
      <Header title="Nova Assinatura" />

      <div className="flex-1 overflow-auto p-6">
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between gap-4 overflow-x-auto">
            {STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isPast = STEPS.findIndex((item) => item.id === currentStep) > index;

              return (
                <div key={step.id} className="flex items-center flex-1 min-w-fit">
                  <button
                    onClick={() => (isPast || isActive) && setCurrentStep(step.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[var(--color-brand-light)] text-[var(--color-brand)]'
                        : isPast
                        ? 'text-[var(--color-success)]'
                        : 'text-[var(--color-text-tertiary)]'
                    }`}
                    disabled={!isPast && !isActive}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive
                          ? 'bg-[var(--color-brand)] text-white'
                          : isPast
                          ? 'bg-[var(--color-success)] text-white'
                          : 'bg-[var(--color-bg-tertiary)]'
                      }`}
                    >
                      {isPast ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.icon
                      )}
                    </div>
                    <span className="font-medium hidden sm:block">{step.label}</span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${isPast ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border-primary)]'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {error && (
          <Card className="p-4 mb-6 border border-[var(--color-error)] text-[var(--color-error)]">
            {error}
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <>
                {currentStep === 'user' && (
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">Selecionar aluno</h2>
                    <p className="text-[var(--color-text-secondary)] mb-4">Escolha o aluno que receberá a assinatura.</p>

                    <div className="relative mb-4">
                      <Input
                        placeholder="Buscar por nome, email, CPF ou matrícula..."
                        value={userSearch}
                        onChange={(event) => setUserSearch(event.target.value)}
                        className="pl-10"
                      />
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    <div className="space-y-2 max-h-[420px] overflow-y-auto">
                      {filteredStudents.map((student) => (
                        <button
                          key={student.id}
                          onClick={() => selectStudent(student)}
                          className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors text-left ${
                            data.userId === student.id
                              ? 'border-[var(--color-brand)] bg-[var(--color-brand-light)]'
                              : 'border-[var(--color-border-primary)] hover:bg-[var(--color-bg-tertiary)]'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-[var(--color-text-primary)]">{student.fullName}</div>
                            <div className="text-sm text-[var(--color-text-tertiary)]">{student.email}</div>
                            <div className="text-sm text-[var(--color-text-tertiary)]">
                              {student.registrationId || student.document || '-'}
                            </div>
                          </div>
                          {data.userId === student.id && <Badge variant="success">Selecionado</Badge>}
                        </button>
                      ))}
                    </div>
                  </Card>
                )}

                {currentStep === 'plan' && (
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">Selecionar plano</h2>
                    <p className="text-[var(--color-text-secondary)] mb-4">A assinatura usará um plano ativo da academia.</p>

                    <div className="relative mb-4">
                      <Input
                        placeholder="Buscar por nome ou descrição..."
                        value={planSearch}
                        onChange={(event) => setPlanSearch(event.target.value)}
                        className="pl-10"
                      />
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    <div className="space-y-3">
                      {filteredPlans.map((plan) => (
                        <button
                          key={plan.id}
                          onClick={() => selectPlan(plan)}
                          className={`w-full text-left p-4 rounded-lg border transition-colors ${
                            data.planId === plan.id
                              ? 'border-[var(--color-brand)] bg-[var(--color-brand-light)]'
                              : 'border-[var(--color-border-primary)] hover:bg-[var(--color-bg-tertiary)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <div className="font-medium text-[var(--color-text-primary)]">{plan.name}</div>
                            <Badge variant="secondary">{getBillingCycleLabel(plan.billingCycle)}</Badge>
                          </div>
                          <div className="text-sm text-[var(--color-text-secondary)] mb-3">{plan.description || 'Sem descrição.'}</div>
                          <div className="text-[var(--color-text-primary)] font-semibold">{formatPrice(plan.price)}</div>
                        </button>
                      ))}
                    </div>
                  </Card>
                )}

                {currentStep === 'conditions' && (
                  <Card className="p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Definir condições</h2>
                    <p className="text-[var(--color-text-secondary)]">Ajuste as datas, ciclo e valor final da assinatura.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startedAt">Início da vigência</Label>
                        <Input
                          id="startedAt"
                          type="date"
                          value={data.startedAt}
                          onChange={(event) => {
                            const startedAt = event.target.value;
                            setData((previous) => ({
                              ...previous,
                              startedAt,
                              expiresAt: previous.expiresAt || getSuggestedExpiration(startedAt, previous.billingCycle),
                            }));
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expiresAt">Fim da vigência</Label>
                        <Input
                          id="expiresAt"
                          type="date"
                          value={data.expiresAt}
                          onChange={(event) => setData((previous) => ({ ...previous, expiresAt: event.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="billingCycle">Ciclo de cobrança</Label>
                        <select
                          id="billingCycle"
                          value={data.billingCycle}
                          onChange={(event) => {
                            const billingCycle = event.target.value as SubscriptionBillingCycle;
                            setData((previous) => ({
                              ...previous,
                              billingCycle,
                              expiresAt: getSuggestedExpiration(previous.startedAt, billingCycle),
                            }));
                          }}
                          className="w-full px-3 py-2 rounded-md border border-[var(--divider-primary)] bg-[var(--background-primary)] text-[var(--element-primary)]"
                        >
                          <option value="monthly">Mensal</option>
                          <option value="yearly">Anual</option>
                          <option value="custom">Personalizado</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="price">Valor da assinatura</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={data.price}
                          onChange={(event) => setData((previous) => ({ ...previous, price: Number(event.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações internas</Label>
                      <textarea
                        id="notes"
                        value={data.notes}
                        onChange={(event) => setData((previous) => ({ ...previous, notes: event.target.value }))}
                        rows={5}
                        className="w-full rounded-md border border-[var(--divider-primary)] bg-[var(--background-primary)] px-3 py-2 text-sm text-[var(--element-primary)] focus:outline-none focus:border-[var(--status-info)] focus:ring-2 focus:ring-[var(--status-info-background)]"
                        placeholder="Informações comerciais, exceções ou observações internas."
                      />
                    </div>
                  </Card>
                )}

                {currentStep === 'review' && (
                  <Card className="p-6 space-y-6">
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">Revisar assinatura</h2>
                      <p className="text-[var(--color-text-secondary)]">Confirme os dados antes de salvar.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm text-[var(--color-text-secondary)] mb-1">Aluno</div>
                        <div className="font-medium text-[var(--color-text-primary)]">{selectedStudent?.fullName || '-'}</div>
                        <div className="text-sm text-[var(--color-text-secondary)]">{selectedStudent?.email || '-'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-[var(--color-text-secondary)] mb-1">Plano</div>
                        <div className="font-medium text-[var(--color-text-primary)]">{selectedPlan?.name || '-'}</div>
                        <div className="text-sm text-[var(--color-text-secondary)]">{selectedPlan?.description || 'Sem descrição.'}</div>
                      </div>
                      <div>
                        <div className="text-sm text-[var(--color-text-secondary)] mb-1">Vigência</div>
                        <div className="font-medium text-[var(--color-text-primary)]">
                          {data.startedAt || '-'} até {data.expiresAt || 'sem data final'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-[var(--color-text-secondary)] mb-1">Cobrança</div>
                        <div className="font-medium text-[var(--color-text-primary)]">
                          {formatPrice(data.price)} • {getBillingCycleLabel(data.billingCycle)}
                        </div>
                      </div>
                    </div>

                    {data.notes ? (
                      <div>
                        <div className="text-sm text-[var(--color-text-secondary)] mb-1">Observações</div>
                        <div className="rounded-lg bg-[var(--color-bg-secondary)] p-4 text-[var(--color-text-primary)] whitespace-pre-wrap">
                          {data.notes}
                        </div>
                      </div>
                    ) : null}
                  </Card>
                )}
              </>
            )}
          </div>

          <div>
            <Card className="p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Resumo</h3>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-[var(--color-text-secondary)]">Aluno</div>
                  <div className="font-medium text-[var(--color-text-primary)]">{selectedStudent?.fullName || 'Selecione um aluno'}</div>
                </div>
                <div>
                  <div className="text-[var(--color-text-secondary)]">Plano</div>
                  <div className="font-medium text-[var(--color-text-primary)]">{selectedPlan?.name || 'Selecione um plano'}</div>
                </div>
                <div>
                  <div className="text-[var(--color-text-secondary)]">Cobrança</div>
                  <div className="font-medium text-[var(--color-text-primary)]">{formatPrice(data.price)}</div>
                </div>
                <div>
                  <div className="text-[var(--color-text-secondary)]">Ciclo</div>
                  <div className="font-medium text-[var(--color-text-primary)]">{getBillingCycleLabel(data.billingCycle)}</div>
                </div>
                <div>
                  <div className="text-[var(--color-text-secondary)]">Vigência</div>
                  <div className="font-medium text-[var(--color-text-primary)]">
                    {data.startedAt || '-'} até {data.expiresAt || 'sem data final'}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={goPrev} disabled={currentStep === 'user' || loading || submitting}>
                  Voltar
                </Button>

                {currentStep === 'review' ? (
                  <Button onClick={handleCreateSubscription} disabled={!canProceed || loading || submitting}>
                    {submitting ? 'Salvando...' : 'Criar assinatura'}
                  </Button>
                ) : (
                  <Button onClick={goNext} disabled={!canProceed || loading}>
                    Continuar
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
