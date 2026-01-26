'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { mockUsers } from '@/mocks/usersMock';
import { mockPlans, formatPrice, type Plan } from '@/mocks/plansMock';
import {
  generateContractNumber,
  SIGNATURE_METHOD_LABELS,
  type SignatureMethod,
} from '@/mocks/contractsMock';

type Step = 'user' | 'plan' | 'conditions' | 'review';

interface NewContractData {
  userId: string;
  userName: string;
  userDocument: string;
  planId: string;
  plan: Plan | null;
  startDate: string;
  discountType: 'percentage' | 'fixed' | 'none';
  discountValue: number;
  discountReason: string;
  enrollmentFeeDiscount: number;
  paymentDayOfMonth: number;
  signatureMethod: SignatureMethod;
  internalNotes: string;
}

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  {
    id: 'user',
    label: 'Cliente',
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

export default function NewAssinaturaPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('user');
  const [userSearch, setUserSearch] = useState('');
  const [planSearch, setPlanSearch] = useState('');
  
  const [data, setData] = useState<NewContractData>({
    userId: '',
    userName: '',
    userDocument: '',
    planId: '',
    plan: null,
    startDate: new Date().toISOString().split('T')[0],
    discountType: 'none',
    discountValue: 0,
    discountReason: '',
    enrollmentFeeDiscount: 0,
    paymentDayOfMonth: 5,
    signatureMethod: 'digital',
    internalNotes: '',
  });

  // Número do contrato
  const contractNumber = useMemo(() => generateContractNumber(), []);

  // Usuários filtrados
  const filteredUsers = useMemo(() => {
    if (!userSearch) return mockUsers.slice(0, 10);
    const query = userSearch.toLowerCase();
    return mockUsers.filter(
      (u) =>
        u.fullName.toLowerCase().includes(query) ||
        u.document.includes(userSearch) ||
        u.email.toLowerCase().includes(query)
    );
  }, [userSearch]);

  // Planos filtrados (apenas ativos)
  const filteredPlans = useMemo(() => {
    const activePlans = mockPlans.filter((p) => p.status === 'active');
    if (!planSearch) return activePlans;
    const query = planSearch.toLowerCase();
    return activePlans.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }, [planSearch]);

  // Helper para obter preço mensal do plano
  const getMonthlyPrice = (plan: Plan) => {
    const monthlyPricing = plan.pricing.find((p) => p.cycle === 'monthly');
    return monthlyPricing?.price || plan.pricing[0]?.price || 0;
  };

  // Helper para obter taxa de matrícula
  const getEnrollmentFee = (plan: Plan) => {
    return plan.enrollmentFee.enabled ? plan.enrollmentFee.value : 0;
  };

  // Calcula valores finais
  const calculatedValues = useMemo(() => {
    if (!data.plan) return null;

    const basePrice = getMonthlyPrice(data.plan);
    let finalPrice = basePrice;

    if (data.discountType === 'percentage') {
      finalPrice = basePrice - (basePrice * data.discountValue) / 100;
    } else if (data.discountType === 'fixed') {
      finalPrice = basePrice - data.discountValue;
    }

    const enrollmentFee = getEnrollmentFee(data.plan);
    const finalEnrollmentFee = Math.max(0, enrollmentFee - data.enrollmentFeeDiscount);

    return {
      basePrice,
      finalPrice: Math.max(0, finalPrice),
      enrollmentFee,
      finalEnrollmentFee,
    };
  }, [data.plan, data.discountType, data.discountValue, data.enrollmentFeeDiscount]);

  // Navegação entre steps
  const goToStep = (step: Step) => {
    setCurrentStep(step);
  };

  const goNext = () => {
    const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].id);
    }
  };

  const goPrev = () => {
    const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id);
    }
  };

  // Validação do step atual
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 'user':
        return !!data.userId;
      case 'plan':
        return !!data.planId;
      case 'conditions':
        return !!data.startDate && data.paymentDayOfMonth > 0;
      case 'review':
        return true;
      default:
        return false;
    }
  }, [currentStep, data]);

  // Handler para selecionar usuário
  const selectUser = (user: typeof mockUsers[0]) => {
    setData((prev) => ({
      ...prev,
      userId: user.id,
      userName: user.fullName,
      userDocument: user.document,
    }));
  };

  // Handler para selecionar plano
  const selectPlan = (plan: Plan) => {
    setData((prev) => ({
      ...prev,
      planId: plan.id,
      plan,
    }));
  };

  // Criar assinatura (mock)
  const handleCreateContract = () => {
    console.log('Creating subscription:', { contractNumber, ...data });
    alert(`Assinatura ${contractNumber} criada com sucesso! (mock)`);
    router.push('/assinaturas');
  };

  // Formatar data
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
      <Header title="Nova Assinatura" />

      <div className="flex-1 overflow-auto p-6">
        {/* Stepper */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isPast = STEPS.findIndex((s) => s.id === currentStep) > index;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => (isPast || isActive) && goToStep(step.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[var(--color-brand-light)] text-[var(--color-brand)]'
                        : isPast
                        ? 'text-[var(--color-success)] cursor-pointer'
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
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        isPast ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border-primary)]'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Conteúdo do Step */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Área principal */}
          <div className="lg:col-span-2">
            {/* Step 1: Selecionar Cliente */}
            {currentStep === 'user' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                  Selecionar Cliente
                </h2>
                <p className="text-[var(--color-text-secondary)] mb-4">
                  Busque e selecione o cliente para vincular à assinatura.
                </p>

                <div className="relative mb-4">
                  <Input
                    placeholder="Buscar por nome, CPF ou email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors text-left ${
                        data.userId === user.id
                          ? 'border-[var(--color-brand)] bg-[var(--color-brand-light)]'
                          : 'border-[var(--color-border-primary)] hover:bg-[var(--color-bg-tertiary)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-secondary)]">
                          {user.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-[var(--color-text-primary)]">{user.fullName}</div>
                          <div className="text-sm text-[var(--color-text-tertiary)]">{user.document}</div>
                        </div>
                      </div>
                      {data.userId === user.id && (
                        <svg className="w-5 h-5 text-[var(--color-brand)]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Step 2: Selecionar Plano */}
            {currentStep === 'plan' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                  Selecionar Plano
                </h2>
                <p className="text-[var(--color-text-secondary)] mb-4">
                  Escolha o plano que será contratado.
                </p>

                <div className="relative mb-4">
                  <Input
                    placeholder="Buscar por nome ou categoria..."
                    value={planSearch}
                    onChange={(e) => setPlanSearch(e.target.value)}
                    className="pl-10"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                  {filteredPlans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => selectPlan(plan)}
                      className={`p-4 rounded-lg border transition-colors text-left ${
                        data.planId === plan.id
                          ? 'border-[var(--color-brand)] bg-[var(--color-brand-light)]'
                          : 'border-[var(--color-border-primary)] hover:bg-[var(--color-bg-tertiary)]'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-[var(--color-text-primary)]">{plan.name}</div>
                          <div className="text-sm text-[var(--color-text-tertiary)]">{plan.category}</div>
                        </div>
                        {data.planId === plan.id && (
                          <svg className="w-5 h-5 text-[var(--color-brand)]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="text-lg font-bold text-[var(--color-brand)]">
                        {formatPrice(getMonthlyPrice(plan))}/mês
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {plan.features.slice(0, 3).map((f) => (
                          <Badge key={f.id} variant="secondary">
                            {f.name}
                          </Badge>
                        ))}
                        {plan.features.length > 3 && (
                          <Badge variant="secondary">+{plan.features.length - 3}</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Step 3: Condições */}
            {currentStep === 'conditions' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                  Condições da Assinatura
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Data de início */}
                  <div>
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={data.startDate}
                      onChange={(e) => setData((prev) => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>

                  {/* Dia de vencimento */}
                  <div>
                    <Label htmlFor="paymentDay">Dia de Vencimento</Label>
                    <Input
                      id="paymentDay"
                      type="number"
                      min={1}
                      max={28}
                      value={data.paymentDayOfMonth}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          paymentDayOfMonth: Math.min(28, Math.max(1, parseInt(e.target.value) || 1)),
                        }))
                      }
                    />
                  </div>

                  {/* Tipo de desconto */}
                  <div>
                    <Label htmlFor="discountType">Desconto na Mensalidade</Label>
                    <select
                      id="discountType"
                      value={data.discountType}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          discountType: e.target.value as 'percentage' | 'fixed' | 'none',
                          discountValue: e.target.value === 'none' ? 0 : prev.discountValue,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-primary)] 
                               bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]
                               focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                    >
                      <option value="none">Sem desconto</option>
                      <option value="percentage">Porcentagem (%)</option>
                      <option value="fixed">Valor fixo (R$)</option>
                    </select>
                  </div>

                  {/* Valor do desconto */}
                  {data.discountType !== 'none' && (
                    <div>
                      <Label htmlFor="discountValue">
                        Valor do Desconto {data.discountType === 'percentage' ? '(%)' : '(R$)'}
                      </Label>
                      <Input
                        id="discountValue"
                        type="number"
                        min={0}
                        max={data.discountType === 'percentage' ? 100 : undefined}
                        value={data.discountValue}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            discountValue: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  )}

                  {/* Motivo do desconto */}
                  {data.discountType !== 'none' && (
                    <div className="md:col-span-2">
                      <Label htmlFor="discountReason">Motivo do Desconto</Label>
                      <Input
                        id="discountReason"
                        placeholder="Ex: Fidelidade, Promoção, Indicação..."
                        value={data.discountReason}
                        onChange={(e) => setData((prev) => ({ ...prev, discountReason: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* Desconto na matrícula */}
                  <div>
                    <Label htmlFor="enrollmentDiscount">Desconto na Matrícula (R$)</Label>
                    <Input
                      id="enrollmentDiscount"
                      type="number"
                      min={0}
                      max={data.plan ? getEnrollmentFee(data.plan) : 0}
                      value={data.enrollmentFeeDiscount}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          enrollmentFeeDiscount: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>

                  {/* Método de assinatura */}
                  <div>
                    <Label htmlFor="signatureMethod">Método de Assinatura</Label>
                    <select
                      id="signatureMethod"
                      value={data.signatureMethod}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          signatureMethod: e.target.value as SignatureMethod,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-primary)] 
                               bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]
                               focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                    >
                      {Object.entries(SIGNATURE_METHOD_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notas internas */}
                  <div className="md:col-span-2">
                    <Label htmlFor="notes">Notas Internas (opcional)</Label>
                    <textarea
                      id="notes"
                      rows={3}
                      placeholder="Observações internas sobre a assinatura..."
                      value={data.internalNotes}
                      onChange={(e) => setData((prev) => ({ ...prev, internalNotes: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-primary)] 
                               bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]
                               focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]
                               resize-none"
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Step 4: Revisão */}
            {currentStep === 'review' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
                  Revisar Assinatura
                </h2>

                {/* Cliente */}
                <div className="mb-6 pb-6 border-b border-[var(--color-border-primary)]">
                  <h3 className="font-medium text-[var(--color-text-secondary)] mb-2">Cliente</h3>
                  <div className="text-lg font-semibold text-[var(--color-text-primary)]">{data.userName}</div>
                  <div className="text-[var(--color-text-tertiary)]">{data.userDocument}</div>
                </div>

                {/* Plano */}
                <div className="mb-6 pb-6 border-b border-[var(--color-border-primary)]">
                  <h3 className="font-medium text-[var(--color-text-secondary)] mb-2">Plano</h3>
                  <div className="text-lg font-semibold text-[var(--color-text-primary)]">{data.plan?.name}</div>
                  <div className="text-[var(--color-text-tertiary)]">{data.plan?.category}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {data.plan?.features.map((f) => (
                      <Badge key={f.id} variant="secondary">
                        {f.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Valores */}
                <div className="mb-6 pb-6 border-b border-[var(--color-border-primary)]">
                  <h3 className="font-medium text-[var(--color-text-secondary)] mb-3">Valores</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Mensalidade Base</span>
                      <span className="text-[var(--color-text-primary)]">
                        {formatPrice(calculatedValues?.basePrice || 0)}
                      </span>
                    </div>
                    {data.discountType !== 'none' && (
                      <div className="flex justify-between text-[var(--color-success)]">
                        <span>
                          Desconto ({data.discountReason || data.discountType === 'percentage' ? `${data.discountValue}%` : formatPrice(data.discountValue)})
                        </span>
                        <span>
                          -{data.discountType === 'percentage'
                            ? formatPrice(((calculatedValues?.basePrice || 0) * data.discountValue) / 100)
                            : formatPrice(data.discountValue)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-[var(--color-text-primary)]">Mensalidade Final</span>
                      <span className="text-[var(--color-brand)]">
                        {formatPrice(calculatedValues?.finalPrice || 0)}
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--color-border-primary)]">
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-secondary)]">Taxa de Matrícula</span>
                        <span className="text-[var(--color-text-primary)]">
                          {formatPrice(calculatedValues?.enrollmentFee || 0)}
                        </span>
                      </div>
                      {data.enrollmentFeeDiscount > 0 && (
                        <div className="flex justify-between text-[var(--color-success)]">
                          <span>Desconto na Matrícula</span>
                          <span>-{formatPrice(data.enrollmentFeeDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold">
                        <span className="text-[var(--color-text-primary)]">Matrícula Final</span>
                        <span className="text-[var(--color-text-primary)]">
                          {formatPrice(calculatedValues?.finalEnrollmentFee || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalhes */}
                <div>
                  <h3 className="font-medium text-[var(--color-text-secondary)] mb-3">Detalhes</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[var(--color-text-tertiary)]">Data de Início</span>
                      <div className="text-[var(--color-text-primary)]">{formatDate(data.startDate)}</div>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-tertiary)]">Dia de Vencimento</span>
                      <div className="text-[var(--color-text-primary)]">Dia {data.paymentDayOfMonth}</div>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-tertiary)]">Fidelidade</span>
                      <div className="text-[var(--color-text-primary)]">{data.plan?.contractRules.minimumCommitment} meses</div>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-tertiary)]">Assinatura</span>
                      <div className="text-[var(--color-text-primary)]">{SIGNATURE_METHOD_LABELS[data.signatureMethod]}</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar - Resumo */}
          <div>
            <Card className="p-4 sticky top-6">
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Resumo da Assinatura</h3>
              
              <div className="text-sm text-[var(--color-text-tertiary)] mb-4">
                Número: <span className="font-mono text-[var(--color-text-primary)]">{contractNumber}</span>
              </div>

              <div className="space-y-3 mb-6">
                {data.userName && (
                  <div className="flex items-center gap-2 p-2 bg-[var(--color-bg-secondary)] rounded-lg">
                    <svg className="w-5 h-5 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-[var(--color-text-primary)]">{data.userName}</span>
                  </div>
                )}
                {data.plan && (
                  <div className="flex items-center gap-2 p-2 bg-[var(--color-bg-secondary)] rounded-lg">
                    <svg className="w-5 h-5 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <span className="text-[var(--color-text-primary)]">{data.plan.name}</span>
                  </div>
                )}
                {calculatedValues && (
                  <div className="flex items-center justify-between p-2 bg-[var(--color-brand-light)] rounded-lg">
                    <span className="text-[var(--color-brand)]">Valor Mensal</span>
                    <span className="font-bold text-[var(--color-brand)]">
                      {formatPrice(calculatedValues.finalPrice)}
                    </span>
                  </div>
                )}
              </div>

              {/* Navegação */}
              <div className="flex gap-2">
                {currentStep !== 'user' && (
                  <Button variant="secondary" onClick={goPrev} className="flex-1">
                    Voltar
                  </Button>
                )}
                {currentStep !== 'review' ? (
                  <Button onClick={goNext} disabled={!canProceed} className="flex-1">
                    Continuar
                  </Button>
                ) : (
                  <Button onClick={handleCreateContract} className="flex-1">
                    Criar Assinatura
                  </Button>
                )}
              </div>

              <Button
                variant="ghost"
                onClick={() => router.push('/assinaturas')}
                className="w-full mt-2"
              >
                Cancelar
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
