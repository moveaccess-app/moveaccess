/**
 * Contract Variables Engine
 *
 * Defines, resolves and previews dynamic variables in contract templates.
 * Variables use the `{{variable_name}}` syntax.
 */

// ─── Types ───────────────────────────────────────────────────────

export interface ContractVariable {
  key: string;
  label: string;
  description: string;
  category: VariableCategory;
  example: string;
}

export type VariableCategory = 'academia' | 'aluno' | 'plano' | 'contrato' | 'unidade';

export interface VariableCategoryInfo {
  id: VariableCategory;
  label: string;
  icon: string; // emoji for simplicity
}

export interface VariableContext {
  academia_nome?: string;
  academia_cnpj?: string;
  aluno_nome?: string;
  aluno_cpf?: string;
  aluno_email?: string;
  plano_nome?: string;
  plano_valor?: string;
  plano_periodo?: string;
  data_inicio?: string;
  data_aceite?: string;
  data_hoje?: string;
  unidade_nome?: string;
  unidade_endereco?: string;
}

// ─── Categories ──────────────────────────────────────────────────

export const VARIABLE_CATEGORIES: VariableCategoryInfo[] = [
  { id: 'academia', label: 'Academia', icon: '🏢' },
  { id: 'aluno', label: 'Aluno', icon: '👤' },
  { id: 'plano', label: 'Plano', icon: '📋' },
  { id: 'contrato', label: 'Contrato', icon: '📅' },
  { id: 'unidade', label: 'Unidade', icon: '📍' },
];

// ─── Variable Definitions ────────────────────────────────────────

export const CONTRACT_VARIABLES: ContractVariable[] = [
  // Academia
  {
    key: 'academia_nome',
    label: 'Nome da Academia',
    description: 'Razão social ou nome fantasia da academia',
    category: 'academia',
    example: 'Academia Força Total',
  },
  {
    key: 'academia_cnpj',
    label: 'CNPJ da Academia',
    description: 'CNPJ formatado da academia',
    category: 'academia',
    example: '12.345.678/0001-90',
  },
  // Aluno
  {
    key: 'aluno_nome',
    label: 'Nome do Aluno',
    description: 'Nome completo do aluno contratante',
    category: 'aluno',
    example: 'João Silva Santos',
  },
  {
    key: 'aluno_cpf',
    label: 'CPF do Aluno',
    description: 'CPF formatado do aluno',
    category: 'aluno',
    example: '123.456.789-00',
  },
  {
    key: 'aluno_email',
    label: 'E-mail do Aluno',
    description: 'Endereço de e-mail do aluno',
    category: 'aluno',
    example: 'joao.silva@email.com',
  },
  // Plano
  {
    key: 'plano_nome',
    label: 'Nome do Plano',
    description: 'Nome do plano contratado',
    category: 'plano',
    example: 'Plano Mensal Completo',
  },
  {
    key: 'plano_valor',
    label: 'Valor do Plano',
    description: 'Valor mensal formatado (R$)',
    category: 'plano',
    example: 'R$ 149,90',
  },
  {
    key: 'plano_periodo',
    label: 'Período do Plano',
    description: 'Periodicidade de cobrança (mensal, trimestral, etc.)',
    category: 'plano',
    example: 'Mensal',
  },
  // Contrato
  {
    key: 'data_inicio',
    label: 'Data de Início',
    description: 'Data de início do contrato',
    category: 'contrato',
    example: new Date().toLocaleDateString('pt-BR'),
  },
  {
    key: 'data_aceite',
    label: 'Data de Aceite',
    description: 'Data em que o aluno aceita o contrato',
    category: 'contrato',
    example: new Date().toLocaleDateString('pt-BR'),
  },
  {
    key: 'data_hoje',
    label: 'Data Atual',
    description: 'Data do dia atual',
    category: 'contrato',
    example: new Date().toLocaleDateString('pt-BR'),
  },
  // Unidade
  {
    key: 'unidade_nome',
    label: 'Nome da Unidade',
    description: 'Nome da unidade/filial da academia',
    category: 'unidade',
    example: 'Unidade Centro',
  },
  {
    key: 'unidade_endereco',
    label: 'Endereço da Unidade',
    description: 'Endereço completo da unidade',
    category: 'unidade',
    example: 'Rua das Flores, 123 - Centro',
  },
];

// ─── Lookup map ──────────────────────────────────────────────────

const VARIABLE_MAP = new Map(CONTRACT_VARIABLES.map((v) => [v.key, v]));

// ─── Resolve ─────────────────────────────────────────────────────

const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

/**
 * Resolve variables in contract content using the provided context.
 * Unknown or missing variables are kept as `{{key}}` (transparent to the reader).
 */
export function resolveVariables(content: string, context: VariableContext): string {
  return content.replace(VARIABLE_PATTERN, (match, key: string) => {
    const value = context[key as keyof VariableContext];
    return value ?? match;
  });
}

/**
 * Resolve variables with example data for preview purposes.
 */
export function resolveVariablesWithExamples(content: string): string {
  return content.replace(VARIABLE_PATTERN, (match, key: string) => {
    const variable = VARIABLE_MAP.get(key);
    return variable?.example ?? match;
  });
}

/**
 * Extract all variable keys used in a content string.
 */
export function extractVariables(content: string): string[] {
  const matches = content.matchAll(VARIABLE_PATTERN);
  const keys = new Set<string>();
  for (const match of matches) {
    keys.add(match[1]);
  }
  return Array.from(keys);
}

/**
 * Get info about variables used in content, separated into known vs unknown.
 */
export function analyzeVariables(content: string): {
  known: ContractVariable[];
  unknown: string[];
} {
  const keys = extractVariables(content);
  const known: ContractVariable[] = [];
  const unknown: string[] = [];

  for (const key of keys) {
    const variable = VARIABLE_MAP.get(key);
    if (variable) {
      known.push(variable);
    } else {
      unknown.push(key);
    }
  }

  return { known, unknown };
}

/**
 * Build a VariableContext from onboarding session data.
 * Used when the student is about to accept the contract.
 */
export function buildContextFromOnboarding(params: {
  studentName?: string;
  studentCpf?: string;
  studentEmail?: string;
  planName?: string;
  planValue?: number;
  planPeriod?: string;
  academyName?: string;
  academyCnpj?: string;
  unitName?: string;
  unitAddress?: string;
}): VariableContext {
  const today = new Date().toLocaleDateString('pt-BR');
  return {
    academia_nome: params.academyName,
    academia_cnpj: params.academyCnpj,
    aluno_nome: params.studentName,
    aluno_cpf: params.studentCpf,
    aluno_email: params.studentEmail,
    plano_nome: params.planName,
    plano_valor: params.planValue != null
      ? `R$ ${params.planValue.toFixed(2).replace('.', ',')}`
      : undefined,
    plano_periodo: params.planPeriod,
    data_inicio: today,
    data_aceite: today,
    data_hoje: today,
    unidade_nome: params.unitName,
    unidade_endereco: params.unitAddress,
  };
}

/**
 * Get all available variables grouped by category.
 */
export function getVariablesByCategory(): { category: VariableCategoryInfo; variables: ContractVariable[] }[] {
  return VARIABLE_CATEGORIES.map((category) => ({
    category,
    variables: CONTRACT_VARIABLES.filter((v) => v.category === category.id),
  }));
}
