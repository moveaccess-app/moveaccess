/**
 * Landing Page Content
 * Centralized mock content for the MoveAccess landing page
 */

import {
  Fingerprint,
  CreditCard,
  FileText,
  Users,
  Calendar,
  Clock,
  Bell,
  BarChart3,
  RefreshCw,
  UserPlus,
  FileSignature,
  Scan,
  LineChart,
  Building2,
  Zap,
  Rocket,
} from "lucide-react";

export const landingContent = {
  // Brand
  brand: {
    name: "MoveAccess",
    tagline: "O novo padrão de gestão para academias.",
    description: "Sistema completo para academias",
  },

  // Navigation
  nav: {
    links: [
      { label: "Funcionalidades", href: "#features" },
      { label: "Como funciona", href: "#how-it-works" },
      { label: "Para quem é", href: "#audience" },
    ],
    cta: {
      login: { label: "Entrar", href: "/login" },
      signup: { label: "Testar grátis", href: "/signup" },
    },
  },

  // Hero Section
  hero: {
    badge: "Sistema completo para academias",
    headline: "O novo padrão de gestão para",
    headlineHighlight: "academias.",
    subheadline:
      "Controle de acesso, financeiro, contratos e automações — tudo em um único sistema inteligente.",
    cta: {
      primary: { label: "Testar demonstração", href: "/signup" },
      secondary: { label: "Falar com especialista", href: "/plans" },
    },
    trustBadges: [
      { label: "100% online", color: "green" },
      { label: "Setup em minutos", color: "primary" },
      { label: "Suporte dedicado", color: "blue" },
    ],
    mockup: {
      url: "app.moveaccess.com.br",
      stats: [
        { label: "Alunos ativos", value: "1.247" },
        { label: "MRR", value: "R$ 89.4K" },
        { label: "Check-ins hoje", value: "342" },
      ],
      floatingCard: {
        label: "Acesso liberado",
        value: "QR Code ativo",
      },
    },
  },

  // Pillars Section
  pillars: {
    badge: "Por que mudar?",
    title: "Por que academias estão mudando para o",
    titleHighlight: "MoveAccess",
    subtitle: "Três pilares que transformam a gestão da sua academia",
    items: [
      {
        icon: Fingerprint,
        title: "Acesso inteligente",
        description:
          "QR Code, biometria e catracas integradas. Libere entradas de forma automática e segura.",
      },
      {
        icon: CreditCard,
        title: "Financeiro automático",
        description:
          "Cobrança, inadimplência e baixa automática. Receba sem precisar cobrar manualmente.",
      },
      {
        icon: FileText,
        title: "Contratos digitais",
        description:
          "Criação, assinatura e renovação sem papel. Tudo digital, rápido e com validade jurídica.",
      },
    ],
  },

  // Features Section
  features: {
    badge: "Funcionalidades",
    title: "Tudo que sua academia precisa",
    subtitle: "Ferramentas poderosas para automatizar e escalar sua operação",
    items: [
      {
        icon: Users,
        title: "Gestão de alunos",
        description: "Cadastro completo, histórico e comunicação centralizada.",
      },
      {
        icon: Calendar,
        title: "Planos e vencimentos",
        description: "Controle total de planos, valores e datas de renovação.",
      },
      {
        icon: Clock,
        title: "Check-in e presença",
        description: "Histórico detalhado de frequência e horários de pico.",
      },
      {
        icon: Bell,
        title: "Automação de cobrança",
        description: "Régua completa: D-3, D+1, D+5, D+10 automatizados.",
      },
      {
        icon: BarChart3,
        title: "Painel financeiro",
        description: "MRR, churn, ticket médio e indicadores em tempo real.",
      },
      {
        icon: RefreshCw,
        title: "Reativações",
        description: "Identifique e recupere alunos inativos automaticamente.",
      },
    ],
  },

  // How It Works Section
  howItWorks: {
    badge: "Como funciona",
    title: "Como sua academia funciona com o",
    titleHighlight: "MoveAccess?",
    subtitle: "Do cadastro ao recebimento — tudo automatizado em 4 passos",
    steps: [
      {
        icon: UserPlus,
        step: "01",
        title: "Cadastre planos e alunos",
        description:
          "Configure seus planos, valores e cadastre alunos em poucos cliques.",
      },
      {
        icon: FileSignature,
        step: "02",
        title: "Gere contratos e assinaturas",
        description:
          "Contratos digitais com assinatura eletrônica e validade jurídica.",
      },
      {
        icon: Scan,
        step: "03",
        title: "Libere acesso automaticamente",
        description:
          "QR Code, biometria ou catraca — entrada sem filas nem burocracia.",
      },
      {
        icon: LineChart,
        step: "04",
        title: "Acompanhe tudo no painel",
        description:
          "Receba automaticamente e monitore todos os indicadores em tempo real.",
      },
    ],
  },

  // Testimonials/Audience Section
  audience: {
    badge: "Público",
    title: "Para quem é o MoveAccess",
    items: [
      {
        icon: Building2,
        text: "Para academias que querem modernizar a gestão.",
      },
      {
        icon: Zap,
        text: "Para studios e boxes que precisam automatizar acesso e financeiro.",
      },
      {
        icon: Users,
        text: "Para gestores que buscam simplicidade e eficiência.",
      },
    ],
    scalability: {
      title: "Criado para escalar com qualquer tamanho de academia",
      description:
        "Do pequeno studio às grandes unidades — o MoveAccess foi projetado para crescer junto com você.",
    },
  },

  // Transparency Section
  transparency: {
    icon: Rocket,
    title: "Estamos construindo o futuro da gestão de academias",
    description:
      "O MoveAccess está em expansão e evolui continuamente com base no uso real e na necessidade das academias. Buscamos entregar a experiência mais simples e inteligente da categoria.",
  },

  // CTA Section
  cta: {
    badge: "Comece agora mesmo",
    title: "Leve sua academia para o",
    titleHighlight: "próximo nível.",
    subtitle:
      "Automatize sua gestão e tenha controle total sobre acesso, financeiro e contratos em um único sistema.",
    buttons: {
      primary: { label: "Quero conhecer", href: "/signup" },
      secondary: { label: "Agendar demonstração", href: "/plans" },
    },
    trustNote: "Sem compromisso • Setup gratuito • Suporte dedicado",
  },

  // Footer
  footer: {
    description: "O sistema completo para gestão de academias modernas.",
    links: {
      Produto: [
        { label: "Funcionalidades", href: "#features" },
        { label: "Preços", href: "/plans" },
        { label: "Integrações", href: "#" },
        { label: "API", href: "#" },
      ],
      Empresa: [
        { label: "Sobre", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Carreiras", href: "#" },
        { label: "Contato", href: "#" },
      ],
      Recursos: [
        { label: "Central de Ajuda", href: "#" },
        { label: "Documentação", href: "#" },
        { label: "Status", href: "#" },
        { label: "Segurança", href: "#" },
      ],
      Legal: [
        { label: "Privacidade", href: "#" },
        { label: "Termos de Uso", href: "#" },
        { label: "Cookies", href: "#" },
      ],
    },
    social: [
      { name: "Instagram", href: "#", icon: "I" },
      { name: "LinkedIn", href: "#", icon: "L" },
      { name: "YouTube", href: "#", icon: "Y" },
    ],
    bottom: {
      copyright: `© ${new Date().getFullYear()} MoveAccess. Todos os direitos reservados.`,
      legalLinks: [
        { label: "Política de Privacidade", href: "#" },
        { label: "Termos de Serviço", href: "#" },
      ],
    },
  },
};

export type LandingContent = typeof landingContent;
