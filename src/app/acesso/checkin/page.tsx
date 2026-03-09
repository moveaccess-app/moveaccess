'use client';

import { useState, useCallback, useEffect, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  getAccessUnits,
  processCheckin,
  type AccessUnit,
  type CheckInResult,
} from '@/lib/access/accessService';

const icons = {
  check: (
    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  x: (
    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  user: (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  loader: (
    <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
};

type Step = 'loading' | 'login' | 'result';

function CheckInContent() {
  const searchParams = useSearchParams();
  const requestedUnitId = searchParams.get('unit');

  const [step, setStep] = useState<Step>('loading');
  const [unit, setUnit] = useState<AccessUnit | null>(null);
  const [units, setUnits] = useState<AccessUnit[]>([]);
  const [error, setError] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);

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
      setStep('login');
    }

    loadUnits();
  }, [requestedUnitId]);

  const handleCheckin = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!unit) return;

    setError('');
    setIsSubmitting(true);

    try {
      const checkResult = await processCheckin({
        identifier,
        unitId: unit.id,
        method: 'manual',
        notes,
      });

      setResult(checkResult);
      setStep('result');
    } finally {
      setIsSubmitting(false);
    }
  }, [identifier, notes, unit]);

  const handleTryAgain = useCallback(() => {
    setIdentifier('');
    setNotes('');
    setError('');
    setResult(null);
    setStep('login');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-primary)] to-[var(--background-secondary)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 sm:p-8">
        {unit && (
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-[var(--element-primary)]">Check-in</h1>
            <p className="text-sm text-[var(--element-secondary)]">{unit.name}</p>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-[var(--element-accent)]">{icons.loader}</div>
            <p className="mt-4 text-[var(--element-secondary)]">Carregando...</p>
          </div>
        )}

        {step === 'login' && (
          <form onSubmit={handleCheckin} className="space-y-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-[var(--background-tertiary)] text-[var(--element-primary)]">
                {icons.user}
              </div>
            </div>

            <div>
              <Label htmlFor="identifier">CPF, E-mail ou Telefone</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="Digite o identificador do aluno..."
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1"
                autoFocus
              />
            </div>

            {units.length > 1 && (
              <div>
                <Label htmlFor="unit">Unidade</Label>
                <select
                  id="unit"
                  value={unit?.id || ''}
                  onChange={(e) => setUnit(units.find((item) => item.id === e.target.value) || null)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] text-[var(--element-primary)] text-sm"
                >
                  {units.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Input
                id="notes"
                type="text"
                placeholder="Observação opcional do check-in"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            {error && (
              <p className="text-sm text-[var(--status-negative)] text-center">{error}</p>
            )}

            <Button type="submit" disabled={!identifier.trim() || !unit || isSubmitting} className="w-full">
              {isSubmitting ? 'Processando...' : 'Registrar check-in'}
            </Button>

            <p className="text-xs text-center text-[var(--element-disabled)]">
              MVP manual operado por colaborador autenticado
            </p>
          </form>
        )}

        {step === 'result' && (
          <div className="text-center py-6">
            {error ? (
              <>
                <div className="mx-auto w-24 h-24 rounded-full bg-[var(--status-negative-background)] text-[var(--status-negative)] flex items-center justify-center mb-6">
                  {icons.x}
                </div>
                <h2 className="text-2xl font-bold text-[var(--status-negative)] mb-2">Erro</h2>
                <p className="text-[var(--element-secondary)]">{error}</p>
              </>
            ) : result?.allowed ? (
              <>
                <div className="mx-auto w-24 h-24 rounded-full bg-[var(--status-positive-background)] text-[var(--status-positive)] flex items-center justify-center mb-6 animate-pulse">
                  {icons.check}
                </div>
                <h2 className="text-2xl font-bold text-[var(--status-positive)] mb-2">Acesso Liberado!</h2>
                <p className="text-lg text-[var(--element-primary)] font-medium mb-1">{result.user?.name}</p>
                <p className="text-[var(--element-secondary)]">{result.message}</p>
                <AutoReset onReset={handleTryAgain} seconds={5} />
              </>
            ) : (
              <>
                <div className="mx-auto w-24 h-24 rounded-full bg-[var(--status-negative-background)] text-[var(--status-negative)] flex items-center justify-center mb-6">
                  {icons.x}
                </div>
                <h2 className="text-2xl font-bold text-[var(--status-negative)] mb-2">Acesso Negado</h2>
                {result?.user?.name && (
                  <p className="text-lg text-[var(--element-primary)] font-medium mb-1">{result.user.name}</p>
                )}
                <p className="text-[var(--element-secondary)]">{result?.message}</p>
                <Button variant="outline" onClick={handleTryAgain} className="mt-6">Tentar Novamente</Button>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// Auto reset component
function AutoReset({
  onReset,
  seconds,
}: {
  onReset: () => void;
  seconds: number;
}) {
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
      Retornando em {remaining}s...
    </p>
  );
}

// Loading fallback
function CheckInLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-primary)] to-[var(--background-secondary)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-[var(--element-accent)]">{icons.loader}</div>
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
