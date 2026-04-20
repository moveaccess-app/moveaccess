'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { SkeletonCard } from '@/components/ui/Skeleton';
import {
  cancelSubscription,
  formatPrice,
  formatSubscriptionDate,
  formatSubscriptionDateTime,
  getBillingCycleLabel,
  getDaysRemaining,
  getSubscriptionById,
  getSubscriptionStatusLabel,
  getSubscriptionStatusVariant,
  updateSubscription,
  type Subscription,
  type SubscriptionBillingCycle,
  type SubscriptionStatus,
} from '@/lib/subscriptions/subscriptionService';

interface PageProps {
  params: Promise<{ id: string }>;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-[var(--color-border-primary)] last:border-b-0">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-right text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}

export default function AssinaturaDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    status: 'active' as SubscriptionStatus,
    startedAt: '',
    expiresAt: '',
    billingCycle: 'monthly' as SubscriptionBillingCycle,
    price: 0,
    notes: '',
  });

  const loadSubscription = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getSubscriptionById(id);
      setSubscription(data);

      if (data) {
        setForm({
          status: data.status,
          startedAt: data.startedAt.split('T')[0],
          expiresAt: data.expiresAt ? data.expiresAt.split('T')[0] : '',
          billingCycle: data.billingCycle,
          price: data.price,
          notes: data.notes,
        });
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar assinatura.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const daysRemaining = useMemo(() => getDaysRemaining(subscription?.expiresAt || null), [subscription?.expiresAt]);

  const handleSave = async () => {
    if (!subscription) return;

    setSaving(true);
    setError(null);

    const result = await updateSubscription(subscription.id, {
      status: form.status,
      startedAt: form.startedAt,
      expiresAt: form.expiresAt || null,
      billingCycle: form.billingCycle,
      price: form.price,
      notes: form.notes,
    });

    setSaving(false);

    if (!result.success || !result.subscription) {
      setError(result.error || 'Não foi possível salvar a assinatura.');
      return;
    }

    setSubscription(result.subscription);
    setEditing(false);
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    setSaving(true);
    setError(null);

    const result = await cancelSubscription(subscription.id, 'Cancelada manualmente pela equipe.');

    setSaving(false);

    if (!result.success || !result.subscription) {
      setError(result.error || 'Não foi possível cancelar a assinatura.');
      return;
    }

    setSubscription(result.subscription);
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
        <Header title="Assinatura" />
        <div className="p-6 max-w-3xl mx-auto w-full space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
        <Header title="Assinatura não encontrada" />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="p-8 text-center">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Assinatura não encontrada</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">A assinatura solicitada não existe ou não pertence à sua academia.</p>
            <Button onClick={() => router.push('/assinaturas')}>Voltar para assinaturas</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
      <Header title={subscription.plan?.name || 'Assinatura'} />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {error && (
          <Card className="p-4 border border-[var(--color-error)] text-[var(--color-error)]">
            {error}
          </Card>
        )}

        <Card className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {subscription.student?.fullName || 'Aluno não encontrado'}
                </h1>
                <Badge variant={getSubscriptionStatusVariant(subscription.status)}>
                  {getSubscriptionStatusLabel(subscription.status)}
                </Badge>
                {daysRemaining !== null && daysRemaining <= 30 && subscription.status === 'active' ? (
                  <Badge variant={daysRemaining <= 7 ? 'destructive' : 'warning'}>
                    {daysRemaining < 0 ? 'Vencida' : `${daysRemaining} dias`}
                  </Badge>
                ) : null}
              </div>
              <p className="text-[var(--color-text-secondary)]">
                {subscription.plan?.name || 'Plano não encontrado'} • {getBillingCycleLabel(subscription.billingCycle)}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Atualizada em {formatSubscriptionDateTime(subscription.updatedAt)}
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => router.push('/assinaturas')}>
                Voltar
              </Button>
              {editing ? (
                <>
                  <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                    Cancelar edição
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => setEditing(true)}>
                    Editar
                  </Button>
                  {subscription.status !== 'cancelled' && (
                    <Button variant="destructive" onClick={handleCancelSubscription} disabled={saving}>
                      {saving ? 'Cancelando...' : 'Cancelar assinatura'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--color-border-primary)]">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">{formatPrice(subscription.price)}</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Valor</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">{formatSubscriptionDate(subscription.startedAt)}</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Início</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">{formatSubscriptionDate(subscription.expiresAt)}</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Vencimento</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                {daysRemaining === null ? '-' : daysRemaining < 0 ? 'Vencida' : `${daysRemaining} dias`}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">Restante</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Aluno</h2>
              <InfoRow label="Nome" value={subscription.student?.fullName || '-'} />
              <InfoRow label="Email" value={subscription.student?.email || '-'} />
              <InfoRow label="Documento" value={subscription.student?.document || '-'} />
              <InfoRow label="Matrícula" value={subscription.student?.registrationId || '-'} />
              <InfoRow label="Status do aluno" value={subscription.student?.status || '-'} />
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Plano vinculado</h2>
              <InfoRow label="Plano" value={subscription.plan?.name || '-'} />
              <InfoRow label="Status do plano" value={subscription.plan?.status || '-'} />
              <InfoRow label="Ciclo" value={getBillingCycleLabel(subscription.billingCycle)} />
              <InfoRow label="Preço base" value={formatPrice(subscription.plan?.price || 0)} />
              <div className="pt-3 text-sm text-[var(--color-text-secondary)]">
                {subscription.plan?.description || 'Sem descrição cadastrada.'}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Observações</h2>
              {editing ? (
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações internas</Label>
                  <textarea
                    id="notes"
                    rows={6}
                    value={form.notes}
                    onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))}
                    className="w-full rounded-md border border-[var(--divider-primary)] bg-[var(--background-primary)] px-3 py-2 text-sm text-[var(--element-primary)] focus:outline-none focus:border-[var(--status-info)] focus:ring-2 focus:ring-[var(--status-info-background)]"
                  />
                </div>
              ) : (
                <div className="rounded-lg bg-[var(--color-bg-secondary)] p-4 text-[var(--color-text-primary)] whitespace-pre-wrap min-h-[120px]">
                  {subscription.notes || 'Sem observações registradas.'}
                </div>
              )}
            </Card>
          </div>

          <div>
            <Card className="p-6 space-y-4 sticky top-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Dados da assinatura</h2>

              {editing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={form.status}
                      onChange={(event) => setForm((previous) => ({ ...previous, status: event.target.value as SubscriptionStatus }))}
                      className="w-full px-3 py-2 rounded-md border border-[var(--divider-primary)] bg-[var(--background-primary)] text-[var(--element-primary)]"
                    >
                      <option value="active">Ativa</option>
                      <option value="paused">Pausada</option>
                      <option value="expired">Expirada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startedAt">Início</Label>
                    <Input
                      id="startedAt"
                      type="date"
                      value={form.startedAt}
                      onChange={(event) => setForm((previous) => ({ ...previous, startedAt: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiresAt">Vencimento</Label>
                    <Input
                      id="expiresAt"
                      type="date"
                      value={form.expiresAt}
                      onChange={(event) => setForm((previous) => ({ ...previous, expiresAt: event.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingCycle">Ciclo</Label>
                    <select
                      id="billingCycle"
                      value={form.billingCycle}
                      onChange={(event) => setForm((previous) => ({ ...previous, billingCycle: event.target.value as SubscriptionBillingCycle }))}
                      className="w-full px-3 py-2 rounded-md border border-[var(--divider-primary)] bg-[var(--background-primary)] text-[var(--element-primary)]"
                    >
                      <option value="monthly">Mensal</option>
                      <option value="yearly">Anual</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Valor</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(event) => setForm((previous) => ({ ...previous, price: Number(event.target.value) }))}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <InfoRow label="Status" value={getSubscriptionStatusLabel(subscription.status)} />
                  <InfoRow label="Ciclo" value={getBillingCycleLabel(subscription.billingCycle)} />
                  <InfoRow label="Valor" value={formatPrice(subscription.price)} />
                  <InfoRow label="Criada em" value={formatSubscriptionDateTime(subscription.createdAt)} />
                  <InfoRow label="Cancelada em" value={formatSubscriptionDateTime(subscription.cancelledAt)} />
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
