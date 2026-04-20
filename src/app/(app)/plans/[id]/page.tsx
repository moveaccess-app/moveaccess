'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Button, Card, Badge, Input, Label, SkeletonCard } from '@/components/ui';
import { toast } from 'sonner';
import {
  archivePlan,
  formatPrice,
  formatPlanUpdatedAt,
  getBillingCycleLabel,
  getPlanById,
  getPlanStatusLabel,
  updatePlan,
  type Plan,
} from '@/lib/plans/plansService';
import {
  formValuesToPlanInput,
  planToFormValues,
  type PlanFormValues,
} from '@/lib/plans/planForm';
import { AccessRuleEditor } from '@/components/plans/AccessRuleEditor';

function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
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

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-[var(--divider-primary)] last:border-0">
      <span className="text-sm text-[var(--text-tertiary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)] text-right">{value}</span>
    </div>
  );
}

function EditFields({ values, onChange }: { values: PlanFormValues; onChange: (field: keyof PlanFormValues, value: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Label htmlFor="name">Nome do plano</Label>
        <Input id="name" value={values.name} onChange={(e) => onChange('name', e.target.value)} />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          value={values.description}
          onChange={(e) => onChange('description', e.target.value)}
          className="w-full h-28 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm resize-none"
        />
      </div>

      <div>
        <Label htmlFor="price">Preço</Label>
        <Input id="price" type="number" min="0" step="0.01" value={values.price} onChange={(e) => onChange('price', e.target.value)} />
      </div>

      <div>
        <Label htmlFor="billingCycle">Ciclo</Label>
        <select
          id="billingCycle"
          value={values.billingCycle}
          onChange={(e) => onChange('billingCycle', e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm"
        >
          <option value="monthly">Mensal</option>
          <option value="yearly">Anual</option>
          <option value="custom">Personalizado</option>
        </select>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={values.status}
          onChange={(e) => onChange('status', e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm"
        >
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>

      <div>
        <Label htmlFor="dailyCheckInLimit">Limite diário de check-ins</Label>
        <Input id="dailyCheckInLimit" type="number" min="0" value={values.dailyCheckInLimit} onChange={(e) => onChange('dailyCheckInLimit', e.target.value)} />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="notes">Observações de acesso</Label>
        <textarea
          id="notes"
          value={values.notes}
          onChange={(e) => onChange('notes', e.target.value)}
          className="w-full h-24 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm resize-none"
          placeholder="Regras extras do plano"
        />
      </div>
    </div>
  );
}

export default function PlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [values, setValues] = useState<PlanFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPlan() {
      setLoading(true);
      const data = await getPlanById(planId);

      if (!active) return;

      setPlan(data);
      setValues(data ? planToFormValues(data) : null);
      setLoading(false);
    }

    void loadPlan();

    return () => {
      active = false;
    };
  }, [planId]);

  const statusVariant = {
    active: 'success' as const,
    inactive: 'warning' as const,
  };

  const handleFieldChange = (field: keyof PlanFormValues, value: string) => {
    setValues((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleSave = async () => {
    if (!values || !plan) return;

    setSaving(true);
    const result = await updatePlan(plan.id, formValuesToPlanInput(values));
    setSaving(false);

    if (!result.success || !result.plan) {
      toast.error(result.error || 'Não foi possível atualizar o plano.');
      return;
    }

    setPlan(result.plan);
    setValues(planToFormValues(result.plan));
    setIsEditing(false);
    toast.success('Plano atualizado com sucesso.');
  };

  const handleArchive = async () => {
    if (!plan) return;

    setSaving(true);
    const result = await archivePlan(plan.id);
    setSaving(false);

    if (!result.success || !result.plan) {
      toast.error(result.error || 'Não foi possível arquivar o plano.');
      return;
    }

    setPlan(result.plan);
    setValues(planToFormValues(result.plan));
    toast.success('Plano arquivado com sucesso.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)]">
        <Header title="Plano" />
        <div className="p-6 max-w-4xl mx-auto space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!plan || !values) {
    return (
      <div className="min-h-screen bg-[var(--background-secondary)]">
        <Header title="Plano não encontrado" />
        <div className="p-6 max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <p className="text-[var(--text-tertiary)] mb-4">O plano solicitado não foi encontrado.</p>
            <Button onClick={() => router.push('/plans')}>Voltar para Planos</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background-secondary)]">
      <Header title={plan.name} />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">{plan.name}</h1>
                <Badge variant={statusVariant[plan.status]}>{getPlanStatusLabel(plan.status)}</Badge>
                <Badge variant="secondary">{getBillingCycleLabel(plan.billingCycle)}</Badge>
              </div>
              <p className="text-[var(--text-secondary)]">{plan.description || 'Sem descrição cadastrada.'}</p>
            </div>

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => {
                    setValues(planToFormValues(plan));
                    setIsEditing(false);
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Editar
                  </Button>
                  {plan.status === 'active' && (
                    <Button variant="destructive" onClick={handleArchive} disabled={saving}>
                      {saving ? 'Processando...' : 'Arquivar'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-[var(--text-tertiary)] mb-1">Preço</p>
            <p className="text-2xl font-bold text-[var(--element-primary)]">{formatPrice(plan.price)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-[var(--text-tertiary)] mb-1">Ciclo</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{getBillingCycleLabel(plan.billingCycle)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-[var(--text-tertiary)] mb-1">Atualizado em</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{formatPlanUpdatedAt(plan.updatedAt)}</p>
          </Card>
        </div>

        <Section title={isEditing ? 'Editar plano' : 'Resumo do plano'}>
          {isEditing ? (
            <EditFields values={values} onChange={handleFieldChange} />
          ) : (
            <div className="space-y-0">
              <InfoRow label="Nome" value={plan.name} />
              <InfoRow label="Descrição" value={plan.description || 'Sem descrição'} />
              <InfoRow label="Preço" value={formatPrice(plan.price)} />
              <InfoRow label="Ciclo" value={getBillingCycleLabel(plan.billingCycle)} />
              <InfoRow label="Status" value={getPlanStatusLabel(plan.status)} />
            </div>
          )}
        </Section>

        <AccessRuleEditor planId={plan.id} academyId={plan.academyId} />

        <Section title="Metadados">
          <div className="space-y-0">
            <InfoRow label="ID" value={plan.id} />
            <InfoRow label="Criado em" value={formatPlanUpdatedAt(plan.createdAt)} />
            <InfoRow label="Atualizado em" value={formatPlanUpdatedAt(plan.updatedAt)} />
          </div>
        </Section>
      </div>
    </div>
  );
}
