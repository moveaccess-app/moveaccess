// ============================================
// MÓDULO DE TEMPLATES CONTRATUAIS - MOVEACCESS
// Modelos de documentos contratuais
// ============================================

import { mockPlans } from './plansMock';

// ============================================
// TIPOS BASE
// ============================================

/**
 * Status do template
 */
export type TemplateStatus = 'draft' | 'published' | 'archived';

/**
 * Labels de status
 */
export const TEMPLATE_STATUS_LABELS: Record<TemplateStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
};

/**
 * Variants de badge por status
 */
export const TEMPLATE_STATUS_VARIANT: Record<TemplateStatus, 'default' | 'secondary' | 'destructive' | 'warning' | 'success' | 'outline'> = {
  draft: 'warning',
  published: 'success',
  archived: 'secondary',
};

// ============================================
// INTERFACES
// ============================================

/**
 * Variável dinâmica do template
 */
export interface TemplateVariable {
  key: string;
  label: string;
  description: string;
  example: string;
  category: 'user' | 'plan' | 'contract' | 'unit' | 'custom';
}

/**
 * Versão do template
 */
export interface TemplateVersion {
  version: number;
  status: TemplateStatus;
  content: string;
  createdAt: string;
  createdBy: string;
  publishedAt?: string;
  signatureCount: number;
}

/**
 * Assinatura mockada vinculada ao template
 */
export interface TemplateSignature {
  id: string;
  userId: string;
  userName: string;
  userDocument: string;
  signedAt: string;
  templateVersion: number;
  contractNumber: string;
}

/**
 * Plano vinculado ao template
 */
export interface LinkedPlan {
  planId: string;
  planName: string;
  linkedAt: string;
  linkedBy: string;
}

/**
 * Interface principal do Template
 */
export interface ContractTemplate {
  id: string;
  code: string;                    // CTPL-001, CTPL-002, etc.
  name: string;
  description: string;
  currentVersion: number;
  status: TemplateStatus;
  requiresSignature: boolean;
  
  // Conteúdo atual
  content: string;
  
  // Variáveis suportadas
  variables: TemplateVariable[];
  
  // Planos vinculados
  linkedPlans: LinkedPlan[];
  
  // Histórico de versões
  versions: TemplateVersion[];
  
  // Assinaturas (mock)
  signatures: TemplateSignature[];
  
