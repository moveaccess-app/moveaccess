'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '@/components/ui';
import { RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/** @deprecated Use server-signed rotating QR via issue_student_qr_token() RPC instead. */
export function buildStudentQrIdentifier(studentId: string): string {
  return `MOVEACCESS:STUDENT:${studentId}`;
}

const REFRESH_INTERVAL = 45; // seconds — token expires at 60s, refresh at 45s for safety margin

interface StudentQRCodeProps {
  /** Kept for prop compatibility; the rotating token is fetched from the backend. */
  studentId?: string;
  studentName?: string;
}

export function StudentQRCode({ studentName }: StudentQRCodeProps) {
  const { session } = useAuth();
  const [token, setToken]             = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(REFRESH_INTERVAL);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const secondsRef  = useRef(REFRESH_INTERVAL);
  const mountedRef  = useRef(true);

  const fetchToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!session?.access_token) {
        throw new Error('Sessão do aluno indisponível. Faça login novamente.');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/issue_student_qr_token`,
        {
          method: 'POST',
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      const payload = await response.json();

      if (!mountedRef.current) return;

      if (!response.ok) {
        throw new Error(payload?.message || 'Erro ao gerar QR.');
      }

      setToken(payload as string);
      secondsRef.current = REFRESH_INTERVAL;
      setSecondsLeft(REFRESH_INTERVAL);
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : 'Erro ao gerar QR.';
      setError(msg);
      setToken(null);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    mountedRef.current = true;
    fetchToken();

    const tick = window.setInterval(() => {
      if (!mountedRef.current) return;
      secondsRef.current -= 1;
      setSecondsLeft(secondsRef.current);
      if (secondsRef.current <= 0) {
        fetchToken();
      }
    }, 1000);

    return () => {
      mountedRef.current = false;
      window.clearInterval(tick);
    };
  }, [fetchToken]);

  const progressPct = Math.max(0, (secondsLeft / REFRESH_INTERVAL) * 100);

  return (
    <div className="flex flex-col items-center">

      {/* QR frame */}
      <div
        className="w-72 h-72 sm:w-80 sm:h-80 rounded-2xl flex items-center justify-center mb-3 relative overflow-hidden p-4"
        style={{ backgroundColor: 'white', boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 opacity-60">
            <RefreshCw className="w-10 h-10 animate-spin" style={{ color: 'var(--status-info)' }} />
            <span className="text-xs" style={{ color: 'var(--element-secondary)' }}>Gerando código...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 text-center px-2">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <span className="text-xs text-red-500 leading-tight">{error}</span>
            <button
              onClick={fetchToken}
              className="text-xs underline mt-1"
              style={{ color: 'var(--status-info)' }}
            >
              Tentar novamente
            </button>
          </div>
        ) : token ? (
          <QRCodeSVG
            key={token}
            value={token}
            size={272}
            bgColor="#FFFFFF"
            fgColor="#111827"
            level="L"
            includeMargin
            title={studentName ? `QR Code de acesso de ${studentName}` : 'QR Code de acesso'}
          />
        ) : null}

        {/* Corner decorations */}
        <div className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2 rounded-tl-lg" style={{ borderColor: 'var(--status-info)' }} />
        <div className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2 rounded-tr-lg" style={{ borderColor: 'var(--status-info)' }} />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2 rounded-bl-lg" style={{ borderColor: 'var(--status-info)' }} />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2 rounded-br-lg" style={{ borderColor: 'var(--status-info)' }} />
      </div>

      {/* Countdown progress bar */}
      {token && !isLoading && (
        <div className="w-full max-w-[320px] mb-3">
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--background-tertiary, #e5e7eb)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${progressPct}%`,
                backgroundColor: progressPct > 30
                  ? 'var(--status-info)'
                  : 'var(--status-warning, #f59e0b)',
              }}
            />
          </div>
          <p className="text-center text-xs mt-1" style={{ color: 'var(--element-secondary)' }}>
            Novo código em <strong>{secondsLeft}s</strong>
          </p>
        </div>
      )}

      {/* Labels */}
      <div className="text-center px-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4" style={{ color: 'var(--status-positive)' }} />
          <Badge variant="outline">Código seguro e rotativo</Badge>
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--element-primary)' }}>
          Apresente este código no scanner da academia
        </p>
        <p className="text-xs mb-1" style={{ color: 'var(--element-secondary)' }}>
          O código expira automaticamente e é renovado a cada {REFRESH_INTERVAL} segundos.
        </p>
        <p className="text-[11px]" style={{ color: 'var(--element-secondary)' }}>
          Para facilitar a leitura, mantenha o brilho da tela alto e evite zoom do navegador.
        </p>
      </div>
    </div>
  );
}
