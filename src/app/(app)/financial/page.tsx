'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  getFinancialSummary,
  formatCurrency,
  formatCurrencyCompact,
} from '@/mocks/financialMock';

// Componentes internos
import { ChargesList, OverdueList } from './components';

type TabType = 'dashboard' | 'charges' | 'overdue';

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'dashboard',
    label: 'Visão Geral',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'charges',
    label: 'Cobranças',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: 'overdue',
    label: 'Inadimplência',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
];

// Componente KPI Card - Otimizado para responsividade
function KPICard({
  title,
  value,
  fullValue,
  subtitle,
  trend,
  icon,
  variant = 'default',
  onClick,
}: {
  title: string;
  value: string;
  fullValue?: string;
  subtitle?: string;
  trend?: { value: number; label: string };
  icon: React.ReactNode;
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
      title={fullValue || undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--element-secondary)] mb-1 truncate">{title}</p>
          <p className={`text-lg lg:text-xl font-bold ${variantClasses[variant]} truncate`} title={fullValue}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[var(--element-disabled)] mt-0.5 truncate">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-xs font-medium ${trend.value >= 0 ? 'text-[var(--status-positive)]' : 'text-[var(--status-negative)]'}`}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg ${bgClasses[variant]} ${variantClasses[variant]} flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

// Componente de Gráfico de Barras Horizontal - Responsivo e funcional
function RevenueChart({ received, expected, overdue, showValues }: { received: number; expected: number; overdue: number; showValues: boolean }) {
  const maxValue = Math.max(received, expected, overdue) || 1;
  const paidPercent = (received / maxValue) * 100;
  const expectedPercent = (expected / maxValue) * 100;
  const overduePercent = (overdue / maxValue) * 100;

  const { display: receivedDisplay } = formatCurrencyCompact(received);
  const { display: expectedDisplay } = formatCurrencyCompact(expected);
  const { display: overdueDisplay } = formatCurrencyCompact(overdue);

  const formatValue = (value: string) => showValues ? value : '••••••';
  const formatTitle = (value: number) => showValues ? formatCurrency(value) : undefined;

  return (
    <div className="space-y-4">
      {/* Barra de Recebido */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--element-secondary)]">Recebido</span>
          <span className="font-medium text-[var(--status-positive)]" title={formatTitle(received)}>
            {formatValue(receivedDisplay)}
          </span>
        </div>
        <div className="h-3 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--status-positive)] rounded-full transition-all duration-500"
            style={{ width: `${paidPercent}%` }}
          />
        </div>
      </div>

      {/* Barra de Previsto */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--element-secondary)]">Previsto</span>
          <span className="font-medium text-[var(--status-info)]" title={formatTitle(expected)}>
            {formatValue(expectedDisplay)}
          </span>
        </div>
        <div className="h-3 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--status-info)] rounded-full transition-all duration-500"
            style={{ width: `${expectedPercent}%` }}
          />
        </div>
      </div>

      {/* Barra de Atraso - só exibe se houver valor */}
      {overdue > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--element-secondary)]">Em Atraso</span>
            <span className="font-medium text-[var(--status-negative)]" title={formatTitle(overdue)}>
              {formatValue(overdueDisplay)}
            </span>
          </div>
          <div className="h-3 bg-[var(--background-tertiary)] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[var(--status-negative)] rounded-full transition-all duration-500"
              style={{ width: `${overduePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Indicador de performance */}
      <div className="pt-3 border-t border-[var(--divider-primary)]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--element-secondary)]">Performance</span>
          <span className={`text-sm font-semibold ${
            received >= expected * 0.9 ? 'text-[var(--status-positive)]' : 
            received >= expected * 0.7 ? 'text-[var(--status-alert)]' : 
            'text-[var(--status-negative)]'
          }`}>
            {showValues ? (expected > 0 ? ((received / expected) * 100).toFixed(0) : 0) : '••'}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default function FinancialPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showValues, setShowValues] = useState(true);
  const summary = useMemo(() => getFinancialSummary(), []);

  // Função para formatar valor com visibilidade
  const formatValue = (value: string) => {
    return showValues ? value : '•••••';
  };

  const renderDashboard = () => {
    const { display: receivedDisplay, full: receivedFull } = formatCurrencyCompact(summary.receivedThisMonth);
    const { display: expectedDisplay, full: expectedFull } = formatCurrencyCompact(summary.expectedThisMonth);
    const { display: overdueDisplay, full: overdueFull } = formatCurrencyCompact(summary.overdueTotal);
    const { display: dueSoonDisplay, full: dueSoonFull } = formatCurrencyCompact(summary.dueSoon7Days);

    return (
      <div className="space-y-6">
        {/* KPIs Principais - Grid 2x2 em mobile, 4 colunas em desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <KPICard
            title="Receita Recebida"
            value={formatValue(receivedDisplay)}
            fullValue={showValues ? receivedFull : undefined}
            subtitle="Este mês"
            trend={{ value: summary.mrrChange, label: 'vs mês anterior' }}
            variant="success"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <KPICard
            title="Receita Esperada"
            value={formatValue(expectedDisplay)}
            fullValue={showValues ? expectedFull : undefined}
            subtitle="Este mês"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
          />
          <KPICard
            title="Em Atraso"
            value={formatValue(overdueDisplay)}
            fullValue={showValues ? overdueFull : undefined}
            subtitle={`${summary.overdueCount} cobrança(s)`}
            variant="destructive"
            onClick={() => setActiveTab('overdue')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <KPICard
            title="A Vencer (7 dias)"
            value={formatValue(dueSoonDisplay)}
            fullValue={showValues ? dueSoonFull : undefined}
            subtitle={`${summary.dueSoon7DaysCount} cobrança(s)`}
            variant="warning"
            onClick={() => setActiveTab('charges')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Conteúdo principal - Grid 2 colunas em desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Gráfico de Receita */}
          <Card className="p-5 lg:col-span-2">
            <h2 className="text-base font-semibold text-[var(--element-primary)] mb-4">
              Receita do Mês
            </h2>
            <RevenueChart 
              received={summary.receivedThisMonth}
              expected={summary.expectedThisMonth}
              overdue={summary.overdueTotal}
              showValues={showValues}
            />
          </Card>

          {/* Ações Rápidas */}
          <Card className="p-5">
            <h2 className="text-base font-semibold text-[var(--element-primary)] mb-4">
              Ações Rápidas
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('overdue')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--divider-primary)] hover:bg-[var(--background-tertiary)] transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-[var(--status-negative-background)] text-[var(--status-negative)]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-[var(--element-primary)]">Tratar Inadimplência</div>
                  <div className="text-xs text-[var(--element-secondary)]">{summary.overdueCount} pendência(s)</div>
                </div>
                {summary.overdueCount > 0 && (
                  <Badge variant="destructive">{summary.overdueCount}</Badge>
                )}
              </button>

              <button
                onClick={() => setActiveTab('charges')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--divider-primary)] hover:bg-[var(--background-tertiary)] transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-[var(--status-alert-background)] text-[var(--status-alert)]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-[var(--element-primary)]">A Vencer em 7 dias</div>
                  <div className="text-xs text-[var(--element-secondary)]">{summary.dueSoon7DaysCount} cobrança(s)</div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('charges')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--divider-primary)] hover:bg-[var(--background-tertiary)] transition-colors text-left"
              >
                <div className="p-2 rounded-lg bg-[var(--status-info-background)] text-[var(--status-info)]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-[var(--element-primary)]">Ver Cobranças</div>
                  <div className="text-xs text-[var(--element-secondary)]">Gestão completa</div>
                </div>
              </button>
            </div>
          </Card>
        </div>

        {/* Resumo secundário - Cards menores */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4 bg-[var(--background-secondary)]">
            <p className="text-xs text-[var(--element-secondary)]">MRR Estimado</p>
            <p className="text-lg font-bold text-[var(--element-primary)] truncate" title={showValues ? formatCurrency(summary.mrr) : undefined}>
              {formatValue(formatCurrencyCompact(summary.mrr).display)}
            </p>
            <p className="text-xs text-[var(--element-disabled)]">{summary.activeSubscriptions} assinaturas</p>
          </Card>
          <Card className="p-4 bg-[var(--background-secondary)]">
            <p className="text-xs text-[var(--element-secondary)]">Mês Anterior</p>
            <p className="text-lg font-bold text-[var(--element-primary)] truncate" title={showValues ? formatCurrency(summary.receivedLastMonth) : undefined}>
              {formatValue(formatCurrencyCompact(summary.receivedLastMonth).display)}
            </p>
            <p className="text-xs text-[var(--element-disabled)]">Total recebido</p>
          </Card>
          <Card className="p-4 bg-[var(--background-secondary)]">
            <p className="text-xs text-[var(--element-secondary)]">Taxa de Adimplência</p>
            <p className={`text-lg font-bold ${
              summary.overdueCount === 0 ? 'text-[var(--status-positive)]' : 
              summary.overdueCount <= 3 ? 'text-[var(--status-alert)]' : 
              'text-[var(--status-negative)]'
            }`}>
              {summary.activeSubscriptions > 0 
                ? (((summary.activeSubscriptions - summary.overdueCount) / summary.activeSubscriptions) * 100).toFixed(0)
                : 100}%
            </p>
            <p className="text-xs text-[var(--element-disabled)]">Pagamentos em dia</p>
          </Card>
          <Card className="p-4 bg-[var(--background-secondary)]">
            <p className="text-xs text-[var(--element-secondary)]">Variação MRR</p>
            <p className={`text-lg font-bold ${summary.mrrChange >= 0 ? 'text-[var(--status-positive)]' : 'text-[var(--status-negative)]'}`}>
              {summary.mrrChange >= 0 ? '+' : ''}{summary.mrrChange.toFixed(1)}%
            </p>
            <p className="text-xs text-[var(--element-disabled)]">vs mês anterior</p>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background-secondary)]">
      <Header title="Financeiro" />

      <div className="flex-1 overflow-auto">
        {/* Tabs - Fixas no topo com scroll interno */}
        <div className="sticky top-0 z-10 bg-[var(--background-secondary)] px-4 lg:px-6 py-4 border-b border-[var(--divider-primary)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-1 p-1 bg-[var(--background-primary)] rounded-lg border border-[var(--divider-primary)] w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[var(--status-info)] text-white'
                    : 'text-[var(--element-secondary)] hover:bg-[var(--background-tertiary)]'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
            </div>
            
            {/* Toggle de visibilidade de valores */}
            <button
              onClick={() => setShowValues(!showValues)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] hover:bg-[var(--background-tertiary)] transition-colors"
              title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
            >
              {showValues ? (
                <svg className="w-5 h-5 text-[var(--element-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-[var(--element-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              )}
              <span className="text-sm text-[var(--element-secondary)] hidden sm:inline">
                {showValues ? 'Ocultar' : 'Mostrar'}
              </span>
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4 lg:p-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'charges' && <ChargesList showValues={showValues} />}
          {activeTab === 'overdue' && <OverdueList showValues={showValues} />}
        </div>
      </div>
    </div>
  );
}
