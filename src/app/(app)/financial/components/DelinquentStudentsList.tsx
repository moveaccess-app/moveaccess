'use client';

import { useEffect, useState, useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  getDelinquentStudents,
  formatCurrency,
  formatPaymentDate,
  type DelinquentStudent,
} from '@/lib/payments/paymentService';
import {
  getDelinquencyPolicy,
  type DelinquencyPolicy,
  DELINQUENCY_POLICY_DEFAULTS,
} from '@/lib/settings';

type SortField = 'days' | 'total' | 'count' | 'name';

function getSeverityVariant(days: number): 'warning' | 'destructive' {
  return days > 30 ? 'destructive' : 'warning';
}

function wouldBlock(student: DelinquentStudent, policy: DelinquencyPolicy): boolean {
  return policy.blockAccess && student.daysDelinquent > policy.graceDays;
}

export function DelinquentStudentsList({ showValues }: { showValues: boolean }) {
  const [students, setStudents] = useState<DelinquentStudent[]>([]);
  const [policy, setPolicy] = useState<DelinquencyPolicy>(DELINQUENCY_POLICY_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('days');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [studentsResult, policyResult] = await Promise.all([
          getDelinquentStudents(),
          getDelinquencyPolicy(),
        ]);

        if (cancelled) return;

        setStudents(studentsResult);
        setPolicy(policyResult);
      } catch {
        if (cancelled) return;
        setError('Não foi possível carregar os alunos inadimplentes.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, []);

  const sorted = useMemo(() => {
    const copy = [...students];
    switch (sortField) {
      case 'days':
        return copy.sort((a, b) => b.daysDelinquent - a.daysDelinquent);
      case 'total':
        return copy.sort((a, b) => b.overdueTotal - a.overdueTotal);
      case 'count':
        return copy.sort((a, b) => b.overdueCount - a.overdueCount);
      case 'name':
        return copy.sort((a, b) => a.studentName.localeCompare(b.studentName));
      default:
        return copy;
    }
  }, [students, sortField]);

  const blockedCount = useMemo(
    () => students.filter((s) => wouldBlock(s, policy)).length,
    [students, policy],
  );

  if (loading) {
    return (
      <Card className="p-10 text-center text-[var(--element-secondary)]">
        Carregando alunos inadimplentes...
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-sm text-[var(--status-negative)] mb-3">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card className="p-10 text-center">
        <div className="text-3xl mb-3">&#10003;</div>
        <p className="text-sm font-medium text-[var(--element-primary)]">Nenhum aluno inadimplente</p>
        <p className="text-xs text-[var(--element-secondary)] mt-1">Todos os pagamentos estão em dia.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="destructive">{students.length} inadimplente(s)</Badge>
        {policy.blockAccess ? (
          <Badge variant={blockedCount > 0 ? 'destructive' : 'secondary'}>
            {blockedCount} bloqueado(s) pela política
          </Badge>
        ) : (
          <Badge variant="secondary">Bloqueio de acesso desativado</Badge>
        )}
        {policy.blockAccess && policy.graceDays > 0 && (
          <span className="text-xs text-[var(--element-secondary)]">
            Tolerância: {policy.graceDays} dia(s)
          </span>
        )}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 text-xs text-[var(--element-secondary)]">
        <span>Ordenar:</span>
        {([
          ['days', 'Dias em atraso'],
          ['total', 'Valor total'],
          ['count', 'Qtd. cobranças'],
          ['name', 'Nome'],
        ] as [SortField, string][]).map(([field, label]) => (
          <button
            key={field}
            onClick={() => setSortField(field)}
            className={`px-2 py-1 rounded ${
              sortField === field
                ? 'bg-[var(--element-primary)] text-[var(--background-primary)] font-medium'
                : 'bg-[var(--background-tertiary)] hover:bg-[var(--divider-primary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Student cards */}
      <div className="space-y-3">
        {sorted.map((student) => {
          const blocked = wouldBlock(student, policy);
          const severity = getSeverityVariant(student.daysDelinquent);

          return (
            <Card
              key={`${student.studentId}-${student.academyId}`}
              className={`p-4 border-l-4 ${
                blocked
                  ? 'border-l-[var(--status-negative)]'
                  : 'border-l-[var(--status-alert)]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                {/* Left: student info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-[var(--element-primary)] truncate">
                      {student.studentName}
                    </span>
                    <Badge variant={severity}>
                      {student.daysDelinquent}d em atraso
                    </Badge>
                    {blocked && (
                      <Badge variant="destructive">Bloqueado</Badge>
                    )}
                    {!blocked && policy.blockAccess && (
                      <Badge variant="secondary">Dentro da tolerância</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-[var(--element-secondary)]">
                    {student.studentRegistrationId && (
                      <span>Matrícula: {student.studentRegistrationId}</span>
                    )}
                    <span>
                      {student.overdueCount} cobrança(s) vencida(s)
                    </span>
                    <span>
                      Desde {formatPaymentDate(student.oldestOverdueDate)}
                    </span>
                    {student.studentStatus && student.studentStatus !== 'active' && (
                      <Badge variant="outline">{student.studentStatus}</Badge>
                    )}
                  </div>
                </div>

                {/* Right: total */}
                <div className="text-right flex-shrink-0">
                  <div className={`text-base font-bold ${severity === 'destructive' ? 'text-[var(--status-negative)]' : 'text-[var(--status-alert)]'}`}>
                    {showValues ? formatCurrency(student.overdueTotal) : '•••••'}
                  </div>
                  <div className="text-xs text-[var(--element-secondary)]">total em atraso</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
