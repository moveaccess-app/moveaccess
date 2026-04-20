'use client';

/**
 * Scanner Premium — Check-in operacional
 *
 * O operador aponta a câmera para o QR code do aluno.
 * O sistema decodifica o identificador e chama a RPC
 * `process_checkin_by_identifier` via accessService.
 *
 * Resultado rico: nome, tipo de acesso, unidade, timestamp, audio feedback.
 * Otimizado para operação contínua às 6h da manhã com fila na porta.
 *
 * Rota: /(protected)/scanner
 */

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Container,
  Label,
  Input,
} from '@/components/ui';
import {
  getAccessUnits,
  processCheckin,
  type DenialReason,
  type AccessUnit,
  type CheckInResult,
} from '@/lib/access';
import { getAcademy, type Academy, type AccessScannerMode } from '@/lib/settings';
import { useQrScanner } from '@/hooks/useQrScanner';
import { useScannerAudio } from '@/hooks/useScannerAudio';
import {
  Camera,
  CameraOff,
  CheckCircle,
  XCircle,
  Scan,
  RefreshCw,
  Loader2,
  LogIn,
  LogOut,
  ArrowRightLeft,
  Users,
  Clock,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PageStep = 'loading' | 'select-unit' | 'scanning' | 'processing' | 'result';
type ScannerFlow = 'entry' | 'exit' | 'auto';
type AcademyPreferencesState = Academy['preferences'];

function getScannerDeniedCopy(reason?: DenialReason, fallbackMessage?: string) {
  const defaultCopy = {
    title: 'Entrada não liberada',
    description: 'Não foi possível concluir a liberação agora.',
    guidance: 'Por favor, dirija-se à recepção para ajuda.',
  };

  const copyByReason: Partial<
    Record<DenialReason, { title: string; description: string; guidance: string }>
  > = {
    USER_NOT_FOUND: {
      title: 'Cadastro não localizado',
      description: 'Não encontramos um cadastro válido para esta entrada.',
      guidance: 'Por favor, dirija-se à recepção para ajuda.',
    },
    STUDENT_INACTIVE: {
      title: 'Entrada não liberada',
      description: 'Seu acesso não pôde ser confirmado neste momento.',
      guidance: 'Por favor, dirija-se à recepção para ajuda.',
    },
    SUBSCRIPTION_INACTIVE: {
      title: 'Entrada não liberada',
      description: 'Seu acesso não pôde ser confirmado neste momento.',
      guidance: 'Por favor, dirija-se à recepção para ajuda.',
    },
    SUBSCRIPTION_EXPIRED: {
      title: 'Entrada não liberada',
      description: 'Seu acesso não pôde ser confirmado neste momento.',
      guidance: 'Por favor, dirija-se à recepção para ajuda.',
    },
    UNIT_NOT_ALLOWED: {
      title: 'Entrada não liberada',
      description: 'Este acesso não está disponível para esta unidade agora.',
      guidance: 'Por favor, dirija-se à recepção para ajuda.',
    },
    TIME_NOT_ALLOWED: {
      title: 'Entrada não liberada',
      description: 'Este acesso não está disponível neste horário.',
      guidance: 'Por favor, dirija-se à recepção para ajuda.',
    },
    QR_EXPIRED: {
      title: 'Código expirado',
      description: 'Esse QR já venceu e precisa ser atualizado.',
      guidance: 'Peça para o aluno abrir um novo QR e tente novamente.',
    },
    QR_ALREADY_USED: {
      title: 'Código já utilizado',
      description: 'Esse QR já foi consumido em uma validação anterior.',
      guidance: 'Peça para o aluno abrir um novo QR e tente novamente.',
    },
    INVALID_QR_SIGNATURE: {
      title: 'Código inválido',
      description: 'Não foi possível validar a autenticidade deste QR.',
      guidance: 'Peça para o aluno gerar um novo QR e tente novamente.',
    },
    INVALID_QR_PAYLOAD: {
      title: 'Código inválido',
      description: 'O conteúdo do QR não pôde ser lido corretamente.',
      guidance: 'Aproxime a câmera ou peça um novo QR ao aluno.',
    },
    ACADEMY_MISMATCH: {
      title: 'Código de outra academia',
      description: 'Esse QR foi gerado para outra academia.',
      guidance: 'Confirme a conta do aluno ou a unidade selecionada.',
    },
    ALREADY_INSIDE: {
      title: 'Saída pendente',
      description: 'Já existe uma entrada aberta para este aluno.',
      guidance: 'Registre a saída anterior antes de liberar uma nova entrada.',
    },
    EXIT_WITHOUT_ENTRY: {
      title: 'Entrada não encontrada',
      description: 'Não há entrada aberta para registrar a saída deste aluno.',
      guidance: 'Confirme o fluxo configurado ou registre uma nova entrada.',
    },
  };

  const reasonCopy = reason ? copyByReason[reason] : undefined;

  return reasonCopy ?? {
    ...defaultCopy,
    description: fallbackMessage || defaultCopy.description,
  };
}

/* ------------------------------------------------------------------ */
/*  AutoReset — countdown that calls onReset                           */
/* ------------------------------------------------------------------ */

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
    <p className="text-xs text-[var(--element-disabled)] mt-4">
      Próximo scan em {remaining}s...
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getEventLabel(eventType?: 'entry' | 'exit'): string {
  if (eventType === 'exit') return 'Saída registrada';
  return 'Entrada registrada';
}

/* ------------------------------------------------------------------ */
/*  Daily stats tracker (session only, no backend)                     */
/* ------------------------------------------------------------------ */

interface DayStats {
  total: number;
  allowed: number;
  denied: number;
  lastScans: Array<{ name?: string; allowed: boolean; time: Date }>;
}

function useDayStats() {
  const [stats, setStats] = useState<DayStats>({
    total: 0,
    allowed: 0,
    denied: 0,
    lastScans: [],
  });

  const record = useCallback((result: CheckInResult) => {
    setStats((prev) => ({
      total: prev.total + 1,
      allowed: prev.allowed + (result.allowed ? 1 : 0),
      denied: prev.denied + (result.allowed ? 0 : 1),
      lastScans: [
        { name: result.user?.name, allowed: result.allowed, time: new Date() },
        ...prev.lastScans,
      ].slice(0, 5),
    }));
  }, []);

  return { stats, record };
}

/* ------------------------------------------------------------------ */
/*  Main content (wrapped in Suspense at the bottom)                   */
/* ------------------------------------------------------------------ */

function ScannerContent() {
  const searchParams = useSearchParams();

  /* ---- units ---- */
  const [units, setUnits] = useState<AccessUnit[]>([]);
  const [unit, setUnit] = useState<AccessUnit | null>(null);
  const [scannerMode, setScannerMode] = useState<AccessScannerMode>('entry_only');
  const [scannerFlow, setScannerFlow] = useState<ScannerFlow>('entry');

  /* ---- workflow ---- */
  const [step, setStep] = useState<PageStep>('loading');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [manualIdentifier, setManualIdentifier] = useState('');
  const [capturedIdentifier, setCapturedIdentifier] = useState('');
  const deniedCopy = getScannerDeniedCopy(result?.reason, result?.message);

  /* ---- Audio feedback ---- */
  const { playSuccess, playDenied } = useScannerAudio();

  /* ---- Daily session stats ---- */
  const { stats, record } = useDayStats();

  /* ---- QR scanner hook ---- */
  const cameraEnabled = step === 'scanning';
  const {
    videoRef,
    canvasRef,
    code,
    streaming,
    error: cameraError,
    reset: resetScanner,
  } = useQrScanner({ enabled: cameraEnabled });

  /* ---- Load units on mount ---- */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [data, academy] = await Promise.all([getAccessUnits(), getAcademy()]);
      if (cancelled) return;

      const preferences: AcademyPreferencesState | undefined = academy?.preferences as AcademyPreferencesState | undefined;

      setUnits(data);

      const configuredMode = preferences?.accessControl?.scannerMode || 'entry_only';
      setScannerMode(configuredMode);

      const requestedFlow = searchParams.get('flow');
      const nextFlow: ScannerFlow =
        configuredMode === 'single_entry_exit'
          ? 'auto'
          : requestedFlow === 'exit'
            ? 'exit'
            : 'entry';

      setScannerFlow(nextFlow);

      if (data.length === 1) {
        setUnit(data[0]);
        setStep('scanning');
      } else if (data.length > 1) {
        setStep('select-unit');
      } else {
        setErrorMsg(
          'Nenhuma unidade configurada. Cadastre unidades em Configurações → Unidades.',
        );
        setStep('result');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  /* ---- Guard: avoid double-processing ---- */
  const processingRef = useRef(false);

  const beginValidation = useCallback(
    (identifier: string) => {
      if (!identifier || !unit || processingRef.current) return;

      processingRef.current = true;
      const normalizedIdentifier = identifier.trim();
      setCapturedIdentifier(normalizedIdentifier);

      const frameId = requestAnimationFrame(() => setStep('processing'));

      processCheckin({
        identifier: normalizedIdentifier,
        unitId: unit.id,
        method: 'qr',
        flow: scannerFlow,
        notes: 'Scanner QR check-in',
      })
        .then((res) => {
          setResult(res);
          record(res);
          if (res.allowed) playSuccess();
          else playDenied();
          setStep('result');
        })
        .catch((err) => {
          setResult(null);
          playDenied();
          setErrorMsg(
            err instanceof Error
              ? err.message
              : 'Falha ao validar o acesso do aluno.',
          );
          setStep('result');
        });

      return () => cancelAnimationFrame(frameId);
    },
    [scannerFlow, unit, record, playSuccess, playDenied],
  );

  /* ---- When QR code is decoded → processCheckin ---- */
  useEffect(() => {
    if (!code) return;
    return beginValidation(code);
  }, [code, beginValidation]);

  /* ---- Reset for next scan ---- */
  const handleReset = useCallback(() => {
    processingRef.current = false;
    setResult(null);
    setErrorMsg('');
    setCapturedIdentifier('');
    setManualIdentifier('');
    resetScanner();
    setStep('scanning');
  }, [resetScanner]);

  const handleScannerFlowChange = useCallback((nextFlow: ScannerFlow) => {
    setScannerFlow(nextFlow);
    setCapturedIdentifier('');
    setManualIdentifier('');
    setErrorMsg('');
    setResult(null);
    processingRef.current = false;
    resetScanner();
    setStep('scanning');
  }, [resetScanner]);

  /* ---- Pick unit and start scanning ---- */
  const handleSelectUnit = useCallback((u: AccessUnit) => {
    setUnit(u);
    setStep('scanning');
  }, []);

  const handleManualValidate = useCallback(() => {
    if (!manualIdentifier.trim()) return;
    beginValidation(manualIdentifier);
  }, [beginValidation, manualIdentifier]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  const flowIcon = scannerFlow === 'exit' ? LogOut : scannerFlow === 'auto' ? ArrowRightLeft : LogIn;
  const flowLabel = scannerFlow === 'exit' ? 'Saída' : scannerFlow === 'auto' ? 'Auto' : 'Entrada';
  const FlowIcon = flowIcon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-primary)] to-[var(--background-secondary)]">
      {/* Header */}
      <header className="border-b border-[var(--divider-primary)] bg-[var(--background-secondary)]/80 backdrop-blur sticky top-0 z-50">
        <Container size="xl" className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-[var(--element-primary)]">
                Move<span className="text-[var(--element-accent)]">Access</span>
              </span>
              {unit && (
                <Badge variant="outline" className="text-xs">
                  {unit.name}
                </Badge>
              )}
            </div>

            {/* Operation mode + daily stats in header */}
            <div className="flex items-center gap-3">
              {step !== 'loading' && step !== 'select-unit' && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--element-secondary)]">
                  <FlowIcon className="w-3.5 h-3.5" />
                  <span className="font-medium">{flowLabel}</span>
                </div>
              )}
              {stats.total > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--element-secondary)]">
                  <Users className="w-3.5 h-3.5" />
                  <span>{stats.total}</span>
                </div>
              )}
            </div>
          </div>
        </Container>
      </header>

      {/* Main */}
      <main
        className="flex flex-col items-center justify-center px-4 py-6 lg:py-8"
        style={{ minHeight: 'calc(100vh - 57px)' }}
      >
        {/* ---- Loading ---- */}
        {step === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--element-accent)]" />
            <p className="text-[var(--element-secondary)]">Carregando unidades...</p>
          </div>
        )}

        {/* ---- Select unit ---- */}
        {step === 'select-unit' && (
          <Card className="w-full max-w-md p-6">
            <CardHeader className="text-center p-0 mb-6">
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                <Scan className="w-5 h-5 text-[var(--element-accent)]" />
                Selecione a Unidade
              </CardTitle>
              <CardDescription>
                Escolha a unidade para operar o scanner.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              {units.map((u) => (
                <Button
                  key={u.id}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleSelectUnit(u)}
                >
                  <Camera className="w-4 h-4" />
                  {u.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ---- Scanning / Processing ---- */}
        {(step === 'scanning' || step === 'processing') && (
          <div className="w-full max-w-5xl flex flex-col lg:flex-row lg:items-start lg:gap-8 gap-6">
            {/* Left column: camera + controls */}
            <div className="flex-1 flex flex-col items-center gap-5 max-w-md mx-auto lg:max-w-none lg:mx-0">
              {/* Scanner mode selector */}
              {scannerMode !== 'entry_only' && (
                <div className="w-full rounded-xl border border-[var(--divider-primary)] bg-[var(--background-primary)] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--element-primary)]">Modo de operação</p>
                    <Badge variant="outline" className="text-xs">
                      <FlowIcon className="w-3 h-3 mr-1" />
                      {flowLabel}
                    </Badge>
                  </div>

                  {scannerMode === 'single_entry_exit' ? (
                    <p className="text-xs text-[var(--element-secondary)]">
                      Entrada e saída automática — o sistema decide com base na presença.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={scannerFlow === 'entry' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleScannerFlowChange('entry')}
                        className="gap-1.5"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        Entrada
                      </Button>
                      <Button
                        type="button"
                        variant={scannerFlow === 'exit' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleScannerFlowChange('exit')}
                        className="gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Saída
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Camera viewfinder */}
              <div className="relative w-full aspect-square max-w-sm rounded-2xl overflow-hidden border-4 border-[var(--element-accent)] bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Corner markers overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-white/80 rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-white/80 rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-white/80 rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-white/80 rounded-br-lg" />

                  {/* Scan line */}
                  {step === 'scanning' && streaming && (
                    <div className="absolute inset-x-6 h-0.5 bg-gradient-to-r from-transparent via-[var(--element-accent)] to-transparent animate-pulse top-1/2" />
                  )}
                </div>

                {/* Processing overlay */}
                {step === 'processing' && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-white" />
                    <p className="text-white font-medium mt-3">Verificando...</p>
                  </div>
                )}

                {/* Camera error */}
                {cameraError && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center">
                    <CameraOff className="w-12 h-12 text-[var(--status-negative)] mb-3" />
                    <p className="text-white text-sm">{cameraError}</p>
                  </div>
                )}

                {/* Waiting for stream */}
                {!streaming && !cameraError && step === 'scanning' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-white/60" />
                    <p className="text-white/60 text-sm mt-2">Iniciando câmera...</p>
                  </div>
                )}
              </div>

              {/* Status badges */}
              <div className="text-center space-y-1.5 w-full max-w-sm">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {step === 'processing' ? 'QR capturado' : streaming ? 'Scanner ativo' : 'Preparando câmera'}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--element-secondary)]">
                  {step === 'processing'
                    ? 'Validando acesso do aluno...'
                    : 'Aponte a câmera para o QR code do aluno'}
                </p>
              </div>

              {/* Manual fallback */}
              <div className="w-full max-w-sm rounded-xl border border-[var(--divider-primary)] bg-[var(--background-primary)] p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-[var(--element-primary)]">Validação manual</p>
                  <p className="text-xs text-[var(--element-secondary)]">
                    Se a câmera não capturar, cole o código do QR.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="manual-identifier"
                    value={manualIdentifier}
                    onChange={(e) => setManualIdentifier(e.target.value)}
                    placeholder="MOVEACCESS:QR:..."
                    disabled={step === 'processing'}
                    className="flex-1 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleManualValidate();
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleManualValidate}
                    disabled={step === 'processing' || !manualIdentifier.trim()}
                    size="sm"
                    className="gap-1.5 shrink-0"
                  >
                    {step === 'processing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                    Validar
                  </Button>
                </div>
              </div>

              {/* Unit selector (when multiple) */}
              {units.length > 1 && (
                <div className="w-full max-w-sm">
                  <Label
                    htmlFor="unit-select"
                    className="text-xs text-[var(--element-secondary)]"
                  >
                    Unidade
                  </Label>
                  <select
                    id="unit-select"
                    value={unit?.id || ''}
                    onChange={(e) => {
                      const selected = units.find((u) => u.id === e.target.value);
                      if (selected) setUnit(selected);
                    }}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] text-[var(--element-primary)] text-sm"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Right column: daily context sidebar (desktop only) */}
            <div className="hidden lg:block w-72 shrink-0 space-y-4">
              {/* Session stats */}
              <div className="rounded-xl border border-[var(--divider-primary)] bg-[var(--background-primary)] p-4 space-y-3">
                <p className="text-sm font-medium text-[var(--element-primary)] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--element-accent)]" />
                  Sessão de hoje
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[var(--element-primary)]">{stats.total}</p>
                    <p className="text-xs text-[var(--element-secondary)]">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--status-positive)]">{stats.allowed}</p>
                    <p className="text-xs text-[var(--element-secondary)]">Liberados</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[var(--status-negative)]">{stats.denied}</p>
                    <p className="text-xs text-[var(--element-secondary)]">Negados</p>
                  </div>
                </div>
              </div>

              {/* Recent scans */}
              {stats.lastScans.length > 0 && (
                <div className="rounded-xl border border-[var(--divider-primary)] bg-[var(--background-primary)] p-4 space-y-3">
                  <p className="text-sm font-medium text-[var(--element-primary)] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[var(--element-accent)]" />
                    Últimos scans
                  </p>
                  <div className="space-y-2">
                    {stats.lastScans.map((scan, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--divider-primary)] last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: scan.allowed
                                ? 'var(--status-positive)'
                                : 'var(--status-negative)',
                            }}
                          />
                          <span className="truncate text-[var(--element-primary)]">
                            {scan.name || 'Não identificado'}
                          </span>
                        </div>
                        <span className="text-[var(--element-disabled)] shrink-0 ml-2">
                          {formatTime(scan.time)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- Result ---- */}
        {step === 'result' && (
          <div className="w-full max-w-md">
            {errorMsg ? (
              /* Generic error */
              <Card className="p-8 text-center">
                <div className="mx-auto w-24 h-24 rounded-full bg-[var(--status-negative-background)] text-[var(--status-negative)] flex items-center justify-center mb-6">
                  <XCircle className="w-16 h-16" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--status-negative)] mb-2">
                  Erro
                </h2>
                <p className="text-[var(--element-secondary)] mb-6">{errorMsg}</p>
                <Button variant="outline" onClick={handleReset}>
                  Tentar Novamente
                </Button>
              </Card>
            ) : result?.allowed ? (
              /* ---- ACCESS GRANTED ---- */
              <Card
                className="p-8 text-center border-2"
                style={{ borderColor: 'var(--status-positive)' }}
              >
                <div
                  className="mx-auto w-28 h-28 rounded-full flex items-center justify-center mb-6 animate-pulse"
                  style={{
                    backgroundColor: 'var(--status-positive-background)',
                    color: 'var(--status-positive)',
                  }}
                >
                  <CheckCircle className="w-20 h-20" />
                </div>
                <h2
                  className="text-3xl font-extrabold mb-2"
                  style={{ color: 'var(--status-positive)' }}
                >
                  ACESSO LIBERADO
                </h2>

                {/* Rich result info */}
                {result.user?.name && (
                  <p className="text-xl font-semibold text-[var(--element-primary)] mb-1">
                    {result.user.name}
                  </p>
                )}
                <div className="flex items-center justify-center gap-3 text-sm text-[var(--element-secondary)] mt-2 mb-3 flex-wrap">
                  {result.eventType && (
                    <span className="flex items-center gap-1">
                      {result.eventType === 'exit' ? <LogOut className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
                      {getEventLabel(result.eventType)}
                    </span>
                  )}
                  {result.unitName && (
                    <span className="flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      {result.unitName}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(result.timestamp)}
                  </span>
                </div>
                <p className="text-[var(--element-secondary)] text-sm">{result.message}</p>
                <AutoReset onReset={handleReset} seconds={4} />
              </Card>
            ) : (
              /* ---- ACCESS DENIED ---- */
              <Card
                className="p-8 text-center border-2"
                style={{ borderColor: 'var(--status-negative)' }}
              >
                <div
                  className="mx-auto w-28 h-28 rounded-full flex items-center justify-center mb-6"
                  style={{
                    backgroundColor: 'var(--status-negative-background)',
                    color: 'var(--status-negative)',
                  }}
                >
                  <XCircle className="w-20 h-20" />
                </div>
                <h2
                  className="text-3xl font-extrabold mb-2"
                  style={{ color: 'var(--status-negative)' }}
                >
                  {deniedCopy.title}
                </h2>
                {result?.user?.name && (
                  <p className="text-xl font-semibold text-[var(--element-primary)] mb-1">
                    {result.user.name}
                  </p>
                )}
                <p className="text-lg text-[var(--element-secondary)] mb-2">
                  {deniedCopy.description}
                </p>
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: 'var(--status-negative)',
                    color: 'var(--status-negative)',
                  }}
                >
                  {deniedCopy.guidance}
                </Badge>
                <div className="flex items-center justify-center gap-3 text-xs text-[var(--element-disabled)] mt-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(result?.timestamp || new Date())}
                  </span>
                </div>
                <div className="mt-6">
                  <Button variant="outline" onClick={handleReset} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Escanear Novamente
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page export with Suspense boundary                                 */
/* ------------------------------------------------------------------ */

function ScannerLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-primary)] to-[var(--background-secondary)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--element-accent)]" />
        <p className="text-[var(--element-secondary)]">Carregando scanner...</p>
      </div>
    </div>
  );
}

export default function ScannerPage() {
  return (
    <Suspense fallback={<ScannerLoading />}>
      <ScannerContent />
    </Suspense>
  );
}