  // Metadados
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ============================================
// VARIÁVEIS DISPONÍVEIS
// ============================================

export const AVAILABLE_VARIABLES: TemplateVariable[] = [
  // Usuário
  { key: '{{user.name}}', label: 'Nome do Usuário', description: 'Nome completo do cliente', example: 'João da Silva', category: 'user' },
  { key: '{{user.document}}', label: 'CPF do Usuário', description: 'CPF do cliente', example: '123.456.789-00', category: 'user' },
  { key: '{{user.email}}', label: 'E-mail do Usuário', description: 'E-mail do cliente', example: 'joao@email.com', category: 'user' },
  { key: '{{user.phone}}', label: 'Telefone do Usuário', description: 'Telefone do cliente', example: '(11) 99999-9999', category: 'user' },
  { key: '{{user.address}}', label: 'Endereço do Usuário', description: 'Endereço completo do cliente', example: 'Rua das Flores, 123', category: 'user' },
  
  // Plano
  { key: '{{plan.name}}', label: 'Nome do Plano', description: 'Nome do plano contratado', example: 'Plano Premium', category: 'plan' },
  { key: '{{plan.price}}', label: 'Valor do Plano', description: 'Valor mensal do plano', example: 'R$ 199,90', category: 'plan' },
  { key: '{{plan.cycle}}', label: 'Ciclo de Cobrança', description: 'Periodicidade da cobrança', example: 'Mensal', category: 'plan' },
  { key: '{{plan.features}}', label: 'Recursos do Plano', description: 'Lista de recursos inclusos', example: 'Musculação, Cardio, Piscina', category: 'plan' },
  
  // Contrato/Assinatura
  { key: '{{contract.number}}', label: 'Número do Contrato', description: 'Número único do contrato', example: 'CTR-2026-00001', category: 'contract' },
  { key: '{{contract.startDate}}', label: 'Data de Início', description: 'Data de início do contrato', example: '01/01/2026', category: 'contract' },
  { key: '{{contract.endDate}}', label: 'Data de Término', description: 'Data de término do contrato', example: '31/12/2026', category: 'contract' },
  { key: '{{contract.monthlyValue}}', label: 'Valor Mensal', description: 'Valor final mensal (com descontos)', example: 'R$ 179,90', category: 'contract' },
  { key: '{{contract.enrollmentFee}}', label: 'Taxa de Matrícula', description: 'Valor da taxa de matrícula', example: 'R$ 99,00', category: 'contract' },
  { key: '{{contract.fidelity}}', label: 'Período de Fidelidade', description: 'Tempo mínimo de permanência', example: '12 meses', category: 'contract' },
  { key: '{{contract.penalty}}', label: 'Multa Rescisória', description: 'Valor/percentual da multa', example: '20% do saldo', category: 'contract' },
  
  // Unidade
  { key: '{{unit.name}}', label: 'Nome da Unidade', description: 'Nome da unidade/filial', example: 'Academia Move Centro', category: 'unit' },
  { key: '{{unit.address}}', label: 'Endereço da Unidade', description: 'Endereço da unidade', example: 'Av. Central, 1000', category: 'unit' },
  { key: '{{unit.phone}}', label: 'Telefone da Unidade', description: 'Telefone de contato da unidade', example: '(11) 3333-3333', category: 'unit' },
  
  // Datas
  { key: '{{today}}', label: 'Data Atual', description: 'Data de geração do documento', example: '11/01/2026', category: 'custom' },
  { key: '{{signatureDate}}', label: 'Data de Assinatura', description: 'Data em que o documento foi assinado', example: '11/01/2026', category: 'custom' },
];

// ============================================
// CONTEÚDO DE EXEMPLO
// ============================================

const SAMPLE_CONTRACT_CONTENT = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS

CONTRATANTE: {{user.name}}, inscrito(a) no CPF sob o nº {{user.document}}, residente e domiciliado(a) em {{user.address}}.

CONTRATADA: Academia Move Fitness LTDA, inscrita no CNPJ sob o nº XX.XXX.XXX/0001-XX, situada em {{unit.address}}.

CLÁUSULA PRIMEIRA - DO OBJETO
O presente contrato tem por objeto a prestação de serviços de atividades físicas na unidade {{unit.name}}, conforme o plano {{plan.name}}.

CLÁUSULA SEGUNDA - DO PRAZO
O presente contrato terá vigência de {{contract.startDate}} a {{contract.endDate}}, podendo ser renovado automaticamente por igual período.

CLÁUSULA TERCEIRA - DO VALOR
3.1. O CONTRATANTE pagará mensalmente o valor de {{contract.monthlyValue}} referente à mensalidade.
3.2. A taxa de matrícula no valor de {{contract.enrollmentFee}} será cobrada no ato da contratação.

CLÁUSULA QUARTA - DA FIDELIDADE
O presente contrato possui período de fidelidade de {{contract.fidelity}}, contados a partir da data de início.

CLÁUSULA QUINTA - DA RESCISÃO
Em caso de rescisão antecipada, será aplicada multa de {{contract.penalty}}, conforme legislação vigente.

CLÁUSULA SEXTA - DOS SERVIÇOS
O plano contratado inclui os seguintes serviços: {{plan.features}}.

CLÁUSULA SÉTIMA - DISPOSIÇÕES GERAIS
As partes elegem o foro da comarca de São Paulo para dirimir quaisquer dúvidas oriundas deste contrato.

{{unit.name}}, {{today}}.

_________________________
CONTRATANTE: {{user.name}}

_________________________
CONTRATADA: Academia Move Fitness LTDA
`;

const TERMS_OF_USE_CONTENT = `
TERMO DE RESPONSABILIDADE E USO DAS INSTALAÇÕES

Eu, {{user.name}}, portador(a) do CPF nº {{user.document}}, DECLARO estar ciente e de acordo com as seguintes condições para utilização das instalações da {{unit.name}}:

1. RESPONSABILIDADE MÉDICA
Declaro estar apto(a) à prática de atividades físicas, assumindo total responsabilidade por minha saúde durante a utilização das instalações.

2. REGRAS DE UTILIZAÇÃO
- Utilizar roupas e calçados adequados para a prática de atividades físicas;
- Portar toalha pessoal durante os exercícios;
- Respeitar os horários de funcionamento estabelecidos pelo plano {{plan.name}};
- Higienizar os equipamentos após o uso;
- Não utilizar aparelhos celulares nas áreas de treino.

3. RESPONSABILIDADE POR PERTENCES
A academia não se responsabiliza por objetos pessoais deixados nas dependências sem a utilização dos armários disponíveis.

4. VIGÊNCIA
Este termo é válido pelo período de {{contract.startDate}} a {{contract.endDate}}.

{{unit.name}}, {{today}}.

_________________________
{{user.name}}
CPF: {{user.document}}
`;

const CANCELLATION_POLICY_CONTENT = `
POLÍTICA DE CANCELAMENTO

Este documento estabelece as condições para cancelamento do contrato nº {{contract.number}}.

CLIENTE: {{user.name}}
CPF: {{user.document}}
PLANO: {{plan.name}}
VALOR MENSAL: {{contract.monthlyValue}}

1. PERÍODO DE FIDELIDADE
O contrato possui período de fidelidade de {{contract.fidelity}}.

2. MULTA RESCISÓRIA
Em caso de cancelamento durante o período de fidelidade, será aplicada multa de {{contract.penalty}}.

3. CÁLCULO DA MULTA
A multa será calculada sobre o saldo devedor até o término do período de fidelidade.

4. FORMAS DE CANCELAMENTO
O cancelamento pode ser solicitado:
- Presencialmente na unidade {{unit.name}}
- Por escrito, com AR, para {{unit.address}}

5. PRAZO
O cancelamento será efetivado em até 30 dias após a solicitação.

Data: {{today}}

_________________________
{{user.name}}
`;

// ============================================
// MOCK DATA
// ============================================

export const mockTemplates: ContractTemplate[] = [
  {
    id: 'template-001',
    code: 'CTPL-001',
    name: 'Contrato Padrão de Prestação de Serviços',
    description: 'Modelo principal de contrato para todos os planos. Inclui cláusulas de fidelidade, rescisão e serviços.',
    currentVersion: 3,
    status: 'published',
    requiresSignature: true,
    content: SAMPLE_CONTRACT_CONTENT,
    variables: AVAILABLE_VARIABLES.filter(v => 
      ['{{user.name}}', '{{user.document}}', '{{user.address}}', '{{unit.name}}', '{{unit.address}}', 
       '{{plan.name}}', '{{plan.features}}', '{{contract.startDate}}', '{{contract.endDate}}', 
       '{{contract.monthlyValue}}', '{{contract.enrollmentFee}}', '{{contract.fidelity}}', 
       '{{contract.penalty}}', '{{today}}'].includes(v.key)
    ),
    linkedPlans: [
      { planId: 'plan-001', planName: 'Plano Básico', linkedAt: '2025-06-15T10:00:00Z', linkedBy: 'Admin' },
      { planId: 'plan-002', planName: 'Plano Premium', linkedAt: '2025-06-15T10:00:00Z', linkedBy: 'Admin' },
      { planId: 'plan-003', planName: 'Plano VIP', linkedAt: '2025-07-01T14:30:00Z', linkedBy: 'Admin' },
    ],
    versions: [
      { version: 1, status: 'archived', content: '...', createdAt: '2025-01-10T09:00:00Z', createdBy: 'Carlos Admin', publishedAt: '2025-01-15T10:00:00Z', signatureCount: 45 },
      { version: 2, status: 'archived', content: '...', createdAt: '2025-06-01T14:00:00Z', createdBy: 'Maria Jurídico', publishedAt: '2025-06-10T11:00:00Z', signatureCount: 120 },
      { version: 3, status: 'published', content: SAMPLE_CONTRACT_CONTENT, createdAt: '2025-11-20T16:30:00Z', createdBy: 'Carlos Admin', publishedAt: '2025-11-25T09:00:00Z', signatureCount: 87 },
    ],
    signatures: [
      { id: 'sig-001', userId: 'user-001', userName: 'João Silva', userDocument: '123.456.789-00', signedAt: '2025-12-01T10:30:00Z', templateVersion: 3, contractNumber: 'CTR-2025-00156' },
      { id: 'sig-002', userId: 'user-002', userName: 'Maria Santos', userDocument: '987.654.321-00', signedAt: '2025-12-05T14:15:00Z', templateVersion: 3, contractNumber: 'CTR-2025-00162' },
      { id: 'sig-003', userId: 'user-003', userName: 'Pedro Costa', userDocument: '456.789.123-00', signedAt: '2025-12-10T09:45:00Z', templateVersion: 3, contractNumber: 'CTR-2025-00170' },
    ],
    createdAt: '2025-01-10T09:00:00Z',
    createdBy: 'Carlos Admin',
    updatedAt: '2025-11-25T09:00:00Z',
    updatedBy: 'Carlos Admin',
  },
  {
    id: 'template-002',
    code: 'CTPL-002',
    name: 'Termo de Responsabilidade',
    description: 'Termo de responsabilidade para uso das instalações e prática de atividades físicas.',
    currentVersion: 2,
    status: 'published',
    requiresSignature: true,
    content: TERMS_OF_USE_CONTENT,
    variables: AVAILABLE_VARIABLES.filter(v => 
      ['{{user.name}}', '{{user.document}}', '{{unit.name}}', '{{plan.name}}', 
       '{{contract.startDate}}', '{{contract.endDate}}', '{{today}}'].includes(v.key)
    ),
    linkedPlans: [
      { planId: 'plan-001', planName: 'Plano Básico', linkedAt: '2025-06-15T10:00:00Z', linkedBy: 'Admin' },
      { planId: 'plan-002', planName: 'Plano Premium', linkedAt: '2025-06-15T10:00:00Z', linkedBy: 'Admin' },
    ],
    versions: [
      { version: 1, status: 'archived', content: '...', createdAt: '2025-02-01T10:00:00Z', createdBy: 'Maria Jurídico', publishedAt: '2025-02-05T09:00:00Z', signatureCount: 200 },
      { version: 2, status: 'published', content: TERMS_OF_USE_CONTENT, createdAt: '2025-08-15T11:00:00Z', createdBy: 'Maria Jurídico', publishedAt: '2025-08-20T14:00:00Z', signatureCount: 156 },
    ],
    signatures: [
      { id: 'sig-004', userId: 'user-004', userName: 'Ana Oliveira', userDocument: '111.222.333-44', signedAt: '2025-11-28T16:00:00Z', templateVersion: 2, contractNumber: 'CTR-2025-00148' },
    ],
    createdAt: '2025-02-01T10:00:00Z',
    createdBy: 'Maria Jurídico',
    updatedAt: '2025-08-20T14:00:00Z',
    updatedBy: 'Maria Jurídico',
  },
  {
    id: 'template-003',
    code: 'CTPL-003',
    name: 'Política de Cancelamento',
    description: 'Documento com as condições de cancelamento e multas rescisórias.',
    currentVersion: 1,
    status: 'published',
    requiresSignature: true,
    content: CANCELLATION_POLICY_CONTENT,
    variables: AVAILABLE_VARIABLES.filter(v => 
      ['{{user.name}}', '{{user.document}}', '{{unit.name}}', '{{unit.address}}', '{{plan.name}}', 
       '{{contract.number}}', '{{contract.monthlyValue}}', '{{contract.fidelity}}', 
       '{{contract.penalty}}', '{{today}}'].includes(v.key)
    ),
    linkedPlans: [
      { planId: 'plan-002', planName: 'Plano Premium', linkedAt: '2025-09-01T10:00:00Z', linkedBy: 'Admin' },
      { planId: 'plan-003', planName: 'Plano VIP', linkedAt: '2025-09-01T10:00:00Z', linkedBy: 'Admin' },
    ],
    versions: [
      { version: 1, status: 'published', content: CANCELLATION_POLICY_CONTENT, createdAt: '2025-09-01T10:00:00Z', createdBy: 'Carlos Admin', publishedAt: '2025-09-05T09:00:00Z', signatureCount: 45 },
    ],
    signatures: [],
    createdAt: '2025-09-01T10:00:00Z',
    createdBy: 'Carlos Admin',
    updatedAt: '2025-09-05T09:00:00Z',
    updatedBy: 'Carlos Admin',
  },
  {
    id: 'template-004',
    code: 'CTPL-004',
    name: 'Contrato Corporativo',
    description: 'Modelo de contrato para clientes corporativos com condições especiais.',
    currentVersion: 1,
    status: 'draft',
    requiresSignature: true,
    content: `CONTRATO CORPORATIVO\n\nEmpresa: {{user.name}}\nCNPJ: {{user.document}}\n\n[Conteúdo em elaboração...]`,
    variables: AVAILABLE_VARIABLES.slice(0, 8),
    linkedPlans: [],
    versions: [
      { version: 1, status: 'draft', content: '...', createdAt: '2026-01-05T14:00:00Z', createdBy: 'Carlos Admin', signatureCount: 0 },
    ],
    signatures: [],
    createdAt: '2026-01-05T14:00:00Z',
    createdBy: 'Carlos Admin',
    updatedAt: '2026-01-08T10:30:00Z',
    updatedBy: 'Carlos Admin',
  },
  {
    id: 'template-005',
    code: 'CTPL-005',
    name: 'Termo de Autorização de Imagem',
    description: 'Autorização para uso de imagem em materiais promocionais.',
    currentVersion: 1,
    status: 'archived',
    requiresSignature: true,
    content: `TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM\n\nEu, {{user.name}}, autorizo o uso de minha imagem...\n\n[Modelo arquivado]`,
    variables: AVAILABLE_VARIABLES.filter(v => v.category === 'user'),
    linkedPlans: [],
    versions: [
      { version: 1, status: 'archived', content: '...', createdAt: '2024-06-01T10:00:00Z', createdBy: 'Marketing', publishedAt: '2024-06-05T09:00:00Z', signatureCount: 30 },
    ],
    signatures: [],
    createdAt: '2024-06-01T10:00:00Z',
    createdBy: 'Marketing',
    updatedAt: '2025-12-01T16:00:00Z',
    updatedBy: 'Carlos Admin',
  },
];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Busca template por ID
 */
export function getTemplateById(id: string): ContractTemplate | undefined {
  return mockTemplates.find(t => t.id === id);
}

/**
 * Busca templates por status
 */
export function getTemplatesByStatus(status: TemplateStatus): ContractTemplate[] {
  return mockTemplates.filter(t => t.status === status);
}

/**
 * Busca templates vinculados a um plano
 */
export function getTemplatesByPlanId(planId: string): ContractTemplate[] {
  return mockTemplates.filter(t => t.linkedPlans.some(lp => lp.planId === planId));
}

/**
 * Busca templates
 */
export function searchTemplates(query: string): ContractTemplate[] {
  const q = query.toLowerCase();
  return mockTemplates.filter(
    t => t.name.toLowerCase().includes(q) ||
         t.code.toLowerCase().includes(q) ||
         t.description.toLowerCase().includes(q)
  );
}

/**
 * Estatísticas dos templates
 */
export function getTemplateStats() {
  const total = mockTemplates.length;
  const published = mockTemplates.filter(t => t.status === 'published').length;
  const draft = mockTemplates.filter(t => t.status === 'draft').length;
  const archived = mockTemplates.filter(t => t.status === 'archived').length;
  const totalSignatures = mockTemplates.reduce((sum, t) => sum + t.signatures.length, 0);
  const templatesWithPlans = mockTemplates.filter(t => t.linkedPlans.length > 0).length;

  return { total, published, draft, archived, totalSignatures, templatesWithPlans };
}

/**
 * Gera código para novo template
 */
export function generateTemplateCode(): string {
  const lastCode = mockTemplates
    .map(t => parseInt(t.code.replace('CTPL-', '')))
    .sort((a, b) => b - a)[0] || 0;
  return `CTPL-${String(lastCode + 1).padStart(3, '0')}`;
}

/**
 * Formata data para exibição
 */
export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora
 */
export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('pt-BR');
}

/**
 * Obtém planos disponíveis para vincular
 */
export function getAvailablePlans() {
  return mockPlans.filter(p => p.status === 'active').map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
  }));
}
