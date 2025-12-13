import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Crown, ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const Plans = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      id: "trial",
      name: "Trial",
      description: "Experimente gratuitamente",
      icon: Sparkles,
      price: { monthly: "Grátis", annual: "Grátis" },
      period: { monthly: "por 14 dias", annual: "por 14 dias" },
      features: [
        "Acesso completo a todas as funcionalidades",
        "Até 50 alunos cadastrados",
        "Check-in por QR Code",
        "Dashboard básico",
        "Suporte por email",
      ],
      cta: "Começar trial",
      highlighted: false,
    },
    {
      id: "monthly",
      name: "Profissional",
      description: "Para academias em crescimento",
      icon: Zap,
      price: { monthly: "R$ 199", annual: "R$ 149" },
      period: { monthly: "/mês", annual: "/mês" },
      features: [
        "Alunos ilimitados",
        "Cobrança automática (PIX, cartão, boleto)",
        "Contratos digitais",
        "Dashboard completo (MRR, churn, ticket)",
        "Integração com catracas",
        "Biometria facial e digital",
        "Suporte prioritário",
      ],
      cta: isAnnual ? "Assinar anual" : "Assinar mensal",
      highlighted: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Para grandes redes",
      icon: Crown,
      price: { monthly: "Sob consulta", annual: "Sob consulta" },
      period: { monthly: "", annual: "" },
      features: [
        "Tudo do plano Profissional",
        "Multi-unidades",
        "API personalizada",
        "Onboarding dedicado",
        "SLA garantido",
        "Gerente de sucesso exclusivo",
        "Customizações sob demanda",
      ],
      cta: "Falar com especialista",
      highlighted: false,
    },
  ];

  const handleSelectPlan = (planId: string) => {
    if (planId === "enterprise") {
      // Open contact or redirect
      window.open("mailto:contato@moveaccess.com.br", "_blank");
    } else {
      navigate("/signup");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-glow" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      
      <div className="relative z-10 min-h-screen py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Link to="/" className="inline-block mb-8">
              <span className="text-2xl font-bold">
                Move<span className="text-primary">Access</span>
              </span>
            </Link>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Escolha o plano ideal para sua academia
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Controle, acesso, financeiro, contratos e automações em um só lugar.
            </p>
          </div>
          
          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Mensal
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Anual
            </span>
            {isAnnual && (
              <span className="px-3 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
                Economize 25%
              </span>
            )}
          </div>
          
          {/* Plans grid */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 transition-all duration-300 ${
                  plan.highlighted 
                    ? 'glass border-primary/50 shadow-glow scale-[1.02]' 
                    : 'glass'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 text-sm font-semibold bg-primary text-primary-foreground rounded-full shadow-lg">
                      Mais popular
                    </span>
                  </div>
                )}
                
                <div className="mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    plan.highlighted ? 'bg-primary' : 'bg-secondary'
                  }`}>
                    <plan.icon className={`w-6 h-6 ${plan.highlighted ? 'text-primary-foreground' : 'text-primary'}`} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {isAnnual ? plan.price.annual : plan.price.monthly}
                    </span>
                    <span className="text-muted-foreground">
                      {isAnnual ? plan.period.annual : plan.period.monthly}
                    </span>
                  </div>
                  {isAnnual && plan.id === "monthly" && (
                    <p className="text-sm text-primary mt-1">2 meses grátis incluídos</p>
                  )}
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  variant={plan.highlighted ? "default" : "outline"}
                  className="w-full h-12"
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
          
          {/* Trial info */}
          <div className="glass rounded-2xl p-8 max-w-2xl mx-auto text-center">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              Comece grátis, sem compromisso
            </h3>
            <p className="text-muted-foreground mb-6">
              O trial de 14 dias dá acesso completo ao sistema. Não pedimos cartão de crédito — 
              você só escolhe o plano quando estiver pronto.
            </p>
            <Button onClick={() => navigate("/signup")} size="lg" className="h-12">
              Começar trial gratuito
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          {/* Back link */}
          <div className="text-center mt-8">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;
