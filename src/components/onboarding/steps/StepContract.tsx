'use client';

import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { OnboardingSession } from '@/lib/users';
import { cn } from '@/lib/utils';

interface StepContractProps {
  session: OnboardingSession;
  onNext: (data: OnboardingSession['collectedData']['contract']) => void;
  onBack: () => void;
}

// Texto do contrato mockado
const contractTerms = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ACADEMIA

CLÁUSULA 1ª - DO OBJETO
O presente contrato tem por objeto a prestação de serviços de academia, incluindo acesso às instalações, equipamentos e atividades oferecidas pela CONTRATADA.

CLÁUSULA 2ª - DO PRAZO
O prazo do presente contrato é determinado conforme o plano escolhido pelo CONTRATANTE, iniciando-se na data de ativação do acesso.

CLÁUSULA 3ª - DO VALOR E FORMA DE PAGAMENTO
3.1. O CONTRATANTE pagará à CONTRATADA o valor correspondente ao plano escolhido.
3.2. O pagamento deverá ser efetuado até o dia do vencimento escolhido.
3.3. O atraso no pagamento acarretará a suspensão temporária do acesso.

CLÁUSULA 4ª - DAS OBRIGAÇÕES DO CONTRATANTE
4.1. Respeitar as normas de uso das instalações.
4.2. Utilizar os equipamentos de forma adequada.
4.3. Portar-se de forma ética e respeitosa com funcionários e demais frequentadores.
4.4. Comunicar qualquer alteração de dados cadastrais.

CLÁUSULA 5ª - DAS OBRIGAÇÕES DA CONTRATADA
5.1. Disponibilizar as instalações e equipamentos em perfeito estado.
5.2. Manter profissionais capacitados para orientação.
5.3. Garantir a segurança das instalações.

CLÁUSULA 6ª - DA RESCISÃO
6.1. O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 dias.
6.2. A rescisão não exime o CONTRATANTE do pagamento de valores em aberto.

CLÁUSULA 7ª - DISPOSIÇÕES GERAIS
7.1. O CONTRATANTE declara estar apto à prática de atividades físicas, isentando a CONTRATADA de responsabilidade por eventuais lesões.
7.2. Fica eleito o foro da comarca local para dirimir quaisquer questões oriundas deste contrato.
`;

export function StepContract({ session, onNext, onBack }: StepContractProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(
    session.collectedData.contract?.acceptedTerms || false
  );
  const [signatureMethod, setSignatureMethod] = useState<'digital' | 'manual'>(
    session.collectedData.contract?.signatureMethod || 'digital'
  );
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      setError('Você precisa aceitar os termos para continuar');
      return;
    }

    onNext({
      contractId: `ctr-${Date.now()}`,
      contractNumber: `CTR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      acceptedTerms: true,
      signedAt: new Date().toISOString(),
      signatureMethod,
    });
  };

  const userName = session.collectedData.identification?.fullName || 'Usuário';
  const planName = session.collectedData.planSelection?.planName || 'Plano';
  const planValue = session.collectedData.planSelection?.value || 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Contrato
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Leia os termos e confirme a assinatura do contrato.
        </p>
      </div>

      {/* Resumo */}
      <Card className="p-4 bg-[var(--background-secondary)] border-none">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-[var(--text-tertiary)]">Contratante</p>
            <p className="font-medium text-[var(--text-primary)]">{userName}</p>
          </div>
          <div>
            <p className="text-[var(--text-tertiary)]">Plano</p>
            <p className="font-medium text-[var(--text-primary)]">{planName}</p>
          </div>
          <div>
            <p className="text-[var(--text-tertiary)]">Valor mensal</p>
            <p className="font-medium text-[var(--text-primary)]">
              R$ {planValue.toFixed(2).replace('.', ',')}
            </p>
          </div>
          <div>
            <p className="text-[var(--text-tertiary)]">Início</p>
            <p className="font-medium text-[var(--text-primary)]">
              {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </Card>

      {/* Contrato */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          Termos do contrato
        </h3>
        <div className="h-64 overflow-y-auto p-4 bg-[var(--background-primary)] border border-[var(--border-default)] rounded-lg">
          <pre className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap font-sans leading-relaxed">
            {contractTerms}
          </pre>
        </div>
      </div>

      {/* Método de assinatura */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          Método de assinatura
        </h3>
        <div className="flex gap-4">
          <label 
            className={cn(
              'flex-1 p-4 border rounded-lg cursor-pointer transition-all',
              signatureMethod === 'digital' 
                ? 'border-[var(--element-primary)] bg-[var(--element-primary)]/5' 
                : 'border-[var(--border-default)] hover:border-[var(--border-hover)]'
            )}
          >
            <input
              type="radio"
              name="signatureMethod"
              value="digital"
              checked={signatureMethod === 'digital'}
              onChange={() => setSignatureMethod('digital')}
              className="sr-only"
            />
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                signatureMethod === 'digital' 
                  ? 'border-[var(--element-primary)]' 
                  : 'border-[var(--border-default)]'
              )}>
                {signatureMethod === 'digital' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--element-primary)]" />
                )}
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Assinatura digital</p>
                <p className="text-sm text-[var(--text-tertiary)]">Aceite eletrônico agora</p>
              </div>
            </div>
          </label>
          
          <label 
            className={cn(
              'flex-1 p-4 border rounded-lg cursor-pointer transition-all',
              signatureMethod === 'manual' 
                ? 'border-[var(--element-primary)] bg-[var(--element-primary)]/5' 
                : 'border-[var(--border-default)] hover:border-[var(--border-hover)]'
            )}
          >
            <input
              type="radio"
              name="signatureMethod"
              value="manual"
              checked={signatureMethod === 'manual'}
              onChange={() => setSignatureMethod('manual')}
              className="sr-only"
            />
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                signatureMethod === 'manual' 
                  ? 'border-[var(--element-primary)]' 
                  : 'border-[var(--border-default)]'
              )}>
                {signatureMethod === 'manual' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--element-primary)]" />
                )}
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Assinatura manual</p>
                <p className="text-sm text-[var(--text-tertiary)]">Impresso para assinar</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Aceite */}
      <div className="space-y-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => {
              setAcceptedTerms(e.target.checked);
              setError('');
            }}
            className="mt-0.5 w-5 h-5 rounded border-[var(--border-default)]"
          />
          <span className="text-sm text-[var(--text-primary)]">
            Li e aceito os termos do contrato de prestação de serviços. 
            Declaro estar ciente das condições e responsabilidades estabelecidas.
          </span>
        </label>
        {error && (
          <p className="text-sm text-[var(--status-negative)]">{error}</p>
        )}
      </div>

      {/* Ações */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
        >
          Voltar
        </Button>
        <Button type="submit">
          Assinar e continuar
        </Button>
      </div>
    </form>
  );
}
