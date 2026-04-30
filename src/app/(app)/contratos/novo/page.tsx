'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  createContractTemplate,
  publishContractTemplate,
  resolveVariablesWithExamples,
  analyzeVariables,
  getVariablesByCategory,
  STARTER_TEMPLATES,
  type StarterTemplate,
} from '@/lib/contracts';

type CreationPath = 'template' | 'blank';
type WizardStep = 1 | 2 | 3;

const BLANK_CONTRACT_STRUCTURE = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

CONTRATADA: {{academia_nome}}
CONTRATANTE: {{aluno_nome}}
PLANO: {{plano_nome}} - {{plano_valor}} ({{plano_periodo}})
INÍCIO: {{data_inicio}}

CLÁUSULA 1 - DO OBJETO
Descreva aqui o serviço prestado pela academia ao aluno.

CLÁUSULA 2 - DAS REGRAS DE USO
Descreva aqui as regras de uso, frequencia, acesso e conduta.

CLÁUSULA 3 - DO PAGAMENTO E CANCELAMENTO
Descreva aqui vencimento, inadimplência, cancelamento e demais condições.

Data de aceite: {{data_aceite}}`;

function PathChoiceStep({
  onChooseTemplate,
  onChooseBlank,
}: {
  onChooseTemplate: () => void;
  onChooseBlank: () => void;
}) {
  return (
    <Card className="p-6">
      <div className="max-w-2xl space-y-2">
        <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Comece por um modelo ou crie do zero
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Escolha como deseja preparar o contrato da academia que será usado na matrícula e no aceite do aluno.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Usar modelo pronto</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                Use um contrato pronto e personalize para sua academia.
              </p>
            </div>
            <span className="rounded-full bg-[var(--color-brand-light)] px-2.5 py-1 text-xs font-medium text-[var(--color-brand)]">
              Mais guiado
            </span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-secondary)]">
            <li>Modelos com texto inicial e variáveis prontas para a matrícula.</li>
            <li>Edição livre antes de salvar ou publicar.</li>
          </ul>
          <Button onClick={onChooseTemplate} className="mt-5 w-full justify-center">
            Usar modelo pronto
          </Button>
        </div>

        <div className="rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Criar do zero</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                Crie um contrato em branco se já tiver seu próprio texto.
              </p>
            </div>
            <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
              Texto livre
            </span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-secondary)]">
            <li>Abre um editor vazio com estrutura mínima.</li>
            <li>Ideal para academia que já possui o próprio termo.</li>
          </ul>
          <Button variant="outline" onClick={onChooseBlank} className="mt-5 w-full justify-center">
            Começar em branco
          </Button>
        </div>
      </div>
    </Card>
  );
}

function StarterTemplatePicker({
  onBack,
  onSelect,
}: {
  onBack: () => void;
  onSelect: (template: StarterTemplate) => void;
}) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Escolha um modelo para personalizar
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Selecione um contrato base para preencher o conteúdo inicial e seguir para a edição da sua academia.
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          Voltar
        </Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {STARTER_TEMPLATES.map((template) => (
          <div
            key={template.id}
            className="rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-5"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                  {template.name}
                </h3>
                <span className="rounded-full bg-[var(--color-brand-light)] px-2 py-1 text-[11px] font-medium text-[var(--color-brand)]">
                  Pronto para editar
                </span>
              </div>
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                {template.description}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--color-bg-tertiary)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <Button onClick={() => onSelect(template)} className="mt-5 w-full justify-center">
              Usar este modelo
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function WizardSteps({ currentStep }: { currentStep: WizardStep }) {
  const steps = [
    { id: 1, label: 'Informacoes basicas' },
    { id: 2, label: 'Conteudo' },
    { id: 3, label: 'Revisar e salvar' },
  ] as const;

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {steps.map((step) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;

          return (
            <div key={step.id} className="flex items-center gap-3 md:flex-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                  active
                    ? 'bg-[var(--color-brand)] text-white'
                    : done
                    ? 'bg-[var(--color-success)] text-white'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
                }`}
              >
                {done ? '✓' : step.id}
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  Etapa {step.id}
                </p>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function VariablePanel({ onInsert }: { onInsert: (key: string) => void }) {
  const groups = getVariablesByCategory();

  return (
    <Card className="p-5">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Variáveis dinâmicas disponíveis
        </h3>
        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
          As variáveis serão substituídas pelos dados reais do aluno, plano e academia no aceite.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {groups.map(({ category, variables }) => (
          <div key={category.id}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              {category.icon} {category.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {variables.map((variable) => (
                <button
                  key={variable.key}
                  type="button"
                  onClick={() => onInsert(variable.key)}
                  title={`${variable.description}\nExemplo: ${variable.example}`}
                  className="rounded-md border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] px-2.5 py-1.5 text-left text-xs font-mono text-[var(--color-brand)] transition-colors hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-light)]"
                >
                  {`{{${variable.key}}}`}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PreviewPanel({ content }: { content: string }) {
  const resolved = resolveVariablesWithExamples(content);
  const analysis = analyzeVariables(content);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Preview do contrato</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">Dados exibidos com exemplos para revisar antes de salvar.</p>
        </div>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {analysis.known.length} variável(is) reconhecida(s)
        </span>
      </div>

      {analysis.unknown.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
          Variáveis não reconhecidas: {analysis.unknown.map((key) => `{{${key}}}`).join(', ')}
        </div>
      )}

      <div className="mt-4 max-h-[420px] overflow-y-auto rounded-xl border border-[var(--color-border-primary)] bg-white p-5 dark:bg-[var(--color-bg-primary)]">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {resolved}
        </pre>
      </div>
    </Card>
  );
}

function ReviewSummary({
  creationPath,
  selectedStarter,
  name,
  description,
  content,
}: {
  creationPath: CreationPath;
  selectedStarter: StarterTemplate | null;
  name: string;
  description: string;
  content: string;
}) {
  const analysis = analyzeVariables(content);

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Resumo antes de salvar</h3>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">Origem</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
            {creationPath === 'template' ? 'Modelo pronto' : 'Criado do zero'}
          </p>
          {selectedStarter && (
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{selectedStarter.name}</p>
          )}
        </div>

        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">Uso no fluxo real</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">Matricula e aceite do aluno</p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            O contrato publicado será exibido ao aluno no aceite do cadastro.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4 md:col-span-2">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">Contrato</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">{name || 'Sem nome informado'}</p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {description || 'Sem descricao adicional.'}
          </p>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            {analysis.known.length} variável(is) reconhecida(s) e {content.trim().length} caracteres no texto.
          </p>
        </div>
      </div>
    </Card>
  );
}

export default function NewTemplatePage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [creationPath, setCreationPath] = useState<CreationPath | null>(null);
  const [selectedStarterId, setSelectedStarterId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState<'draft' | 'publish' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedStarter = selectedStarterId
    ? STARTER_TEMPLATES.find((template) => template.id === selectedStarterId) ?? null
    : null;

  const basicInfoValid = name.trim().length >= 3;
  const contentValid = content.trim().length >= 50;
  const canSubmit = basicInfoValid && contentValid;
  const hasStartedFlow = Boolean(creationPath || name.trim() || description.trim() || content.trim());

  const resetFlow = useCallback(() => {
    setCreationPath(null);
    setSelectedStarterId(null);
    setCurrentStep(1);
    setName('');
    setDescription('');
    setContent('');
    setError(null);
    setSubmitting(null);
  }, []);

  const confirmResetFlow = useCallback(() => {
    if (!hasStartedFlow) {
      resetFlow();
      return true;
    }

    if (!confirm('Deseja descartar o contrato em criacao e voltar para a escolha inicial?')) {
      return false;
    }

    resetFlow();
    return true;
  }, [hasStartedFlow, resetFlow]);

  const handleChooseTemplate = () => {
    setCreationPath('template');
    setSelectedStarterId(null);
    setCurrentStep(1);
    setName('');
    setDescription('');
    setContent('');
    setError(null);
  };

  const handleChooseBlank = () => {
    setCreationPath('blank');
    setSelectedStarterId(null);
    setCurrentStep(1);
    setName('');
    setDescription('');
    setContent(BLANK_CONTRACT_STRUCTURE);
    setError(null);
  };

  const handleSelectStarter = (template: StarterTemplate) => {
    setCreationPath('template');
    setSelectedStarterId(template.id);
    setCurrentStep(1);
    setName(template.name);
    setDescription(template.description);
    setContent(template.content);
    setError(null);
  };

  const handleInsertVariable = useCallback(
    (key: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const tag = `{{${key}}}`;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nextContent = content.slice(0, start) + tag + content.slice(end);

      setContent(nextContent);
      setError(null);

      requestAnimationFrame(() => {
        textarea.focus();
        const cursor = start + tag.length;
        textarea.setSelectionRange(cursor, cursor);
      });
    },
    [content],
  );

  const handleCancel = () => {
    if (!hasStartedFlow) {
      router.push('/contratos');
      return;
    }

    if (confirm('Deseja descartar o contrato em criacao?')) {
      router.push('/contratos');
    }
  };

  const goToContentStep = () => {
    if (!basicInfoValid) {
      setError('Informe um nome de contrato com pelo menos 3 caracteres.');
      return;
    }

    setError(null);
    setCurrentStep(2);

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const goToReviewStep = () => {
    if (!contentValid) {
      setError('O conteudo do contrato precisa ter pelo menos 50 caracteres.');
      return;
    }

    setError(null);
    setCurrentStep(3);
  };

  const handleBack = () => {
    setError(null);

    if (currentStep === 3) {
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      setCurrentStep(1);
      return;
    }

    if (creationPath === 'template' && selectedStarterId) {
      setSelectedStarterId(null);
      setName('');
      setDescription('');
      setContent('');
      return;
    }

    resetFlow();
  };

  const handleSubmit = async (mode: 'draft' | 'publish') => {
    if (!canSubmit) {
      setError('Revise o nome e o conteudo antes de salvar.');
      return;
    }

    setSubmitting(mode);
    setError(null);

    const created = await createContractTemplate({
      name: name.trim(),
      description: description.trim() || undefined,
      content: content.trim(),
    });

    if (!created) {
      setError('Erro ao criar o contrato. Tente novamente.');
      setSubmitting(null);
      return;
    }

    if (mode === 'draft') {
      router.push(`/contratos/${created.id}`);
      return;
    }

    const published = await publishContractTemplate(created.id);

    if (!published) {
      toast.error('Rascunho criado, mas não foi possível publicar agora.');
      router.push(`/contratos/${created.id}`);
      return;
    }

    router.push(`/contratos/${published.id}`);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
      <Header title="Novo contrato" />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          {error && (
            <Card className="border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </Card>
          )}

          {creationPath === null && (
            <PathChoiceStep
              onChooseTemplate={handleChooseTemplate}
              onChooseBlank={handleChooseBlank}
            />
          )}

          {creationPath === 'template' && !selectedStarterId && (
            <StarterTemplatePicker
              onBack={resetFlow}
              onSelect={handleSelectStarter}
            />
          )}

          {creationPath !== null && (creationPath === 'blank' || selectedStarterId) && (
            <>
              <WizardSteps currentStep={currentStep} />

              <Card className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">
                      Caminho escolhido
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                      {creationPath === 'template'
                        ? `Modelo pronto${selectedStarter ? `: ${selectedStarter.name}` : ''}`
                        : 'Criado do zero'}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      Este contrato será usado pela academia no aceite do aluno durante a matrícula.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {creationPath === 'template' && selectedStarterId && (
                      <Button variant="outline" onClick={handleBack}>
                        Trocar modelo
                      </Button>
                    )}
                    <Button variant="ghost" onClick={confirmResetFlow}>
                      Trocar caminho
                    </Button>
                  </div>
                </div>
              </Card>

              {currentStep === 1 && (
                <Card className="p-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                      Informações básicas
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Defina como a academia vai identificar este contrato antes de editar o texto.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="space-y-5">
                      <div>
                        <Label htmlFor="name">Nome do contrato *</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(event) => {
                            setName(event.target.value);
                            setError(null);
                          }}
                          placeholder="Ex: Contrato de prestação de serviços"
                        />
                        {name && name.trim().length > 0 && name.trim().length < 3 && (
                          <p className="mt-1 text-sm text-[var(--color-error)]">Mínimo de 3 caracteres.</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="description">Descrição</Label>
                        <textarea
                          id="description"
                          value={description}
                          onChange={(event) => {
                            setDescription(event.target.value);
                            setError(null);
                          }}
                          placeholder="Explique brevemente quando este contrato deve ser usado pela academia."
                          rows={4}
                          className="w-full resize-none rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 py-2 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-4">
                      <p className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">Uso no fluxo real</p>
                      <p className="mt-2 text-sm font-medium text-[var(--color-text-primary)]">
                        Aceite do aluno na matrícula
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                        As variáveis de plano, aluno e academia refletem os dados reais preenchidos no cadastro do aluno.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {currentStep === 2 && (
                <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                  <VariablePanel onInsert={handleInsertVariable} />

                  <Card className="p-6">
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Conteúdo</h2>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Edite o texto que o aluno verá no aceite. Use variáveis dinâmicas para preencher dados reais da matrícula.
                      </p>
                    </div>

                    <div className="mt-5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-brand-light)] p-4">
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        As variáveis serão substituídas pelos dados reais do aluno, plano e academia no aceite.
                      </p>
                    </div>

                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(event) => {
                        setContent(event.target.value);
                        setError(null);
                      }}
                      rows={22}
                      className="mt-5 w-full resize-none rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] px-4 py-3 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
                      placeholder={BLANK_CONTRACT_STRUCTURE}
                    />

                    {content.trim().length > 0 && content.trim().length < 50 && (
                      <p className="mt-2 text-sm text-[var(--color-error)]">
                        O conteúdo precisa ter no mínimo 50 caracteres ({content.trim().length}/50).
                      </p>
                    )}
                  </Card>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <ReviewSummary
                    creationPath={creationPath}
                    selectedStarter={selectedStarter}
                    name={name.trim()}
                    description={description.trim()}
                    content={content}
                  />
                  <PreviewPanel content={content} />

                  <Card className="border-[var(--color-brand)] bg-[var(--color-brand-light)] p-5">
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Salvar e publicar</h3>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Salvar como rascunho cria o contrato sem ativá-lo. Publicar agora usa o backend atual e arquiva o contrato publicado anterior, se existir.
                      </p>
                    </div>
                  </Card>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-[var(--color-border-primary)] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button variant="outline" onClick={handleBack}>
                    {currentStep === 1 ? 'Voltar' : 'Etapa anterior'}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {currentStep === 1 && (
                    <Button onClick={goToContentStep}>
                      Avançar para conteúdo
                    </Button>
                  )}

                  {currentStep === 2 && (
                    <Button onClick={goToReviewStep}>
                      Avançar para revisão
                    </Button>
                  )}

                  {currentStep === 3 && (
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => void handleSubmit('draft')}
                        disabled={!canSubmit || submitting !== null}
                      >
                        {submitting === 'draft' ? 'Salvando rascunho...' : 'Salvar como rascunho'}
                      </Button>
                      <Button
                        onClick={() => void handleSubmit('publish')}
                        disabled={!canSubmit || submitting !== null}
                      >
                        {submitting === 'publish' ? 'Publicando...' : 'Publicar agora'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
