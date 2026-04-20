'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  createContractTemplate,
  resolveVariablesWithExamples,
  analyzeVariables,
  getVariablesByCategory,
  STARTER_TEMPLATES,
  type StarterTemplate,
} from '@/lib/contracts';

// ─── Starter Template Picker ─────────────────────────────────────

function StarterTemplatePicker({
  onSelect,
}: {
  onSelect: (template: StarterTemplate) => void;
}) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
        Comece a partir de um modelo pronto
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
        Escolha um modelo pré-configurado com variáveis dinâmicas. Você pode personalizá-lo depois.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {STARTER_TEMPLATES.map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => onSelect(st)}
            className="text-left p-4 rounded-lg border border-[var(--color-border-primary)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand-light)] transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-brand)]">
                  {st.name}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  {st.description}
                </p>
              </div>
              <svg
                className="w-5 h-5 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-brand)] shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="flex gap-1.5 mt-2">
              {st.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-3 text-center">
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Ou comece do zero escrevendo o conteúdo manualmente abaixo.
        </p>
      </div>
    </Card>
  );
}

// ─── Variable Panel ──────────────────────────────────────────────

function VariablePanel({ onInsert }: { onInsert: (key: string) => void }) {
  const groups = getVariablesByCategory();

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Variáveis dinâmicas</h3>
      </div>
      <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
        Clique para inserir. Serão substituídas por dados reais no aceite do aluno.
      </p>
      <div className="space-y-3">
        {groups.map(({ category, variables }) => (
          <div key={category.id}>
            <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
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
    </Card>
  );
}

// ─── Preview Panel ───────────────────────────────────────────────

function PreviewPanel({ content }: { content: string }) {
  const resolved = resolveVariablesWithExamples(content);
  const analysis = analyzeVariables(content);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">Preview</h3>
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

export default function NewTemplatePage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const isValid = name.trim().length >= 3 && content.trim().length >= 50;

  const handleSelectStarter = (st: StarterTemplate) => {
    setName(st.name);
    setDescription(st.description);
    setContent(st.content);
    setActiveTab('editor');
    // Scroll to editor
    requestAnimationFrame(() => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      textareaRef.current?.focus();
    });
  };

  const handleInsertVariable = useCallback(
    (key: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const tag = `{{${key}}}`;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + tag + content.slice(end);

      setContent(newContent);
      setActiveTab('editor');

      requestAnimationFrame(() => {
        textarea.focus();
        const newPos = start + tag.length;
        textarea.setSelectionRange(newPos, newPos);
      });
    },
    [content]
  );

  const handleCancel = () => {
    if (name || description || content) {
      if (confirm('Deseja descartar o modelo em criação?')) {
        router.push('/contratos');
      }
    } else {
      router.push('/contratos');
    }
  };

  const handleSave = async () => {
    if (!isValid) return;

    setSaving(true);
    setError(null);

    const result = await createContractTemplate({
      name: name.trim(),
      description: description.trim() || undefined,
      content: content.trim(),
    });

    if (result) {
      router.push(`/contratos/${result.id}`);
    } else {
      setError('Erro ao criar o modelo. Tente novamente.');
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
      <Header title="Novo Modelo de Contrato" />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {error && (
            <Card className="p-4 bg-red-50 border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </Card>
          )}

          {/* Starter Templates — only show when content is empty */}
          {!content && <StarterTemplatePicker onSelect={handleSelectStarter} />}

          {/* Informações básicas */}
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
            </div>
          </Card>

          {/* Variable Panel */}
          <VariablePanel onInsert={handleInsertVariable} />

          {/* Editor + Preview */}
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
                Conteúdo do Contrato *
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
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Use variáveis como {{aluno_nome}}, {{plano_valor}}, {{academia_nome}} para personalizar automaticamente.

CONTRATO DE PRESTAÇÃO DE SERVIÇOS

CONTRATADA: {{academia_nome}}
CONTRATANTE: {{aluno_nome}}

CLÁUSULA PRIMEIRA — DO OBJETO
...`}
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

          {/* Dica */}
          <Card className="p-4 bg-[var(--color-brand-light)] border-[var(--color-brand)]">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[var(--color-brand)] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-medium text-[var(--color-brand)]">Dica</div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  O modelo será criado como rascunho. Após salvar, você poderá publicá-lo para que
                  seja utilizado na jornada de onboarding dos alunos. As variáveis dinâmicas serão
                  substituídas automaticamente pelos dados reais do aluno e da academia.
                </div>
              </div>
            </div>
          </Card>

          {/* Ações */}
          <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border-primary)]">
            <Button variant="secondary" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!isValid || saving}>
              {saving ? 'Salvando...' : 'Criar Modelo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
