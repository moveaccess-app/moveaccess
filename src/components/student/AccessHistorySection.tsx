'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { Activity } from 'lucide-react';
import type { StudentPortalAccessLog } from '@/lib/student/studentPortalService';

const EVENT_LABELS: Record<string, string> = {
  entry: 'Entrada',
  exit: 'Saída',
};

function formatDateTime(dateStr: string): { date: string; time: string } {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('pt-BR'),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
}

interface AccessHistorySectionProps {
  accessLogs: StudentPortalAccessLog[];
}

export function AccessHistorySection({ accessLogs }: AccessHistorySectionProps) {
  return (
    <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--background-primary)' }}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" style={{ color: 'var(--status-info)' }} />
          <CardTitle className="text-base font-bold">Últimos Acessos</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {accessLogs.length === 0 ? (
          <div
            className="text-center py-6 rounded-xl"
            style={{ backgroundColor: 'var(--background-secondary)' }}
          >
            <p className="text-sm" style={{ color: 'var(--element-secondary)' }}>
              Nenhum acesso registrado
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {accessLogs.map((log) => {
              const { date, time } = formatDateTime(log.occurredAt);
              const isAllowed = log.status === 'allowed';

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2.5 border-b last:border-b-0"
                  style={{ borderColor: 'var(--divider-primary)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: isAllowed
                          ? 'var(--status-positive)'
                          : 'var(--status-negative)',
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--element-primary)' }}>
                          {log.unitName || 'Unidade'}
                        </p>
                        {log.accessEvent && (
                          <Badge variant={log.accessEvent === 'entry' ? 'success' : 'secondary'}>
                            {EVENT_LABELS[log.accessEvent] || log.accessEvent}
                          </Badge>
                        )}
                      </div>
                      {!isAllowed && log.denialReason && (
                        <p className="text-xs" style={{ color: 'var(--status-negative)' }}>
                          Acesso negado
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-xs font-medium" style={{ color: 'var(--element-primary)' }}>
                      {time}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--element-disabled)' }}>
                      {date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
