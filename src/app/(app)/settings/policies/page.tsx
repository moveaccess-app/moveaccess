'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  BILLING_POLICIES_DEFAULTS,
  getBillingPolicies,
  updateBillingPolicies,
  type BillingPolicies,
} from '@/lib/settings';
import { getCurrentSession } from '@/lib/auth/authService';
import { getEffectiveBillingPolicies } from '@/lib/settings/policies';

function clonePolicies(policies: BillingPolicies): BillingPolicies {
  return {
    delinquency: { ...policies.delinquency },
    billing: {
      dueReminder: { ...policies.billing.dueReminder },
      overdueNotice: { ...policies.billing.overdueNotice },
      preBlock: { ...policies.billing.preBlock },
      escalation: { ...policies.billing.escalation },
      subscriptionExpiring: { ...policies.billing.subscriptionExpiring },
      paymentConfirmed: { ...policies.billing.paymentConfirmed },
      regularization: { ...policies.billing.regularization },
      reactivation: { ...policies.billing.reactivation },
    },
  };
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-start gap-3 rounded-xl border p-4 ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} border-[var(--divider-primary)] bg-[var(--background-primary)]`}>
      <div className="relative mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <div className={`h-6 w-10 rounded-full transition-colors ${checked ? 'bg-[var(--status-info)]' : 'bg-[var(--element-disabled)]'}`}>
          <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--element-primary)]">{label}</p>
        <p className="mt-1 text-xs text-[var(--element-secondary)]">{description}</p>
      </div>
    </label>
  );
}

function NumberSelect({
  label,
  value,
  onChange,
  options,
  hint,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  options: Array<{ value: number; label: string }>;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${disabled ? 'opacity-60' : ''} border-[var(--divider-primary)] bg-[var(--background-primary)]`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--element-primary)]">{label}</p>
          <p className="mt-1 text-xs text-[var(--element-secondary)]">{hint}</p>
        </div>
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          className="rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] px-3 py-2 text-sm text-[var(--element-primary)]"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function PolicySummaryChip({
  title,
  value,
  enabled,
}: {
  title: string;
  value: string;
  enabled: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--divider-primary)] bg-[var(--background-primary)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--element-primary)]">{title}</p>
        <Badge variant={enabled ? 'success' : 'secondary'}>
          {enabled ? 'Ligado' : 'Desligado'}
        </Badge>
      </div>
      <p className="mt-2 text-xs text-[var(--element-secondary)]">{value}</p>
    </div>
  );
}

const GRACE_DAY_OPTIONS = [0, 3, 5, 7, 10, 15, 30].map((value) => ({
  value,
  label: value === 0 ? 'Sem tolerância' : `${value} dia(s)`,
}));

const DUE_REMINDER_OPTIONS = [0, 1, 2, 3, 5, 7, 10, 14, 21, 30].map((value) => ({
  value,
  label: value === 0 ? 'No vencimento' : `${value} dia(s) antes`,
}));

const OVERDUE_OPTIONS = [1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60].map((value) => ({
  value,
  label: `D+${value}`,
}));

const SUBSCRIPTION_OPTIONS = [1, 3, 5, 7, 10, 14, 21, 30, 45, 60].map((value) => ({
  value,
  label: `${value} dia(s) antes`,
}));

