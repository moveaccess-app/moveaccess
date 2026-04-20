'use client';

import { useState, useEffect, useRef, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import {
  getContractTemplateById,
  updateContractTemplate,
  TEMPLATE_STATUS_LABELS,
  type ContractTemplate,
  type ContractTemplateStatus,
  resolveVariablesWithExamples,
  analyzeVariables,
  getVariablesByCategory,
} from '@/lib/contracts';

const STATUS_VARIANT: Record<ContractTemplateStatus, 'default' | 'secondary' | 'destructive' | 'warning' | 'success' | 'outline'> = {
  draft: 'warning',
  published: 'success',
  archived: 'secondary',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

// ─── Variable Panel ──────────────────────────────────────────────

function VariablePanel({
  onInsert,
}: {
  onInsert: (variableKey: string) => void;
}) {
  const groups = getVariablesByCategory();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
          Variáveis dinâmicas
        </h3>
      </div>
      <p className="text-xs text-[var(--color-text-tertiary)]">
        Clique para inserir no editor. As variáveis serão substituídas por dados reais no aceite do aluno.
      </p>

      {groups.map(({ category, variables }) => (
        <div key={category.id}>
          <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
            {category.icon} {category.label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {variables.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => onInsert(v.key)}
                title={`${v.description}\nExemplo: ${v.example}`}
                className="px-2 py-1 rounded text-xs font-mono bg-[var(--color-bg-tertiary)] text-[var(--color-brand)] hover:bg-[var(--color-brand-light)] border border-[var(--color-border-primary)] hover:border-[var(--color-brand)] transition-colors cursor-pointer"
              >
                {`{{${v.key}}}`}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Preview Panel ───────────────────────────────────────────────

function PreviewPanel({ content }: { content: string }) {
  const resolved = resolveVariablesWithExamples(content);
  const analysis = analyzeVariables(content);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
            Preview
          </h3>
        </div>
        {analysis.known.length > 0 && (
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {analysis.known.length} variável(is) • dados de exemplo
          </span>
        )}
      </div>

      {analysis.unknown.length > 0 && (
        <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Variáveis não reconhecidas: {analysis.unknown.map((k) => `{{${k}}}`).join(', ')}
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-[var(--color-bg-primary)] rounded-lg p-5 border border-[var(--color-border-primary)] max-h-[400px] overflow-y-auto">
        <pre className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap font-sans leading-relaxed">
          {resolved}
        </pre>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function EditTemplatePage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getContractTemplateById(id);
      if (data) {
        setTemplate(data);
        setName(data.name);
        setDescription(data.description || '');
        setContent(data.content);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const isValid = name.trim().length >= 3 && content.trim().length >= 50;

  const handleInputChange = (setter: (value: string) => void, value: string) => {
    setter(value);
    setIsDirty(true);
  };

  const handleInsertVariable = useCallback((key: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const tag = `{{${key}}}`;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = content.slice(0, start) + tag + content.slice(end);

    setContent(newContent);
    setIsDirty(true);
    setActiveTab('editor');

    // Restore cursor after the inserted tag
    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = start + tag.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  }, [content]);

  const handleSave = async () => {
    if (!isValid || !template) return;

    setSaving(true);
    setError(null);

    const result = await updateContractTemplate(id, {
      name: name.trim(),
      description: description.trim() || undefined,
      content: content.trim(),
    });

    if (result) {
      setTemplate(result);
      setIsDirty(false);
      router.push(`/contratos/${id}`);
    } else {
      setError('Erro ao salvar. Tente novamente.');
      setSaving(false);
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

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
        <Header title="Editar Template" />
        <div className="p-6 max-w-3xl mx-auto w-full space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
        <Header title="Modelo não encontrado" />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Modelo não encontrado</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">O modelo solicitado não existe ou foi removido.</p>
            <Button onClick={() => router.push('/contratos')}>Voltar para Contratos</Button>
          </Card>
        </div>
      </div>
    );
  }

  if (template.status !== 'draft') {
    return (
      <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
        <Header title="Edição não permitida" />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">Edição não permitida</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Apenas modelos em rascunho podem ser editados. Este modelo está{' '}
              <Badge variant={STATUS_VARIANT[template.status]}>
                {TEMPLATE_STATUS_LABELS[template.status]}
              </Badge>
            </p>
            <Button onClick={() => router.push(`/contratos/${id}`)}>Ver Modelo</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
      <Header title={`Editar: ${template.name}`} />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header com status */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={STATUS_VARIANT[template.status]}>
                  {TEMPLATE_STATUS_LABELS[template.status]}
                </Badge>
                <Badge variant="secondary">v{template.version}</Badge>
                {isDirty && <Badge variant="warning">Alterações não salvas</Badge>}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleCancel}>Cancelar</Button>
                <Button onClick={handleSave} disabled={!isValid || !isDirty || saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </Card>

          {error && (
            <Card className="p-4 bg-red-50 border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </Card>
          )}

          {/* Informações básicas */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Informações Básicas</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Modelo *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleInputChange(setName, e.target.value)}
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
                  onChange={(e) => handleInputChange(setDescription, e.target.value)}
                  placeholder="Descreva brevemente o propósito deste modelo..."
                  rows={2}
                  className="w-full px-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] resize-none"
                />
              </div>
            </div>
          </Card>

          {/* Variable Panel */}
          <Card className="p-4">
            <VariablePanel onInsert={handleInsertVariable} />
          </Card>

          {/* Editor + Preview Tabs */}
          <Card className="p-6">
            <div className="flex items-center gap-1 mb-4 border-b border-[var(--color-border-primary)]">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === 'editor'
                    ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
                    : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === 'preview'
                    ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
                    : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                Preview
              </button>
            </div>

            {activeTab === 'editor' ? (
              <>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => handleInputChange(setContent, e.target.value)}
                  placeholder="Digite o conteúdo do contrato aqui... Use {{variavel}} para inserir dados dinâmicos."
                  rows={22}
                  className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] resize-none font-mono text-sm"
                />
                {content && content.length < 50 && (
                  <p className="text-sm text-[var(--color-error)] mt-2">
                    O conteúdo deve ter no mínimo 50 caracteres ({content.length}/50)
                  </p>
                )}
              </>
            ) : (
              <PreviewPanel content={content} />
            )}
          </Card>

          {/* Ações */}
          <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border-primary)]">
            <Button variant="secondary" onClick={() => router.push(`/contratos/${id}`)}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar
            </Button>
            <Button onClick={handleSave} disabled={!isValid || !isDirty || saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
