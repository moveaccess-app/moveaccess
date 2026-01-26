'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  getAccessKPIs,
  mockAccessHistory,
  formatAccessTime,
  formatCpfMasked,
  getAccessMethodLabel,
  getAccessStatusLabel,
  type AccessAttempt,
} from '@/mocks/accessMock';

// Ícones inline SVG
const icons = {
  users: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  block: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
  activity: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  x: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  log: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  manual: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  ),
  qr: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  ),
};

// KPI Card Component
function KPICard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
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
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--element-secondary)] mb-1 truncate">
            {title}
          </p>
          <p className={`text-2xl font-bold ${variantClasses[variant]}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-[var(--element-disabled)] mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`p-2 rounded-lg flex-shrink-0 ${bgClasses[variant]} ${variantClasses[variant]}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

// Quick Action Card
function QuickActionCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-4 hover:shadow-md transition-all cursor-pointer group">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--background-tertiary)] text-[var(--element-primary)]">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-[var(--element-primary)]">{title}</p>
            <p className="text-xs text-[var(--element-secondary)] truncate">{description}</p>
          </div>
          <div className="text-[var(--element-disabled)] group-hover:text-[var(--element-primary)] transition-colors">
            {icons.arrowRight}
          </div>
        </div>
      </Card>
    </Link>
  );
}

// Access Log Item
function AccessLogItem({ attempt }: { attempt: AccessAttempt }) {
  const isAllowed = attempt.status === 'allowed';

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--divider-primary)] last:border-0">
      {/* Status Icon */}
      <div
        className={`p-1.5 rounded-full flex-shrink-0 ${
          isAllowed
            ? 'bg-[var(--status-positive-background)] text-[var(--status-positive)]'
            : 'bg-[var(--status-negative-background)] text-[var(--status-negative)]'
        }`}
      >
        {isAllowed ? icons.check : icons.x}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--element-primary)] truncate">
          {attempt.userName || 'Usuário desconhecido'}
        </p>
        <div className="flex items-center gap-2 text-xs text-[var(--element-secondary)]">
          <span>{formatCpfMasked(attempt.userCpf || '')}</span>
          <span>•</span>
          <span>{getAccessMethodLabel(attempt.method)}</span>
        </div>
      </div>

      {/* Status Badge */}
      <Badge
        variant={isAllowed ? 'default' : 'destructive'}
        className="flex-shrink-0 text-xs"
      >
        {getAccessStatusLabel(attempt.status)}
      </Badge>

      {/* Time */}
      <div className="flex items-center gap-1 text-xs text-[var(--element-disabled)] flex-shrink-0">
        {icons.clock}
        <span>{formatAccessTime(attempt.timestamp)}</span>
      </div>
    </div>
  );
}

export default function AccessOverviewPage() {
  const kpis = useMemo(() => getAccessKPIs(), []);
  const recentAccesses = useMemo(() => mockAccessHistory.slice(0, 8), []);

  return (
    <div className="min-h-screen bg-[var(--background-primary)]">
      <Header title="Controle de Acesso" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KPICard
            title="Acessos Hoje"
            value={kpis.accessesToday}
            subtitle={`Média: ${kpis.avgDailyAccesses}/dia`}
            icon={icons.users}
            variant="success"
          />
          <KPICard
            title="Bloqueios Hoje"
            value={kpis.blockedToday}
            subtitle="Tentativas negadas"
            icon={icons.block}
            variant="destructive"
          />
          <KPICard
            title="Ativos Agora"
            value={kpis.activeNow}
            subtitle={`Pico: ${kpis.peakHour}`}
            icon={icons.activity}
            variant="default"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--element-primary)] mb-3">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickActionCard
              title="Log de Acessos"
              description="Histórico completo de entradas"
              icon={icons.log}
              href="/access/log"
            />
            <QuickActionCard
              title="Liberação Manual"
              description="Liberar acesso sem QR/PIN"
              icon={icons.manual}
              href="/access/releases"
            />
            <QuickActionCard
              title="Config. QR Code"
              description="Gerenciar QR das unidades"
              icon={icons.qr}
              href="/access/releases"
            />
          </div>
        </div>

        {/* Recent Accesses */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--element-primary)]">
              Últimos Acessos
            </h2>
            <Link
              href="/access/log"
              className="text-sm text-[var(--element-accent)] hover:underline flex items-center gap-1"
            >
              Ver todos
              {icons.arrowRight}
            </Link>
          </div>

          {recentAccesses.length > 0 ? (
            <div className="divide-y divide-[var(--divider-primary)]">
              {recentAccesses.map((attempt) => (
                <AccessLogItem key={attempt.id} attempt={attempt} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[var(--element-secondary)]">
                Nenhum acesso registrado ainda.
              </p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
