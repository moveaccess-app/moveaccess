export {
  type ContractTemplate,
  type ContractTemplateInput,
  type ContractTemplateStatus,
  TEMPLATE_STATUS_LABELS,
  getContractTemplates,
  getContractTemplateById,
  getActiveContractTemplate,
  createContractTemplate,
  updateContractTemplate,
  publishContractTemplate,
  archiveContractTemplate,
} from './contractTemplateServiceSupabase';

export {
  type ContractVariable,
  type VariableCategory,
  type VariableCategoryInfo,
  type VariableContext,
  CONTRACT_VARIABLES,
  VARIABLE_CATEGORIES,
  resolveVariables,
  resolveVariablesWithExamples,
  extractVariables,
  analyzeVariables,
  buildContextFromOnboarding,
  getVariablesByCategory,
} from './contractVariables';

export {
  type StarterTemplate,
  STARTER_TEMPLATES,
  getStarterTemplate,
} from './starterTemplates';
