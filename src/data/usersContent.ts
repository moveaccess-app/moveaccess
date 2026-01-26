export const usersContent = {
  // Títulos das páginas
  listTitle: 'Usuários',
  detailTitle: 'Detalhes do Usuário',
  
  // Página de listagem
  searchPlaceholder: 'Buscar por nome, email ou matrícula...',
  filterByStatus: 'Filtrar por status',
  allStatuses: 'Todos os status',
  
  // Cabeçalhos da tabela
  tableHeaders: {
    name: 'Nome',
    email: 'Email',
    status: 'Status',
    plan: 'Plano',
    createdAt: 'Data de Cadastro',
    actions: 'Ações',
    identity: 'Identidade',
    operationalStatus: 'Status Operacional',
    financial: 'Financeiro',
    contract: 'Contrato',
    activity: 'Atividade',
  },
  
  // Ações
  viewDetails: 'Ver Detalhes',
  copyData: 'Copiar',
  copied: 'Copiado!',
  
  // Status de acesso
  accessStatusLabels: {
    allowed: 'Acesso OK',
    blockedFinancial: 'Bloqueado por Financeiro',
    blockedContract: 'Bloqueado por Contrato',
    blockedManual: 'Bloqueado Manual',
    inactive: 'Inativo',
  } as const,
  
  // Atividade - último check-in
  lastCheckInLabels: {
    today: 'Hoje',
    yesterday: 'Ontem',
    within7Days: 'Últimos 7 dias',
    moreThan7Days: '+7 dias',
    never: 'Nunca',
  } as const,
  
  // Contrato
  contractIndicators: {
    active: 'Contrato Vigente',
    noContract: 'Sem Contrato',
  } as const,
  
  // Página de detalhes - Seções
  detailSections: {
    identity: 'Identidade e Vínculo',
    status: 'Status do Usuário',
    access: 'Controle de Acesso',
    subscription: 'Assinatura / Plano',
    contracts: 'Contratos',
    financial: 'Situação Financeira',
    documents: 'Documentos',
  },
  
  // Campos
  fields: {
    // Identidade
    registrationId: 'Matrícula',
    fullName: 'Nome Completo',
    email: 'Email',
    phone: 'Telefone',
    document: 'CPF',
    userType: 'Tipo de Usuário',
    unit: 'Unidade / Academia',
    registrationOrigin: 'Origem do Cadastro',
    createdAt: 'Data de Cadastro',
    
    // Status
    status: 'Status Atual',
    statusReason: 'Motivo',
    statusSince: 'Desde',
    lastChange: 'Última Alteração',
    
    // Acesso
    accessAllowed: 'Acesso Permitido',
    lastCheckIn: 'Último Check-in',
    accessMethod: 'Método',
    checkIns7Days: 'Check-ins (7 dias)',
    checkIns30Days: 'Check-ins (30 dias)',
    digitalCard: 'Carteirinha Digital',
    digitalCardExpiry: 'Validade',
    
    // Plano
    currentPlan: 'Plano Atual',
    planStartDate: 'Início',
    planEndDate: 'Fim',
    billingType: 'Tipo de Cobrança',
    autoRenewal: 'Renovação Automática',
    nextDueDate: 'Próximo Vencimento',
    currentValue: 'Valor Atual',
    discount: 'Desconto Ativo',
    
    // Contrato
    contractNumber: 'Número',
    contractStatus: 'Status',
    contractSignedAt: 'Assinatura',
    contractStartDate: 'Início',
    contractEndDate: 'Fim',
    contractPlan: 'Plano',
    contractValue: 'Valor',
    currentContract: 'Contrato Vigente',
    
    // Financeiro
    financialStatus: 'Situação',
    daysOverdue: 'Dias em Atraso',
    lastPayment: 'Último Pagamento',
    paymentValue: 'Valor',
    paymentMethod: 'Meio',
    pendingBalance: 'Saldo Pendente',
    nextPayment: 'Próximo Pagamento',
    
    // Documentos
    documentName: 'Nome',
    documentStatus: 'Status',
    documentDate: 'Data de Upload',
  },
  
  // Labels de status do usuário
  statusLabels: {
    active: 'Ativo',
    inactive: 'Inativo',
    pending: 'Pendente',
    suspended: 'Suspenso',
    blocked: 'Bloqueado',
  } as const,
  
  // Labels de tipo de usuário
  userTypeLabels: {
    student: 'Aluno',
    personal: 'Personal Trainer',
    guest: 'Visitante',
    employee: 'Funcionário',
  } as const,
  
  // Labels de origem do cadastro
  registrationOriginLabels: {
    academy: 'Pela Academia',
    app: 'Pelo App',
    website: 'Pelo Website',
    migration: 'Migração',
  } as const,
  
  // Labels de fonte de alteração de status
  statusChangeSourceLabels: {
    manual: 'Manual',
    system: 'Sistema',
    automation: 'Automação',
  } as const,
  
  // Labels de método de acesso
  accessMethodLabels: {
    qr_code: 'QR Code',
    biometry: 'Biometria',
    card: 'Cartão',
    manual: 'Manual',
  } as const,
  
  // Labels de status da carteirinha digital
  digitalCardStatusLabels: {
    generated: 'Gerada',
    pending: 'Pendente',
    revoked: 'Revogada',
  } as const,
  
  // Labels de tipo de cobrança
  billingTypeLabels: {
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    semiannual: 'Semestral',
    annual: 'Anual',
    single: 'Avulso',
  } as const,
  
  // Labels de status do contrato
  contractStatusLabels: {
    active: 'Ativo',
    expired: 'Expirado',
    pending: 'Pendente',
    cancelled: 'Cancelado',
  } as const,
  
  // Labels de método de pagamento
  paymentMethodLabels: {
    credit_card: 'Cartão de Crédito',
    debit: 'Débito',
    pix: 'PIX',
    boleto: 'Boleto',
    cash: 'Dinheiro',
  } as const,
  
  // Labels de status financeiro
  financialStatusLabels: {
    up_to_date: 'Em Dia',
    overdue: 'Em Atraso',
    partial: 'Parcial',
  } as const,
  
  // Labels de status de documento
  documentStatusLabels: {
    ok: 'OK',
    pending: 'Pendente',
    expired: 'Expirado',
  } as const,
  
  // Labels de tipo de documento
  documentTypeLabels: {
    contract: 'Contrato',
    identity: 'Identidade',
    proof_of_residence: 'Comprovante de Residência',
    medical: 'Atestado Médico',
    payment_proof: 'Comprovante de Pagamento',
    other: 'Outro',
  } as const,
  
  // Textos auxiliares
  yes: 'Sim',
  no: 'Não',
  none: 'Nenhum',
  notApplicable: 'N/A',
  noData: '-',
  viewDocument: 'Ver',
  
  // Estados vazios
  noUsersFound: 'Nenhum usuário encontrado',
  noUsersMessage: 'Não há usuários cadastrados no momento.',
  noPlan: 'Nenhum plano ativo',
  noContracts: 'Nenhum contrato vinculado',
  noDocuments: 'Nenhum documento cadastrado',
  noPayments: 'Nenhum pagamento registrado',
  noCheckIns: 'Nenhum check-in registrado',
};
