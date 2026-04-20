'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  getDelinquencyPolicy,
  updateDelinquencyPolicy,
  type DelinquencyPolicy,
  DELINQUENCY_POLICY_DEFAULTS,
} from '@/lib/settings';

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

// Section placeholder for features not yet implemented
function PlannedSection({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <Card className="overflow-hidden opacity-75">
      <div className="p-4 bg-[var(--background-tertiary)] border-b border-[var(--divider-primary)]">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-[var(--element-primary)]">{title}</h2>
          <Badge variant="secondary">Em breve</Badge>
        </div>
        <p className="text-xs text-[var(--element-secondary)] mt-1">{description}</p>
      </div>
      <div className="p-4">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-[var(--element-disabled)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--element-disabled)] flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs text-[var(--element-disabled)] mt-4">
          Esta configuração estará disponível em uma próxima atualização.
        </p>
      </div>
    </Card>
  );
}

export default function PoliciesPage() {
  // ── Delinquency policy (real data) ───────────────────────────
  const [delinquencyPolicy, setDelinquencyPolicy] = useState<DelinquencyPolicy>(DELINQUENCY_POLICY_DEFAULTS);
  const [delinquencyOriginal, setDelinquencyOriginal] = useState<DelinquencyPolicy>(DELINQUENCY_POLICY_DEFAULTS);
  const [delinquencyLoading, setDelinquencyLoading] = useState(true);
  const [delinquencySaving, setDelinquencySaving] = useState(false);
  const [delinquencyError, setDelinquencyError] = useState('');
  const [delinquencySuccess, setDelinquencySuccess] = useState('');

  const delinquencyHasChanges =
    delinquencyPolicy.blockAccess !== delinquencyOriginal.blockAccess ||
    delinquencyPolicy.graceDays !== delinquencyOriginal.graceDays;

  const loadDelinquency = useCallback(async () => {
    setDelinquencyLoading(true);
    setDelinquencyError('');
    try {
      const policy = await getDelinquencyPolicy();
      setDelinquencyPolicy(policy);
      setDelinquencyOriginal(policy);
    } catch {
      setDelinquencyError('Não foi possível carregar a política de inadimplência.');
    } finally {
      setDelinquencyLoading(false);
    }
  }, []);

  useEffect(() => { void loadDelinquency(); }, [loadDelinquency]);

  const handleSaveDelinquency = async () => {
    setDelinquencySaving(true);
    setDelinquencyError('');
    setDelinquencySuccess('');

    const result = await updateDelinquencyPolicy(delinquencyPolicy, 'current_user');

    setDelinquencySaving(false);

    if (!result.success) {
      setDelinquencyError(result.error || 'Erro ao salvar.');
      return;
    }

    setDelinquencyOriginal({ ...delinquencyPolicy });
    setDelinquencySuccess('Política de inadimplência salva!');
    setTimeout(() => setDelinquencySuccess(''), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background-secondary)]">
      <Header title="Regras de Negócio" />

      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[var(--element-secondary)]">
            <Link href="/settings" className="hover:text-[var(--status-info)]">Configurações</Link>
            <span>/</span>
            <span className="text-[var(--element-primary)]">Regras</span>
          </div>

          <p className="text-sm text-[var(--element-secondary)]">
            Configure como sua academia lida com cobranças, inadimplência e acesso.
          </p>

          {/* ── Inadimplência (REAL DATA) ─────────────────────────── */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-[var(--background-tertiary)] border-b border-[var(--divider-primary)]">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-[var(--element-primary)]">Inadimplência</h2>
                <Badge variant="success">Ativo</Badge>
              </div>
              <p className="text-xs text-[var(--element-secondary)] mt-1">O que acontece quando um aluno atrasa o pagamento</p>
            </div>
            <div className="p-4">
              {delinquencyLoading ? (
                <div className="py-3 space-y-3">
                  <Skeleton height="h-4" width="w-48" />
                  <Skeleton height="h-4" width="w-64" />
                  <Skeleton height="h-4" width="w-32" />
                </div>
              ) : delinquencyError && !delinquencyPolicy.blockAccess && delinquencyPolicy.graceDays === 0 ? (
                <div className="py-3">
                  <p className="text-sm text-[var(--status-negative)]">{delinquencyError}</p>
                  <Button variant="outline" className="mt-2" onClick={() => void loadDelinquency()}>Tentar novamente</Button>
                </div>
              ) : (
                <>
                  {delinquencyError && (
                    <p className="text-sm text-[var(--status-negative)] mb-3">{delinquencyError}</p>
                  )}

                  <Toggle
                    checked={delinquencyPolicy.blockAccess}
                    onChange={(v) => {
                      setDelinquencySuccess('');
                      setDelinquencyError('');
                      setDelinquencyPolicy((prev) => ({ ...prev, blockAccess: v }));
                    }}
                    label="Bloquear acesso quando inadimplente"
                    hint="O aluno não conseguirá fazer check-in se tiver cobranças vencidas"
                  />
                  <NumberSelect
                    label="Dias de tolerância"
                    value={delinquencyPolicy.graceDays}
                    onChange={(v) => {
                      setDelinquencySuccess('');
                      setDelinquencyError('');
                      setDelinquencyPolicy((prev) => ({ ...prev, graceDays: v }));
                    }}
                    options={[
                      { value: 0, label: 'Bloquear no vencimento' },
                      { value: 3, label: '3 dias' },
                      { value: 5, label: '5 dias' },
                      { value: 7, label: '1 semana' },
                      { value: 10, label: '10 dias' },
                      { value: 15, label: '15 dias' },
                      { value: 30, label: '30 dias' },
                    ]}
                    hint="Tempo que o aluno ainda pode acessar após o vencimento"
                  />

                  {delinquencyPolicy.blockAccess && (
                    <div className="mt-3 p-3 rounded-lg bg-[var(--status-alert-background)] text-[var(--status-alert)] text-xs">
                      Alunos com cobranças vencidas há mais de {delinquencyPolicy.graceDays} dia(s) terão o check-in bloqueado automaticamente.
                    </div>
                  )}

                  {!delinquencyPolicy.blockAccess && (
                    <div className="mt-3 p-3 rounded-lg bg-[var(--background-tertiary)] text-[var(--element-secondary)] text-xs">
                      Inadimplência será registrada, mas o acesso não será bloqueado. Você pode ativar o bloqueio a qualquer momento.
                    </div>
                  )}

                  {delinquencySuccess && (
                    <div className="mt-3 p-3 rounded-lg bg-[var(--status-positive-background)] text-[var(--status-positive)] text-sm">
                      {delinquencySuccess}
                    </div>
                  )}

                  {delinquencyHasChanges && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => void handleSaveDelinquency()}
                        disabled={delinquencySaving}
                      >
                        {delinquencySaving ? 'Salvando...' : 'Salvar Inadimplência'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* ── Cobrança (em breve) ───────────────────────────────── */}
          <PlannedSection
            title="Cobrança"
            description="Configurações padrão para novas mensalidades"
            items={[
              'Dia de vencimento padrão',
              'Multa e juros automáticos',
              'Formato de cobrança preferencial',
            ]}
          />

          {/* ── Reativação (em breve) ─────────────────────────────── */}
          <PlannedSection
            title="Reativação"
            description="Retorno de alunos que cancelaram"
            items={[
              'Permitir reativação após cancelamento',
              'Exigir nova assinatura de contrato',
              'Exigir quitação de débitos',
            ]}
          />

          {/* ── Check-in (em breve) ───────────────────────────────── */}
          <PlannedSection
            title="Check-in"
            description="Controle de acesso às unidades"
            items={[
              'Permitir múltiplos acessos por dia',
              'Registrar tentativas bloqueadas',
              'Janela de horário para check-in',
            ]}
          />
        </div>
      </div>
    </div>
  );
}
