'use client';

import { useState, useCallback, useMemo, useEffect, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  processCheckIn,
  validateOtp,
  mockUnits,
  validateAccessRules,
  type AccessUnit,
  type CheckInResult,
  type AccessUser,
} from '@/mocks/accessMock';

// Ícones inline
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
  lock: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  phone: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  loader: (
    <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
};

type Step = 'loading' | 'login' | 'otp' | 'result';

function CheckInContent() {
  const searchParams = useSearchParams();
  const unitId = searchParams.get('unit');

  // Calcula estado inicial baseado nos parâmetros
  const initialState = useMemo(() => {
    if (!unitId) {
      return {
        step: 'result' as Step,
        unit: null as AccessUnit | null,
        error: 'Unidade não especificada. Acesse através do QR Code da academia.',
      };
    }

    const foundUnit = mockUnits.find((u) => u.id === unitId);
    if (!foundUnit) {
      return {
        step: 'result' as Step,
        unit: null as AccessUnit | null,
        error: 'Unidade não encontrada.',
      };
    }

    if (!foundUnit.qrEnabled) {
      return {
        step: 'result' as Step,
        unit: null as AccessUnit | null,
        error: 'Check-in por QR Code está desativado nesta unidade.',
      };
    }

    return {
      step: 'login' as Step,
      unit: foundUnit,
      error: '',
    };
  }, [unitId]);

  const [step, setStep] = useState<Step>(initialState.step);
  const [unit] = useState<AccessUnit | null>(initialState.unit);
  const [error, setError] = useState(initialState.error);

  // Login form
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP form
  const [otp, setOtp] = useState('');
  const [pendingUser, setPendingUser] = useState<AccessUser | null>(null);

  // Result
  const [result, setResult] = useState<CheckInResult | null>(null);

  // Handle Login
  const handleLogin = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!unit) return;

      setError('');
      setIsSubmitting(true);

      setTimeout(() => {
        const checkResult = processCheckIn(identifier, pin, unit.id);

        if (checkResult.reason === 'otp_required' && checkResult.user) {
          // Precisa de OTP
          setPendingUser(checkResult.user);
          setStep('otp');
          setIsSubmitting(false);
          return;
        }

        setResult(checkResult);
        setStep('result');
        setIsSubmitting(false);
      }, 800);
    },
    [identifier, pin, unit]
  );

  // Handle OTP
  const handleOtpSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!unit || !pendingUser) return;

      setError('');
      setIsSubmitting(true);

      setTimeout(() => {
        if (validateOtp(pendingUser.id, otp)) {
          // OTP válido, fazer check-in
          const checkResult = validateAccessRules(pendingUser, unit.id);
          setResult({
            ...checkResult,
            user: pendingUser,
          });
        } else {
          setResult({
            allowed: false,
            reason: 'otp_invalid',
            message: 'Código OTP inválido. Tente novamente.',
            timestamp: new Date(),
            attemptId: `att_${Date.now()}`,
          });
        }
        setStep('result');
        setIsSubmitting(false);
      }, 800);
    },
    [otp, pendingUser, unit]
  );

  // Reset to try again
  const handleTryAgain = useCallback(() => {
    setIdentifier('');
    setPin('');
    setOtp('');
    setError('');
    setResult(null);
    setPendingUser(null);
    setStep('login');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-primary)] to-[var(--background-secondary)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 sm:p-8">
        {/* Header */}
        {unit && (
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-[var(--element-primary)]">
              Check-in
            </h1>
            <p className="text-sm text-[var(--element-secondary)]">{unit.name}</p>
          </div>
        )}

        {/* Loading */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-[var(--element-accent)]">{icons.loader}</div>
            <p className="mt-4 text-[var(--element-secondary)]">Carregando...</p>
          </div>
        )}

        {/* Login Form */}
        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
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
                placeholder="Digite seu identificador..."
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="pin">PIN (4 dígitos)</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="mt-1 text-center text-2xl tracking-widest"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-[var(--status-negative)] text-center">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={!identifier.trim() || pin.length !== 4 || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Verificando...' : 'Entrar'}
            </Button>

            <p className="text-xs text-center text-[var(--element-disabled)]">
              Use seu CPF e o PIN cadastrado no app MoveAccess
            </p>
          </form>
        )}

        {/* OTP Form */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-[var(--status-alert-background)] text-[var(--status-alert)]">
                {icons.phone}
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-lg font-semibold text-[var(--element-primary)]">
                Verificação de Segurança
              </h2>
              <p className="text-sm text-[var(--element-secondary)] mt-1">
                Novo dispositivo detectado. Digite o código enviado para seu celular.
              </p>
            </div>

            <div>
              <Label htmlFor="otp">Código OTP</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="mt-1 text-center text-2xl tracking-widest"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-[var(--status-negative)] text-center">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={otp.length !== 6 || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Verificando...' : 'Confirmar'}
            </Button>

            <p className="text-xs text-center text-[var(--element-disabled)]">
              Dica: Use o código <strong>123456</strong> para testes
            </p>
          </form>
        )}

        {/* Result */}
        {step === 'result' && (
          <div className="text-center py-6">
            {error ? (
              // Error state (invalid unit, etc)
              <>
                <div className="mx-auto w-24 h-24 rounded-full bg-[var(--status-negative-background)] text-[var(--status-negative)] flex items-center justify-center mb-6">
                  {icons.x}
                </div>
                <h2 className="text-2xl font-bold text-[var(--status-negative)] mb-2">
                  Erro
                </h2>
                <p className="text-[var(--element-secondary)]">{error}</p>
              </>
            ) : result?.allowed ? (
              // Success
              <>
                <div className="mx-auto w-24 h-24 rounded-full bg-[var(--status-positive-background)] text-[var(--status-positive)] flex items-center justify-center mb-6 animate-pulse">
                  {icons.check}
                </div>
                <h2 className="text-2xl font-bold text-[var(--status-positive)] mb-2">
                  Acesso Liberado!
                </h2>
                <p className="text-lg text-[var(--element-primary)] font-medium mb-1">
                  {result.user?.name}
                </p>
                <p className="text-[var(--element-secondary)]">{result.message}</p>

                {/* Auto reset after 5 seconds */}
                <AutoReset onReset={handleTryAgain} seconds={5} />
              </>
            ) : (
              // Denied
              <>
                <div className="mx-auto w-24 h-24 rounded-full bg-[var(--status-negative-background)] text-[var(--status-negative)] flex items-center justify-center mb-6">
                  {icons.x}
                </div>
                <h2 className="text-2xl font-bold text-[var(--status-negative)] mb-2">
                  Acesso Negado
                </h2>
                {result?.user && (
                  <p className="text-lg text-[var(--element-primary)] font-medium mb-1">
                    {result.user.name}
                  </p>
                )}
                <p className="text-[var(--element-secondary)]">{result?.message}</p>

                <Button variant="outline" onClick={handleTryAgain} className="mt-6">
                  Tentar Novamente
                </Button>
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
