'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Header } from '@/components/common/Header';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SkeletonStats, SkeletonTable } from '@/components/ui/Skeleton';
import {
  ChargesList,
  DelinquentStudentsList,
  ExtratoOperacional,
  OverdueList,
  SubscriptionsList,
} from './components';
import {
  createPayment,
  formatCurrency,
  formatCurrencyCompact,
  getFinancialSummary,
  getPayments,
  type Payment,
  type PaymentMethod,
} from '@/lib/payments/paymentService';
import { getSubscriptions, type Subscription } from '@/lib/subscriptions/subscriptionService';
import {
  BarChart3,
  FileText,
  ClipboardList,
  AlertTriangle,
  Users,
  Repeat,
  DollarSign,
  Calculator,
  CircleAlert,
  Clock,
  Plus,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';

type TabType = 'dashboard' | 'extrato' | 'charges' | 'subscriptions' | 'overdue' | 'delinquents';

const TABS: { id: TabType; label: string; icon: ReactNode }[] = [
  { id: 'dashboard', label: 'Visão Geral', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'extrato', label: 'Extrato', icon: <FileText className="w-4 h-4" /> },
  { id: 'charges', label: 'Cobranças', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'subscriptions', label: 'Assinaturas', icon: <Repeat className="w-4 h-4" /> },
  { id: 'overdue', label: 'Inadimplência', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'delinquents', label: 'Inadimplentes', icon: <Users className="w-4 h-4" /> },
];

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'pix', label: 'Pix' },
  { value: 'card', label: 'Cartão' },
  { value: 'boleto', label: 'Boleto' },
];

const EMPTY_CREATE_FORM = {
  subscriptionId: '',
  amount: '',
  method: 'pix' as PaymentMethod,
  dueDate: '',
  reference: '',
};

