'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Label, Card, CardContent, Logo } from '@/components/ui';
import {
  getSetupState,
  updateAcademySetup,
  updateUnitSetup,
  saveBillingStep,
  createPlansSetup,
  skipPlanStep,
  completeSetup,
  type SetupState,
} from '@/lib/auth/setupService';
import {
  Building2,
  MapPin,
  CreditCard,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Zap,
  SkipForward,
} from 'lucide-react';
import { capture } from '@/lib/analytics';

// ============================================================================
// TYPES
// ============================================================================

interface StepDef {
  id: string;
  label: string;
  icon: React.ElementType;
}

const STEPS: StepDef[] = [
  { id: 'academy', label: 'Academia', icon: Building2 },
  { id: 'unit', label: 'Unidade', icon: MapPin },
  { id: 'billing', label: 'Cobrança', icon: CreditCard },
  { id: 'plan', label: 'Planos', icon: Calendar },
  { id: 'review', label: 'Revisão', icon: CheckCircle },
];

interface AcademyForm {
  tradeName: string;
  phone: string;
  email: string;
  cnpj: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

interface UnitForm {
  id: string;
  name: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

interface PlanForm {
  name: string;
  price: string;
  billingCycle: 'monthly' | 'yearly' | 'custom';
}

type PlanSetupMode = 'templates' | 'custom';

// ============================================================================
// HELPERS
// ============================================================================

function formatCNPJ(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function formatCEP(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function formatCurrency(value: string): string {
  const num = value.replace(/\D/g, '');
  if (!num) return '';
  const cents = parseInt(num, 10);
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrency(formatted: string): number {
  const clean = formatted.replace(/\./g, '').replace(',', '.');
  return parseFloat(clean) || 0;
}

// ============================================================================
// PLAN TEMPLATES
// ============================================================================

const PLAN_TEMPLATES = [
  {
    id: 'monthly',
    name: 'Plano Mensal',
    price: '149,90',
    billingCycle: 'monthly' as const,
    popular: true,
    helper: 'Para alunos com cobrança recorrente mês a mês.',
  },
  {
    id: 'quarterly',
    name: 'Plano Trimestral',
    price: '399,90',
    billingCycle: 'custom' as const,
    popular: false,
    helper: 'Boa opção para pacotes com compromisso de 3 meses.',
  },
  {
    id: 'yearly',
    name: 'Plano Anual',
    price: '1.199,90',
    billingCycle: 'yearly' as const,
    popular: false,
    helper: 'Ideal para alunos com pagamento antecipado anual.',
  },
];

// ============================================================================
// PROGRESS BAR COMPONENT
// ============================================================================

function ProgressBar({ currentStep, steps }: { currentStep: number; steps: StepDef[] }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <React.Fragment key={step.id}>
            {index > 0 && (
              <div
                className="hidden sm:block w-8 h-0.5 transition-colors duration-300"
                style={{
                  backgroundColor: isCompleted
                    ? 'var(--status-positive)'
                    : 'var(--divider-primary)',
                }}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0"
                style={{
                  backgroundColor: isCompleted
                    ? 'var(--status-positive)'
                    : isCurrent
                    ? 'var(--element-primary)'
                    : 'var(--background-tertiary)',
                  color: isCompleted || isCurrent
                    ? 'var(--background-primary)'
                    : 'var(--element-secondary)',
                }}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className="hidden sm:inline text-xs font-medium transition-colors duration-300"
                style={{
                  color: isCurrent
                    ? 'var(--element-primary)'
                    : 'var(--element-secondary)',
                }}
              >
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================

function StepAcademy({
  form,
  onChange,
}: {
  form: AcademyForm;
  onChange: (f: AcademyForm) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--element-primary)' }}>
          Dados da sua academia
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--element-secondary)' }}>
          Comece com os dados principais da academia. Você pode complementar ou ajustar depois.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="s-tradeName" className="text-sm font-semibold">
            Nome da academia *
          </Label>
          <Input
            id="s-tradeName"
            value={form.tradeName}
            onChange={(e) => onChange({ ...form, tradeName: e.target.value })}
            placeholder="Ex: Move Fitness"
            autoFocus
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-phone" className="text-sm font-semibold">Telefone</Label>
          <Input
            id="s-phone"
            value={form.phone}
            onChange={(e) => onChange({ ...form, phone: formatPhone(e.target.value) })}
            placeholder="(11) 99999-9999"
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-email" className="text-sm font-semibold">E-mail</Label>
          <Input
            id="s-email"
            type="email"
            value={form.email}
            onChange={(e) => onChange({ ...form, email: e.target.value })}
            placeholder="contato@academia.com"
            className="h-11"
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="s-cnpj" className="text-sm font-semibold">
            CNPJ <span style={{ color: 'var(--element-secondary)' }}>(opcional)</span>
          </Label>
          <Input
            id="s-cnpj"
            value={form.cnpj}
            onChange={(e) => onChange({ ...form, cnpj: formatCNPJ(e.target.value) })}
            placeholder="00.000.000/0001-00"
            className="h-11"
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--element-primary)' }}>
          Endereço <span style={{ color: 'var(--element-secondary)' }}>(opcional)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="s-street" className="text-xs">Rua</Label>
            <Input id="s-street" value={form.street} onChange={(e) => onChange({ ...form, street: e.target.value })} placeholder="Av. Paulista" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-number" className="text-xs">Número</Label>
            <Input id="s-number" value={form.number} onChange={(e) => onChange({ ...form, number: e.target.value })} placeholder="1000" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-neighborhood" className="text-xs">Bairro</Label>
            <Input id="s-neighborhood" value={form.neighborhood} onChange={(e) => onChange({ ...form, neighborhood: e.target.value })} placeholder="Centro" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-city" className="text-xs">Cidade</Label>
            <Input id="s-city" value={form.city} onChange={(e) => onChange({ ...form, city: e.target.value })} placeholder="São Paulo" className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-state" className="text-xs">Estado</Label>
            <Input id="s-state" value={form.state} onChange={(e) => onChange({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })} placeholder="SP" maxLength={2} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-zip" className="text-xs">CEP</Label>
            <Input id="s-zip" value={form.zipCode} onChange={(e) => onChange({ ...form, zipCode: formatCEP(e.target.value) })} placeholder="00000-000" className="h-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepUnit({
  form,
  onChange,
  academyAddress,
}: {
  form: UnitForm;
  onChange: (f: UnitForm) => void;
  academyAddress: AcademyForm;
}) {
  const [copied, setCopied] = useState(false);

  function copyFromAcademy() {
    onChange({
      ...form,
      street: academyAddress.street,
      number: academyAddress.number,
      neighborhood: academyAddress.neighborhood,
      city: academyAddress.city,
      state: academyAddress.state,
      zipCode: academyAddress.zipCode,
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--element-primary)' }}>
          Unidade principal
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--element-secondary)' }}>
          Cadastre a unidade que vai começar a operar no piloto. Você pode adicionar outras depois.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="u-name" className="text-sm font-semibold">Nome da unidade *</Label>
        <Input
          id="u-name"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="Ex: Unidade Centro"
          autoFocus
          className="h-11"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--element-primary)' }}>
            Endereço da unidade
          </p>
          {academyAddress.street && (
            <Button type="button" variant="ghost" size="sm" onClick={copyFromAcademy} className="text-xs">
              {copied ? '✓ Copiado' : 'Copiar da academia'}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="u-street" className="text-xs">Rua</Label>
            <Input id="u-street" value={form.street} onChange={(e) => onChange({ ...form, street: e.target.value })} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-number" className="text-xs">Número</Label>
            <Input id="u-number" value={form.number} onChange={(e) => onChange({ ...form, number: e.target.value })} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-neighborhood" className="text-xs">Bairro</Label>
            <Input id="u-neighborhood" value={form.neighborhood} onChange={(e) => onChange({ ...form, neighborhood: e.target.value })} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-city" className="text-xs">Cidade</Label>
            <Input id="u-city" value={form.city} onChange={(e) => onChange({ ...form, city: e.target.value })} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-state" className="text-xs">Estado</Label>
            <Input id="u-state" value={form.state} onChange={(e) => onChange({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })} maxLength={2} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-zip" className="text-xs">CEP</Label>
            <Input id="u-zip" value={form.zipCode} onChange={(e) => onChange({ ...form, zipCode: formatCEP(e.target.value) })} className="h-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepBilling({
  choice,
  onChoose,
}: {
  choice: 'now' | 'later' | null;
  onChoose: (c: 'now' | 'later') => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--element-primary)' }}>
          Como sua academia vai cobrar os alunos
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--element-secondary)' }}>
          Defina se você vai começar com cobrança manual ou preparar a integração com o Asaas para automatizar recebimentos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={() => onChoose('now')}
          className="p-5 rounded-xl border-2 text-left transition-all"
          style={{
            borderColor: choice === 'now' ? 'var(--status-info)' : 'var(--divider-primary)',
            backgroundColor: choice === 'now' ? 'var(--status-info-background, rgba(59,130,246,0.08))' : 'transparent',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--status-info-background, rgba(59,130,246,0.1))', color: 'var(--status-info)' }}
            >
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--element-primary)' }}>
                Já tenho conta no Asaas
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--element-secondary)' }}>
                Após concluir o setup, configure sua API Key em Configurações → Integrações para ativar cobranças automáticas.
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChoose('later')}
          className="p-5 rounded-xl border-2 text-left transition-all"
          style={{
            borderColor: choice === 'later' ? 'var(--status-info)' : 'var(--divider-primary)',
            backgroundColor: choice === 'later' ? 'var(--status-info-background, rgba(59,130,246,0.08))' : 'transparent',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--background-tertiary)', color: 'var(--element-secondary)' }}
            >
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--element-primary)' }}>
                Configurar depois
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--element-secondary)' }}>
                Você pode usar cobranças manuais agora e configurar o Asaas a qualquer momento.
              </p>
            </div>
          </div>
        </button>
      </div>

      <div
        className="p-4 rounded-lg text-xs"
        style={{ backgroundColor: 'var(--background-tertiary)', color: 'var(--element-secondary)' }}
      >
        <p className="font-semibold mb-1" style={{ color: 'var(--element-primary)' }}>
          Não tem conta no Asaas?
        </p>
        <p>
          Crie uma conta gratuita em{' '}
          <a
            href="https://www.asaas.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: 'var(--status-info)' }}
          >
            asaas.com
          </a>
          {' '}para habilitar cobranças automáticas, PIX, boleto e cartão de crédito.
        </p>
      </div>
    </div>
  );
}

function StepPlan({
  mode,
  onModeChange,
  selectedTemplateIds,
  onToggleTemplate,
  form,
  onChange,
  plansCount,
}: {
  mode: PlanSetupMode;
  onModeChange: (mode: PlanSetupMode) => void;
  selectedTemplateIds: string[];
  onToggleTemplate: (templateId: string) => void;
  form: PlanForm;
  onChange: (f: PlanForm) => void;
  plansCount: number;
}) {
  const selectedCount = selectedTemplateIds.length;
  const hasExistingPlans = plansCount > 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--element-primary)' }}>
          Escolha os planos da sua academia
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--element-secondary)' }}>
          {hasExistingPlans
            ? 'Sua academia já tem planos ativos. Se quiser, adicione mais opções iniciais para oferecer aos alunos.'
            : 'Escolha os planos iniciais que sua academia deseja oferecer aos alunos. Você pode começar com mais de um agora e ajustar depois.'}
        </p>
      </div>

      <div
        className="rounded-xl border p-4 text-sm"
        style={{
          borderColor: 'var(--divider-primary)',
          backgroundColor: 'var(--background-tertiary)',
          color: 'var(--element-secondary)',
        }}
      >
        <p className="font-semibold mb-1" style={{ color: 'var(--element-primary)' }}>
          Importante
        </p>
        <p>
          Estes são os planos que sua academia vai oferecer aos alunos. Não é a cobrança do MoveAccess.
        </p>
      </div>

      {mode === 'templates' && (
        <>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--element-primary)' }}>
              Modelos iniciais para seus alunos
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--element-secondary)' }}>
              Selecione um ou mais modelos. O preço exibido é o valor que sua academia cobrará do aluno.
            </p>
            <p className="text-xs mt-2 font-medium" style={{ color: 'var(--element-secondary)' }}>
              {selectedCount > 0
                ? `${selectedCount} modelo(s) selecionado(s)`
                : 'Nenhum modelo selecionado ainda'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLAN_TEMPLATES.map((t) => {
              const isSelected = selectedTemplateIds.includes(t.id);

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onToggleTemplate(t.id)}
                  className="relative rounded-xl border-2 p-4 text-left transition-all"
                  style={{
                    borderColor: isSelected ? 'var(--status-info)' : 'var(--divider-primary)',
                    backgroundColor: isSelected ? 'var(--status-info-background, rgba(59,130,246,0.08))' : 'transparent',
                  }}
                  aria-pressed={isSelected}
                >
                  {t.popular && (
                    <span
                      className="absolute -top-2.5 left-4 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--status-positive)', color: 'var(--background-primary)' }}
                    >
                      Popular
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--element-primary)' }}>
                        {t.name}
                      </p>
                      <p className="text-lg font-bold mt-1" style={{ color: 'var(--element-primary)' }}>
                        R$ {t.price}
                      </p>
                    </div>
                    <div
                      className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: isSelected ? 'var(--status-info)' : 'var(--divider-primary)',
                        backgroundColor: isSelected ? 'var(--status-info)' : 'transparent',
                        color: 'var(--background-primary)',
                      }}
                    >
                      {isSelected && <CheckCircle className="w-4 h-4" />}
                    </div>
                  </div>

                  <p className="text-xs mt-2 font-medium" style={{ color: 'var(--element-primary)' }}>
                    Cobrado do aluno · {t.billingCycle === 'monthly' ? 'mensal' : t.billingCycle === 'yearly' ? 'anual' : 'trimestral'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--element-secondary)' }}>
                    {t.helper}
                  </p>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div>
        <button
          type="button"
          onClick={() => onModeChange(mode === 'templates' ? 'custom' : 'templates')}
          className="text-xs font-medium underline"
          style={{ color: 'var(--element-secondary)' }}
        >
          {mode === 'templates' ? 'Criar um plano personalizado em vez de usar modelos' : 'Voltar para modelos prontos'}
        </button>

        {mode === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div className="sm:col-span-2">
              <p className="text-xs" style={{ color: 'var(--element-secondary)' }}>
                Crie um plano inicial personalizado para oferecer aos seus alunos.
              </p>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="p-name" className="text-xs">Nome do plano</Label>
              <Input id="p-name" value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-price" className="text-xs">Preço (R$)</Label>
              <Input
                id="p-price"
                value={form.price}
                onChange={(e) => onChange({ ...form, price: formatCurrency(e.target.value) })}
                placeholder="0,00"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-cycle" className="text-xs">Ciclo</Label>
              <select
                id="p-cycle"
                value={form.billingCycle}
                onChange={(e) => onChange({ ...form, billingCycle: e.target.value as PlanForm['billingCycle'] })}
                className="w-full h-10 rounded-md border px-3 text-sm"
                style={{
                  backgroundColor: 'var(--background-primary)',
                  borderColor: 'var(--divider-primary)',
                  color: 'var(--element-primary)',
                }}
              >
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepReview({
  academy,
  unit,
  planSummary,
  billing,
}: {
  academy: AcademyForm;
  unit: UnitForm;
  planSummary: { value: string; detail: string; done: boolean };
  billing: 'now' | 'later' | null;
}) {
  const items = [
    {
      label: 'Academia',
      value: academy.tradeName,
      detail: [academy.phone, academy.email].filter(Boolean).join(' · '),
      icon: Building2,
      done: !!academy.tradeName,
    },
    {
      label: 'Unidade',
      value: unit.name,
      detail: [unit.street, unit.number, unit.city].filter(Boolean).join(', '),
      icon: MapPin,
      done: !!unit.name,
    },
    {
      label: 'Cobrança',
      value: billing === 'now' ? 'Asaas (configurar após setup)' : 'Cobrança manual',
      detail: billing === 'now' ? 'Configure a API Key em Configurações → Integrações' : 'Você pode ativar cobrança automática depois',
      icon: CreditCard,
      done: true,
    },
    {
      label: 'Planos',
      value: planSummary.value,
      detail: planSummary.detail,
      icon: Calendar,
      done: planSummary.done,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--element-primary)' }}>
          Tudo pronto!
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--element-secondary)' }}>
          Revise o essencial para começar a operar. Você pode ajustar esses dados depois no painel.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-start gap-3 p-4 rounded-xl border"
              style={{ borderColor: 'var(--divider-primary)' }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: item.done ? 'var(--status-positive-background, rgba(34,197,94,0.1))' : 'var(--background-tertiary)',
                  color: item.done ? 'var(--status-positive)' : 'var(--element-secondary)',
                }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{ color: 'var(--element-secondary)' }}>
                  {item.label}
                </p>
                <p className="font-semibold text-sm" style={{ color: 'var(--element-primary)' }}>
                  {item.value}
                </p>
                {item.detail && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--element-secondary)' }}>
                    {item.detail}
                  </p>
                )}
              </div>
              {item.done && <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--status-positive)' }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function SetupWizardPage() {
  const router = useRouter();
  const { isAuthenticated, isStaff, isLoading: authLoading, currentUser, refreshSession } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [setupState, setSetupState] = useState<SetupState | null>(null);

  // Forms
  const [academyForm, setAcademyForm] = useState<AcademyForm>({
    tradeName: '', phone: '', email: '', cnpj: '',
    street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '',
  });
  const [unitForm, setUnitForm] = useState<UnitForm>({
    id: '', name: 'Unidade Principal',
    street: '', number: '', neighborhood: '', city: '', state: '', zipCode: '',
  });
  const [billingChoice, setBillingChoice] = useState<'now' | 'later' | null>(null);
  const [planMode, setPlanMode] = useState<PlanSetupMode>('templates');
  const [selectedPlanTemplateIds, setSelectedPlanTemplateIds] = useState<string[]>([]);
  const [planForm, setPlanForm] = useState<PlanForm>({
    name: '', price: '', billingCycle: 'monthly',
  });

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !isStaff) {
      router.push('/login');
      return;
    }
    // If setup is already completed, go to home
    if (currentUser?.tenancy.setupCompleted === true) {
      router.push('/home');
    }
  }, [authLoading, isAuthenticated, isStaff, currentUser, router]);

  // Load setup state
  const loadState = useCallback(async () => {
    setIsLoading(true);
    try {
      const state = await getSetupState();
      if (!state) return;

      setSetupState(state);

      // Pre-fill academy form
      setAcademyForm({
        tradeName: state.academy.tradeName,
        phone: state.academy.phone ? formatPhone(state.academy.phone) : '',
        email: state.academy.email,
        cnpj: state.academy.cnpj ? formatCNPJ(state.academy.cnpj) : '',
        street: state.academy.address?.street || '',
        number: state.academy.address?.number || '',
        neighborhood: state.academy.address?.neighborhood || '',
        city: state.academy.address?.city || '',
        state: state.academy.address?.state || '',
        zipCode: state.academy.address?.zipCode ? formatCEP(state.academy.address.zipCode) : '',
      });

      // Pre-fill unit form
      if (state.unit) {
        setUnitForm({
          id: state.unit.id,
          name: state.unit.name,
          street: state.unit.address?.street || '',
          number: state.unit.address?.number || '',
          neighborhood: state.unit.address?.neighborhood || '',
          city: state.unit.address?.city || '',
          state: state.unit.address?.state || '',
          zipCode: state.unit.address?.zipCode ? formatCEP(state.unit.address.zipCode) : '',
        });
      }

      // Resume at saved step
      setCurrentStep(Math.min(state.setupStep, 4));

      // Track first wizard open
      if (state.setupStep === 0) {
        capture('setup_started', {});
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isStaff) {
      loadState();
    }
  }, [authLoading, isAuthenticated, isStaff, loadState]);

  // Step validation
  function validateCurrentStep(): string | null {
    if (currentStep === 0) {
      if (!academyForm.tradeName.trim()) return 'Nome da academia é obrigatório';
    }
    if (currentStep === 1) {
      if (!unitForm.name.trim()) return 'Nome da unidade é obrigatório';
    }
    if (currentStep === 2) {
      if (!billingChoice) return 'Selecione uma opção de cobrança';
    }
    if (currentStep === 3 && planMode === 'custom') {
      const hasAnyCustomValue = !!planForm.name.trim() || !!planForm.price.trim();
      if (hasAnyCustomValue && (!planForm.name.trim() || !planForm.price.trim())) {
        return 'Preencha nome e valor do plano personalizado ou volte para os modelos prontos';
      }
    }
    return null;
  }

  // Save step
  async function saveStep(): Promise<boolean> {
    setError('');
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return false;
    }

    setIsSaving(true);
    try {
      let result: { success: boolean; error?: string };

      switch (currentStep) {
        case 0: {
          const address: Record<string, string> = {};
          if (academyForm.street) address.street = academyForm.street;
          if (academyForm.number) address.number = academyForm.number;
          if (academyForm.neighborhood) address.neighborhood = academyForm.neighborhood;
          if (academyForm.city) address.city = academyForm.city;
          if (academyForm.state) address.state = academyForm.state;
          if (academyForm.zipCode) address.zipCode = academyForm.zipCode.replace(/\D/g, '');

          result = await updateAcademySetup({
            tradeName: academyForm.tradeName.trim(),
            phone: academyForm.phone.replace(/\D/g, '') || undefined,
            email: academyForm.email.trim() || undefined,
            cnpj: academyForm.cnpj.replace(/\D/g, '') || undefined,
            address: Object.keys(address).length > 0 ? address : undefined,
          });
          break;
        }
        case 1: {
          const address: Record<string, string> = {};
          if (unitForm.street) address.street = unitForm.street;
          if (unitForm.number) address.number = unitForm.number;
          if (unitForm.neighborhood) address.neighborhood = unitForm.neighborhood;
          if (unitForm.city) address.city = unitForm.city;
          if (unitForm.state) address.state = unitForm.state;
          if (unitForm.zipCode) address.zipCode = unitForm.zipCode.replace(/\D/g, '');

          result = await updateUnitSetup(unitForm.id, {
            name: unitForm.name.trim(),
            address: Object.keys(address).length > 0 ? address : undefined,
          });
          break;
        }
        case 2:
          result = await saveBillingStep();
          break;
        case 3: {
          const plansToCreate =
            planMode === 'templates'
              ? PLAN_TEMPLATES.filter((template) => selectedPlanTemplateIds.includes(template.id)).map((template) => ({
                  name: template.name,
                  price: parseCurrency(template.price),
                  billingCycle: template.billingCycle,
                }))
              : planForm.name.trim() && planForm.price
              ? [
                  {
                    name: planForm.name.trim(),
                    price: parseCurrency(planForm.price),
                    billingCycle: planForm.billingCycle,
                  },
                ]
              : [];

          if (plansToCreate.length > 0) {
            result = await createPlansSetup(plansToCreate);

            if (result.success) {
              setSetupState((prev) =>
                prev
                  ? { ...prev, plansCount: prev.plansCount + plansToCreate.length }
                  : prev
              );
              setSelectedPlanTemplateIds([]);
              setPlanMode('templates');
              setPlanForm({ name: '', price: '', billingCycle: 'monthly' });
            }
          } else {
            result = await skipPlanStep();
          }
          break;
        }
        default:
          result = { success: true };
      }

      if (!result.success) {
        setError(result.error || 'Erro ao salvar');
        return false;
      }
      return true;
    } catch {
      setError('Erro inesperado. Tente novamente.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleNext() {
    const saved = await saveStep();
    if (!saved) return;

    capture('setup_step_completed', {
      step_number: currentStep + 1,
      step_name: STEPS[currentStep].id,
    });

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
      setError('');
    }
  }

  async function handleFinish() {
    setIsSaving(true);
    setError('');
    try {
      const result = await completeSetup();
      if (result.success) {
        capture('setup_completed', { total_steps: STEPS.length });
        // Refresh auth so setupCompleted updates
        await refreshSession();
        router.push('/home');
      } else {
        setError(result.error || 'Erro ao finalizar');
      }
    } catch {
      setError('Erro inesperado.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setError('');
    }
  }

  async function handleSkipPlan() {
    setIsSaving(true);
    const result = await skipPlanStep();
    setIsSaving(false);
    if (result.success) {
      capture('setup_step_skipped', { step_number: 4, step_name: 'plan' });
      setSelectedPlanTemplateIds([]);
      setPlanMode('templates');
      setPlanForm({ name: '', price: '', billingCycle: 'monthly' });
      setCurrentStep(4);
    }
  }

  const planTemplatesSelected = PLAN_TEMPLATES.filter((template) => selectedPlanTemplateIds.includes(template.id));
  const planSummary = (() => {
    if (planTemplatesSelected.length > 0) {
      return {
        value: `${planTemplatesSelected.length} plano(s) inicial(is) selecionado(s)`,
        detail: planTemplatesSelected.map((template) => template.name).join(' · '),
        done: true,
      };
    }

    if (planForm.name.trim() && planForm.price) {
      return {
        value: planForm.name.trim(),
        detail: `R$ ${planForm.price} · Plano da academia para os alunos`,
        done: true,
      };
    }

    const existingPlans = setupState?.plansCount || 0;
    if (existingPlans > 0) {
      return {
        value: `${existingPlans} plano(s) cadastrado(s)`,
        detail: 'Você pode editar ou criar mais planos depois no painel',
        done: true,
      };
    }

    return {
      value: 'Nenhum plano criado',
      detail: 'Você pode configurar os planos da academia depois',
      done: false,
    };
  })();

  const nextButtonLabel = (() => {
    if (currentStep === STEPS.length - 1) return 'Entrar no sistema';
    if (currentStep !== 3) return 'Próximo';
    if (planMode === 'templates' && selectedPlanTemplateIds.length > 0) return 'Salvar planos e continuar';
    if (planMode === 'custom' && planForm.name.trim() && planForm.price) return 'Salvar plano e continuar';
    return 'Continuar sem criar planos';
  })();

  // Loading
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: 'var(--element-secondary)' }} />
          <p style={{ color: 'var(--element-secondary)' }}>Carregando configuração...</p>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!isAuthenticated || !isStaff) return null;

  const isLastStep = currentStep === STEPS.length - 1;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--background-secondary)' }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: 'var(--background-primary)', borderColor: 'var(--divider-primary)' }}
      >
        {/* Progress line */}
        <div className="h-1 w-full" style={{ backgroundColor: 'var(--background-tertiary)' }}>
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, backgroundColor: 'var(--status-positive)' }}
          />
        </div>

        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo variant="icon" size="sm" />
          <ProgressBar currentStep={currentStep} steps={STEPS} />
          <div className="w-8" /> {/* Spacer */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center p-4 sm:p-8">
        <Card className="w-full max-w-2xl border" style={{ borderColor: 'var(--divider-primary)' }}>
          <CardContent className="p-6 sm:p-8">
            {currentStep === 0 && <StepAcademy form={academyForm} onChange={setAcademyForm} />}
            {currentStep === 1 && <StepUnit form={unitForm} onChange={setUnitForm} academyAddress={academyForm} />}
            {currentStep === 2 && <StepBilling choice={billingChoice} onChoose={setBillingChoice} />}
            {currentStep === 3 && (
              <StepPlan
                mode={planMode}
                onModeChange={setPlanMode}
                selectedTemplateIds={selectedPlanTemplateIds}
                onToggleTemplate={(templateId) => {
                  setSelectedPlanTemplateIds((current) =>
                    current.includes(templateId)
                      ? current.filter((id) => id !== templateId)
                      : [...current, templateId]
                  );
                }}
                form={planForm}
                onChange={setPlanForm}
                plansCount={setupState?.plansCount || 0}
              />
            )}
            {currentStep === 4 && (
              <StepReview
                academy={academyForm}
                unit={unitForm}
                planSummary={planSummary}
                billing={billingChoice}
              />
            )}

            {/* Error */}
            {error && (
              <div
                className="mt-4 p-3 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'var(--status-negative-background)',
                  color: 'var(--status-negative)',
                  border: '1px solid var(--status-negative)',
                }}
              >
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: 'var(--divider-primary)' }}>
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0 || isSaving}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>

              <div className="flex items-center gap-2">
                {currentStep === 3 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkipPlan}
                    disabled={isSaving}
                    className="gap-1 text-sm"
                  >
                    <SkipForward className="w-4 h-4" />
                    Pular
                  </Button>
                )}

                {isLastStep ? (
                  <Button
                    type="button"
                    onClick={handleFinish}
                    disabled={isSaving}
                    className="gap-2 px-6"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Finalizando...
                      </>
                    ) : (
                      <>
                        {nextButtonLabel}
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSaving}
                    className="gap-1 px-6"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {currentStep === 3 ? 'Salvando planos...' : 'Salvando...'}
                      </>
                    ) : (
                      <>
                        {nextButtonLabel}
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs" style={{ color: 'var(--element-secondary)' }}>
          Passo {currentStep + 1} de {STEPS.length} · Seu progresso é salvo automaticamente
        </p>
      </div>
    </div>
  );
}
