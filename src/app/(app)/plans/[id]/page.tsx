'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Button, Card, Badge, Input, Label } from '@/components/ui';
import {
  getPlanById,
  formatPrice,
  formatAllowedDays,
  formatAccessHours,
  BILLING_CYCLE_LABELS,
  PLAN_STATUS_LABELS,
  USER_TYPE_LABELS,
  CHARGE_TYPE_LABELS,
  WEEKDAY_LABELS,
  DEFAULT_FEATURES,
  PLAN_CATEGORIES,
  type Plan,
  type PlanStatus,
  type BillingCycle,
  type ChargeType,
  type UserTypeAllowed,
  type PlanPricing,
  type PlanFeature,
} from '@/mocks/plansMock';

// ============================================
// COMPONENTES AUXILIARES
// ============================================

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex justify-between py-2 border-b border-[var(--divider-primary)] last:border-0">
      <span className="text-sm text-[var(--text-tertiary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

function Section({ title, children, action }: SectionProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        {action}
      </div>
      {children}
    </Card>
  );
}

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
// PÁGINA DE DETALHES
// ============================================

export default function PlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;
  
  const [isEditing, setIsEditing] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(() => getPlanById(planId) || null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(() => 
    plan?.features.map(f => f.id) || []
  );

  // Se plano não existe
  if (!plan) {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)]">
        <Header title="Plano não encontrado" />
        <div className="p-6 max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <p className="text-[var(--text-tertiary)] mb-4">
              O plano solicitado não foi encontrado.
            </p>
            <Button onClick={() => router.push('/plans')}>
              Voltar para Planos
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const statusVariant = {
    active: 'success' as const,
    inactive: 'warning' as const,
    draft: 'secondary' as const,
  };

  // Handlers para edição
  const updatePlan = <K extends keyof Plan>(field: K, value: Plan[K]) => {
    setPlan(prev => prev ? { ...prev, [field]: value } : null);
  };

  const updatePricing = (cycle: BillingCycle, field: keyof PlanPricing, value: number | boolean) => {
    if (!plan) return;
    setPlan({
      ...plan,
      pricing: plan.pricing.map(p => 
        p.cycle === cycle ? { ...p, [field]: value } : p
      ),
    });
  };

  const updateAccessRules = <K extends keyof Plan['accessRules']>(
    field: K, 
    value: Plan['accessRules'][K]
  ) => {
    if (!plan) return;
    setPlan({
      ...plan,
      accessRules: { ...plan.accessRules, [field]: value },
    });
  };

  const updateContractRules = <K extends keyof Plan['contractRules']>(
    field: K, 
    value: Plan['contractRules'][K]
  ) => {
    if (!plan) return;
    setPlan({
      ...plan,
      contractRules: { ...plan.contractRules, [field]: value },
    });
  };

  const updateOnboardingBehavior = <K extends keyof Plan['onboardingBehavior']>(
    field: K, 
    value: Plan['onboardingBehavior'][K]
  ) => {
    if (!plan) return;
    setPlan({
      ...plan,
      onboardingBehavior: { ...plan.onboardingBehavior, [field]: value },
    });
  };

  const updateEnrollmentFee = <K extends keyof Plan['enrollmentFee']>(
    field: K, 
    value: Plan['enrollmentFee'][K]
  ) => {
    if (!plan) return;
    setPlan({
      ...plan,
      enrollmentFee: { ...plan.enrollmentFee, [field]: value },
    });
  };

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => {
      if (prev.includes(featureId)) {
        return prev.filter(id => id !== featureId);
      }
      return [...prev, featureId];
    });
  };

  const toggleUserType = (userType: UserTypeAllowed) => {
    if (!plan) return;
    const current = plan.userTypesAllowed;
    if (current.includes(userType)) {
      updatePlan('userTypesAllowed', current.filter(t => t !== userType));
    } else {
      updatePlan('userTypesAllowed', [...current, userType]);
    }
  };

  const toggleDay = (day: number) => {
    if (!plan) return;
    const current = plan.accessRules.allowedDays;
    const newDays = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort();
    updateAccessRules('allowedDays', newDays);
  };

  const handleStatusChange = (newStatus: PlanStatus) => {
    updatePlan('status', newStatus);
  };

  const handleSave = () => {
    if (!plan) return;
    
    // Atualizar features
    const features: PlanFeature[] = selectedFeatures
      .map(id => DEFAULT_FEATURES.find(f => f.id === id))
      .filter((f): f is PlanFeature => f !== undefined);
    
    const updatedPlan = {
      ...plan,
      features,
      updatedAt: new Date().toISOString(),
    };
    
    setPlan(updatedPlan);
    setIsEditing(false);
    alert('Plano atualizado com sucesso!');
  };

  const handleCancel = () => {
    // Restaurar dados originais
    const original = getPlanById(planId);
    if (original) {
      setPlan(original);
      setSelectedFeatures(original.features.map(f => f.id));
    }
    setIsEditing(false);
  };

  // ========== MODO VISUALIZAÇÃO ==========
  if (!isEditing) {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)]">
        <Header title={plan.name} />
        
        <div className="p-6 max-w-4xl mx-auto space-y-6">
          {/* Header com status */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]">{plan.name}</h1>
                  <Badge variant={statusVariant[plan.status]}>
                    {PLAN_STATUS_LABELS[plan.status]}
                  </Badge>
                  {plan.onboardingBehavior.isPopular && (
                    <Badge variant="default">Popular</Badge>
                  )}
                  {plan.onboardingBehavior.isBestValue && (
                    <Badge variant="secondary">Melhor custo</Badge>
                  )}
                </div>
                <p className="text-[var(--text-secondary)]">{plan.description}</p>
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <span className="text-[var(--text-tertiary)]">
                    Categoria: <span className="text-[var(--text-primary)]">{plan.category}</span>
                  </span>
                  <span className="text-[var(--text-tertiary)]">•</span>
                  <span className="text-[var(--text-tertiary)]">
                    Tipo: <span className="text-[var(--text-primary)]">{CHARGE_TYPE_LABELS[plan.chargeType]}</span>
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
                {plan.status === 'active' ? (
                  <Button variant="destructive" onClick={() => handleStatusChange('inactive')}>
                    Desativar
                  </Button>
                ) : (
                  <Button onClick={() => handleStatusChange('active')}>
                    Ativar
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-[var(--text-tertiary)] mb-1">Contratos Ativos</p>
              <p className="text-2xl font-bold text-[var(--element-primary)]">
                {plan.stats.activeContracts}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-[var(--text-tertiary)] mb-1">Receita Total</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {formatPrice(plan.stats.totalRevenue)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-[var(--text-tertiary)] mb-1">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-[var(--status-positive)]">
                {plan.stats.conversionRate}%
              </p>
            </Card>
          </div>

          {/* Preços */}
          <Section title="Preços">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plan.pricing.filter(p => p.enabled).map(pricing => (
                <div 
                  key={pricing.cycle}
                  className="p-4 rounded-lg bg-[var(--background-secondary)]"
                >
                  <p className="text-sm text-[var(--text-tertiary)] mb-2">
                    {BILLING_CYCLE_LABELS[pricing.cycle]}
                  </p>
                  <p className="text-xl font-bold text-[var(--element-primary)]">
                    {formatPrice(pricing.price)}
                  </p>
                  {pricing.discountPercentage > 0 && (
                    <Badge variant="success" className="mt-2">
                      -{pricing.discountPercentage}%
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            
            {plan.enrollmentFee.enabled && (
              <div className="mt-4 pt-4 border-t border-[var(--divider-primary)]">
                <InfoRow 
                  label="Taxa de Matrícula" 
                  value={formatPrice(plan.enrollmentFee.value)} 
                />
                <InfoRow 
                  label="Permite desconto" 
                  value={plan.enrollmentFee.allowDiscount ? 'Sim' : 'Não'} 
                />
              </div>
            )}
          </Section>

          {/* Recursos */}
          <Section title="Recursos Inclusos">
            <div className="flex flex-wrap gap-2">
              {plan.features.map(feature => (
                <span 
                  key={feature.id}
                  className="px-3 py-1.5 bg-[var(--element-primary)]/10 text-[var(--element-primary)] rounded-lg text-sm"
                >
                  {feature.name}
                </span>
              ))}
              {plan.features.length === 0 && (
                <p className="text-[var(--text-tertiary)]">Nenhum recurso definido</p>
              )}
            </div>
          </Section>

          {/* Público */}
          <Section title="Público Permitido">
            <div className="flex flex-wrap gap-2">
              {plan.userTypesAllowed.map(type => (
                <Badge key={type} variant="secondary">
                  {USER_TYPE_LABELS[type]}
                </Badge>
              ))}
            </div>
          </Section>

          {/* Regras de Acesso */}
          <Section title="Regras de Acesso">
            <div className="space-y-0">
              <InfoRow label="Horário" value={formatAccessHours(plan.accessRules)} />
              <InfoRow label="Dias" value={formatAllowedDays(plan.accessRules.allowedDays)} />
              <InfoRow 
                label="Check-ins por dia" 
                value={plan.accessRules.dailyCheckInLimit === 0 ? 'Ilimitado' : plan.accessRules.dailyCheckInLimit} 
              />
              <InfoRow 
                label="Intervalo entre check-ins" 
                value={plan.accessRules.checkInCooldown === 0 ? 'Sem limite' : `${plan.accessRules.checkInCooldown} min`} 
              />
            </div>
          </Section>

          {/* Regras Contratuais */}
          <Section title="Regras Contratuais">
            <div className="space-y-0">
              <InfoRow label="Fidelidade mínima" value={`${plan.contractRules.minimumCommitment} meses`} />
              <InfoRow label="Multa por cancelamento" value={`${plan.contractRules.earlyTerminationFee}%`} />
              <InfoRow label="Aviso prévio" value={`${plan.contractRules.cancellationNoticeDays} dias`} />
              <InfoRow label="Renovação automática" value={plan.contractRules.autoRenewal ? 'Sim' : 'Não'} />
            </div>
          </Section>

          {/* Comportamento no Onboarding */}
          <Section title="Comportamento no Onboarding">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${plan.onboardingBehavior.userSelectable ? 'bg-[var(--status-positive)]' : 'bg-[var(--text-tertiary)]'}`} />
                  <span className="text-sm">Selecionável pelo usuário</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${plan.onboardingBehavior.requiresApproval ? 'bg-[var(--status-positive)]' : 'bg-[var(--text-tertiary)]'}`} />
                  <span className="text-sm">Exige aprovação da academia</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${plan.onboardingBehavior.requiresImmediatePayment ? 'bg-[var(--status-positive)]' : 'bg-[var(--text-tertiary)]'}`} />
                  <span className="text-sm">Exige pagamento imediato</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${plan.onboardingBehavior.immediateAccessAfterCompletion ? 'bg-[var(--status-positive)]' : 'bg-[var(--text-tertiary)]'}`} />
                  <span className="text-sm">Libera acesso imediato</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${plan.onboardingBehavior.showInPublicCatalog ? 'bg-[var(--status-positive)]' : 'bg-[var(--text-tertiary)]'}`} />
                  <span className="text-sm">Visível no catálogo público</span>
                </div>
                {plan.onboardingBehavior.trialDays > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--status-positive)]" />
                    <span className="text-sm">Trial de {plan.onboardingBehavior.trialDays} dias</span>
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* Metadata */}
          <Card className="p-4 bg-[var(--background-secondary)]">
            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
              <span>Criado em: {new Date(plan.createdAt).toLocaleDateString('pt-BR')}</span>
              <span>Atualizado em: {new Date(plan.updatedAt).toLocaleDateString('pt-BR')}</span>
              <span>Por: {plan.createdBy}</span>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ========== MODO EDIÇÃO ==========
  return (
    <div className="min-h-screen bg-[var(--background-secondary)]">
      <Header title={`Editando: ${plan.name}`} />
      
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Identidade */}
        <Section title="Identidade do Plano">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Plano *</Label>
              <Input
                id="name"
                value={plan.name}
                onChange={(e) => updatePlan('name', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="shortDescription">Descrição Curta</Label>
              <Input
                id="shortDescription"
                value={plan.shortDescription || ''}
                onChange={(e) => updatePlan('shortDescription', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição Completa</Label>
              <textarea
                id="description"
                value={plan.description}
                onChange={(e) => updatePlan('description', e.target.value)}
                className="w-full h-24 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  value={plan.category}
                  onChange={(e) => updatePlan('category', e.target.value)}
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
                      onClick={() => updatePlan('chargeType', type)}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm transition-colors ${
                        plan.chargeType === type
                          ? 'bg-[var(--element-primary)] text-white'
                          : 'bg-[var(--background-secondary)] text-[var(--text-secondary)]'
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
                      plan.userTypesAllowed.includes(type)
                        ? 'bg-[var(--element-primary)] text-white'
                        : 'bg-[var(--background-secondary)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {USER_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Preços */}
        <Section title="Preços">
          <div className="space-y-4">
            {plan.pricing.map(pricing => (
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

        {/* Taxa de Matrícula */}
        <Section title="Taxa de Matrícula">
          <div className="space-y-4">
            <Toggle
              label="Cobrar taxa de matrícula"
              checked={plan.enrollmentFee.enabled}
              onChange={(checked) => updateEnrollmentFee('enabled', checked)}
            />
            
            {plan.enrollmentFee.enabled && (
              <>
                <div>
                  <Label>Valor da Matrícula (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={plan.enrollmentFee.value}
                    onChange={(e) => updateEnrollmentFee('value', Number(e.target.value))}
                  />
                </div>
                
                <Toggle
                  label="Permitir desconto no onboarding"
                  checked={plan.enrollmentFee.allowDiscount}
                  onChange={(checked) => updateEnrollmentFee('allowDiscount', checked)}
                />
              </>
            )}
          </div>
        </Section>

        {/* Recursos Inclusos */}
        <Section title="Recursos Inclusos">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {DEFAULT_FEATURES.map(feature => (
              <button
                key={feature.id}
                type="button"
                onClick={() => toggleFeature(feature.id)}
                className={`p-3 rounded-lg text-sm text-left transition-colors ${
                  selectedFeatures.includes(feature.id)
                    ? 'bg-[var(--element-primary)] text-white'
                    : 'bg-[var(--background-secondary)] text-[var(--text-secondary)]'
                }`}
              >
                {feature.name}
              </button>
            ))}
          </div>
        </Section>

        {/* Regras de Acesso */}
        <Section title="Regras de Acesso">
          <div className="space-y-4">
            <Toggle
              label="Acesso 24 horas"
              checked={plan.accessRules.is24Hours}
              onChange={(checked) => updateAccessRules('is24Hours', checked)}
            />
            
            {!plan.accessRules.is24Hours && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Horário de Início</Label>
                  <Input
                    type="time"
                    value={plan.accessRules.allowedHours.start}
                    onChange={(e) => updateAccessRules('allowedHours', {
                      ...plan.accessRules.allowedHours,
                      start: e.target.value,
                    })}
                  />
                </div>
                <div>
                  <Label>Horário de Término</Label>
                  <Input
                    type="time"
                    value={plan.accessRules.allowedHours.end}
                    onChange={(e) => updateAccessRules('allowedHours', {
                      ...plan.accessRules.allowedHours,
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
                      plan.accessRules.allowedDays.includes(index)
                        ? 'bg-[var(--element-primary)] text-white'
                        : 'bg-[var(--background-secondary)] text-[var(--text-secondary)]'
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
                  value={plan.accessRules.dailyCheckInLimit}
                  onChange={(e) => updateAccessRules('dailyCheckInLimit', Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Intervalo entre check-ins (min)</Label>
                <Input
                  type="number"
                  min="0"
                  value={plan.accessRules.checkInCooldown}
                  onChange={(e) => updateAccessRules('checkInCooldown', Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Regras Contratuais */}
        <Section title="Regras Contratuais">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fidelidade Mínima (meses)</Label>
                <Input
                  type="number"
                  min="0"
                  value={plan.contractRules.minimumCommitment}
                  onChange={(e) => updateContractRules('minimumCommitment', Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Multa por Cancelamento (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={plan.contractRules.earlyTerminationFee}
                  onChange={(e) => updateContractRules('earlyTerminationFee', Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label>Aviso Prévio para Cancelamento (dias)</Label>
              <Input
                type="number"
                min="0"
                value={plan.contractRules.cancellationNoticeDays}
                onChange={(e) => updateContractRules('cancellationNoticeDays', Number(e.target.value))}
              />
            </div>

            <Toggle
              label="Renovação Automática"
              checked={plan.contractRules.autoRenewal}
              onChange={(checked) => updateContractRules('autoRenewal', checked)}
            />
          </div>
        </Section>

        {/* Comportamento no Onboarding */}
        <Section title="Comportamento no Onboarding">
          <div className="space-y-4">
            <Toggle
              label="Selecionável pelo usuário"
              description="O usuário pode escolher este plano durante o cadastro"
              checked={plan.onboardingBehavior.userSelectable}
              onChange={(checked) => updateOnboardingBehavior('userSelectable', checked)}
            />

            <Toggle
              label="Exige aprovação da academia"
              checked={plan.onboardingBehavior.requiresApproval}
              onChange={(checked) => updateOnboardingBehavior('requiresApproval', checked)}
            />

            <Toggle
              label="Exige pagamento imediato"
              checked={plan.onboardingBehavior.requiresImmediatePayment}
              onChange={(checked) => updateOnboardingBehavior('requiresImmediatePayment', checked)}
            />

            <Toggle
              label="Libera acesso imediatamente"
              checked={plan.onboardingBehavior.immediateAccessAfterCompletion}
              onChange={(checked) => updateOnboardingBehavior('immediateAccessAfterCompletion', checked)}
            />

            <div>
              <Label>Período de Trial (dias)</Label>
              <Input
                type="number"
                min="0"
                value={plan.onboardingBehavior.trialDays}
                onChange={(e) => updateOnboardingBehavior('trialDays', Number(e.target.value))}
              />
            </div>

            <Toggle
              label="Mostrar no catálogo público"
              checked={plan.onboardingBehavior.showInPublicCatalog}
              onChange={(checked) => updateOnboardingBehavior('showInPublicCatalog', checked)}
            />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Ordem no catálogo</Label>
                <Input
                  type="number"
                  min="1"
                  value={plan.onboardingBehavior.catalogOrder}
                  onChange={(e) => updateOnboardingBehavior('catalogOrder', Number(e.target.value))}
                />
              </div>

              <div className="flex items-end">
                <Toggle
                  label="Popular"
                  checked={plan.onboardingBehavior.isPopular}
                  onChange={(checked) => updateOnboardingBehavior('isPopular', checked)}
                />
              </div>

              <div className="flex items-end">
                <Toggle
                  label="Melhor custo"
                  checked={plan.onboardingBehavior.isBestValue}
                  onChange={(checked) => updateOnboardingBehavior('isBestValue', checked)}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* Ações */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Alterações
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
