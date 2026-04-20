'use client';

import { useState, useCallback, useEffect, useRef, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle2,
  XCircle,
  User,
  Loader2,
  Clock,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import {
  getAccessUnits,
  getAccessLogs,
  processCheckin,
  formatAccessTime,
  formatCpfMasked,
  getAccessStatusLabel,
  type AccessUnit,
  type AccessAttempt,
  type CheckInResult,
} from '@/lib/access';

type Step = 'loading' | 'form' | 'processing' | 'result';

function CheckInContent() {
  const searchParams = useSearchParams();
  const requestedUnitId = searchParams.get('unit');
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('loading');
  const [unit, setUnit] = useState<AccessUnit | null>(null);
  const [units, setUnits] = useState<AccessUnit[]>([]);
  const [error, setError] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [recentLogs, setRecentLogs] = useState<AccessAttempt[]>([]);

  useEffect(() => {
    async function loadUnits() {
      setStep('loading');
      const data = await getAccessUnits();
      setUnits(data);

      if (data.length === 0) {
        setError('Nenhuma unidade disponível para check-in. Faça login como staff para operar esta tela.');
        setStep('result');
        return;
      }

      const selected = (requestedUnitId ? data.find((item) => item.id === requestedUnitId) : null) || data[0];
      if (!selected) {
        setError('Unidade não encontrada.');
        setStep('result');
        return;
      }

      setUnit(selected);
      setStep('form');

      const logs = await getAccessLogs({ unitId: selected.id, limit: 5 });
      setRecentLogs(logs);
    }
    loadUnits();
  }, [requestedUnitId]);

  useEffect(() => {
    if (step === 'form') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step]);

  const handleCheckin = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!unit || !identifier.trim()) return;

    setError('');
    setStep('processing');

    try {
      const checkResult = await processCheckin({
        identifier: identifier.trim(),
        unitId: unit.id,
        method: 'manual',
        notes: notes.trim() || undefined,
      });

      setResult(checkResult);
      setStep('result');

      const logs = await getAccessLogs({ unitId: unit.id, limit: 5 });
      setRecentLogs(logs);
    } catch {
      setResult({
        allowed: false,
        reason: 'UNAUTHENTICATED',
        message: 'Erro ao processar check-in. Tente novamente.',
        timestamp: new Date(),
        attemptId: '',
      });
      setStep('result');
    }
  }, [identifier, notes, unit]);

  const handleReset = useCallback(() => {
    setIdentifier('');
    setNotes('');
    setError('');
    setResult(null);
    setStep('form');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-primary)] to-[var(--background-secondary)]">
      {/* Header */}
      <header className="bg-[var(--background-primary)] border-b border-[var(--divider-primary)] px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--element-accent)] flex items-center justify-center">
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-[var(--element-primary)]">Check-in Manual</h1>
              {unit && (
                <div className="flex items-center gap-1 text-xs text-[var(--element-secondary)]">
                  <MapPin className="w-3 h-3" />
                  <span>{unit.name}</span>
                </div>
              )}
            </div>
          </div>
          {units.length > 1 && unit && (
            <select
              value={unit.id}
              onChange={(e) => {
                const selected = units.find((item) => item.id === e.target.value);
                if (selected) setUnit(selected);
              }}
              className="px-3 py-1.5 rounded-lg border border-[var(--divider-secondary)] bg-[var(--background-primary)] text-sm text-[var(--element-primary)]"
            >
              {units.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Card */}
          <div className="lg:col-span-2">
            <Card className="p-6 sm:p-8">
              {step === 'loading' && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-10 h-10 text-[var(--element-accent)] animate-spin" />
                  <p className="mt-4 text-[var(--element-secondary)]">Carregando unidades...</p>
                </div>
              )}

              {step === 'form' && (
                <form onSubmit={handleCheckin} className="space-y-6">
                  <div className="text-center mb-2">
                    <div className="mx-auto w-16 h-16 rounded-full bg-[var(--background-tertiary)] flex items-center justify-center mb-4">
                      <User className="w-8 h-8 text-[var(--element-primary)]" />
                    </div>
                    <h2 className="text-lg font-semibold text-[var(--element-primary)]">Identificar Aluno</h2>
                    <p className="text-sm text-[var(--element-secondary)] mt-1">
                      CPF, e-mail ou telefone do aluno
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="identifier" className="sr-only">Identificador</Label>
                    <Input
                      ref={inputRef}
                      id="identifier"
                      type="text"
                      placeholder="Digite CPF, e-mail ou telefone..."
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="text-center text-lg py-3"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes" className="text-xs text-[var(--element-secondary)]">
                      Observação (opcional)
                    </Label>
                    <Input
                      id="notes"
                      type="text"
                      placeholder="Ex: primeira aula experimental"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-[var(--status-negative)] text-center">{error}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={!identifier.trim() || !unit}
                    className="w-full py-3 text-base font-semibold"
                  >
                    Registrar Check-in
                  </Button>
                </form>
              )}

              {step === 'processing' && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-12 h-12 text-[var(--element-accent)] animate-spin" />
                  <p className="mt-4 text-lg text-[var(--element-secondary)]">Validando acesso...</p>
                  <p className="text-sm text-[var(--element-disabled)] mt-1">Verificando plano, pagamentos e regras</p>
                </div>
              )}

              {step === 'result' && (
                <div className="text-center py-8">
                  {error && !result ? (
                    <>
                      <div className="mx-auto w-24 h-24 rounded-full bg-[var(--status-negative-background)] flex items-center justify-center mb-6">
                        <XCircle className="w-14 h-14 text-[var(--status-negative)]" />
                      </div>
                      <h2 className="text-2xl font-bold text-[var(--status-negative)] mb-2">Erro</h2>
                      <p className="text-[var(--element-secondary)] max-w-sm mx-auto">{error}</p>
                      <Button variant="outline" onClick={handleReset} className="mt-6">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Tentar Novamente
                      </Button>
                    </>
                  ) : result?.allowed ? (
                    <>
                      <div className="mx-auto w-28 h-28 rounded-full bg-[var(--status-positive-background)] flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-16 h-16 text-[var(--status-positive)]" />
                      </div>
                      <h2 className="text-2xl font-bold text-[var(--status-positive)] mb-1">Acesso Liberado</h2>
                      {result.user?.name && (
                        <p className="text-xl text-[var(--element-primary)] font-semibold mb-1">{result.user.name}</p>
                      )}
                      <p className="text-[var(--element-secondary)]">{result.message}</p>
                      <AutoReset onReset={handleReset} seconds={5} />
                    </>
                  ) : (
                    <>
                      <div className="mx-auto w-28 h-28 rounded-full bg-[var(--status-negative-background)] flex items-center justify-center mb-6">
                        <XCircle className="w-16 h-16 text-[var(--status-negative)]" />
                      </div>
                      <h2 className="text-2xl font-bold text-[var(--status-negative)] mb-1">Acesso Negado</h2>
                      {result?.user?.name && (
                        <p className="text-xl text-[var(--element-primary)] font-semibold mb-1">{result.user.name}</p>
                      )}
                      <p className="text-[var(--element-secondary)] max-w-sm mx-auto">{result?.message}</p>
                      <Button variant="outline" onClick={handleReset} className="mt-6">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Próximo Aluno
                      </Button>
                    </>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Recent Check-ins Sidebar */}
          <div className="hidden lg:block">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-[var(--element-primary)] mb-3">
                Últimos Check-ins
              </h3>
              {recentLogs.length > 0 ? (
                <div className="space-y-3">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-2.5 py-2 border-b border-[var(--divider-primary)] last:border-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        log.status === 'allowed' ? 'bg-[var(--status-positive)]' : 'bg-[var(--status-negative)]'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--element-primary)] truncate">
                          {log.userName || 'Desconhecido'}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-[var(--element-disabled)]">
                          <Clock className="w-3 h-3" />
                          <span>{formatAccessTime(log.timestamp)}</span>
                          <span>•</span>
                          <span>{formatCpfMasked(log.userCpf || '')}</span>
                        </div>
                      </div>
                      <Badge
                        variant={log.status === 'allowed' ? 'default' : 'destructive'}
                        className="text-xs flex-shrink-0"
                      >
                        {getAccessStatusLabel(log.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--element-disabled)] text-center py-6">
                  Nenhum check-in recente
                </p>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function AutoReset({ onReset, seconds }: { onReset: () => void; seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer);
          onReset();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onReset]);

  return (
    <p className="text-xs text-[var(--element-disabled)] mt-6">
      Próximo aluno em {remaining}s...
    </p>
  );
}

function CheckInLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-primary)] to-[var(--background-secondary)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 text-[var(--element-accent)] animate-spin" />
          <p className="mt-4 text-[var(--element-secondary)]">Carregando...</p>
        </div>
      </Card>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<CheckInLoading />}>
      <CheckInContent />
    </Suspense>
  );
}
