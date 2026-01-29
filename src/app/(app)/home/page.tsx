'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext'; // Importar useAuth
import {
  getHomeData,
  formatRelativeTime,
  getAccessTypeLabel,
  type AccessType,
  type PriorityAlert,
  type AccessHistoryEntry,
} from '@/mocks/homeMock';

// ============================================================================
// ÍCONES SVG
// ============================================================================

const icons = {
  checkCircle: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  alertTriangle: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  xCircle: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  money: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  block: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  unlock: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  activity: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
};

// ============================================================================
// COMPONENTES
// ============================================================================

/**
 * Item de Alerta - Linha simples sem fundo colorido
 */
function AlertItem({ alert }: { alert: PriorityAlert }) {
  const typeIcons = {
    financial: icons.money,
    access: icons.block,
    contract: icons.document,
    system: icons.alertTriangle,
  };

  const iconColor = alert.severity === 'critical' 
    ? 'text-[var(--status-negative)]' 
    : 'text-[var(--status-alert)]';

  return (
    <div className="flex items-center gap-4 p-4 border-b border-[var(--divider-primary)] last:border-b-0 hover:bg-[var(--background-secondary)] transition-colors">
      <div className={`p-2 rounded-lg bg-[var(--background-tertiary)] ${iconColor} flex-shrink-0`}>
        {typeIcons[alert.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-medium text-[var(--element-primary)] text-sm">
            {alert.title}
          </h3>
          {alert.severity === 'critical' && (
            <Badge variant="destructive" className="text-xs">
              Urgente
            </Badge>
          )}
        </div>
        <p className="text-xs text-[var(--element-secondary)] mt-0.5">
          {alert.description}
        </p>
      </div>
      <Link href={alert.actionHref} className="flex-shrink-0">
        <Button variant="ghost" size="sm" className="text-xs text-[var(--element-secondary)] hover:text-[var(--element-primary)]">
          {alert.actionLabel}
          <span className="ml-1">{icons.arrowRight}</span>
        </Button>
      </Link>
    </div>
  );
}

/**
 * Card de Métrica de Saúde - Tipografia forte, visual neutro
 */
function HealthMetricCard({ label, value, context }: {
  label: string;
  value: string;
  context: string;
}) {
  return (
    <Card className="p-5 border border-[var(--divider-primary)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--element-secondary)] uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-[var(--element-primary)]">
            {value}
          </p>
          <p className="text-xs text-[var(--element-secondary)] mt-1">
            {context}
          </p>
        </div>
        <div className="p-2 rounded-lg bg-[var(--background-tertiary)] text-[var(--element-secondary)] flex-shrink-0">
          {icons.money}
        </div>
      </div>
    </Card>
  );
}

/**
 * Card de Acessos Recentes - Lista cronológica (máximo 4 itens, sem scroll)
 */
function RecentAccessesCard({ accesses }: { accesses: AccessHistoryEntry[] }) {
  const getAccessTypeConfig = (type: AccessType) => {
    const configs = {
      allowed: {
        badgeVariant: 'success' as const,
        iconColor: 'text-[var(--status-positive)]',
        icon: icons.checkCircle,
      },
      denied: {
        badgeVariant: 'destructive' as const,
        iconColor: 'text-[var(--status-negative)]',
        icon: icons.xCircle,
      },
      manual_release: {
        badgeVariant: 'warning' as const,
        iconColor: 'text-[var(--status-alert)]',
        icon: icons.unlock,
      },
    };
    return configs[type];
  };

  // Mostrar apenas os 4 primeiros, sem scroll
  const displayedAccesses = accesses.slice(0, 4);

  return (
    <Card className="border border-[var(--divider-primary)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--divider-primary)]">
        <h3 className="font-medium text-[var(--element-primary)] text-sm">
          Últimos acessos
        </h3>
      </div>
      
      <div className="divide-y divide-[var(--divider-primary)]">
        {displayedAccesses.map((access) => {
          const config = getAccessTypeConfig(access.type);
          
          return (
            <div key={access.id} className="p-4 hover:bg-[var(--background-secondary)] transition-colors">
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg bg-[var(--background-tertiary)] ${config.iconColor} flex-shrink-0 mt-0.5`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-[var(--element-primary)] text-sm">
                      {access.userName}
                    </span>
                    <Badge variant={config.badgeVariant} className="text-xs">
                      {getAccessTypeLabel(access.type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--element-secondary)] flex-wrap">
                    <span>{access.unitName}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(access.timestamp)}</span>
                  </div>
                  {access.reason && (
                    <p className="text-xs text-[var(--element-secondary)] mt-1">
                      {access.reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="px-5 py-3 border-t border-[var(--divider-primary)] bg-[var(--background-secondary)]">
        <Link href="/access/log">
          <Button variant="ghost" size="sm" className="text-xs w-full justify-center text-[var(--element-secondary)] hover:text-[var(--element-primary)]">
            Ver histórico completo
            <span className="ml-1">{icons.arrowRight}</span>
          </Button>
        </Link>
      </div>
    </Card>
  );
}

/**
 * Botões de Ação Rápida - Um primário, restante secundário/outline
 */
function QuickActions({ actions }: { actions: Array<{
  id: string;
  label: string;
  icon: 'unlock' | 'money' | 'calendar' | 'users';
  href: string;
}> }) {
  const iconMap = {
    unlock: icons.unlock,
    money: icons.money,
    calendar: icons.calendar,
    users: icons.users,
  };

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action, index) => (
        <Link key={action.id} href={action.href}>
          <Button 
            variant={index === 0 ? 'default' : 'outline'} 
            size="default"
            className="gap-2"
          >
            {iconMap[action.icon]}
            {action.label}
          </Button>
        </Link>
      ))}
    </div>
  );
}

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HomePage() {
  const { logout } = useAuth(); // Obter função de logout
  const homeData = useMemo(() => getHomeData(), []);

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  
  const formattedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1);
  const greeting = getGreeting();

  return (
    <div className="flex flex-col h-full bg-[var(--background-secondary)]">
      <Header 
        title="Início" 
        actions={
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--element-secondary)] hidden sm:inline">
              {formattedDate}
            </span>
            <Button onClick={logout} variant="outline" size="sm">
              Sair
            </Button>
          </div>
        }
      />
      
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Saudação */}
          <div>
            <p className="text-[var(--element-secondary)]">
              {greeting}! Aqui está o resumo da sua academia.
            </p>
          </div>
          
          {/* LINHA 1: ALERTAS PRIORITÁRIOS */}
          {homeData.alerts.length > 0 && (
            <Card className="border border-[var(--divider-primary)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--divider-primary)]">
                <h3 className="text-sm font-medium text-[var(--element-secondary)] uppercase tracking-wide">
                  Requer sua atenção
                </h3>
              </div>
              <div>
                {homeData.alerts.map((alert) => (
                  <AlertItem key={alert.id} alert={alert} />
                ))}
              </div>
            </Card>
          )}
          
          {/* LINHA 2: INDICADORES (KPIs compactos) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <HealthMetricCard 
              label={homeData.healthMetric.label}
              value={homeData.healthMetric.value}
              context={homeData.healthMetric.context}
            />
            
            {/* KPI de Ações Rápidas - resumo compacto */}
            <Card className="p-5 border border-[var(--divider-primary)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--element-secondary)] uppercase tracking-wide mb-1">
                    Acessos hoje
                  </p>
                  <p className="text-2xl font-bold text-[var(--element-primary)]">
                    {homeData.recentAccesses.length > 0 ? homeData.recentAccesses.length * 12 : 0}
                  </p>
                  <p className="text-xs text-[var(--element-secondary)] mt-1">
                    {homeData.recentAccesses.filter(a => a.type === 'denied').length} bloqueados
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--background-tertiary)] text-[var(--element-secondary)] flex-shrink-0">
                  {icons.activity}
                </div>
              </div>
            </Card>
          </div>
          
          {/* LINHA 3: HISTÓRICO DE ACESSOS */}
          <RecentAccessesCard accesses={homeData.recentAccesses} />
          
          {/* LINHA 4: AÇÕES RÁPIDAS */}
          <div>
            <h3 className="text-sm font-medium text-[var(--element-secondary)] uppercase tracking-wide mb-3">
              Ações rápidas
            </h3>
            <QuickActions actions={homeData.quickActions} />
          </div>
          
        </div>
      </div>
    </div>
  );
}