const REACTIVATION_WINDOW_OPTIONS = [0, 7, 15, 30, 45, 60, 90, 120, 180, 365].map((value) => ({
  value,
  label: value === 0 ? 'Imediato' : `${value} dia(s)`,
}));

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<BillingPolicies>(clonePolicies(BILLING_POLICIES_DEFAULTS));
  const [originalPolicies, setOriginalPolicies] = useState<BillingPolicies>(clonePolicies(BILLING_POLICIES_DEFAULTS));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const hasChanges = useMemo(
    () => JSON.stringify(policies) !== JSON.stringify(originalPolicies),
    [policies, originalPolicies],
  );

  const applyPolicies = useCallback((nextPolicies: BillingPolicies) => {
    setPolicies(clonePolicies(getEffectiveBillingPolicies(nextPolicies)));
  }, []);

  const updatePoliciesState = useCallback((updater: (current: BillingPolicies) => BillingPolicies) => {
    setErrorMessage('');
    setSuccessMessage('');
    setPolicies((current) => clonePolicies(getEffectiveBillingPolicies(updater(current))));
  }, []);

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const nextPolicies = await getBillingPolicies();
      const effectivePolicies = clonePolicies(getEffectiveBillingPolicies(nextPolicies));
      setPolicies(effectivePolicies);
      setOriginalPolicies(effectivePolicies);
    } catch (error) {
      console.error('[PoliciesPage] Erro ao carregar policies:', error);
      setErrorMessage('Não foi possível carregar a política de cobrança da academia.');
      applyPolicies(clonePolicies(BILLING_POLICIES_DEFAULTS));
      setOriginalPolicies(clonePolicies(BILLING_POLICIES_DEFAULTS));
    } finally {
      setLoading(false);
    }
  }, [applyPolicies]);

  useEffect(() => {
    void loadPolicies();
  }, [loadPolicies]);

  const preBlockOptions = useMemo(() => {
    const baseOptions = [0, 1, 2, 3, 5, 7, 10, 15, 30];
    const graceDays = policies.delinquency.graceDays;
    const filtered = baseOptions.filter((value) => value <= graceDays);

    return (filtered.length ? filtered : [0]).map((value) => ({
      value,
      label: value === 0 ? 'No dia do bloqueio' : `${value} dia(s) antes`,
    }));
  }, [policies.delinquency.graceDays]);

  const escalationOptions = useMemo(() => {
    const minimum = policies.billing.overdueNotice.daysAfterDue + 1;
    const baseOptions = [2, 3, 5, 7, 10, 14, 21, 30, 45, 60, 90, 120];

    return baseOptions
      .filter((value) => value >= minimum)
      .map((value) => ({
        value,
        label: `D+${value}`,
      }));
  }, [policies.billing.overdueNotice.daysAfterDue]);

  const reactivationMaxOptions = useMemo(
    () => REACTIVATION_WINDOW_OPTIONS.filter((option) => option.value >= policies.billing.reactivation.minDaysSinceLoss),
    [policies.billing.reactivation.minDaysSinceLoss],
  );

  const handleSave = async () => {
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const session = await getCurrentSession();
      const userId = session?.user?.id;

      if (!userId) {
        setErrorMessage('Sessão expirada. Faça login novamente.');
        return;
      }

      const result = await updateBillingPolicies(policies, userId);

      if (!result.success) {
        setErrorMessage(result.error || 'Não foi possível salvar a política.');
        return;
      }

      const nextPolicies = result.academy
        ? clonePolicies(getEffectiveBillingPolicies(result.academy.preferences))
        : clonePolicies(policies);

      setPolicies(nextPolicies);
      setOriginalPolicies(nextPolicies);
      setSuccessMessage('Política de cobrança e automação salva com sucesso.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      console.error('[PoliciesPage] Erro ao salvar:', error);
      setErrorMessage('Ocorreu um erro ao salvar as configurações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background-secondary)]">
      <Header title="Regras de Negócio" />

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
          <div className="flex items-center gap-2 text-sm text-[var(--element-secondary)]">
            <Link href="/settings" className="hover:text-[var(--status-info)]">Configurações</Link>
            <span>/</span>
            <span className="text-[var(--element-primary)]">Regras</span>
          </div>

          <Card className="p-5 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-[var(--element-primary)]">Política efetiva de cobrança</h2>
                  <Badge variant="outline">Academia</Badge>
                </div>
                <p className="mt-2 text-sm text-[var(--element-secondary)]">
                  Os valores abaixo mostram a política efetiva usada hoje pela academia. Se um campo nunca foi personalizado,
                  o default seguro do sistema já está aplicado aqui.
                </p>
              </div>
              <div className="rounded-xl bg-[var(--background-tertiary)] px-4 py-3 text-xs text-[var(--element-secondary)] lg:max-w-xs">
                Essas configurações afetam as próximas execuções automáticas. Históricos já enviados e ações já processadas não retroagem automaticamente.
              </div>
            </div>

            {loading ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-xl border border-[var(--divider-primary)] p-4">
                    <Skeleton height="h-4" width="w-32" />
                    <div className="mt-3">
                      <Skeleton height="h-3" width="w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <PolicySummaryChip
                  title="Inadimplência"
                  value={policies.delinquency.blockAccess ? `Bloqueio após ${policies.delinquency.graceDays} dia(s)` : 'Somente monitoramento, sem bloquear acesso'}
                  enabled={policies.delinquency.blockAccess}
                />
                <PolicySummaryChip
                  title="Reminder"
                  value={policies.billing.dueReminder.enabled ? `Dispara ${policies.billing.dueReminder.daysBeforeDue} dia(s) antes do vencimento` : 'Não envia lembrete pré-vencimento'}
                  enabled={policies.billing.dueReminder.enabled}
                />
                <PolicySummaryChip
                  title="Overdue e Escalada"
                  value={`1o aviso em D+${policies.billing.overdueNotice.daysAfterDue} e escalada em D+${policies.billing.escalation.daysOverdue}`}
                  enabled={policies.billing.overdueNotice.enabled || policies.billing.escalation.enabled}
                />
                <PolicySummaryChip
                  title="Reativação"
                  value={policies.billing.reactivation.enabled ? `${policies.billing.reactivation.minDaysSinceLoss} a ${policies.billing.reactivation.maxDaysSinceLoss} dia(s) desde a perda` : 'Win-back desligado'}
                  enabled={policies.billing.reactivation.enabled}
                />
              </div>
            )}
          </Card>

          {successMessage && (
            <div className="rounded-xl border border-[var(--status-positive)] bg-[var(--status-positive-background)] px-4 py-3 text-sm text-[var(--status-positive)]">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-[var(--status-negative)] bg-[var(--status-negative-background)] px-4 py-3 text-sm text-[var(--status-negative)]">
              {errorMessage}
            </div>
          )}

          {loading ? (
            <Card className="p-5 space-y-4">
              <Skeleton height="h-5" width="w-40" />
              <Skeleton height="h-20" width="w-full" />
              <Skeleton height="h-20" width="w-full" />
            </Card>
          ) : (
            <>
              <Card className="p-5 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--element-primary)]">Inadimplência e pré-bloqueio</h2>
                  <p className="mt-1 text-sm text-[var(--element-secondary)]">
                    Defina se o acesso é bloqueado por inadimplência e quanto antes o time deve avisar o aluno sobre a proximidade do bloqueio.
                  </p>
                </div>

                <div className="grid gap-3">
                  <Toggle
                    checked={policies.delinquency.blockAccess}
                    onChange={(value) => updatePoliciesState((current) => ({
                      ...current,
                      delinquency: {
                        ...current.delinquency,
                        blockAccess: value,
                      },
                      billing: {
                        ...current.billing,
                        preBlock: {
                          ...current.billing.preBlock,
                          enabled: value ? current.billing.preBlock.enabled : false,
                        },
                      },
                    }))}
                    label="Bloquear acesso quando houver inadimplência real"
                    description="Usa a política da academia para impedir check-in quando a cobrança vencida já ultrapassou a tolerância configurada."
                  />

                  <NumberSelect
                    label="Dias de tolerância"
                    value={policies.delinquency.graceDays}
                    onChange={(value) => updatePoliciesState((current) => ({
                      ...current,
                      delinquency: {
                        ...current.delinquency,
                        graceDays: value,
                      },
                    }))}
                    options={GRACE_DAY_OPTIONS}
                    hint="Janela em que o aluno ainda pode acessar a academia antes do bloqueio por inadimplência."
                  />

                  <Toggle
                    checked={policies.billing.preBlock.enabled}
                    disabled={!policies.delinquency.blockAccess}
                    onChange={(value) => updatePoliciesState((current) => ({
                      ...current,
                      billing: {
                        ...current.billing,
                        preBlock: {
                          ...current.billing.preBlock,
                          enabled: value,
                        },
                      },
                    }))}
                    label="Avisar antes do bloqueio"
                    description={policies.delinquency.blockAccess
                      ? 'Envia um alerta automático quando o aluno entra na janela final antes do bloqueio.'
                      : 'Ative o bloqueio por inadimplência para liberar o alerta de pré-bloqueio.'}
                  />

                  <NumberSelect
                    label="Dias antes do bloqueio para avisar"
                    value={policies.billing.preBlock.daysBeforeBlock}
                    disabled={!policies.delinquency.blockAccess || !policies.billing.preBlock.enabled}
                    onChange={(value) => updatePoliciesState((current) => ({
                      ...current,
                      billing: {
                        ...current.billing,
                        preBlock: {
                          ...current.billing.preBlock,
                          daysBeforeBlock: value,
                        },
                      },
                    }))}
                    options={preBlockOptions}
                    hint="Essa janela é sempre relativa aos dias de tolerância configurados acima."
                  />
                </div>
              </Card>

              <Card className="p-5 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--element-primary)]">Cobrança e lembretes</h2>
                  <p className="mt-1 text-sm text-[var(--element-secondary)]">
                    Controle quando o sistema lembra o aluno antes do vencimento e quando dispara o primeiro aviso de atraso.
                  </p>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <Toggle
                    checked={policies.billing.dueReminder.enabled}
                    onChange={(value) => updatePoliciesState((current) => ({
                      ...current,
                      billing: {
                        ...current.billing,
                        dueReminder: {
                          ...current.billing.dueReminder,
                          enabled: value,
                        },
                      },
                    }))}
                    label="Reminder pré-vencimento"
                    description="Usa a cobrança pendente para lembrar o aluno antes do vencimento com link de pagamento quando existir."
                  />

                  <NumberSelect
                    label="Quantos dias antes lembrar"
                    value={policies.billing.dueReminder.daysBeforeDue}
                    disabled={!policies.billing.dueReminder.enabled}
                    onChange={(value) => updatePoliciesState((current) => ({
                      ...current,
                      billing: {
                        ...current.billing,
                        dueReminder: {
                          ...current.billing.dueReminder,
                          daysBeforeDue: value,
                        },
                      },
                    }))}
                    options={DUE_REMINDER_OPTIONS}
                    hint="Aplica-se às próximas cobranças pendentes elegíveis."
                  />

                  <Toggle
                    checked={policies.billing.overdueNotice.enabled}
                    onChange={(value) => updatePoliciesState((current) => ({
                      ...current,
                      billing: {
                        ...current.billing,
                        overdueNotice: {
                          ...current.billing.overdueNotice,
                          enabled: value,
                        },
                      },
                    }))}
                    label="Primeiro aviso de atraso"
                    description="Dispara o primeiro contato automático após o vencimento, antes da escalada operacional."
                  />

                  <NumberSelect
                    label="D+ para o primeiro aviso"
                    value={policies.billing.overdueNotice.daysAfterDue}
                    disabled={!policies.billing.overdueNotice.enabled}
                    onChange={(value) => updatePoliciesState((current) => ({
                      ...current,
                      billing: {
                        ...current.billing,
                        overdueNotice: {
                          ...current.billing.overdueNotice,
                          daysAfterDue: value,
                        },
                        escalation: {
                          ...current.billing.escalation,
                          daysOverdue: Math.max(current.billing.escalation.daysOverdue, value + 1),
                        },
                      },
                    }))}
                    options={OVERDUE_OPTIONS}
                    hint="Se a escalada estiver ligada, ela sempre acontece depois desse primeiro aviso."
                  />
                </div>
              </Card>

              <Card className="p-5 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--element-primary)]">Escalada e ciclo da assinatura</h2>
                  <p className="mt-1 text-sm text-[var(--element-secondary)]">
                    Ajuste quando a cobrança vira caso escalado e quando a academia avisa que uma assinatura está perto do fim.
                  </p>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <Toggle
                    checked={policies.billing.escalation.enabled}
                    onChange={(value) => updatePoliciesState((current) => ({
                      ...current,
                      billing: {
                        ...current.billing,
                        escalation: {
                          ...current.billing.escalation,
                          enabled: value,
                        },
                      },
                    }))}
                    label="Escalada de cobrança"
                    description="Move cobranças persistentes para um estágio operacional mais crítico no dispatch e no command center."
                  />

                  <NumberSelect
                    label="D+ para escalada"
                    value={policies.billing.escalation.daysOverdue}
                    disabled={!policies.billing.escalation.enabled}
                    onChange={(value) => updatePoliciesState((current) => ({
                      ...current,
                      billing: {
                        ...current.billing,
                        escalation: {
                          ...current.billing.escalation,
                          daysOverdue: value,
                        },
                      },
                    }))}
                    options={escalationOptions}
                    hint="Cobranças que chegarem aqui passam a ser lidas como escaladas no runtime e no command center."
                  />

                  <Toggle
                    checked={policies.billing.subscriptionExpiring.enabled}
                    onChange={(value) => updatePoliciesState((current) => ({
                      ...current,
                      billing: {
                        ...current.billing,
                        subscriptionExpiring: {
                          ...current.billing.subscriptionExpiring,
                          enabled: value,
                        },
                      },
                    }))}
                    label="Aviso de assinatura expirando"
                    description="Usa o ciclo da subscription para avisar o aluno antes do fim da assinatura ativa."
                  />

                  <NumberSelect
                    label="Dias antes do fim da assinatura"
                    value={policies.billing.subscriptionExpiring.daysBeforeExpiry}
                    disabled={!policies.billing.subscriptionExpiring.enabled}
                    onChange={(value) => updatePoliciesState((current) => ({
                      ...current,
                      billing: {
                        ...current.billing,
                        subscriptionExpiring: {
                          ...current.billing.subscriptionExpiring,
                          daysBeforeExpiry: value,
                        },
                      },
                    }))}
                    options={SUBSCRIPTION_OPTIONS}
                    hint="Avisa enquanto ainda existe tempo para renovar ou ajustar a assinatura."
                  />
                </div>
              </Card>

              <Card className="p-5 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--element-primary)]">Confirmação, regularização e reativação</h2>
                  <p className="mt-1 text-sm text-[var(--element-secondary)]">
                    Controle as comunicações que acontecem depois do pagamento, da regularização da dívida e da perda de assinatura.
                  </p>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <Toggle
                    checked={policies.billing.paymentConfirmed.enabled}
                    onChange={(value) => updatePoliciesState((current) => ({
                      ...current,
                      billing: {
                        ...current.billing,
                        paymentConfirmed: {
                          enabled: value,
                        },
                      },
                    }))}
                    label="Enviar confirmação de pagamento"
                    description="Mantém a resolução operacional do webhook e liga ou desliga somente o e-mail de confirmação ao aluno."
                  />

                  <Toggle
                    checked={policies.billing.regularization.enabled}
                    onChange={(value) => updatePoliciesState((current) => ({
                      ...current,
                      billing: {
                        ...current.billing,
                        regularization: {
                          enabled: value,
                        },
                      },
                    }))}
                    label="Comunicar regularização"
                    description="A resolução operacional continua acontecendo; este toggle controla apenas o envio da comunicação ao aluno quando ele regulariza a situação."
                  />

                  <Toggle
                    checked={policies.billing.reactivation.enabled}
                    onChange={(value) => updatePoliciesState((current) => ({
                      ...current,
                      billing: {
                        ...current.billing,
                        reactivation: {
                          ...current.billing.reactivation,
                          enabled: value,
                        },
                      },
                    }))}
                    label="Ativar win-back de reativação"
                    description="Define se alunos com assinatura cancelada ou expirada entram na janela automática de reativação."
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <NumberSelect
                      label="Janela mínima desde a perda"
                      value={policies.billing.reactivation.minDaysSinceLoss}
                      disabled={!policies.billing.reactivation.enabled}
                      onChange={(value) => updatePoliciesState((current) => ({
                        ...current,
                        billing: {
                          ...current.billing,
                          reactivation: {
                            ...current.billing.reactivation,
                            minDaysSinceLoss: value,
                          },
                        },
                      }))}
                      options={REACTIVATION_WINDOW_OPTIONS}
                      hint="Evita abordar o aluno cedo demais após cancelamento ou expiração."
                    />

                    <NumberSelect
                      label="Janela máxima desde a perda"
                      value={policies.billing.reactivation.maxDaysSinceLoss}
                      disabled={!policies.billing.reactivation.enabled}
                      onChange={(value) => updatePoliciesState((current) => ({
                        ...current,
                        billing: {
                          ...current.billing,
                          reactivation: {
                            ...current.billing.reactivation,
                            maxDaysSinceLoss: value,
                          },
                        },
                      }))}
                      options={reactivationMaxOptions}
                      hint="Depois desse limite, o aluno deixa de entrar nos candidatos automáticos de win-back."
                    />
                  </div>
                </div>
              </Card>

              <div className="flex flex-col gap-3 rounded-2xl border border-[var(--divider-primary)] bg-[var(--background-primary)] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--element-primary)]">Salvar política da academia</p>
                  <p className="mt-1 text-xs text-[var(--element-secondary)]">
                    O runtime usa esses valores nas próximas execuções automáticas e na leitura operacional do financeiro.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => void loadPolicies()} disabled={saving}>
                    Recarregar
                  </Button>
                  <Button onClick={() => void handleSave()} disabled={!hasChanges || saving}>
                    {saving ? 'Salvando...' : 'Salvar política'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}