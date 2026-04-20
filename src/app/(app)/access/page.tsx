'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Users,
  ShieldOff,
  Zap,
  Check,
  X,
  ChevronRight,
  Clock,
  ClipboardList,
  KeyRound,
  QrCode,
  Settings,
} from 'lucide-react';
import {
  getAccessOverview,
  formatAccessTime,
  formatCpfMasked,
  getAccessMethodLabel,
  getAccessStatusLabel,
  type AccessAttempt,
  type AccessOverview,
} from '@/lib/access';

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
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

// Access Log Item
function AccessLogItem({ attempt }: { attempt: AccessAttempt }) {
  const isAllowed = attempt.status === 'allowed';
  const eventLabel = attempt.eventType === 'entry' ? 'Entrada' : attempt.eventType === 'exit' ? 'Saída' : null;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--divider-primary)] last:border-0">
      <div
        className={`p-1.5 rounded-full flex-shrink-0 ${
          isAllowed
            ? 'bg-[var(--status-positive-background)] text-[var(--status-positive)]'
            : 'bg-[var(--status-negative-background)] text-[var(--status-negative)]'
        }`}
      >
        {isAllowed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--element-primary)] truncate">
          {attempt.userName || 'Usuário desconhecido'}
        </p>
        <div className="flex items-center gap-2 text-xs text-[var(--element-secondary)]">
          <span>{formatCpfMasked(attempt.userCpf || '')}</span>
          <span>•</span>
          <span>{getAccessMethodLabel(attempt.method)}</span>
          {eventLabel && (
            <>
              <span>•</span>
              <span>{eventLabel}</span>
            </>
          )}
        </div>
      </div>

      <Badge
        variant={isAllowed ? 'default' : 'destructive'}
        className="flex-shrink-0 text-xs"
      >
        {getAccessStatusLabel(attempt.status)}
      </Badge>

      <div className="flex items-center gap-1 text-xs text-[var(--element-disabled)] flex-shrink-0">
        <Clock className="w-3.5 h-3.5" />
        <span>{formatAccessTime(attempt.timestamp)}</span>
      </div>
    </div>
  );
}

export default function AccessOverviewPage() {
  const [overview, setOverview] = useState<AccessOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      setIsLoading(true);
      const data = await getAccessOverview();
      setOverview(data);
      setIsLoading(false);
    }

    loadOverview();
  }, []);

  const recentAccesses = overview?.recentAccesses || [];

  return (
    <div className="min-h-screen bg-[var(--background-primary)]">
      <Header title="Controle de Acesso" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <KPICard
            title="Acessos Hoje"
            value={isLoading ? '—' : overview?.accessesToday || 0}
            subtitle="Registros do dia atual"
            icon={<Users className="w-5 h-5" />}
            variant="success"
          />
          <KPICard
            title="Liberados Hoje"
            value={isLoading ? '—' : overview?.allowedToday || 0}
            subtitle="Entradas aprovadas"
            icon={<Zap className="w-5 h-5" />}
            variant="default"
          />
          <KPICard
            title="Negados Hoje"
            value={isLoading ? '—' : overview?.deniedToday || 0}
            subtitle="Tentativas negadas"
            icon={<ShieldOff className="w-5 h-5" />}
            variant="destructive"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--element-primary)] mb-3">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <QuickActionCard
              title="Abrir Scanner"
              description="Ler QR do aluno e validar acesso"
              icon={<QrCode className="w-5 h-5" />}
              href="/scanner?flow=entry"
            />
            <QuickActionCard
              title="Log de Acessos"
              description="Histórico completo de entradas"
              icon={<ClipboardList className="w-5 h-5" />}
              href="/access/log"
            />
            <QuickActionCard
              title="Check-in Manual"
              description="Registrar acesso por CPF ou nome"
              icon={<KeyRound className="w-5 h-5" />}
              href="/acesso/checkin"
            />
            <QuickActionCard
              title="Config. de Acesso"
              description="Scanner, entrada/saída e regras de presença"
              icon={<Settings className="w-5 h-5" />}
              href="/settings/access"
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
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {!isLoading && recentAccesses.length > 0 ? (
            <div className="divide-y divide-[var(--divider-primary)]">
              {recentAccesses.map((attempt) => (
                <AccessLogItem key={attempt.id} attempt={attempt} />
              ))}
            </div>
          ) : isLoading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton circle height="h-9" width="w-9" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton height="h-4" width="w-32" />
                    <Skeleton height="h-3" width="w-20" />
                  </div>
                  <Skeleton height="h-5" width="w-16" className="rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <QrCode className="w-10 h-10 mx-auto text-[var(--element-tertiary)] mb-2" strokeWidth={1.5} />
              <p className="text-sm font-medium text-[var(--text-primary)]">Nenhum acesso registrado</p>
              <p className="text-xs text-[var(--element-tertiary)] mt-1">Os check-ins dos alunos aparecerão aqui em tempo real.</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
