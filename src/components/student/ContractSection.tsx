'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import type { StudentPortalContract } from '@/lib/student/studentPortalService';

interface ContractSectionProps {
  contract: StudentPortalContract | null;
}

export function ContractSection({ contract }: ContractSectionProps) {
  const [expanded, setExpanded] = useState(false);

  if (!contract) {
    return (
      <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--background-primary)' }}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: 'var(--element-secondary)' }} />
            <CardTitle className="text-base font-bold">Contrato</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="text-center py-6 rounded-xl"
            style={{ backgroundColor: 'var(--background-secondary)' }}
          >
            <p className="text-sm" style={{ color: 'var(--element-secondary)' }}>
              Nenhum contrato aceito
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0" style={{ backgroundColor: 'var(--background-primary)' }}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5" style={{ color: 'var(--status-positive)' }} />
          <CardTitle className="text-base font-bold">Contrato</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              {contract.templateName && (
                <p className="text-sm font-medium" style={{ color: 'var(--element-primary)' }}>
                  {contract.templateName}
                </p>
              )}
              <p className="text-xs" style={{ color: 'var(--element-secondary)' }}>
                Aceito em {new Date(contract.acceptedAt).toLocaleDateString('pt-BR')}
                {contract.termsVersion && ` · v${contract.termsVersion}`}
              </p>
            </div>
          </div>

          {contract.contentSnapshot && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs font-medium mt-2"
                style={{ color: 'var(--status-info)' }}
              >
                {expanded ? (
                  <>
                    Ocultar contrato
                    <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    Ver contrato completo
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              {expanded && (
                <div
                  className="mt-3 p-4 rounded-xl text-xs leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto"
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                    color: 'var(--element-secondary)',
                  }}
                >
                  {contract.contentSnapshot}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
