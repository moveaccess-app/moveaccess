'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { capture } from '@/lib/analytics';
import {
  getHomeData,
  formatRelativeTime,
  getAccessTypeLabel,
  type AccessType,
  type PriorityAlert,
  type AccessHistoryEntry,
  type ActivationChecklist,
  type DashboardKpis,
  type HomeData,
} from '@/lib/home/homeService';

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
  check: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  creditCard: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  mapPin: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  scan: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  ),
  userPlus: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  trendUp: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  alertCircle: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// ============================================================================
// SKELETON LOADERS
// ============================================================================

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <Card className={`p-5 border border-[var(--divider-primary)] animate-pulse ${className}`}>
      <div className="h-3 w-24 bg-[var(--background-tertiary)] rounded mb-3" />
      <div className="h-8 w-16 bg-[var(--background-tertiary)] rounded mb-2" />
      <div className="h-3 w-40 bg-[var(--background-tertiary)] rounded" />
    </Card>
  );
}

function SkeletonChecklist() {
  return (
    <Card className="border border-[var(--divider-primary)] overflow-hidden animate-pulse">
      <div className="p-6">
        <div className="h-5 w-64 bg-[var(--background-tertiary)] rounded mb-4" />
        <div className="h-3 w-full bg-[var(--background-tertiary)] rounded-full mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="w-6 h-6 rounded-full bg-[var(--background-tertiary)]" />
              <div className="h-4 w-48 bg-[var(--background-tertiary)] rounded" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function HomeSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="h-5 w-72 bg-[var(--background-tertiary)] rounded animate-pulse" />
      <SkeletonChecklist />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

// ============================================================================
// ACTIVATION CHECKLIST
// ============================================================================

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  cta: string;
  href: string;
  icon: React.ReactNode;
  emptyHint: string;
}

function getChecklistItems(activation: ActivationChecklist): ChecklistItem[] {
  return [
    {
      id: 'unit',
      label: 'Unidade principal criada',
      done: activation.hasUnit,
      cta: 'Configurar unidade',
      href: '/settings/units',
      icon: icons.mapPin,
      emptyHint: 'Crie sua primeira unidade para liberar check-ins',
    },
    {
      id: 'billing',
      label: 'Cobrança configurada',
      done: activation.hasBilling,
      cta: 'Configurar Asaas',
      href: '/settings/integrations',
      icon: icons.creditCard,
      emptyHint: 'Configure o Asaas para cobranças automáticas via PIX, boleto e cartão',
    },
    {
      id: 'plan',
      label: activation.hasPlan
        ? `${activation.plansCount} plano(s) ativo(s)`
        : 'Primeiro plano criado',
      done: activation.hasPlan,
      cta: 'Criar plano',
      href: '/plans/new',
      icon: icons.calendar,
      emptyHint: 'Crie seu primeiro plano para começar a matricular alunos',
    },
    {
      id: 'contract',
      label: activation.hasPublishedContract
        ? `${activation.contractsCount} contrato(s) publicado(s)`
        : 'Contrato publicado',
      done: activation.hasPublishedContract,
      cta: 'Criar contrato',
      href: '/contracts',
      icon: icons.document,
      emptyHint: 'Publique um modelo de contrato para formalizar matrículas',
    },
    {
      id: 'student',
      label: activation.hasStudent
        ? `${activation.studentsCount} aluno(s) cadastrado(s)`
        : 'Primeiro aluno cadastrado',
      done: activation.hasStudent,
      cta: 'Cadastrar aluno',
      href: '/users/onboarding',
      icon: icons.userPlus,
      emptyHint: 'Cadastre ou convide seu primeiro aluno para começar a operar',
    },
    {
      id: 'checkin',
      label: activation.hasCheckin
        ? `${activation.checkinsCount} check-in(s) realizado(s)`
        : 'Primeiro check-in realizado',
      done: activation.hasCheckin,
      cta: 'Ir para Access',
      href: '/access',
      icon: icons.scan,
      emptyHint: 'Realize o primeiro check-in para validar o controle de acesso',
    },
    {
      id: 'payment',
      label: activation.hasPayment
        ? `${activation.paymentsCount} pagamento(s) recebido(s)`
        : 'Primeiro pagamento recebido',
      done: activation.hasPayment,
      cta: 'Ir para Financeiro',
      href: '/financial',
      icon: icons.money,
      emptyHint: 'Registre ou receba o primeiro pagamento da academia',
    },
  ];
}

function getProgressMessage(pct: number): string {
  if (pct === 100) return 'Academia pronta para operar!';
  if (pct >= 80) return 'Quase lá! Faltam poucos passos.';
  if (pct >= 50) return 'Bom progresso! Continue configurando.';
  if (pct >= 25) return 'Você está começando. Siga os passos abaixo.';
  return 'Vamos configurar sua academia. Siga os passos abaixo.';
}

function ActivationChecklistCard({
  activation,
  collapsed,
  onToggle,
}: {
  activation: ActivationChecklist;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const items = getChecklistItems(activation);
  // Account creation + setup always done if we reach here
  const doneCount = items.filter((i) => i.done).length + 1; // +1 for "Conta criada"
  const totalCount = items.length + 1;
  const pct = Math.round((doneCount / totalCount) * 100);
  const allDone = pct === 100;

  return (
    <Card className="border border-[var(--divider-primary)] overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-[var(--element-primary)]">
            {allDone
              ? 'Sua academia está pronta!'
              : `Sua academia está ${pct}% pronta`}
          </h2>
          {allDone && (
            <button
              onClick={onToggle}
              className="text-xs text-[var(--element-secondary)] hover:text-[var(--element-primary)] transition-colors"
            >
              {collapsed ? 'Expandir' : 'Minimizar'}
            </button>
          )}
        </div>
        <p className="text-sm text-[var(--element-secondary)] mb-4">
          {getProgressMessage(pct)}
        </p>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-[var(--background-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${pct}%`,
              backgroundColor:
                pct === 100
                  ? 'var(--status-positive)'
                  : pct >= 50
                  ? 'var(--status-info)'
                  : 'var(--status-alert)',
            }}
          />
        </div>
        <p className="text-xs text-[var(--element-secondary)] mt-2">
          {doneCount} de {totalCount} passos concluídos
        </p>
      </div>

      {/* Items */}
      {!collapsed && (
        <div className="border-t border-[var(--divider-primary)]">
          {/* Account created — always done */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--divider-primary)] bg-[var(--background-secondary)]">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--status-positive)] text-white">
              {icons.check}
            </div>
            <span className="text-sm font-medium text-[var(--element-secondary)] line-through">
              Conta criada
            </span>
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-6 py-3 border-b border-[var(--divider-primary)] last:border-b-0 hover:bg-[var(--background-secondary)] transition-colors"
            >
              {/* Status icon */}
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: item.done
                    ? 'var(--status-positive)'
                    : 'var(--background-tertiary)',
                  color: item.done
                    ? 'white'
                    : 'var(--element-disabled)',
                }}
              >
                {item.done ? icons.check : (
                  <span className="w-2 h-2 rounded-full bg-current" />
                )}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm font-medium ${
                    item.done
                      ? 'text-[var(--element-secondary)] line-through'
                      : 'text-[var(--element-primary)]'
                  }`}
                >
                  {item.label}
                </span>
                {!item.done && (
                  <p className="text-xs text-[var(--element-secondary)] mt-0.5">
                    {item.emptyHint}
                  </p>
                )}
              </div>

              {/* CTA */}
              {!item.done && (
                <Link href={item.href} className="flex-shrink-0">
                  <Button variant="outline" size="sm" className="text-xs gap-1.5">
                    {item.cta}
                    {icons.arrowRight}
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// DASHBOARD KPI CARDS
// ============================================================================

function KpiCard({
  label,
  value,
  context,
  icon,
  href,
  variant = 'default',
}: {
  label: string;
  value: string | number;
  context: string;
  icon: React.ReactNode;
  href?: string;
  variant?: 'default' | 'positive' | 'negative' | 'warning';
}) {
  const colorMap = {
    default: 'var(--element-secondary)',
    positive: 'var(--status-positive)',
    negative: 'var(--status-negative)',
    warning: 'var(--status-alert)',
  };

  const content = (
    <Card className="p-5 border border-[var(--divider-primary)] hover:border-[var(--element-disabled)] transition-colors h-full">
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
        <div
          className="p-2 rounded-lg flex-shrink-0"
          style={{
            backgroundColor: `color-mix(in srgb, ${colorMap[variant]} 10%, transparent)`,
            color: colorMap[variant],
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// ============================================================================
// ALERT + ACCESSES (preserved from original, updated style)
// ============================================================================

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

function RecentAccessesCard({ accesses, placeholder }: { accesses: AccessHistoryEntry[]; placeholder: string }) {
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

  const displayedAccesses = accesses.slice(0, 4);

  return (
    <Card className="border border-[var(--divider-primary)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--divider-primary)]">
        <h3 className="font-medium text-[var(--element-primary)] text-sm">
          Últimos acessos
        </h3>
      </div>
      
      {displayedAccesses.length === 0 ? (
        <div className="p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center mb-3 text-[var(--element-disabled)]">
            {icons.scan}
          </div>
          <p className="text-sm font-medium text-[var(--element-primary)] mb-1">
            Nenhum acesso registrado
          </p>
          <p className="text-xs text-[var(--element-secondary)] mb-3">
            {placeholder || 'Realize o primeiro check-in para ver o histórico aqui.'}
          </p>
          <Link href="/access">
            <Button variant="outline" size="sm" className="text-xs">
              Ir para Access
            </Button>
          </Link>
        </div>
      ) : (
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
      )}
      
      {displayedAccesses.length > 0 && (
        <div className="px-5 py-3 border-t border-[var(--divider-primary)] bg-[var(--background-secondary)]">
          <Link href="/access/log">
            <Button variant="ghost" size="sm" className="text-xs w-full justify-center text-[var(--element-secondary)] hover:text-[var(--element-primary)]">
              Ver histórico completo
              <span className="ml-1">{icons.arrowRight}</span>
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// QUICK ACTIONS
// ============================================================================

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
// HELPERS
// ============================================================================

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function isAcademyMature(activation: ActivationChecklist): boolean {
  const items = getChecklistItems(activation);
  const done = items.filter((i) => i.done).length + 1; // +1 for account
  return done >= items.length + 1; // all done
}

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

export default function HomePage() {
  const { logout } = useAuth();
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [checklistCollapsed, setChecklistCollapsed] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await getHomeData();
      if (mounted) {
        setHomeData(data);
        capture('home_viewed', { academy_mature: isAcademyMature(data.activation) });
        // Auto-collapse if academy is fully activated
        if (isAcademyMature(data.activation)) {
          setChecklistCollapsed(true);
        }
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formattedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1);
  const greeting = getGreeting();

  // Loading state
  if (!homeData) {
    return (
      <div className="flex flex-col h-full bg-[var(--background-secondary)]">
        <Header
          title="Início"
          actions={
            <Button onClick={logout} variant="outline" size="sm">Sair</Button>
          }
        />
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <HomeSkeleton />
        </div>
      </div>
    );
  }

  const mature = isAcademyMature(homeData.activation);

  return (
    <div className="flex flex-col h-full bg-[var(--background-secondary)]">
      <Header 
        title="Início" 
        actions={
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--element-secondary)] hidden sm:inline">
              {formattedDate}
            </span>
            <Button onClick={logout} variant="outline" size="sm">Sair</Button>
          </div>
        }
      />
      
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Greeting */}
          <div>
            <h1 className="text-xl font-bold text-[var(--element-primary)]">
              {greeting}, {homeData.academyName}
            </h1>
            <p className="text-sm text-[var(--element-secondary)] mt-0.5">
              {mature
                ? 'Aqui está o resumo operacional da sua academia.'
                : 'Complete os passos abaixo para começar a operar.'}
            </p>
          </div>

          {/* ACTIVATION CHECKLIST — Primary for new academies */}
          {!mature && (
            <ActivationChecklistCard
              activation={homeData.activation}
              collapsed={checklistCollapsed}
              onToggle={() => setChecklistCollapsed(!checklistCollapsed)}
            />
          )}

          {/* ALERTS */}
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

          {/* DASHBOARD KPIs — Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Alunos ativos"
              value={homeData.kpis.activeStudents}
              context={`${homeData.kpis.totalStudents} no total`}
              icon={icons.users}
              href="/users"
              variant={homeData.kpis.activeStudents > 0 ? 'positive' : 'default'}
            />
            <KpiCard
              label="Check-ins hoje"
              value={homeData.dashboard.checkinsToday}
              context={mature ? 'Acessos registrados' : 'Realize check-ins em Access'}
              icon={icons.scan}
              href="/access"
            />
            <KpiCard
              label="Receita do mês"
              value={formatCurrency(homeData.dashboard.monthRevenue)}
              context={
                homeData.dashboard.pendingPayments > 0
                  ? `${homeData.dashboard.pendingPayments} pagamento(s) pendente(s)`
                  : 'Nenhum pagamento pendente'
              }
              icon={icons.money}
              href="/financial"
              variant={homeData.dashboard.monthRevenue > 0 ? 'positive' : 'default'}
            />
            <KpiCard
              label={homeData.dashboard.overdueStudents > 0 ? 'Inadimplentes' : 'Novos alunos'}
              value={
                homeData.dashboard.overdueStudents > 0
                  ? homeData.dashboard.overdueStudents
                  : homeData.dashboard.newStudentsMonth
              }
              context={
                homeData.dashboard.overdueStudents > 0
                  ? 'Alunos com pagamento vencido'
                  : 'Neste mês'
              }
              icon={
                homeData.dashboard.overdueStudents > 0
                  ? icons.alertCircle
                  : icons.trendUp
              }
              href={homeData.dashboard.overdueStudents > 0 ? '/financial' : '/users'}
              variant={
                homeData.dashboard.overdueStudents > 0
                  ? 'negative'
                  : homeData.dashboard.newStudentsMonth > 0
                  ? 'positive'
                  : 'default'
              }
            />
          </div>

          {/* SECONDARY KPIs (operation) */}
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              label="Rascunhos abertos"
              value={homeData.kpis.openDrafts}
              context={`${homeData.kpis.pendingInvites} convites pendentes`}
              icon={icons.activity}
              href="/users/onboarding"
            />
            <KpiCard
              label="Unidades ativas"
              value={homeData.kpis.activeUnits}
              context="Unidades em operação"
              icon={icons.mapPin}
              href="/settings/units"
            />
            <KpiCard
              label="Planos ativos"
              value={homeData.activation.plansCount}
              context={
                homeData.activation.plansCount > 0
                  ? 'Disponíveis para matrícula'
                  : 'Crie um plano para começar'
              }
              icon={icons.calendar}
              href="/plans"
            />
          </div>

          {/* RECENT ACCESSES */}
          <RecentAccessesCard 
            accesses={homeData.recentAccesses} 
            placeholder={homeData.accessPlaceholder} 
          />
          
          {/* QUICK ACTIONS */}
          <div>
            <h3 className="text-sm font-medium text-[var(--element-secondary)] uppercase tracking-wide mb-3">
              Ações rápidas
            </h3>
            <QuickActions actions={homeData.quickActions} />
          </div>

          {/* MATURE ACADEMY — Collapsed checklist reminder */}
          {mature && (
            <ActivationChecklistCard
              activation={homeData.activation}
              collapsed={checklistCollapsed}
              onToggle={() => setChecklistCollapsed(!checklistCollapsed)}
            />
          )}
          
        </div>
      </div>
    </div>
  );
}
