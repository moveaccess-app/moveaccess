'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { getAuditLogs, type AuditLog } from '@/mocks/settingsMock';

// Labels simplificados para ações - linguagem de negócio
const ACTION_LABELS: Record<string, string> = {
  create: 'criou',
  update: 'atualizou',
  delete: 'removeu',
  login: 'entrou no sistema',
  logout: 'saiu do sistema',
  permission_change: 'alterou permissões de',
  status_change: 'alterou status de',
  manual_release: 'liberou acesso de',
  payment_manual: 'registrou pagamento de',
  contract_publish: 'publicou',
  config_change: 'alterou configuração',
};

// Formatar data relativa de forma simples
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias`;

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// Agrupar logs por dia
function groupLogsByDay(logs: AuditLog[]): { label: string; logs: AuditLog[] }[] {
  const groups: Record<string, AuditLog[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;

  logs.forEach((log) => {
    const logDate = new Date(log.timestamp.getFullYear(), log.timestamp.getMonth(), log.timestamp.getDate()).getTime();
    
    let label: string;
    if (logDate === today) {
      label = 'Hoje';
    } else if (logDate === yesterday) {
      label = 'Ontem';
    } else {
      label = log.timestamp.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(log);
  });

  return Object.entries(groups).map(([label, logs]) => ({ label, logs }));
}

// Componente de linha de atividade (simplificado)
function ActivityRow({ log }: { log: AuditLog }) {
  const action = ACTION_LABELS[log.action] || log.action;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--divider-primary)] last:border-0">
      {/* Avatar simples */}
      <div className="w-8 h-8 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center text-[var(--element-secondary)] text-sm font-medium flex-shrink-0">
        {log.userName.charAt(0).toUpperCase()}
      </div>

      {/* Descrição */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--element-primary)]">
          <span className="font-medium">{log.userName}</span>
          {' '}
          <span className="text-[var(--element-secondary)]">{action}</span>
          {log.targetName && (
            <>
              {' '}
              <span className="text-[var(--element-primary)]">{log.targetName}</span>
            </>
          )}
        </p>
      </div>

      {/* Hora */}
      <span className="text-xs text-[var(--element-disabled)] flex-shrink-0">
        {formatRelativeTime(log.timestamp)}
      </span>
    </div>
  );
}

export default function AuditPage() {
  const allLogs = useMemo(() => getAuditLogs().slice(0, 30), []);
  const groupedLogs = useMemo(() => groupLogsByDay(allLogs), [allLogs]);

  return (
    <div className="flex flex-col h-full bg-[var(--background-secondary)]">
      <Header title="Atividades Recentes" />

      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[var(--element-secondary)]">
            <Link href="/settings" className="hover:text-[var(--status-info)]">
              Configurações
            </Link>
            <span>/</span>
            <span className="text-[var(--element-primary)]">Atividades</span>
          </div>

          {/* Informação */}
          <p className="text-sm text-[var(--element-secondary)]">
            Histórico das últimas ações realizadas pela sua equipe.
          </p>

          {/* Lista de atividades agrupadas */}
          {groupedLogs.map((group) => (
            <div key={group.label}>
              <h3 className="text-xs font-medium text-[var(--element-disabled)] uppercase tracking-wide mb-2">
                {group.label}
              </h3>
              <Card className="overflow-hidden">
                <div className="px-4">
                  {group.logs.map((log) => (
                    <ActivityRow key={log.id} log={log} />
                  ))}
                </div>
              </Card>
            </div>
          ))}

          {allLogs.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-[var(--element-secondary)]">Nenhuma atividade registrada.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