function KPICard({
  title,
  value,
  fullValue,
  subtitle,
  icon,
  trend,
  variant = 'default',
  onClick,
}: {
  title: string;
  value: string;
  fullValue?: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  onClick?: () => void;
}) {
  const variantClasses = {
    default: 'text-[var(--element-primary)]',
    success: 'text-[var(--status-positive)]',
    warning: 'text-[var(--status-alert)]',
    destructive: 'text-[var(--status-negative)]',
  };

  const bgClasses = {
    default: 'bg-[var(--background-tertiary)]',
    success: 'bg-[var(--status-positive-background)]',
    warning: 'bg-[var(--status-alert-background)]',
    destructive: 'bg-[var(--status-negative-background)]',
  };

  return (
    <Card
      className={`p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
      title={fullValue}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--element-secondary)] mb-1 truncate">{title}</p>
          <p className={`text-lg lg:text-xl font-bold ${variantClasses[variant]} truncate`} title={fullValue}>
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-0.5">
              {trend.value >= 0 ? (
                <TrendingUp className="w-3 h-3 text-[var(--status-positive)]" />
              ) : (
                <TrendingDown className="w-3 h-3 text-[var(--status-negative)]" />
              )}
              <span className={`text-xs font-medium ${trend.value >= 0 ? 'text-[var(--status-positive)]' : 'text-[var(--status-negative)]'}`}>
                {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
              </span>
              <span className="text-xs text-[var(--element-disabled)]">{trend.label}</span>
            </div>
          )}
          {!trend && subtitle && <p className="text-xs text-[var(--element-disabled)] mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${bgClasses[variant]} ${variantClasses[variant]} flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

function RevenueChart({
  received,
  expected,
  overdue,
  showValues,
}: {
  received: number;
  expected: number;
  overdue: number;
  showValues: boolean;
}) {
  const maxValue = Math.max(received, expected, overdue, 1);
  const { display: receivedDisplay } = formatCurrencyCompact(received);
  const { display: expectedDisplay } = formatCurrencyCompact(expected);
  const { display: overdueDisplay } = formatCurrencyCompact(overdue);

  const items = [
    { label: 'Recebido', value: received, display: receivedDisplay, color: 'bg-[var(--status-positive)]', textColor: 'text-[var(--status-positive)]' },
    { label: 'Previsto', value: expected, display: expectedDisplay, color: 'bg-[var(--status-info)]', textColor: 'text-[var(--status-info)]' },
    { label: 'Em atraso', value: overdue, display: overdueDisplay, color: 'bg-[var(--status-negative)]', textColor: 'text-[var(--status-negative)]' },
  ];

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex justify-between text-sm gap-3">
            <span className="text-[var(--element-secondary)]">{item.label}</span>
            <span className={`font-medium ${item.textColor}`} title={showValues ? formatCurrency(item.value) : undefined}>
              {showValues ? item.display : '••••••'}
            </span>
          </div>
          <div className="h-3 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${item.color}`} style={{ width: `${(item.value / maxValue) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FinancialPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showValues, setShowValues] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const [paymentsResult, subscriptionsResult] = await Promise.all([getPayments(), getSubscriptions()]);

        if (cancelled) {
          return;
        }

        setPayments(paymentsResult);
        setSubscriptions(subscriptionsResult);
      } catch {
        if (cancelled) {
          return;
        }

        setPayments([]);
        setSubscriptions([]);
        setError('Não foi possível carregar os dados financeiros.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      void run();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [reloadKey]);

  const summary = useMemo(() => getFinancialSummary(payments), [payments]);

  const activeSubsCount = useMemo(
    () => subscriptions.filter((s) => s.status === 'active').length,
    [subscriptions],
  );

  const selectedSubscription = useMemo(
    () => subscriptions.find((subscription) => subscription.id === createForm.subscriptionId) || null,
    [createForm.subscriptionId, subscriptions],
  );

  const availableSubscriptions = useMemo(
    () => subscriptions.filter((subscription) => subscription.status === 'active' || subscription.status === 'paused'),
    [subscriptions],
  );

  const receivedDisplay = formatCurrencyCompact(summary.receivedThisMonth);
  const expectedDisplay = formatCurrencyCompact(summary.expectedThisMonth);
  const overdueDisplay = formatCurrencyCompact(summary.overdueTotal);
  const dueSoonDisplay = formatCurrencyCompact(summary.dueSoon7Days);
  const mrrDisplay = formatCurrencyCompact(summary.mrr);

  const applyCreateField = (field: keyof typeof EMPTY_CREATE_FORM, value: string) => {
    setCreateForm((current) => ({ ...current, [field]: value }));
  };

  const handleSelectSubscription = (subscriptionId: string) => {
    const subscription = subscriptions.find((item) => item.id === subscriptionId) || null;
    setCreateForm((current) => ({
      ...current,
      subscriptionId,
      amount: subscription ? String(subscription.price) : current.amount,
      reference: subscription?.plan?.name ? `Cobrança ${subscription.plan.name}` : current.reference,
    }));
  };

  const resetCreateModal = () => {
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateError(null);
    setCreateOpen(false);
  };

  const handleCreatePayment = async () => {
    if (!selectedSubscription) {
      setCreateError('Selecione uma assinatura.');
      return;
    }

    if (!createForm.amount || Number(createForm.amount) <= 0) {
      setCreateError('Informe um valor válido.');
      return;
    }

    if (!createForm.dueDate) {
      setCreateError('Informe a data de vencimento.');
      return;
    }

    setSavingPayment(true);
    setCreateError(null);

    const result = await createPayment({
      subscriptionId: selectedSubscription.id,
      studentId: selectedSubscription.studentId,
      amount: Number(createForm.amount),
      method: createForm.method,
      dueDate: new Date(`${createForm.dueDate}T12:00:00`).toISOString(),
      reference: createForm.reference.trim() || null,
    });

    setSavingPayment(false);

    if (!result.success) {
      setCreateError(result.error || 'Não foi possível criar a cobrança.');
      return;
    }

    resetCreateModal();
    setActiveTab('charges');
    setReloadKey((current) => current + 1);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Row 1: Primary KPIs — Financial Health */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        <KPICard
          title="MRR"
          value={showValues ? mrrDisplay.display : '•••••'}
          fullValue={showValues ? mrrDisplay.full : undefined}
          trend={summary.receivedLastMonth > 0 ? { value: summary.mrrChange, label: 'vs mês anterior' } : undefined}
          subtitle={summary.receivedLastMonth === 0 ? `${activeSubsCount} assinatura(s) ativa(s)` : undefined}
          variant="default"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KPICard
          title="Receita recebida"
          value={showValues ? receivedDisplay.display : '•••••'}
          fullValue={showValues ? receivedDisplay.full : undefined}
          subtitle="Pagamentos pagos no mês"
          variant="success"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <KPICard
          title="Receita esperada"
          value={showValues ? expectedDisplay.display : '•••••'}
          fullValue={showValues ? expectedDisplay.full : undefined}
          subtitle={`${activeSubsCount} assinatura(s) ativa(s)`}
          icon={<Calculator className="w-5 h-5" />}
        />
      </div>

      {/* Row 2: Alerts — Attention needed */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        <KPICard
          title="Em atraso"
          value={showValues ? overdueDisplay.display : '•••••'}
          fullValue={showValues ? overdueDisplay.full : undefined}
          subtitle={`${summary.overdueCount} cobrança(s)`}
          variant="destructive"
          onClick={() => setActiveTab('overdue')}
          icon={<CircleAlert className="w-5 h-5" />}
        />
        <KPICard
          title="A vencer em 7 dias"
          value={showValues ? dueSoonDisplay.display : '•••••'}
          fullValue={showValues ? dueSoonDisplay.full : undefined}
          subtitle={`${summary.dueSoon7DaysCount} cobrança(s)`}
          variant="warning"
          onClick={() => setActiveTab('charges')}
          icon={<Clock className="w-5 h-5" />}
        />
        <KPICard
          title="Assinaturas ativas"
          value={String(activeSubsCount)}
          subtitle={subscriptions.length > activeSubsCount ? `${subscriptions.length} no total` : 'Todas ativas'}
          onClick={() => setActiveTab('subscriptions')}
          icon={<Repeat className="w-5 h-5" />}
        />
      </div>

      {/* Row 3: Revenue chart + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-[var(--element-primary)] mb-4">Receita do mês</h2>
          <RevenueChart
            received={summary.receivedThisMonth}
            expected={summary.expectedThisMonth}
            overdue={summary.overdueTotal}
            showValues={showValues}
          />
          {summary.receivedLastMonth > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--divider-primary)]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--element-secondary)]">Recebido mês anterior</span>
                <span className="font-medium text-[var(--element-primary)]">
                  {showValues ? formatCurrency(summary.receivedLastMonth) : '••••••'}
                </span>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-[var(--element-primary)] mb-4">Ações rápidas</h2>
          <div className="space-y-3">
            <button
              onClick={() => setCreateOpen(true)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--divider-primary)] hover:bg-[var(--background-tertiary)] transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-[var(--status-info-background)] text-[var(--status-info)]">
                <Plus className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-[var(--element-primary)]">Registrar cobrança</div>
                <div className="text-xs text-[var(--element-secondary)]">Criar cobrança para uma assinatura ativa</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('overdue')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--divider-primary)] hover:bg-[var(--background-tertiary)] transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-[var(--status-negative-background)] text-[var(--status-negative)]">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-[var(--element-primary)]">Tratar inadimplência</div>
                <div className="text-xs text-[var(--element-secondary)]">{summary.overdueCount} cobrança(s) vencida(s)</div>
              </div>
              {summary.overdueCount > 0 && <Badge variant="destructive">{summary.overdueCount}</Badge>}
            </button>

            <button
              onClick={() => setActiveTab('subscriptions')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--divider-primary)] hover:bg-[var(--background-tertiary)] transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-[var(--status-positive-background)] text-[var(--status-positive)]">
                <Repeat className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-[var(--element-primary)]">Ver assinaturas</div>
                <div className="text-xs text-[var(--element-secondary)]">{activeSubsCount} ativa(s)</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('charges')}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--divider-primary)] hover:bg-[var(--background-tertiary)] transition-colors text-left"
            >
              <div className="p-2 rounded-lg bg-[var(--status-alert-background)] text-[var(--status-alert)]">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-[var(--element-primary)]">Cobranças abertas</div>
                <div className="text-xs text-[var(--element-secondary)]">{payments.length} registro(s) no total</div>
              </div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background-secondary)]">
      <Header
        title="Financeiro"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowValues((current) => !current)} className="gap-1.5">
              {showValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showValues ? 'Ocultar' : 'Mostrar'}
            </Button>
            <Button variant="outline" onClick={() => setReloadKey((current) => current + 1)} disabled={loading} className="gap-1.5">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Nova cobrança
            </Button>
          </div>
        }
      />

      <main className="p-4 lg:p-6 space-y-6">
        <Card className="p-1.5">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(tab.id)}
                className="gap-1.5 whitespace-nowrap"
                size="sm"
              >
                {tab.icon}
                {tab.label}
              </Button>
            ))}
          </div>
        </Card>

        {error && (
          <Card className="p-4 border-[var(--status-negative)]/20 bg-[var(--status-negative)]/5">
            <div className="text-sm text-[var(--status-negative)]">{error}</div>
          </Card>
        )}

        {loading ? (
          <div className="space-y-6">
            <SkeletonStats count={6} />
            <SkeletonTable rows={5} cols={4} />
          </div>
        ) : activeTab === 'dashboard' ? (
          renderDashboard()
        ) : activeTab === 'extrato' ? (
          <ExtratoOperacional payments={payments} showValues={showValues} />
        ) : activeTab === 'charges' ? (
          <ChargesList payments={payments} showValues={showValues} />
        ) : activeTab === 'subscriptions' ? (
          <SubscriptionsList subscriptions={subscriptions} showValues={showValues} />
        ) : activeTab === 'delinquents' ? (
          <DelinquentStudentsList showValues={showValues} />
        ) : (
          <OverdueList payments={payments} showValues={showValues} />
        )}
      </main>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[var(--element-primary)]">Nova cobrança</h2>
                <p className="text-sm text-[var(--element-secondary)] mt-1">Crie uma cobrança vinculada a uma assinatura existente.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={resetCreateModal}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--element-primary)] mb-2">Assinatura</label>
                <select
                  value={createForm.subscriptionId}
                  onChange={(event) => handleSelectSubscription(event.target.value)}
                  className="w-full px-3 py-2 border border-[var(--divider-primary)] rounded-lg bg-[var(--background-primary)] text-[var(--element-primary)] text-sm"
                >
                  <option value="">Selecione uma assinatura</option>
                  {availableSubscriptions.map((subscription) => (
                    <option key={subscription.id} value={subscription.id}>
                      {subscription.student?.fullName || 'Aluno'} • {subscription.plan?.name || 'Plano'} • {formatCurrency(subscription.price)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSubscription && (
                <Card className="p-4 bg-[var(--background-tertiary)]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-[var(--element-disabled)] mb-1">Aluno</div>
                      <div className="font-medium text-[var(--element-primary)]">{selectedSubscription.student?.fullName || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[var(--element-disabled)] mb-1">Plano</div>
                      <div className="font-medium text-[var(--element-primary)]">{selectedSubscription.plan?.name || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[var(--element-disabled)] mb-1">Mensalidade</div>
                      <div className="font-medium text-[var(--element-primary)]">{formatCurrency(selectedSubscription.price)}</div>
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--element-primary)] mb-2">Valor</label>
                  <Input type="number" min="0" step="0.01" value={createForm.amount} onChange={(event) => applyCreateField('amount', event.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--element-primary)] mb-2">Método</label>
                  <select
                    value={createForm.method}
                    onChange={(event) => applyCreateField('method', event.target.value)}
                    className="w-full px-3 py-2 border border-[var(--divider-primary)] rounded-lg bg-[var(--background-primary)] text-[var(--element-primary)] text-sm h-10"
                  >
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--element-primary)] mb-2">Vencimento</label>
                  <Input type="date" value={createForm.dueDate} onChange={(event) => applyCreateField('dueDate', event.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--element-primary)] mb-2">Referência</label>
                  <Input value={createForm.reference} onChange={(event) => applyCreateField('reference', event.target.value)} placeholder="Ex: Mensalidade de março" />
                </div>
              </div>

              {createError && <div className="text-sm text-[var(--status-negative)]">{createError}</div>}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={resetCreateModal} disabled={savingPayment}>Cancelar</Button>
                <Button onClick={() => void handleCreatePayment()} disabled={savingPayment || availableSubscriptions.length === 0}>
                  {savingPayment ? 'Salvando...' : 'Criar cobrança'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
