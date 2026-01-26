'use client';

import { useState, useMemo, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  getTemplateById,
  TEMPLATE_STATUS_LABELS,
  TEMPLATE_STATUS_VARIANT,
  AVAILABLE_VARIABLES,
  getAvailablePlans,
} from '@/mocks/contractTemplatesMock';
import type { TemplateVariable } from '@/mocks/contractTemplatesMock';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditTemplatePage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const originalTemplate = useMemo(() => getTemplateById(id), [id]);
  const availablePlans = useMemo(() => getAvailablePlans(), []);

  // Form state
  const [name, setName] = useState(originalTemplate?.name || '');
  const [description, setDescription] = useState(originalTemplate?.description || '');
  const [content, setContent] = useState(originalTemplate?.content || '');
  const [requiresSignature, setRequiresSignature] = useState(originalTemplate?.requiresSignature ?? true);
  const [linkedPlanIds, setLinkedPlanIds] = useState<string[]>(
    originalTemplate?.linkedPlans.map((lp) => lp.planId) || []
  );
  const [selectedVariables, setSelectedVariables] = useState<TemplateVariable[]>(
    originalTemplate?.variables || []
  );

  // UI state
  const [activeTab, setActiveTab] = useState<'content' | 'preview'>('content');
  const [showVariablePanel, setShowVariablePanel] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Handlers
  const handleInputChange = useCallback(
    (
      setter: (value: string) => void,
      value: string
    ) => {
      setter(value);
      setIsDirty(true);
    },
    []
  );

  const handleSave = () => {
    alert('Alterações salvas (mock)');
    setIsDirty(false);
  };

  const handlePublishNewVersion = () => {
    if (originalTemplate) {
      const newVersion = originalTemplate.currentVersion + 1;
      alert(`Nova versão v${newVersion} publicada (mock)`);
      setIsDirty(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (confirm('Deseja descartar as alterações?')) {
        router.push(`/contratos/${id}`);
      }
    } else {
      router.push(`/contratos/${id}`);
    }
  };

  const handleTogglePlan = (planId: string) => {
    setLinkedPlanIds((prev) => {
      if (prev.includes(planId)) {
        return prev.filter((p) => p !== planId);
      }
      return [...prev, planId];
    });
    setIsDirty(true);
  };

  const handleInsertVariable = (variable: TemplateVariable) => {
    setContent((prev) => prev + `{{${variable.key}}}`);
    if (!selectedVariables.find((v) => v.key === variable.key)) {
      setSelectedVariables((prev) => [...prev, variable]);
    }
    setIsDirty(true);
  };

  const handleRemoveVariable = (variableKey: string) => {
    setSelectedVariables((prev) => prev.filter((v) => v.key !== variableKey));
    setIsDirty(true);
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

  if (!originalTemplate) {
    return (
      <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
        <Header title="Modelo não encontrado" />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <svg
              className="w-16 h-16 mx-auto text-[var(--color-text-tertiary)] mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Modelo não encontrado</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">O modelo solicitado não existe ou foi removido.</p>
            <Button onClick={() => router.push('/contratos')}>Voltar para Contratos</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
      <Header title={`Editar: ${originalTemplate.name}`} />

      <div className="flex-1 overflow-auto p-6">
        {/* Header com ações */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[var(--color-brand-light)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-[var(--color-text-tertiary)]">{originalTemplate.code}</span>
                  <Badge variant={TEMPLATE_STATUS_VARIANT[originalTemplate.status]}>
                    {TEMPLATE_STATUS_LABELS[originalTemplate.status]}
                  </Badge>
                  <Badge variant="secondary">v{originalTemplate.currentVersion}</Badge>
                  {isDirty && <Badge variant="warning">Alterações não salvas</Badge>}
                </div>
                <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Editando Modelo de Contrato</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button variant="secondary" onClick={handleSave} disabled={!isDirty}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Salvar Rascunho
              </Button>
              <Button onClick={handlePublishNewVersion}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Publicar v{originalTemplate.currentVersion + 1}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal - Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações básicas */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Informações Básicas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Modelo</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => handleInputChange(setName, e.target.value)}
                    placeholder="Ex: Contrato de Prestação de Serviços"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresSignature}
                      onChange={(e) => {
                        setRequiresSignature(e.target.checked);
                        setIsDirty(true);
                      }}
                      className="w-4 h-4 rounded border-[var(--color-border-primary)]"
                    />
                    <span className="text-[var(--color-text-primary)]">Exige assinatura digital</span>
                  </Label>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => handleInputChange(setDescription, e.target.value)}
                    placeholder="Descreva brevemente o propósito deste modelo..."
                    rows={2}
                    className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] resize-none"
                  />
                </div>
              </div>
            </Card>

            {/* Editor de Conteúdo */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Conteúdo do Contrato</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant={showVariablePanel ? 'default' : 'secondary'}
                    onClick={() => setShowVariablePanel(!showVariablePanel)}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Variáveis
                  </Button>
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
              </div>

              {/* Painel de variáveis */}
              {showVariablePanel && (
                <div className="mb-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-primary)]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-[var(--color-text-primary)]">Inserir Variável</h3>
                    <button
                      onClick={() => setShowVariablePanel(false)}
                      className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                    Clique em uma variável para inseri-la no final do conteúdo.
                  </p>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {Object.entries(groupedVariables).map(([category, variables]) => (
                      <div key={category}>
                        <div className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase mb-1">
                          {category}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {variables.map((variable) => (
                            <button
                              key={variable.key}
                              onClick={() => handleInsertVariable(variable)}
                              className="px-2 py-1 text-xs font-mono bg-[var(--color-bg-primary)] hover:bg-[var(--color-brand-light)] hover:text-[var(--color-brand)] rounded border border-[var(--color-border-primary)] transition-colors"
                              title={`${variable.label}: ${variable.description}`}
                            >
                              {`{{${variable.key}}}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Área de edição ou preview */}
              {activeTab === 'content' ? (
                <textarea
                  value={content}
                  onChange={(e) => handleInputChange(setContent, e.target.value)}
                  placeholder="Digite o conteúdo do contrato aqui..."
                  rows={20}
                  className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] resize-none font-mono text-sm"
                />
              ) : (
                <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg p-6 min-h-[500px] max-h-[600px] overflow-y-auto">
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-[var(--color-text-primary)]">
                      {previewContent}
                    </pre>
                  </div>
                </div>
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
                        <span className="text-[var(--color-text-secondary)]">({variable.label})</span>
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Planos Vinculados */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Planos Vinculados</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Selecione os planos que utilizarão este modelo de contrato.
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availablePlans.map((plan) => (
                  <label
                    key={plan.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      linkedPlanIds.includes(plan.id)
                        ? 'bg-[var(--color-brand-light)] border border-[var(--color-brand)]'
                        : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] hover:bg-[var(--color-bg-tertiary)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={linkedPlanIds.includes(plan.id)}
                      onChange={() => handleTogglePlan(plan.id)}
                      className="w-4 h-4 rounded border-[var(--color-border-primary)]"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-[var(--color-text-primary)]">{plan.name}</div>
                      <div className="text-sm text-[var(--color-text-secondary)]">{plan.name}</div>
                    </div>
                  </label>
                ))}
              </div>
              {linkedPlanIds.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border-primary)]">
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {linkedPlanIds.length} plano(s) selecionado(s)
                  </span>
                </div>
              )}
            </Card>

            {/* Dicas */}
            <Card className="p-6 bg-[var(--color-brand-light)] border-[var(--color-brand)]">
              <h3 className="font-semibold text-[var(--color-brand)] mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Dicas de Edição
              </h3>
              <ul className="text-sm text-[var(--color-text-secondary)] space-y-2">
                <li>• Use variáveis com <code className="bg-white/50 px-1 rounded">{`{{variavel}}`}</code> para dados dinâmicos</li>
                <li>• Clique em &quot;Visualizar&quot; para ver o resultado</li>
                <li>• &quot;Salvar Rascunho&quot; não publica as alterações</li>
                <li>• &quot;Publicar&quot; cria uma nova versão</li>
              </ul>
            </Card>

            {/* Ações rápidas */}
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => router.push(`/contratos/${id}`)}
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver Modelo
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => router.push('/contratos')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar para Lista
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
