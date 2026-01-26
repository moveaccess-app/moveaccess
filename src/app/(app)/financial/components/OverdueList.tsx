'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  getOverdueCharges,
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  getDaysOverdue,
  generatePaymentLink,
  getReminderTemplate,
  blockUserFinancial,
  isUserBlockedFinancial,
  Charge,
} from '@/mocks/financialMock';

type SortField = 'daysOverdue' | 'value' | 'userName';
type PriorityLevel = 'high' | 'medium' | 'low';

export function OverdueList({ showValues = true }: { showValues?: boolean }) {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortField>('daysOverdue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [copiedLinks, setCopiedLinks] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const overdueCharges = useMemo(() => {
    const charges = getOverdueCharges();
    
    return charges.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'daysOverdue':
          comparison = getDaysOverdue(a.dueDate) - getDaysOverdue(b.dueDate);
          break;
        case 'value':
          comparison = a.finalValue - b.finalValue;
          break;
        case 'userName':
          comparison = a.userName.localeCompare(b.userName);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [sortBy, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleBlock = (charge: Charge) => {
    blockUserFinancial(charge.userId);
    setBlockedUsers((prev) => new Set([...prev, charge.userId]));
    setOpenMenuId(null);
    alert(`Usuário ${charge.userName} bloqueado por inadimplência.`);
  };

  const handleGenerateLink = async (charge: Charge) => {
    const link = generatePaymentLink(charge.id);
    await navigator.clipboard.writeText(link);
    setCopiedLinks((prev) => new Set([...prev, charge.id]));
    setOpenMenuId(null);
    setTimeout(() => {
      setCopiedLinks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(charge.id);
        return newSet;
      });
    }, 2000);
  };

  const handleSendReminder = (charge: Charge) => {
    const template = getReminderTemplate(charge);
    setOpenMenuId(null);
    alert(`Lembrete copiado para ${charge.userName}!\n\n${template}`);
  };

  const handleChargeClick = (charge: Charge) => {
    router.push(`/financial/cobranca/${charge.id}`);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortBy !== field) {
      return (
        <svg className="w-3 h-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {sortOrder === 'asc' ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        )}
      </svg>
    );
  };

  const getPriorityLevel = (daysOverdue: number): PriorityLevel => {
    if (daysOverdue > 30) return 'high';
    if (daysOverdue > 15) return 'medium';
    return 'low';
  };

  const getPriorityStyles = (priority: PriorityLevel) => {
    switch (priority) {
      case 'high':
        return {
          dot: 'bg-[var(--status-negative)]',
          text: 'text-[var(--status-negative)]',
          label: 'Alta',
        };
      case 'medium':
        return {
          dot: 'bg-[var(--status-alert)]',
          text: 'text-[var(--status-alert)]',
          label: 'Média',
        };
      case 'low':
        return {
          dot: 'bg-yellow-500',
          text: 'text-yellow-600',
          label: 'Baixa',
        };
    }
  };

  // Totais por prioridade
  const priorityCounts = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    overdueCharges.forEach((c) => {
      counts[getPriorityLevel(getDaysOverdue(c.dueDate))]++;
    });
    return counts;
  }, [overdueCharges]);

  const totalOverdue = overdueCharges.reduce((sum, c) => sum + c.finalValue, 0);
  const { display: totalDisplay, full: totalFull } = formatCurrencyCompact(totalOverdue);

  // Estado vazio
  if (overdueCharges.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="p-4 rounded-full bg-[var(--status-positive-background)] w-fit mx-auto mb-4">
          <svg className="w-8 h-8 text-[var(--status-positive)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-[var(--element-primary)] font-medium text-lg">
          Nenhuma cobrança em atraso!
        </div>
        <div className="text-[var(--element-disabled)] text-sm mt-1">
          Todos os pagamentos estão em dia. Continue assim!
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo de Inadimplência - Cards compactos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 bg-[var(--status-negative-background)] border-[var(--status-negative)]/20">
          <div className="text-xs text-[var(--status-negative)] font-medium">Total em Atraso</div>
          <div className="text-xl font-bold text-[var(--status-negative)]" title={showValues ? totalFull : undefined}>
            {showValues ? totalDisplay : '•••••'}
          </div>
          <div className="text-xs text-[var(--element-secondary)] mt-0.5">
            {overdueCharges.length} cobrança(s)
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--status-negative)]" />
            <span className="text-xs text-[var(--element-secondary)] font-medium">Alta Prioridade</span>
          </div>
          <div className="text-xl font-bold text-[var(--status-negative)] mt-1">
            {priorityCounts.high}
          </div>
          <div className="text-xs text-[var(--element-disabled)]">&gt; 30 dias</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--status-alert)]" />
            <span className="text-xs text-[var(--element-secondary)] font-medium">Média Prioridade</span>
          </div>
          <div className="text-xl font-bold text-[var(--status-alert)] mt-1">
            {priorityCounts.medium}
          </div>
          <div className="text-xs text-[var(--element-disabled)]">15-30 dias</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-xs text-[var(--element-secondary)] font-medium">Baixa Prioridade</span>
          </div>
          <div className="text-xl font-bold text-yellow-600 mt-1">
            {priorityCounts.low}
          </div>
          <div className="text-xs text-[var(--element-disabled)]">&lt; 15 dias</div>
        </Card>
      </div>

      {/* Tabela de Inadimplentes */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-[var(--divider-primary)] flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--element-primary)]">
            Fila de Trabalho
          </h2>
          <span className="text-sm text-[var(--element-secondary)]">
            Ordenado por prioridade
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-[var(--background-tertiary)]">
              <tr>
                <th className="text-left p-3 font-medium text-[var(--element-secondary)] text-sm w-20">
                  Prioridade
                </th>
                <th
                  className="text-left p-3 font-medium text-[var(--element-secondary)] text-sm cursor-pointer hover:text-[var(--element-primary)] select-none"
                  onClick={() => toggleSort('userName')}
                >
                  <span className="inline-flex items-center gap-1">
                    Aluno {renderSortIcon('userName')}
                  </span>
                </th>
                <th
                  className="text-right p-3 font-medium text-[var(--element-secondary)] text-sm cursor-pointer hover:text-[var(--element-primary)] select-none"
                  onClick={() => toggleSort('value')}
                >
                  <span className="inline-flex items-center gap-1 justify-end">
                    Valor {renderSortIcon('value')}
                  </span>
                </th>
                <th
                  className="text-center p-3 font-medium text-[var(--element-secondary)] text-sm cursor-pointer hover:text-[var(--element-primary)] select-none"
                  onClick={() => toggleSort('daysOverdue')}
                >
                  <span className="inline-flex items-center gap-1">
                    Atraso {renderSortIcon('daysOverdue')}
                  </span>
                </th>
                <th className="text-right p-3 font-medium text-[var(--element-secondary)] text-sm w-24">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--divider-primary)]">
              {overdueCharges.map((charge) => {
                const daysOverdue = getDaysOverdue(charge.dueDate);
                const priority = getPriorityLevel(daysOverdue);
                const priorityStyle = getPriorityStyles(priority);
                const isBlocked = blockedUsers.has(charge.userId) || isUserBlockedFinancial(charge.userId);
                const isMenuOpen = openMenuId === charge.id;

                return (
                  <tr
                    key={charge.id}
                    className="hover:bg-[var(--background-tertiary)] transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${priorityStyle.dot}`} />
                        <span className={`text-xs font-medium ${priorityStyle.text}`}>
                          {priorityStyle.label}
                        </span>
                      </div>
                    </td>
                    <td
                      className="p-3 cursor-pointer"
                      onClick={() => handleChargeClick(charge)}
                    >
                      <div className="font-medium text-sm text-[var(--element-primary)] hover:text-[var(--status-info)] transition-colors">
                        {charge.userName}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[var(--element-disabled)]">
                          {charge.planName}
                        </span>
                        {isBlocked && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Bloqueado
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className={`font-semibold text-sm ${priorityStyle.text}`} title={showValues ? formatCurrency(charge.finalValue) : undefined}>
                        {showValues ? formatCurrencyCompact(charge.finalValue).display : '•••••'}
                      </div>
                      <div className="text-xs text-[var(--element-disabled)]">
                        Venc. {formatDate(charge.dueDate)}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Badge 
                        variant={priority === 'high' ? 'destructive' : priority === 'medium' ? 'warning' : 'secondary'}
                      >
                        {daysOverdue} dias
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {/* Dropdown de ações */}
                      <div className="relative inline-block">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOpenMenuId(isMenuOpen ? null : charge.id)}
                          className="p-1"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </Button>

                        {isMenuOpen && (
                          <>
                            {/* Overlay para fechar menu */}
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenMenuId(null)}
                            />
                            {/* Menu dropdown */}
                            <div className="absolute right-0 top-8 z-20 w-48 bg-[var(--background-primary)] border border-[var(--divider-primary)] rounded-lg shadow-lg py-1">
                              <button
                                onClick={() => handleGenerateLink(charge)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--element-primary)] hover:bg-[var(--background-tertiary)] transition-colors"
                              >
                                {copiedLinks.has(charge.id) ? (
                                  <svg className="w-4 h-4 text-[var(--status-positive)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                )}
                                Copiar link pagamento
                              </button>
                              <button
                                onClick={() => handleSendReminder(charge)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--element-primary)] hover:bg-[var(--background-tertiary)] transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                Enviar lembrete
                              </button>
                              <button
                                onClick={() => handleChargeClick(charge)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--element-primary)] hover:bg-[var(--background-tertiary)] transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Ver detalhes
                              </button>
                              {!isBlocked && (
                                <>
                                  <div className="border-t border-[var(--divider-primary)] my-1" />
                                  <button
                                    onClick={() => handleBlock(charge)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--status-negative)] hover:bg-[var(--status-negative-background)] transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    Bloquear acesso
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Rodapé */}
      <div className="text-sm text-[var(--element-secondary)]">
        {overdueCharges.length} inadimplente(s) • Total em atraso:{' '}
        <strong className="text-[var(--status-negative)]" title={showValues ? totalFull : undefined}>
          {showValues ? totalDisplay : '•••••'}
        </strong>
      </div>
    </div>
  );
}
