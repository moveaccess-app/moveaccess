'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  AVAILABLE_VARIABLES,
  getAvailablePlans,
  generateTemplateCode,
} from '@/mocks/contractTemplatesMock';
import type { TemplateVariable } from '@/mocks/contractTemplatesMock';

// Steps do wizard
const STEPS = [
  { id: 1, title: 'Informações Básicas', description: 'Nome, descrição e configurações' },
  { id: 2, title: 'Conteúdo', description: 'Editor do modelo de contrato' },
  { id: 3, title: 'Planos Vinculados', description: 'Selecione os planos' },
  { id: 4, title: 'Revisão', description: 'Confirme e publique' },
];

export default function NewTemplatePage() {
  const router = useRouter();
  const availablePlans = useMemo(() => getAvailablePlans(), []);

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [requiresSignature, setRequiresSignature] = useState(true);
  const [linkedPlanIds, setLinkedPlanIds] = useState<string[]>([]);
  const [selectedVariables, setSelectedVariables] = useState<TemplateVariable[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'content' | 'preview'>('content');

  // Navegação
  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    if (name || description || content) {
      if (confirm('Deseja descartar o modelo em criação?')) {
        router.push('/contratos');
      }
    } else {
      router.push('/contratos');
    }
  };

  const handleSaveAsDraft = () => {
    const code = generateTemplateCode();
    alert(`Modelo ${code} salvo como rascunho (mock)`);
    router.push('/contratos');
  };

  const handlePublish = () => {
    const code = generateTemplateCode();
    alert(`Modelo ${code} publicado com sucesso (mock)`);
    router.push('/contratos');
  };

  const handleTogglePlan = (planId: string) => {
    setLinkedPlanIds((prev) => {
      if (prev.includes(planId)) {
        return prev.filter((p) => p !== planId);
      }
      return [...prev, planId];
    });
  };

  const handleInsertVariable = (variable: TemplateVariable) => {
    setContent((prev) => prev + `{{${variable.key}}}`);
    if (!selectedVariables.find((v) => v.key === variable.key)) {
      setSelectedVariables((prev) => [...prev, variable]);
    }
  };

  const handleRemoveVariable = (variableKey: string) => {
    setSelectedVariables((prev) => prev.filter((v) => v.key !== variableKey));
  };

  // Preview com variáveis substituídas (mock)
  const previewContent = useMemo(() => {
    let result = content;
    selectedVariables.forEach((variable) => {
      const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
      result = result.replace(regex, `[${variable.example}]`);
    });
    return result;
  }, [content, selectedVariables]);

  // Variáveis agrupadas por categoria
  const groupedVariables = useMemo(() => {
    const groups: Record<string, TemplateVariable[]> = {};
    AVAILABLE_VARIABLES.forEach((variable) => {
      if (!groups[variable.category]) {
        groups[variable.category] = [];
      }
      groups[variable.category].push(variable);
    });
    return groups;
  }, []);

  // Validação do step atual
  const isCurrentStepValid = useMemo(() => {
    switch (currentStep) {
      case 1:
        return name.trim().length >= 3;
      case 2:
        return content.trim().length >= 50;
      case 3:
        return true; // Opcional
      case 4:
        return true;
      default:
        return false;
    }
  }, [currentStep, name, content]);

  // Renderização dos steps
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  // Step 1: Informações Básicas
  const renderStep1 = () => (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Informações Básicas</h2>

      <div className="space-y-6">
        <div>
          <Label htmlFor="name">Nome do Modelo *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Contrato de Prestação de Serviços"
          />
          {name && name.length < 3 && (
            <p className="text-sm text-[var(--color-error)] mt-1">Mínimo de 3 caracteres</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva brevemente o propósito deste modelo de contrato..."
            rows={3}
            className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] resize-none"
          />
        </div>

        <div className="flex items-center gap-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={requiresSignature}
              onChange={(e) => setRequiresSignature(e.target.checked)}
              className="w-5 h-5 rounded border-[var(--color-border-primary)]"
            />
            <div>
              <div className="font-medium text-[var(--color-text-primary)]">Exige Assinatura Digital</div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                O contrato precisará ser assinado digitalmente pelo usuário
              </div>
            </div>
          </label>
        </div>

        {/* Dica */}
        <div className="p-4 bg-[var(--color-brand-light)] rounded-lg border border-[var(--color-brand)]">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--color-brand)] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-medium text-[var(--color-brand)]">Dica</div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                Escolha um nome descritivo que identifique claramente o tipo de contrato. 
                Isso facilita a busca e organização dos modelos.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  // Step 2: Conteúdo
  const renderStep2 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Conteúdo do Contrato</h2>
            <div className="flex border border-[var(--color-border-primary)] rounded-lg overflow-hidden">
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'content'
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                }`}
                onClick={() => setActiveTab('content')}
              >
                Editar
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                }`}
                onClick={() => setActiveTab('preview')}
              >
                Visualizar
              </button>
            </div>
          </div>

          {activeTab === 'content' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`CONTRATO DE {{plan.nome}}

Por este instrumento particular, as partes abaixo qualificadas...

CONTRATANTE:
Nome: {{usuario.nome}}
CPF/CNPJ: {{usuario.documento}}
Endereço: {{usuario.endereco}}

CONTRATADA:
{{unidade.razao_social}}
CNPJ: {{unidade.cnpj}}

CLÁUSULA PRIMEIRA - DO OBJETO
...`}
              rows={20}
              className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] resize-none font-mono text-sm"
            />
          ) : (
            <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg p-6 min-h-[500px] max-h-[600px] overflow-y-auto">
              <pre className="whitespace-pre-wrap font-mono text-sm text-[var(--color-text-primary)]">
                {previewContent || 'Digite o conteúdo para visualizar...'}
              </pre>
            </div>
          )}

          {content && content.length < 50 && (
            <p className="text-sm text-[var(--color-error)] mt-2">
              O conteúdo deve ter no mínimo 50 caracteres
            </p>
          )}

          {/* Variáveis utilizadas */}
          {selectedVariables.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border-primary)]">
              <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Variáveis utilizadas ({selectedVariables.length}):
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedVariables.map((variable) => (
                  <div
                    key={variable.key}
                    className="flex items-center gap-1 px-2 py-1 bg-[var(--color-bg-tertiary)] rounded-lg text-sm"
                  >
                    <code className="font-mono text-[var(--color-brand)]">{variable.key}</code>
                    <button
                      onClick={() => handleRemoveVariable(variable.key)}
                      className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] ml-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Painel de variáveis */}
      <Card className="p-6">
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-3">Variáveis Disponíveis</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Clique para inserir no final do conteúdo
        </p>
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {Object.entries(groupedVariables).map(([category, variables]) => (
            <div key={category}>
              <div className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-2">
                {category}
              </div>
              <div className="space-y-1">
                {variables.map((variable) => (
                  <button
                    key={variable.key}
                    onClick={() => handleInsertVariable(variable)}
                    className="w-full text-left px-3 py-2 text-sm bg-[var(--color-bg-secondary)] hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand)] rounded-lg border border-[var(--color-border-primary)] transition-colors"
                    title={variable.description}
                  >
                    <code className="font-mono text-xs">{`{{${variable.key}}}`}</code>
                    <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">{variable.label}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  // Step 3: Planos Vinculados
  const renderStep3 = () => (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Planos Vinculados</h2>
      <p className="text-[var(--color-text-secondary)] mb-6">
        Selecione os planos que utilizarão este modelo de contrato. 
        Quando um usuário contratar esses planos, este contrato será gerado automaticamente.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {availablePlans.map((plan) => (
          <label
            key={plan.id}
            className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all ${
              linkedPlanIds.includes(plan.id)
                ? 'bg-[var(--color-brand-light)] border-2 border-[var(--color-brand)]'
                : 'bg-[var(--color-bg-secondary)] border-2 border-[var(--color-border-primary)] hover:bg-[var(--color-bg-tertiary)]'
            }`}
          >
            <input
              type="checkbox"
              checked={linkedPlanIds.includes(plan.id)}
              onChange={() => handleTogglePlan(plan.id)}
              className="w-5 h-5 mt-0.5 rounded border-[var(--color-border-primary)]"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[var(--color-text-primary)] truncate">{plan.name}</div>
              <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                {plan.category}
              </div>
            </div>
            {linkedPlanIds.includes(plan.id) && (
              <svg className="w-5 h-5 text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </label>
        ))}
      </div>

      <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-text-secondary)]">Planos selecionados:</span>
          <Badge variant="default">{linkedPlanIds.length}</Badge>
        </div>
        {linkedPlanIds.length === 0 && (
          <p className="text-sm text-[var(--color-text-tertiary)] mt-2">
            Nenhum plano selecionado. O modelo poderá ser vinculado posteriormente.
          </p>
        )}
      </div>
    </Card>
  );

  // Step 4: Revisão
  const renderStep4 = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-6">Revisão do Modelo</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resumo */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase mb-2">
                Informações
              </h3>
              <div className="space-y-2 p-4 bg-[var(--color-bg-secondary)] rounded-lg">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Nome</span>
                  <span className="font-medium text-[var(--color-text-primary)]">{name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Descrição</span>
                  <span className="text-[var(--color-text-primary)] text-right max-w-[200px] truncate">
                    {description || 'Não informada'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Assinatura Digital</span>
                  <Badge variant={requiresSignature ? 'success' : 'secondary'}>
                    {requiresSignature ? 'Obrigatória' : 'Não obrigatória'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase mb-2">
                Estatísticas
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                  <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {content.length}
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">caracteres</div>
                </div>
                <div className="text-center p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                  <div className="text-2xl font-bold text-[var(--color-brand)]">
                    {selectedVariables.length}
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">variáveis</div>
                </div>
                <div className="text-center p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                  <div className="text-2xl font-bold text-[var(--color-success)]">
                    {linkedPlanIds.length}
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">planos</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase mb-2">
                Planos Vinculados
              </h3>
              <div className="space-y-1">
                {linkedPlanIds.length > 0 ? (
                  linkedPlanIds.map((planId) => {
                    const plan = availablePlans.find((p) => p.id === planId);
                    return (
                      <div
                        key={planId}
                        className="flex items-center gap-2 p-2 bg-[var(--color-bg-secondary)] rounded-lg"
                      >
                        <svg className="w-4 h-4 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[var(--color-text-primary)]">{plan?.name || planId}</span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-[var(--color-text-tertiary)] p-2">
                    Nenhum plano vinculado
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Preview do conteúdo */}
          <div>
            <h3 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase mb-2">
              Preview do Conteúdo
            </h3>
            <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 max-h-[400px] overflow-y-auto">
              <pre className="whitespace-pre-wrap font-mono text-xs text-[var(--color-text-primary)]">
                {previewContent || 'Sem conteúdo'}
              </pre>
            </div>
          </div>
        </div>
      </Card>

      {/* Ações finais */}
      <Card className="p-6 bg-[var(--color-brand-light)] border-[var(--color-brand)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-[var(--color-brand)]">Pronto para publicar?</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Você pode salvar como rascunho e continuar editando depois, ou publicar agora.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleSaveAsDraft}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Salvar Rascunho
            </Button>
            <Button onClick={handlePublish}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Publicar Modelo
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
      <Header title="Novo Modelo de Contrato" />

      <div className="flex-1 overflow-auto p-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      currentStep === step.id
                        ? 'bg-[var(--color-brand)] text-white'
                        : currentStep > step.id
                          ? 'bg-[var(--color-success)] text-white'
                          : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="mt-2 text-center hidden md:block">
                    <div
                      className={`text-sm font-medium ${
                        currentStep === step.id
                          ? 'text-[var(--color-brand)]'
                          : currentStep > step.id
                            ? 'text-[var(--color-success)]'
                            : 'text-[var(--color-text-tertiary)]'
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-[var(--color-text-tertiary)]">{step.description}</div>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-16 md:w-24 h-1 mx-2 rounded ${
                      currentStep > step.id ? 'bg-[var(--color-success)]' : 'bg-[var(--color-bg-tertiary)]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Conteúdo do step */}
        {renderStep()}

        {/* Navegação */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-[var(--color-border-primary)]">
          <Button variant="secondary" onClick={handleCancel}>
            Cancelar
          </Button>
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button variant="secondary" onClick={handlePrevious}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Anterior
              </Button>
            )}
            {currentStep < STEPS.length && (
              <Button onClick={handleNext} disabled={!isCurrentStepValid}>
                Próximo
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
