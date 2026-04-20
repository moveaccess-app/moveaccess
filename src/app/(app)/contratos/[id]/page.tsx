'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import { capture } from '@/lib/analytics';
import {
  getContractTemplateById,
  publishContractTemplate,
  archiveContractTemplate,
  TEMPLATE_STATUS_LABELS,
  resolveVariablesWithExamples,
  analyzeVariables,
  type ContractTemplate,
  type ContractTemplateStatus,
} from '@/lib/contracts';

const STATUS_VARIANT: Record<ContractTemplateStatus, 'default' | 'secondary' | 'destructive' | 'warning' | 'success' | 'outline'> = {
  draft: 'warning',
  published: 'success',
  archived: 'secondary',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

interface PageProps {
  params: Promise<{ id: string }>;
}

// ─── Contract Content Section with Preview ────────────────────────

function ContractContentSection({ content }: { content: string }) {
  const [tab, setTab] = useState<'source' | 'preview'>('source');
  const resolved = resolveVariablesWithExamples(content);

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-1 mb-4 border-b border-[var(--color-border-primary)]">
        <button
          type="button"
          onClick={() => setTab('source')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === 'source'
              ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
              : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          Conteúdo
        </button>
        <button
          type="button"
          onClick={() => setTab('preview')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === 'preview'
              ? 'border-[var(--color-brand)] text-[var(--color-brand)]'
              : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          Preview (dados de exemplo)
        </button>
      </div>

      <div className="bg-[var(--color-bg-secondary)] rounded-lg p-6 text-sm whitespace-pre-wrap max-h-[500px] overflow-y-auto font-sans leading-relaxed text-[var(--color-text-secondary)]">
        {tab === 'source' ? content : resolved}
      </div>
    </Card>
  );
}

// ─── Variable Analysis Card ───────────────────────────────────────

function VariableAnalysisCard({ content }: { content: string }) {
  const analysis = analyzeVariables(content);

  if (analysis.known.length === 0 && analysis.unknown.length === 0) return null;

  return (
    <Card className="p-4 mb-6">
      <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
        Variáveis dinâmicas utilizadas
      </h3>
      <div className="flex flex-wrap gap-2">
        {analysis.known.map((v) => (
          <span
            key={v.key}
            title={v.description}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono bg-[var(--color-brand-light)] text-[var(--color-brand)] border border-[var(--color-brand)]/20"
          >
            {`{{${v.key}}}`}
            <span className="font-sans text-[var(--color-text-tertiary)]">→ {v.example}</span>
          </span>
        ))}
        {analysis.unknown.map((key) => (
          <span
            key={key}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
          >
            {`{{${key}}}`}
            <span className="font-sans">⚠ não reconhecida</span>
          </span>
        ))}
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function TemplateDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getContractTemplateById(id);
      setTemplate(data);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleEdit = () => {
    router.push(`/contratos/${id}/editar`);
  };

  const handlePublish = async () => {
    if (!template || template.status !== 'draft') return;
    if (!window.confirm('Publicar este template? O template publicado atual (se existir) será arquivado.')) return;
    
    setActionLoading(true);
    const result = await publishContractTemplate(id);
    if (result) {
      setTemplate(result);
      capture('contract_published', {});
      toast.success('Template publicado com sucesso.');
    } else {
      toast.error('Não foi possível publicar o template.');
    }
    setActionLoading(false);
  };

  const handleArchive = async () => {
    if (!template || template.status !== 'published') return;
    if (!window.confirm('Arquivar este template? Ele não será mais exibido no onboarding.')) return;
    
    setActionLoading(true);
    const success = await archiveContractTemplate(id);
    if (success) {
      setTemplate({ ...template, status: 'archived' });
      toast.success('Template arquivado.');
    } else {
      toast.error('Não foi possível arquivar o template.');
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
        <Header title="Template" />
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
      <Header title={template.name} />

      <div className="flex-1 overflow-auto p-6">
        {/* Header Card */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-[var(--color-brand-light)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Badge variant={STATUS_VARIANT[template.status]}>
                    {TEMPLATE_STATUS_LABELS[template.status]}
                  </Badge>
                  <Badge variant="secondary">v{template.version}</Badge>
                </div>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">{template.name}</h1>
                {template.description && (
                  <p className="text-[var(--color-text-secondary)]">{template.description}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {template.status === 'draft' && (
                <>
                  <Button onClick={handleEdit}>Editar</Button>
                  <Button variant="secondary" onClick={handlePublish} disabled={actionLoading}>
                    Publicar
                  </Button>
                </>
              )}
              {template.status === 'published' && (
                <Button variant="secondary" onClick={handleArchive} disabled={actionLoading}>
                  Arquivar
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--color-border-primary)]">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">v{template.version}</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Versão</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-[var(--color-text-primary)]">
                {template.publishedAt ? formatDate(template.publishedAt) : '—'}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">Publicado em</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-[var(--color-text-primary)]">
                {formatDate(template.createdAt)}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">Criado em</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-[var(--color-text-primary)]">
                {formatDate(template.updatedAt)}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">Atualizado em</div>
            </div>
          </div>
        </Card>

        {/* Contract content with tabs */}
        <ContractContentSection content={template.content} />

        {/* Variable analysis */}
        <VariableAnalysisCard content={template.content} />

        {/* Back button */}
        <Button variant="secondary" onClick={() => router.push('/contratos')}>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar para Contratos
        </Button>
      </div>
    </div>
  );
}
