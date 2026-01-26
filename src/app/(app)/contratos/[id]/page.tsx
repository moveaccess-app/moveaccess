'use client';

import { useState, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  getTemplateById,
  TEMPLATE_STATUS_LABELS,
  TEMPLATE_STATUS_VARIANT,
  formatDate,
  formatDateTime,
} from '@/mocks/contractTemplatesMock';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Componente para exibir seção expansível
function Section({
  title,
  icon,
  children,
  defaultOpen = true,
  action,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  action?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="overflow-hidden">
      <div
        className="flex items-center justify-between p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-light)] flex items-center justify-center text-[var(--color-brand)]">
            {icon}
          </div>
          <span className="font-semibold text-[var(--color-text-primary)]">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {action && <div onClick={(e) => e.stopPropagation()}>{action}</div>}
          <svg
            className={`w-5 h-5 text-[var(--color-text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {isOpen && <div className="p-4 pt-0 border-t border-[var(--color-border-primary)]">{children}</div>}
    </Card>
  );
}

export default function TemplateDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  
  const template = useMemo(() => getTemplateById(id), [id]);

  // Handlers
  const handleEdit = () => {
    router.push(`/contratos/${id}/editar`);
  };

  const handlePublish = () => {
    alert('Publicar nova versão (mock)');
  };

  const handleArchive = () => {
    alert(`${template?.status === 'archived' ? 'Desarquivar' : 'Arquivar'} template (mock)`);
  };

  const handleDuplicate = () => {
    alert('Duplicar template (mock)');
  };

  const handleGeneratePDF = () => {
    alert('Gerar PDF (mock) - Funcionalidade disponível em breve');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://moveaccess.app/contratos/publico/${template?.id}`);
    alert('Link copiado! (mock)');
  };

  const handleLinkPlan = () => {
    alert('Vincular plano (mock)');
  };

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
      <Header title={`Modelo ${template.code}`} />

      <div className="flex-1 overflow-auto p-6">
        {/* Header Card */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Info principal */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-[var(--color-brand-light)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--color-brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-sm text-[var(--color-text-tertiary)]">{template.code}</span>
                  <Badge variant={TEMPLATE_STATUS_VARIANT[template.status]}>
                    {TEMPLATE_STATUS_LABELS[template.status]}
                  </Badge>
                  <Badge variant="secondary">v{template.currentVersion}</Badge>
                </div>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">{template.name}</h1>
                <p className="text-[var(--color-text-secondary)]">{template.description}</p>
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleEdit}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </Button>
              {template.status === 'draft' && (
                <Button variant="secondary" onClick={handlePublish}>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Publicar
                </Button>
              )}
              <Button variant="secondary" onClick={handleDuplicate}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Duplicar
              </Button>
              <Button variant="secondary" onClick={handleArchive}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                {template.status === 'archived' ? 'Desarquivar' : 'Arquivar'}
              </Button>
            </div>
          </div>

          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--color-border-primary)]">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">v{template.currentVersion}</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Versão Atual</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-brand)]">{template.linkedPlans.length}</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Planos Vinculados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">{template.variables.length}</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Variáveis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-success)]">{template.signatures.length}</div>
              <div className="text-sm text-[var(--color-text-secondary)]">Assinaturas</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Conteúdo do Contrato */}
            <Section
              title="Conteúdo do Contrato"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              action={
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleGeneratePDF}>
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF
                  </Button>
                  <Button variant="secondary" onClick={handleCopyLink}>
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Link
                  </Button>
                </div>
              }
            >
              <div className="bg-[var(--color-bg-secondary)] rounded-lg p-6 font-mono text-sm whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                {template.content}
              </div>
            </Section>

            {/* Variáveis Dinâmicas */}
            <Section
              title="Variáveis Dinâmicas"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              }
              defaultOpen={false}
            >
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Estas variáveis são substituídas automaticamente ao gerar o documento final.
              </p>
              <div className="space-y-2">
                {template.variables.map((variable) => (
                  <div
                    key={variable.key}
                    className="flex items-start gap-4 p-3 bg-[var(--color-bg-secondary)] rounded-lg"
                  >
                    <code className="font-mono text-sm bg-[var(--color-bg-tertiary)] px-2 py-1 rounded text-[var(--color-brand)]">
                      {variable.key}
                    </code>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--color-text-primary)]">{variable.label}</div>
                      <div className="text-sm text-[var(--color-text-tertiary)]">{variable.description}</div>
                      <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                        Ex: <span className="italic">{variable.example}</span>
                      </div>
                    </div>
                    <Badge variant="secondary">{variable.category}</Badge>
                  </div>
                ))}
              </div>
            </Section>

            {/* Histórico de Versões */}
            <Section
              title="Histórico de Versões"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              defaultOpen={false}
            >
              <div className="space-y-3">
                {template.versions
                  .sort((a, b) => b.version - a.version)
                  .map((version) => (
                    <div
                      key={version.version}
                      className={`p-4 rounded-lg border ${
                        version.version === template.currentVersion
                          ? 'border-[var(--color-brand)] bg-[var(--color-brand-light)]'
                          : 'border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--color-text-primary)]">
                            Versão {version.version}
                          </span>
                          <Badge variant={TEMPLATE_STATUS_VARIANT[version.status]}>
                            {TEMPLATE_STATUS_LABELS[version.status]}
                          </Badge>
                          {version.version === template.currentVersion && (
                            <Badge variant="default">Atual</Badge>
                          )}
                        </div>
                        <span className="text-sm text-[var(--color-text-tertiary)]">
                          {version.signatureCount} assinatura(s)
                        </span>
                      </div>
                      <div className="text-sm text-[var(--color-text-secondary)]">
                        Criada em {formatDateTime(version.createdAt)} por {version.createdBy}
                      </div>
                      {version.publishedAt && (
                        <div className="text-sm text-[var(--color-text-tertiary)]">
                          Publicada em {formatDateTime(version.publishedAt)}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </Section>

            {/* Assinaturas */}
            <Section
              title="Assinaturas"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              }
              defaultOpen={false}
            >
              {template.signatures.length > 0 ? (
                <div className="space-y-2">
                  {template.signatures.map((sig) => (
                    <div
                      key={sig.id}
                      className="flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-secondary)]">
                          {sig.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-[var(--color-text-primary)]">{sig.userName}</div>
                          <div className="text-sm text-[var(--color-text-tertiary)]">{sig.userDocument}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-[var(--color-text-primary)]">{sig.contractNumber}</div>
                        <div className="text-xs text-[var(--color-text-tertiary)]">
                          {formatDateTime(sig.signedAt)} • v{sig.templateVersion}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--color-text-tertiary)]">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <p>Nenhuma assinatura registrada para este modelo.</p>
                </div>
              )}
            </Section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Planos Vinculados */}
            <Section
              title="Planos Vinculados"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              }
              action={
                <Button variant="secondary" onClick={handleLinkPlan}>
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Vincular
                </Button>
              }
            >
              {template.linkedPlans.length > 0 ? (
                <div className="space-y-2">
                  {template.linkedPlans.map((lp) => (
                    <div
                      key={lp.planId}
                      className="flex items-center justify-between p-3 bg-[var(--color-bg-secondary)] rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-[var(--color-text-primary)]">{lp.planName}</div>
                        <div className="text-xs text-[var(--color-text-tertiary)]">
                          Vinculado em {formatDate(lp.linkedAt)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => router.push(`/plans/${lp.planId}`)}
                      >
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-[var(--color-text-tertiary)]">
                  <p className="text-sm">Nenhum plano vinculado.</p>
                  <Button variant="secondary" className="mt-2" onClick={handleLinkPlan}>
                    Vincular Plano
                  </Button>
                </div>
              )}
            </Section>

            {/* Informações */}
            <Section
              title="Informações"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            >
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Exige Assinatura</span>
                  <span className="text-[var(--color-text-primary)]">
                    {template.requiresSignature ? 'Sim' : 'Não'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Criado em</span>
                  <span className="text-[var(--color-text-primary)]">{formatDate(template.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Criado por</span>
                  <span className="text-[var(--color-text-primary)]">{template.createdBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Atualizado em</span>
                  <span className="text-[var(--color-text-primary)]">{formatDate(template.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Atualizado por</span>
                  <span className="text-[var(--color-text-primary)]">{template.updatedBy}</span>
                </div>
              </div>
            </Section>

            {/* Botão voltar */}
            <Button variant="secondary" className="w-full" onClick={() => router.push('/contratos')}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar para Contratos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
