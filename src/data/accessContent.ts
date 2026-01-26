/**
 * Access Content
 * Conteúdo centralizado para as páginas de acesso via QR Code
 * Segue o padrão do projeto (como landingContent.ts)
 * 
 * FLUXO:
 * - Academia exibe QR Code (tela/tablet)
 * - Usuário lê QR Code pelo app
 * - Sistema valida e retorna resultado
 */

export const accessContent = {
  // Central de Acesso (Academia) - EXIBE QR CODE
  accessCentral: {
    title: "Central de Acesso",
    subtitle: "QR Code para entrada de alunos",
    
    qrDisplay: {
      title: "QR Code da Academia",
      description: "Alunos devem escanear este código com o app MoveAccess",
      location: "Entrada Principal",
      statusWaiting: "Aguardando leitura...",
    },
    
    buttons: {
      regenerate: "Gerar novo QR",
      manualAccess: "Acesso Manual",
      history: "Ver histórico",
    },
    
    validation: {
      idle: {
        title: "Aguardando",
        description: "Escaneie o QR Code com o app",
      },
      success: {
        title: "Acesso Liberado",
        description: "Entrada autorizada",
      },
      denied: {
        title: "Acesso Negado",
        description: "Verifique com a recepção",
      },
    },
    
    history: {
      title: "Últimos Acessos",
      emptyText: "Nenhum acesso registrado ainda",
    },
    
    navigation: {
      goToScanner: "Scanner (usuário)",
      goToManual: "Liberação manual",
    },
  },
  
  // Meu Scanner (Usuário) - LÊ QR CODE DA ACADEMIA
  myScanner: {
    title: "Scanner de Acesso",
    subtitle: "Escaneie o QR Code da academia para liberar entrada",
    
    scanner: {
      title: "Leitor de QR Code",
      description: "Aponte a câmera para o QR Code da academia",
      waitingText: "Posicione o QR Code...",
      mockButton: "Simular leitura (DEMO)",
    },
    
    states: {
      idle: {
        title: "Pronto para escanear",
        description: "Aponte para o QR Code da academia",
      },
      scanning: {
        title: "Lendo...",
        description: "Aguarde",
      },
      success: {
        title: "Acesso Liberado!",
        description: "Pode entrar na academia",
      },
      denied: {
        title: "Acesso Negado",
        description: "Procure a recepção",
      },
    },
    
    profile: {
      title: "Seu Perfil",
      typeLabel: "Tipo:",
      planLabel: "Plano:",
      statusLabel: "Status:",
    },
    
    navigation: {
      goToCentral: "Central da Academia",
    },
  },
  
  // Acesso Manual (Academia)
  manualAccess: {
    title: "Liberação Manual",
    subtitle: "Busque e libere acesso de alunos manualmente",
    
    search: {
      title: "Buscar Aluno",
      placeholder: "CPF ou nome do aluno",
      buttonText: "Buscar",
      notFound: "Aluno não encontrado",
    },
    
    userCard: {
      title: "Dados do Aluno",
      grantButton: "Liberar Acesso",
      denyButton: "Negar Acesso",
    },
    
    navigation: {
      backToCentral: "Voltar para Central",
    },
  },
  
  // Login Tablet (Acesso rápido)
  tabletLogin: {
    title: "Acesso Rápido",
    subtitle: "Entre com CPF e senha para liberar acesso",
    
    form: {
      cpfLabel: "CPF",
      cpfPlaceholder: "000.000.000-00",
      passwordLabel: "Senha",
      passwordPlaceholder: "Digite sua senha",
      submitButton: "Entrar e Liberar",
      errorInvalid: "CPF ou senha inválidos",
    },
    
    success: {
      title: "Acesso Liberado!",
      description: "Bem-vindo(a) à academia",
      continueButton: "Fazer novo acesso",
    },
    
    navigation: {
      useApp: "Usar app no celular",
      backToCentral: "Voltar",
      goToCentral: "Ir para Central de Acesso",
    },
  },
  
  // Labels compartilhados
  shared: {
    mockNotice: "⚠️ Ambiente de demonstração - Dados simulados",
    backToDashboard: "Voltar ao Dashboard",
  },
};
