'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Input, Button, Card, Label } from '@/components/ui';
import { toast } from 'sonner';
import { createPlan } from '@/lib/plans/plansService';
import { capture } from '@/lib/analytics';
import {
  createEmptyPlanFormValues,
  formValuesToPlanInput,
  type PlanFormValues,
} from '@/lib/plans/planForm';

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        {description && <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

export default function NewPlanPage() {
  const router = useRouter();
  const [values, setValues] = useState<PlanFormValues>(createEmptyPlanFormValues());
  const [saving, setSaving] = useState(false);

  const updateField = (field: keyof PlanFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!values.name.trim()) {
      toast.error('Informe o nome do plano.');
      return;
    }

    setSaving(true);
    const result = await createPlan(formValuesToPlanInput(values));
    setSaving(false);

    if (!result.success || !result.plan) {
      toast.error(result.error || 'Não foi possível criar o plano.');
      return;
    }

    toast.success('Plano criado com sucesso.');
    capture('first_plan_created', {});
    router.push(`/plans/${result.plan.id}`);
  };

  return (
    <div className="min-h-screen bg-[var(--background-secondary)]">
      <Header title="Novo Plano" />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Section title="Identidade do plano" description="Informações principais do catálogo comercial.">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do plano</Label>
              <Input id="name" value={values.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Ex: Plano Premium" />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                value={values.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full h-28 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm resize-none"
                placeholder="Descreva benefícios e contexto do plano"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Preço</Label>
                <Input id="price" type="number" min="0" step="0.01" value={values.price} onChange={(e) => updateField('price', e.target.value)} />
              </div>

              <div>
                <Label htmlFor="billingCycle">Ciclo</Label>
                <select
                  id="billingCycle"
                  value={values.billingCycle}
                  onChange={(e) => updateField('billingCycle', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm"
                >
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              <div>
                <Label htmlFor="status">Status inicial</Label>
                <select
                  id="status"
                  value={values.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Regras de acesso" description="Após criar o plano, você poderá configurar restrições de unidade, dia e horário na página de detalhes.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dailyCheckInLimit">Limite diário de check-ins</Label>
              <Input id="dailyCheckInLimit" type="number" min="0" value={values.dailyCheckInLimit} onChange={(e) => updateField('dailyCheckInLimit', e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <textarea
                id="notes"
                value={values.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="w-full h-24 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm resize-none"
                placeholder="Ex: acesso somente em horário comercial"
              />
            </div>
          </div>
        </Section>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push('/plans')}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Criar plano'}
          </Button>
        </div>
      </div>
    </div>
  );
}
