'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { OnboardingSession } from '@/lib/users';

interface StepActivationProps {
  session: OnboardingSession;
  onComplete: (data: OnboardingSession['collectedData']['activation']) => void;
  onBack: () => void;
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function QRCodeMock() {
  // Padrão fixo para QR Code mock (evita Math.random no render)
  const pattern = [
    1,0,1,1,0,0,1,0,
    0,1,0,1,1,0,0,1,
    1,1,0,0,1,1,0,1,
    0,0,1,1,0,1,1,0,
    1,0,1,0,1,0,1,0,
    0,1,0,1,0,1,0,1,
    1,1,1,0,0,1,1,0,
    0,0,0,1,1,0,0,1,
  ];
  
  return (
    <div className="w-48 h-48 bg-white p-4 rounded-lg shadow-lg mx-auto">
      <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-0.5">
        {pattern.map((cell, i) => (
          <div
            key={i}
            className={`${cell ? 'bg-black' : 'bg-white'} rounded-sm`}
          />
        ))}
      </div>
    </div>
  );
}

export function StepActivation({ session, onComplete, onBack }: StepActivationProps) {
  const [isActivating, setIsActivating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const userName = session.collectedData.identification?.fullName || 'Usuário';
  const planName = session.collectedData.planSelection?.planName || 'Plano';

  const handleActivate = async () => {
    setIsActivating(true);
    
    // Simular ativação
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsActivating(false);
    setIsCompleted(true);
  };

  const handleComplete = () => {
    onComplete({
      accessCardGenerated: true,
      qrCodeGenerated: true,
      activatedAt: new Date().toISOString(),
    });
  };

  if (isCompleted) {
    return (
      <div className="space-y-8 text-center py-8">
        <div className="w-20 h-20 mx-auto bg-[var(--status-positive)]/10 rounded-full flex items-center justify-center">
          <CheckCircleIcon className="w-12 h-12 text-[var(--status-positive)]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Bem-vindo(a), {userName.split(' ')[0]}! 🎉
          </h2>
          <p className="text-[var(--text-secondary)]">
            Seu acesso foi ativado com sucesso.
          </p>
        </div>

        <Card className="p-6 max-w-md mx-auto">
          <div className="space-y-4">
            <QRCodeMock />
            <div className="space-y-1 text-center">
              <p className="font-medium text-[var(--text-primary)]">
                {userName}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                Plano {planName}
              </p>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">
              Apresente este QR Code na catraca para acessar a academia.
            </p>
          </div>
        </Card>

        <div className="space-y-3 max-w-md mx-auto">
          <div className="flex items-center gap-3 p-3 bg-[var(--background-secondary)] rounded-lg">
            <CheckCircleIcon className="w-5 h-5 text-[var(--status-positive)]" />
            <span className="text-sm text-[var(--text-primary)]">Cadastro completo</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[var(--background-secondary)] rounded-lg">
            <CheckCircleIcon className="w-5 h-5 text-[var(--status-positive)]" />
            <span className="text-sm text-[var(--text-primary)]">Contrato assinado</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[var(--background-secondary)] rounded-lg">
            <CheckCircleIcon className="w-5 h-5 text-[var(--status-positive)]" />
            <span className="text-sm text-[var(--text-primary)]">Pagamento confirmado</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[var(--background-secondary)] rounded-lg">
            <CheckCircleIcon className="w-5 h-5 text-[var(--status-positive)]" />
            <span className="text-sm text-[var(--text-primary)]">QR Code gerado</span>
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={handleComplete} size="lg">
            Concluir cadastro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Ativação de Acesso
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Última etapa! Vamos ativar o acesso de {userName.split(' ')[0]}.
        </p>
      </div>

      {/* Resumo do cadastro */}
      <Card className="p-6">
        <h3 className="font-medium text-[var(--text-primary)] mb-4">
          Resumo do cadastro
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[var(--text-tertiary)]">Nome</p>
              <p className="font-medium text-[var(--text-primary)]">{userName}</p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">E-mail</p>
              <p className="font-medium text-[var(--text-primary)]">
                {session.collectedData.identification?.email}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Plano</p>
              <p className="font-medium text-[var(--text-primary)]">{planName}</p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Valor</p>
              <p className="font-medium text-[var(--text-primary)]">
                R$ {session.collectedData.planSelection?.value?.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Contrato</p>
              <p className="font-medium text-[var(--text-primary)]">
                {session.collectedData.contract?.contractNumber}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-tertiary)]">Pagamento</p>
              <p className="font-medium text-[var(--text-primary)]">
                {session.collectedData.payment?.status === 'completed' ? 'Confirmado' : 'Pendente'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* O que será feito */}
      <Card className="p-6 bg-[var(--background-secondary)] border-none">
        <h3 className="font-medium text-[var(--text-primary)] mb-3">
          Ao ativar, será realizado:
        </h3>
        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--element-primary)] rounded-full" />
            Geração do QR Code de acesso
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--element-primary)] rounded-full" />
            Liberação da catraca para entrada
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--element-primary)] rounded-full" />
            Envio de e-mail de boas-vindas com orientações
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--element-primary)] rounded-full" />
            Acesso liberado ao app do aluno
          </li>
        </ul>
      </Card>

      {/* Ações */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isActivating}
        >
          Voltar
        </Button>
        <Button 
          onClick={handleActivate} 
          disabled={isActivating}
          size="lg"
        >
          {isActivating ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Ativando...
            </span>
          ) : (
            '🚀 Ativar acesso'
          )}
        </Button>
      </div>
    </div>
  );
}
