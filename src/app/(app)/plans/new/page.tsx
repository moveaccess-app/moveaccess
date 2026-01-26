'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Input, Button, Card, Badge, Label } from '@/components/ui';
import {
  createEmptyPlan,
  BILLING_CYCLE_LABELS,
  PLAN_CATEGORIES,
  USER_TYPE_LABELS,
  CHARGE_TYPE_LABELS,
  DEFAULT_FEATURES,
  WEEKDAY_LABELS,
  type Plan,
  type PlanPricing,
  type BillingCycle,
  type ChargeType,
  type UserTypeAllowed,
  type PlanFeature,
} from '@/mocks/plansMock';

// ============================================
// COMPONENTES DE SEÇÃO
// ============================================

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        {description && (
          <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>
        )}
      </div>
      {children}
    </Card>
  );
}

// ============================================
// COMPONENTE DE TOGGLE
// ============================================

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div 
        className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
          checked ? 'bg-[var(--element-primary)]' : 'bg-[var(--background-tertiary)]'
        }`}
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
      >
        <div 
          className={`w-5 h-5 rounded-full bg-white shadow transition-transform mt-0.5 ${
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        {description && (
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

// ============================================
// PÁGINA DE CRIAÇÃO
// ============================================

type FormData = ReturnType<typeof createEmptyPlan>;

export default function NewPlanPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(createEmptyPlan());
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // Update handlers
  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updatePricing = useCallback((cycle: BillingCycle, field: keyof PlanPricing, value: number | boolean) => {
    setFormData(prev => ({
      ...prev,
      pricing: prev.pricing.map(p => 
        p.cycle === cycle ? { ...p, [field]: value } : p
      ),
    }));
  }, []);

  const updateAccessRules = useCallback(<K extends keyof FormData['accessRules']>(
    field: K, 
    value: FormData['accessRules'][K]
  ) => {
    setFormData(prev => ({
      ...prev,
      accessRules: { ...prev.accessRules, [field]: value },
    }));
  }, []);

  const updateContractRules = useCallback(<K extends keyof FormData['contractRules']>(
    field: K, 
    value: FormData['contractRules'][K]
  ) => {
    setFormData(prev => ({
      ...prev,
      contractRules: { ...prev.contractRules, [field]: value },
    }));
  }, []);

  const updateOnboardingBehavior = useCallback(<K extends keyof FormData['onboardingBehavior']>(
    field: K, 
    value: FormData['onboardingBehavior'][K]
  ) => {
    setFormData(prev => ({
      ...prev,
      onboardingBehavior: { ...prev.onboardingBehavior, [field]: value },
    }));
  }, []);

  const updateEnrollmentFee = useCallback(<K extends keyof FormData['enrollmentFee']>(
    field: K, 
    value: FormData['enrollmentFee'][K]
  ) => {
    setFormData(prev => ({
      ...prev,
      enrollmentFee: { ...prev.enrollmentFee, [field]: value },
    }));
  }, []);

  const toggleFeature = useCallback((featureId: string) => {
    setSelectedFeatures(prev => {
      if (prev.includes(featureId)) {
        return prev.filter(id => id !== featureId);
      }
      return [...prev, featureId];
    });
  }, []);

  const toggleUserType = useCallback((userType: UserTypeAllowed) => {
    setFormData(prev => {
      const current = prev.userTypesAllowed;
      if (current.includes(userType)) {
        return { ...prev, userTypesAllowed: current.filter(t => t !== userType) };
      }
      return { ...prev, userTypesAllowed: [...current, userType] };
    });
  }, []);

  const toggleDay = useCallback((day: number) => {
    setFormData(prev => {
      const current = prev.accessRules.allowedDays;
      const newDays = current.includes(day)
        ? current.filter(d => d !== day)
        : [...current, day].sort();
      return {
        ...prev,
        accessRules: { ...prev.accessRules, allowedDays: newDays },
      };
    });
  }, []);

  const handleSave = useCallback((asDraft: boolean) => {
    // Montar features a partir das selecionadas
    const features: PlanFeature[] = selectedFeatures
      .map(id => DEFAULT_FEATURES.find(f => f.id === id))
      .filter((f): f is PlanFeature => f !== undefined);

    const newPlan: Plan = {
      ...formData,
      id: `plan-${Date.now()}`,
      features,
      status: asDraft ? 'draft' : 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      stats: {
        activeContracts: 0,
        totalRevenue: 0,
        conversionRate: 0,
      },
    };

    // Em produção, salvaria no backend
    console.log('Plano criado:', newPlan);
    alert(`Plano "${formData.name}" ${asDraft ? 'salvo como rascunho' : 'criado'} com sucesso!`);
    router.push('/plans');
  }, [formData, selectedFeatures, router]);

  const handleCancel = useCallback(() => {
    router.push('/plans');
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--background-secondary)]">
      <Header title="Novo Plano" />
      
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        
        {/* ========== IDENTIDADE ========== */}
        <Section title="Identidade do Plano" description="Informações básicas que definem o plano">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Plano *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Ex: Plano Premium"
              />
            </div>
            
            <div>
              <Label htmlFor="shortDescription">Descrição Curta</Label>
              <Input
                id="shortDescription"
                value={formData.shortDescription || ''}
                onChange={(e) => updateField('shortDescription', e.target.value)}
                placeholder="Ex: Acesso completo com benefícios exclusivos"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição Completa</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Descreva o plano em detalhes..."
                className="w-full h-24 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm"
                >
                  {PLAN_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label>Tipo de Cobrança</Label>
                <div className="flex gap-2 mt-2">
                  {(['recurring', 'single'] as ChargeType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateField('chargeType', type)}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm transition-colors ${
                        formData.chargeType === type
                          ? 'bg-[var(--element-primary)] text-white'
                          : 'bg-[var(--background-secondary)] text-[var(--text-secondary)] hover:bg-[var(--background-tertiary)]'
                      }`}
                    >
                      {CHARGE_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label>Público Permitido</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {(['student', 'personal', 'guest'] as UserTypeAllowed[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleUserType(type)}
                    className={`py-2 px-4 rounded-lg text-sm transition-colors ${
                      formData.userTypesAllowed.includes(type)
                        ? 'bg-[var(--element-primary)] text-white'
                        : 'bg-[var(--background-secondary)] text-[var(--text-secondary)] hover:bg-[var(--background-tertiary)]'
                    }`}
                  >
                    {USER_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ========== PREÇOS ========== */}
        <Section title="Preços" description="Defina os valores para cada ciclo de cobrança">
          <div className="space-y-4">
            {formData.pricing.map(pricing => (
              <div 
                key={pricing.cycle}
                className={`p-4 rounded-lg border transition-colors ${
                  pricing.enabled 
                    ? 'border-[var(--element-primary)] bg-[var(--element-primary)]/5' 
                    : 'border-[var(--border-default)] bg-[var(--background-secondary)]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={pricing.enabled}
                      onChange={(e) => updatePricing(pricing.cycle, 'enabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="font-medium text-[var(--text-primary)]">
                      {BILLING_CYCLE_LABELS[pricing.cycle]}
                    </span>
                  </div>
                  {pricing.discountPercentage > 0 && (
                    <Badge variant="success" className="text-xs">
                      -{pricing.discountPercentage}%
                    </Badge>
                  )}
                </div>
                
                {pricing.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={pricing.price}
                        onChange={(e) => updatePricing(pricing.cycle, 'price', Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Desconto (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={pricing.discountPercentage}
                        onChange={(e) => updatePricing(pricing.cycle, 'discountPercentage', Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ========== TAXA DE MATRÍCULA ========== */}
        <Section title="Taxa de Matrícula" description="Valor cobrado na adesão ao plano">
          <div className="space-y-4">
            <Toggle
              label="Cobrar taxa de matrícula"
              description="Valor adicional cobrado na primeira mensalidade"
              checked={formData.enrollmentFee.enabled}
              onChange={(checked) => updateEnrollmentFee('enabled', checked)}
            />
            
            {formData.enrollmentFee.enabled && (
              <>
                <div>
                  <Label>Valor da Matrícula (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.enrollmentFee.value}
                    onChange={(e) => updateEnrollmentFee('value', Number(e.target.value))}
                  />
                </div>
                
                <Toggle
                  label="Permitir desconto no onboarding"
                  description="A academia pode aplicar descontos via link de cadastro"
                  checked={formData.enrollmentFee.allowDiscount}
                  onChange={(checked) => updateEnrollmentFee('allowDiscount', checked)}
                />
              </>
            )}
          </div>
        </Section>

        {/* ========== RECURSOS INCLUSOS ========== */}
        <Section title="Recursos Inclusos" description="Benefícios oferecidos neste plano">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {DEFAULT_FEATURES.map(feature => (
              <button
                key={feature.id}
                type="button"
                onClick={() => toggleFeature(feature.id)}
                className={`p-3 rounded-lg text-sm text-left transition-colors ${
                  selectedFeatures.includes(feature.id)
                    ? 'bg-[var(--element-primary)] text-white'
                    : 'bg-[var(--background-secondary)] text-[var(--text-secondary)] hover:bg-[var(--background-tertiary)]'
                }`}
              >
                {feature.name}
              </button>
            ))}
          </div>
        </Section>

        {/* ========== REGRAS DE ACESSO ========== */}
        <Section title="Regras de Acesso" description="Defina quando e como o usuário pode acessar">
          <div className="space-y-4">
            <Toggle
              label="Acesso 24 horas"
              description="O usuário pode acessar a qualquer momento"
              checked={formData.accessRules.is24Hours}
              onChange={(checked) => updateAccessRules('is24Hours', checked)}
            />
            
            {!formData.accessRules.is24Hours && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Horário de Início</Label>
                  <Input
                    type="time"
                    value={formData.accessRules.allowedHours.start}
                    onChange={(e) => updateAccessRules('allowedHours', {
                      ...formData.accessRules.allowedHours,
                      start: e.target.value,
                    })}
                  />
                </div>
                <div>
                  <Label>Horário de Término</Label>
                  <Input
                    type="time"
                    value={formData.accessRules.allowedHours.end}
                    onChange={(e) => updateAccessRules('allowedHours', {
                      ...formData.accessRules.allowedHours,
                      end: e.target.value,
                    })}
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Dias Permitidos</Label>
              <div className="flex gap-2 mt-2">
                {WEEKDAY_LABELS.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleDay(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      formData.accessRules.allowedDays.includes(index)
                        ? 'bg-[var(--element-primary)] text-white'
                        : 'bg-[var(--background-secondary)] text-[var(--text-secondary)] hover:bg-[var(--background-tertiary)]'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Check-ins por dia (0 = ilimitado)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.accessRules.dailyCheckInLimit}
                  onChange={(e) => updateAccessRules('dailyCheckInLimit', Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Intervalo entre check-ins (min)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.accessRules.checkInCooldown}
                  onChange={(e) => updateAccessRules('checkInCooldown', Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* ========== REGRAS CONTRATUAIS ========== */}
        <Section title="Regras Contratuais" description="Termos e condições do contrato">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fidelidade Mínima (meses)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.contractRules.minimumCommitment}
                  onChange={(e) => updateContractRules('minimumCommitment', Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Multa por Cancelamento (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.contractRules.earlyTerminationFee}
                  onChange={(e) => updateContractRules('earlyTerminationFee', Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label>Aviso Prévio para Cancelamento (dias)</Label>
              <Input
                type="number"
                min="0"
                value={formData.contractRules.cancellationNoticeDays}
                onChange={(e) => updateContractRules('cancellationNoticeDays', Number(e.target.value))}
              />
            </div>

            <Toggle
              label="Renovação Automática"
              description="O contrato renova automaticamente ao final do período"
              checked={formData.contractRules.autoRenewal}
              onChange={(checked) => updateContractRules('autoRenewal', checked)}
            />
          </div>
        </Section>

        {/* ========== COMPORTAMENTO NO ONBOARDING ========== */}
        <Section title="Comportamento no Onboarding" description="Como o plano se comporta durante o cadastro">
          <div className="space-y-4">
            <Toggle
              label="Selecionável pelo usuário"
              description="O usuário pode escolher este plano durante o cadastro"
              checked={formData.onboardingBehavior.userSelectable}
              onChange={(checked) => updateOnboardingBehavior('userSelectable', checked)}
            />

            <Toggle
              label="Exige aprovação da academia"
              description="A academia deve aprovar antes de ativar o usuário"
              checked={formData.onboardingBehavior.requiresApproval}
              onChange={(checked) => updateOnboardingBehavior('requiresApproval', checked)}
            />

            <Toggle
              label="Exige pagamento imediato"
              description="O usuário deve pagar para concluir o cadastro"
              checked={formData.onboardingBehavior.requiresImmediatePayment}
              onChange={(checked) => updateOnboardingBehavior('requiresImmediatePayment', checked)}
            />

            <Toggle
              label="Libera acesso imediatamente"
              description="Acesso é liberado assim que o cadastro é concluído"
              checked={formData.onboardingBehavior.immediateAccessAfterCompletion}
              onChange={(checked) => updateOnboardingBehavior('immediateAccessAfterCompletion', checked)}
            />

            <div>
              <Label>Período de Trial (dias, 0 = sem trial)</Label>
              <Input
                type="number"
                min="0"
                value={formData.onboardingBehavior.trialDays}
                onChange={(e) => updateOnboardingBehavior('trialDays', Number(e.target.value))}
              />
            </div>

            <div className="pt-4 border-t border-[var(--divider-primary)]">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Exibição no catálogo</p>
              
              <Toggle
                label="Mostrar no catálogo público"
                description="O plano aparece para novos usuários"
                checked={formData.onboardingBehavior.showInPublicCatalog}
                onChange={(checked) => updateOnboardingBehavior('showInPublicCatalog', checked)}
              />

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <Label>Ordem no catálogo</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.onboardingBehavior.catalogOrder}
                    onChange={(e) => updateOnboardingBehavior('catalogOrder', Number(e.target.value))}
                  />
                </div>

                <div className="flex items-end">
                  <Toggle
                    label="Popular"
                    checked={formData.onboardingBehavior.isPopular}
                    onChange={(checked) => updateOnboardingBehavior('isPopular', checked)}
                  />
                </div>

                <div className="flex items-end">
                  <Toggle
                    label="Melhor custo"
                    checked={formData.onboardingBehavior.isBestValue}
                    onChange={(checked) => updateOnboardingBehavior('isBestValue', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ========== AÇÕES ========== */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleCancel}>
              Cancelar
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleSave(true)}>
                Salvar como Rascunho
              </Button>
              <Button onClick={() => handleSave(false)}>
                Criar Plano
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
