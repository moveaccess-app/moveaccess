'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getPolicies, updatePolicies, type Policies } from '@/mocks/settingsMock';

// Toggle component (fora do render)
function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer py-3 border-b border-[var(--divider-primary)] last:border-0">
      <div className="relative mt-0.5 flex-shrink-0">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
        <div className={`w-10 h-6 rounded-full transition-colors ${checked ? 'bg-[var(--status-info)]' : 'bg-[var(--element-disabled)]'}`}>
          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-4' : ''}`} />
        </div>
      </div>
      <div className="flex-1">
        <span className="text-sm font-medium text-[var(--element-primary)]">{label}</span>
        {hint && <p className="text-xs text-[var(--element-secondary)] mt-0.5">{hint}</p>}
      </div>
    </label>
  );
}

// NumberSelect component (fora do render)
function NumberSelect({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
  hint?: string;
}) {
  return (
    <div className="py-3 border-b border-[var(--divider-primary)] last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <span className="text-sm font-medium text-[var(--element-primary)]">{label}</span>
          {hint && <p className="text-xs text-[var(--element-secondary)] mt-0.5">{hint}</p>}
        </div>
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] text-sm text-[var(--element-primary)]"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function PoliciesPage() {
  const originalPolicies = useMemo(() => getPolicies(), []);
  const [formData, setFormData] = useState<Policies>(originalPolicies);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (section: keyof Policies, field: string, value: boolean | number) => {
    setHasChanges(true);
    setSuccessMessage('');
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, unknown>),
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    updatePolicies(formData, 'staff_001');
    setIsSaving(false);
    setHasChanges(false);
    setSuccessMessage('Configurações salvas!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background-secondary)]">
      <Header title="Regras de Negócio" />

      <div className="flex-1 overflow-auto">
        <form onSubmit={handleSubmit} className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[var(--element-secondary)]">
            <Link href="/settings" className="hover:text-[var(--status-info)]">Configurações</Link>
            <span>/</span>
            <span className="text-[var(--element-primary)]">Regras</span>
          </div>

          {/* Feedback */}
          {successMessage && (
            <div className="p-3 rounded-lg bg-[var(--status-positive-background)] text-[var(--status-positive)] text-sm">
              {successMessage}
            </div>
          )}

          {/* Descrição */}
          <p className="text-sm text-[var(--element-secondary)]">
            Configure como sua academia lida com cobranças, inadimplência e acesso.
          </p>

          {/* Inadimplência */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-[var(--background-tertiary)] border-b border-[var(--divider-primary)]">
              <h2 className="font-semibold text-[var(--element-primary)]">Inadimplência</h2>
              <p className="text-xs text-[var(--element-secondary)]">O que acontece quando um aluno atrasa o pagamento</p>
            </div>
            <div className="p-4">
              <Toggle
                checked={formData.delinquency.blockAccess}
                onChange={(v) => handleChange('delinquency', 'blockAccess', v)}
                label="Bloquear acesso quando inadimplente"
                hint="O aluno não conseguirá fazer check-in se tiver pendências"
              />
              <NumberSelect
                label="Dias de tolerância"
                value={formData.delinquency.toleranceDays}
                onChange={(v) => handleChange('delinquency', 'toleranceDays', v)}
                options={[
                  { value: 0, label: 'Bloquear no vencimento' },
                  { value: 3, label: '3 dias' },
                  { value: 5, label: '5 dias' },
                  { value: 7, label: '1 semana' },
                  { value: 15, label: '15 dias' },
                ]}
                hint="Tempo que o aluno ainda pode acessar após o vencimento"
              />
            </div>
          </Card>

          {/* Cobrança */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-[var(--background-tertiary)] border-b border-[var(--divider-primary)]">
              <h2 className="font-semibold text-[var(--element-primary)]">Cobrança</h2>
              <p className="text-xs text-[var(--element-secondary)]">Configurações padrão para novas mensalidades</p>
            </div>
            <div className="p-4">
              <NumberSelect
                label="Dia de vencimento padrão"
                value={formData.billing.defaultDueDay}
                onChange={(v) => handleChange('billing', 'defaultDueDay', v)}
                options={[5, 10, 15, 20, 25].map((d) => ({ value: d, label: `Dia ${d}` }))}
                hint="Novos alunos terão este vencimento por padrão"
              />
            </div>
          </Card>

          {/* Reativação */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-[var(--background-tertiary)] border-b border-[var(--divider-primary)]">
              <h2 className="font-semibold text-[var(--element-primary)]">Reativação</h2>
              <p className="text-xs text-[var(--element-secondary)]">Retorno de alunos que cancelaram</p>
            </div>
            <div className="p-4">
              <Toggle
                checked={formData.reactivation.allowAfterCancellation}
                onChange={(v) => handleChange('reactivation', 'allowAfterCancellation', v)}
                label="Permitir reativação após cancelamento"
                hint="Alunos podem retornar após terem cancelado"
              />
              <Toggle
                checked={formData.reactivation.requireNewContract}
                onChange={(v) => handleChange('reactivation', 'requireNewContract', v)}
                label="Exigir nova assinatura de contrato"
                hint="Aluno precisa assinar um novo contrato ao retornar"
              />
              <Toggle
                checked={formData.reactivation.clearPendingDebts}
                onChange={(v) => handleChange('reactivation', 'clearPendingDebts', v)}
                label="Exigir quitação de débitos"
                hint="Pendências devem ser pagas antes de reativar"
              />
            </div>
          </Card>

          {/* Check-in */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-[var(--background-tertiary)] border-b border-[var(--divider-primary)]">
              <h2 className="font-semibold text-[var(--element-primary)]">Check-in</h2>
              <p className="text-xs text-[var(--element-secondary)]">Controle de acesso às unidades</p>
            </div>
            <div className="p-4">
              <Toggle
                checked={formData.checkIn.allowMultipleCheckInsDay}
                onChange={(v) => handleChange('checkIn', 'allowMultipleCheckInsDay', v)}
                label="Permitir múltiplos acessos por dia"
                hint="Aluno pode fazer check-in mais de uma vez no mesmo dia"
              />
              <Toggle
                checked={formData.checkIn.logAllAttempts}
                onChange={(v) => handleChange('checkIn', 'logAllAttempts', v)}
                label="Registrar tentativas bloqueadas"
                hint="Salvar histórico quando alguém tenta acessar sem permissão"
              />
            </div>
          </Card>

          {/* Botão salvar */}
          {hasChanges && (
            <div className="sticky bottom-4 flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
